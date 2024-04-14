// src/linter/requestParser.ts
import { Project, SourceFile, SyntaxKind, Node, ObjectLiteralExpression, PropertyAssignment, CallExpression, Identifier, StringLiteral, TemplateExpression, VariableDeclaration } from 'ts-morph';
import { TSEndpoint } from '../types/TSEndpoint';

function findEndpointsInFile(sourceFile: SourceFile): TSEndpoint[] {
  const endpoints: TSEndpoint[] = [];
  let basePath = '';

  // Find the base path variable declaration
  sourceFile.getVariableDeclarations().forEach(variableDeclaration => {
    const initializer = variableDeclaration.getInitializer();
    if (initializer && Node.isTemplateExpression(initializer)) {
      const templateExpression = initializer as TemplateExpression;
      const templateSpans = templateExpression.getTemplateSpans();
      const head = templateExpression.getHead().getText().replace(/`$/, '');
      const tail = templateSpans.map(span => span.getLiteral().getText()).join('');
      basePath = (head + tail).replace('${}/', '').replace(/`/g, '');
      console.log(`Found base path: ${basePath}`);
    }
  });

  function visit(node: Node) {
    if (Node.isCallExpression(node)) {
      const callExpression = node as CallExpression;
      if (callExpression.getExpression().getText().includes('fetch')) {
        let method = 'GET';
        let path = '';
        let requestBodyTypeName: string | null = null;

        callExpression.getArguments().forEach(arg => {
          if (Node.isTemplateExpression(arg)) {
            const templateExpression = arg as TemplateExpression;
            const templateSpans = templateExpression.getTemplateSpans();
            const head = templateExpression.getHead().getText().replace(/`$/, '');
            const tail = templateSpans.map(span => span.getLiteral().getText()).join('');
            path = (head + tail).replace('${}', '').replace(/`/g, '');
            console.log(`Found path: ${path}`);
          } else if (Node.isStringLiteral(arg)) {
            path = (arg as StringLiteral).getLiteralValue();
            console.log(`Found path: ${path}`);
          } else if (Node.isObjectLiteralExpression(arg)) {
            (arg as ObjectLiteralExpression).getProperties().forEach(prop => {
              if (prop.asKind(SyntaxKind.PropertyAssignment)) {
                const propAssignment = prop as PropertyAssignment;
                if (propAssignment.getName() === 'method') {
                  const initializer = propAssignment.getInitializer();
                  if (initializer && Node.isStringLiteral(initializer)) {
                    method = initializer.getLiteralValue().toUpperCase();
                    console.log(`Found HTTP method: ${method}`);
                  }
                } else if (propAssignment.getName() === 'body') {
                  const initializer = propAssignment.getInitializer();
                  if (Node.isCallExpression(initializer) && initializer.getExpression().getText() === 'JSON.stringify') {
                    const argument = initializer.getArguments()[0];
                    if (Node.isIdentifier(argument)) {
                      const typeSymbol = (argument as Identifier).getType().getSymbol();
                      if (typeSymbol) {
                        requestBodyTypeName = typeSymbol.getName();
                        console.log(`Found request body type: ${requestBodyTypeName}`);
                      }
                    }
                  }
                }
              }
            });
          }
        });

        if (path) {
          let fullPath = '';
          if (path.startsWith('http://') || path.startsWith('https://')) {
            // If the path is a full URL, extract the path part
            const url = new URL(path);
            fullPath = url.pathname;
          } else {
            // If the path is a relative path, concatenate it with the base path
            fullPath = basePath + path;
          }
          console.log(`Constructed full path: ${fullPath}`);
      
          endpoints.push({ method, path: fullPath, requestBodyType: requestBodyTypeName });
          console.log('Endpoint found:', { method, path: fullPath, requestBodyType: requestBodyTypeName });
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
