// src/linter/requestParser.ts
import { Project, SourceFile, SyntaxKind, Node, ObjectLiteralExpression, PropertyAssignment, CallExpression, Identifier, StringLiteral, TemplateExpression, VariableDeclaration, FunctionDeclaration, ArrowFunction } from 'ts-morph';
import { TSEndpoint } from '../types/TSEndpoint';

/**
 * Finds all endpoints in a given source file
 * @param sourceFile The source file to search for endpoints
 * @returns An array of TSEndpoint objects
 */
function findEndpointsInFile(sourceFile: SourceFile): TSEndpoint[] {
  // Initialize an empty array to store the found endpoints
  const endpoints: TSEndpoint[] = [];
  // Initialize an empty string to store the base path
  let basePath = '';

  // Find the base path variable declaration in the source file
  sourceFile.getVariableDeclarations().forEach(variableDeclaration => {
    // Get the initializer of the variable declaration to extract the base path value
    const initializer = variableDeclaration.getInitializer();

    // Check if the initializer is a template expression
    if (initializer && Node.isTemplateExpression(initializer)) {
      // Cast the initializer to a TemplateExpression type to access its methods and properties
      const templateExpression = initializer as TemplateExpression;
      // Get the template spans of the template expression to extract the head and tail parts
      // Temple spans are the parts of the template expression that are not placeholders
      const templateSpans = templateExpression.getTemplateSpans();
      // Get the head of the template expression (the part before the first template span) and remove the trailing backtick
      const head = templateExpression.getHead().getText().replace(/`$/, '');
      // Get the tail of the template expression (the part after the last template span) and join all spans together
      const tail = templateSpans.map(span => span.getLiteral().getText()).join('');
      // Construct the base path by concatenating the head and tail parts, removing the placeholder syntax `${}`
      basePath = (head + tail).replace('${}/', '').replace(/`/g, '');
      //console.log(`Found base path: ${basePath}`);
    }
  });

  /**
   * A recursive function to visit each node in the source file
   * @param node The current node to visit
   */
  function visit(node: Node) {
    // Check if the node is a call expression
    if (Node.isCallExpression(node)) {
      // Cast the node to a CallExpression
      const callExpression = node as CallExpression;
      // Check if the call expression is a fetch call
      if (callExpression.getExpression().getText().includes('fetch')) {
        // Initialize the method, path, and request body type name
        let method = 'GET';
        let path = '';
        let requestBodyTypeName: string | null = null;
        let responseBodyTypeName: string | null = null;

        // Iterate over the arguments of the call expression
        callExpression.getArguments().forEach(arg => {
          
          if (Node.isTemplateExpression(arg)) {
            const templateExpression = arg as TemplateExpression;
            const templateSpans = templateExpression.getTemplateSpans();
            const head = templateExpression.getHead().getText().replace(/`$/, '');
            const tail = templateSpans.map(span => span.getLiteral().getText()).join('');
            path = (head + tail).replace('${}', '').replace(/`/g, '');
            //console.log(`Found path: ${path}`);
          } else if (Node.isStringLiteral(arg)) {
            path = (arg as StringLiteral).getLiteralValue();
            //console.log(`Found path: ${path}`);
          } else if (Node.isObjectLiteralExpression(arg)) {
            (arg as ObjectLiteralExpression).getProperties().forEach(prop => {
              if (prop.asKind(SyntaxKind.PropertyAssignment)) {
                const propAssignment = prop as PropertyAssignment;
                if (propAssignment.getName() === 'method') {
                  const initializer = propAssignment.getInitializer();
                  if (initializer && Node.isStringLiteral(initializer)) {
                    method = initializer.getLiteralValue().toUpperCase();
                    //console.log(`Found HTTP method: ${method}`);
                  }
                } else if (propAssignment.getName() === 'body') {
                  const initializer = propAssignment.getInitializer();
                  if (Node.isCallExpression(initializer) && initializer.getExpression().getText() === 'JSON.stringify') {
                    const argument = initializer.getArguments()[0];
                    if (Node.isIdentifier(argument)) {
                      let typeNode = (argument as Identifier).getType();
                      let requestBodyType = typeNode.getText();
                
                      // Recursively unwrap utility types
                      while (typeNode.isObject() && typeNode.getAliasSymbol()) {
                        const typeArguments = typeNode.getTypeArguments();
                        if (typeArguments.length > 0) {
                          requestBodyType = typeArguments[0].getText();
                          typeNode = typeArguments[0];
                        } else {
                          break;
                        }
                      }
                
                      // Extract the type name from the import statement
                      const importMatch = requestBodyType.match(/import\(".*"\)\.(\w+)/);
                      if (importMatch) {
                        requestBodyType = importMatch[1];
                      }

                      if (requestBodyType.endsWith('[]')) {
                        requestBodyType = requestBodyType.slice(0, -2);
                      }
                
                      requestBodyTypeName = requestBodyType;
                      //console.log(`Found request body type: ${requestBodyTypeName}`);
                    }
                  }
                }
              }
            });
          }
        });

        
        const parentNode = node.getParent();
        if (Node.isVariableDeclaration(parentNode)) {
          const variableDeclaration = parentNode as VariableDeclaration;
          const typeNode = variableDeclaration.getTypeNode();
          if (typeNode) {
            responseBodyTypeName = typeNode.getText();
          }
        } else if (Node.isReturnStatement(parentNode)) {
          // Navigate up to find the parent function (could be several levels up if nested in blocks or other structures)
          let current: Node | undefined = parentNode;
          while (current && !Node.isFunctionDeclaration(current) && !Node.isArrowFunction(current)) {
            current = current.getParent();
          }
        
          if (current && (Node.isFunctionDeclaration(current) || Node.isArrowFunction(current))) {
            const returnTypeNode = (current as FunctionDeclaration | ArrowFunction).getReturnTypeNode();
            if (returnTypeNode) {
              responseBodyTypeName = returnTypeNode.getText();
              // If the return type is a Promise, extract the generic type parameter
              const match = responseBodyTypeName.match(/Promise<(.+)>/);
              if (match) {
                responseBodyTypeName = match[1];
              }
            } else {
              //console.log("No return type node found.");
            }
          } else {
            //console.log("Parent is not a function declaration or arrow function.");
          }
        } else {
          //console.log("Parent node is not a variable declaration or return statement.");
        }

        if (Node.isCallExpression(node) && node.getExpression().getText().includes('fetch')) {
          // Find the enclosing function of the fetch call
          let current: Node | undefined = node;
          while (current && !Node.isFunctionDeclaration(current) && !Node.isArrowFunction(current)) {
            current = current.getParent();
          }
        
          if (current) {
            const functionNode = current as FunctionDeclaration | ArrowFunction;
            const returnTypeNode = functionNode.getReturnTypeNode();
            if (returnTypeNode) {
              let type = returnTypeNode.getType();
              let responseBodyType = type.getText();
        
              // Recursively unwrap utility types
              while (type.isObject() && type.getAliasSymbol()) {
                const typeArguments = type.getAliasTypeArguments();
                if (typeArguments.length > 0) {
                  responseBodyType = typeArguments[0].getText();
                  type = typeArguments[0];
                } else {
                  break;
                }
              }
        
              // Check if the unwrapped type is a union type
              const unionMatch = responseBodyType.match(/^(.+?)\s*\|/);
              if (unionMatch) {
                // Extract the first type before the "|"
                responseBodyType = unionMatch[1];
              }
        
              // Extract the type name from the import statement
              const importMatch = responseBodyType.match(/import\(".*"\)\.(\w+)/);
              if (importMatch) {
                responseBodyType = importMatch[1];
              }
        
              if (responseBodyType.endsWith('[]')) {
                responseBodyType = responseBodyType.slice(0, -2);
              }
        
              responseBodyTypeName = responseBodyType;
              //console.log(`Found response body type: ${responseBodyTypeName}`);
            }
          }
        }
        
        
        
        if (path) {
          let fullPath = '';
          if (path.startsWith('http://') || path.startsWith('https://')) {
            // If the path is a full URL, extract the path part
            const url = new URL(path);
            fullPath = url.pathname.replace(/\${}/g, '').replace(/^\//, ''); // Remove the leading slash
          } else {
            // If the path is a relative path, concatenate it with the base path
            fullPath = (basePath + path).replace(/\${}/g, '').replace(/^\//, ''); // Remove the leading slash
          }
          //console.log(`Constructed full path: ${fullPath}`);
          
          endpoints.push({
            method,
            path: fullPath,
            requestBodyType: requestBodyTypeName,
            responseBodyType: responseBodyTypeName,
          });
          //console.log('Endpoint found:', { method, path: fullPath, requestBodyType: requestBodyTypeName, responseBodyType: responseBodyTypeName });
        }
      }
    }

    node.forEachChild(visit);
  }

  sourceFile.forEachChild(visit);

  return endpoints;
}

function tsParser(project: Project): TSEndpoint[] {
  const endpoints: TSEndpoint[] = [];

  const sourceFiles = project.getSourceFiles();
  sourceFiles.forEach(sourceFile => {
    endpoints.push(...findEndpointsInFile(sourceFile));
  });

  return endpoints;
}

export { tsParser, TSEndpoint };
