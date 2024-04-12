// src/linter/requestParser.ts
import { Project, SourceFile, SyntaxKind, Node, ObjectLiteralExpression, PropertyAssignment, CallExpression, Identifier, StringLiteral } from 'ts-morph';
import { TSEndpoint } from '../types/TSEndpoint';
import { EndpointDefinition } from '../types/Postman.types';

function findEndpointsInFile(sourceFile: SourceFile, postmanEndpoints: EndpointDefinition[]): TSEndpoint[] {
  const endpoints: TSEndpoint[] = [];

  function visit(node: Node) {
    if (Node.isCallExpression(node)) {
      const callExpression = node as CallExpression;
      if (callExpression.getExpression().getText().includes('fetch')) {
        let method = 'GET';
        let url = '';
        let requestBodyTypeName: string | null = null;

        //console.log('Found fetch call expression');

        callExpression.getArguments().forEach(arg => {
          if (Node.isObjectLiteralExpression(arg)) {
            //console.log('Processing object literal argument');

            (arg as ObjectLiteralExpression).getProperties().forEach(prop => {
              if (prop.asKind(SyntaxKind.PropertyAssignment)) {
                const propAssignment = prop as PropertyAssignment;
                if (propAssignment.getName() === 'body') {
                  //console.log('Found body property');

                  const initializer = propAssignment.getInitializer();
                  if (Node.isCallExpression(initializer) && initializer.getExpression().getText() === 'JSON.stringify') {
                    //console.log('Found JSON.stringify call');

                    const argument = initializer.getArguments()[0];
                    if (Node.isIdentifier(argument)) {
                      //console.log('Processing identifier argument:', argument.getText());
                    
                      const typeSymbol = (argument as Identifier).getType().getSymbol();
                      if (typeSymbol) {
                        requestBodyTypeName = typeSymbol.getName();
                        //console.log('Extracted request body type name:', requestBodyTypeName);
                      } else {
                        //console.log('Type symbol not found for argument:', argument.getText());
                      }
                    }                    
                  }
                }
              }
            });
          }
        });

        callExpression.getArguments().forEach(arg => {
          if (Node.isStringLiteral(arg)) {
            url = (arg as StringLiteral).getLiteralValue();
          } else if (Node.isObjectLiteralExpression(arg)) {
            (arg as ObjectLiteralExpression).getProperties().forEach(prop => {
              if (prop.asKind(SyntaxKind.PropertyAssignment)) {
                const propAssignment = prop as PropertyAssignment;
                if (propAssignment.getName() === 'method') {
                  const initializer = propAssignment.getInitializer();
                  if (initializer && Node.isStringLiteral(initializer)) {
                    method = initializer.getLiteralValue().toUpperCase();
                  }
                }
              }
            });
          }
        });

        if (url) {
          const urlObj = new URL(url, "https://baseurl.com");
          const path = urlObj.pathname;
          endpoints.push({ method, path, requestBodyType: requestBodyTypeName });
          //console.log('Endpoint found:', { method, path, requestBodyType: requestBodyTypeName });
        }
      }
    }

    node.forEachChild(visit);
  }

  sourceFile.forEachChild(visit);

  return endpoints;
}

function tsParser(project: Project, postmanEndpoints: EndpointDefinition[]): TSEndpoint[] {
  const endpoints: TSEndpoint[] = [];

  const sourceFiles = project.getSourceFiles();
  sourceFiles.forEach(sourceFile => {
    endpoints.push(...findEndpointsInFile(sourceFile, postmanEndpoints));
  });

  return endpoints;
}

export { tsParser, TSEndpoint };
