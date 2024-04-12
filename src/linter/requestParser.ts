// src/linter/requestParser.ts
import { Project, SourceFile, SyntaxKind, Node, ObjectLiteralExpression, PropertyAssignment, CallExpression, Identifier, StringLiteral, TemplateExpression } from 'ts-morph';
import { TSEndpoint } from '../types/TSEndpoint';

function findEndpointsInFile(sourceFile: SourceFile): TSEndpoint[] {
  const endpoints: TSEndpoint[] = [];

  function visit(node: Node) {
    if (Node.isCallExpression(node)) {
      const callExpression = node as CallExpression;
      if (callExpression.getExpression().getText().includes('fetch')) {
        let method = 'GET';
        let url = '';
        let requestBodyTypeName: string | null = null;

        callExpression.getArguments().forEach(arg => {
          if (Node.isTemplateExpression(arg)) {
            const templateExpression = arg as TemplateExpression;
            const templateSpans = templateExpression.getTemplateSpans();
            const head = templateExpression.getHead().getText().replace(/`$/, '');
            const tail = templateSpans.map(span => span.getLiteral().getText()).join('');
            url = head + tail;
          } else if (Node.isStringLiteral(arg)) {
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
                } else if (propAssignment.getName() === 'body') {
                  const initializer = propAssignment.getInitializer();
                  if (Node.isCallExpression(initializer) && initializer.getExpression().getText() === 'JSON.stringify') {
                    const argument = initializer.getArguments()[0];
                    if (Node.isIdentifier(argument)) {
                      const typeSymbol = (argument as Identifier).getType().getSymbol();
                      if (typeSymbol) {
                        requestBodyTypeName = typeSymbol.getName();
                      }
                    }
                  }
                }
              }
            });
          }
        });

        if (url) {
          let path = '';

          // Check if the URL starts with "http" or "https"
          if (url.startsWith('http://') || url.startsWith('https://')) {
            const urlObj = new URL(url);
            path = urlObj.pathname + urlObj.search;
          } else {
            // Remove any leading or trailing backticks and whitespace
            url = url.replace(/^`\s*|\s*`$/g, '');
            
            // Extract the path part of the URL
            const urlObj = new URL(url, 'https://example.com');
            path = urlObj.pathname + urlObj.search;
            
            // Omit URL-encoded placeholders
            path = path.replace(/%7B.*?%7D/g, '');
            path = path.replace('$','');
          }

          endpoints.push({ method, path, requestBodyType: requestBodyTypeName });
          console.log('Endpoint found:', { method, path, requestBodyType: requestBodyTypeName });
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
