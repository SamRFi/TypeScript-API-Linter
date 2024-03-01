// src/linter/tsParser.ts
import ts from 'typescript';
import fs from 'fs';
import path from 'path';

interface TSEndpoint {
  method: string;
  path: string;
}

function findEndpointsInFile(fileContent: string, fileName: string): TSEndpoint[] {
  let endpoints: TSEndpoint[] = [];

  const sourceFile = ts.createSourceFile(
    fileName,
    fileContent,
    ts.ScriptTarget.ES2015,
    /*setParentNodes */ true
  );

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(sourceFile).includes('fetch')) {
      let method = 'GET'; // Default method for fetch is GET
      let url = '';

      node.arguments.forEach(arg => {
        if (ts.isStringLiteral(arg)) {
          url = arg.text;
        } else if (ts.isObjectLiteralExpression(arg)) {
          arg.properties.forEach(prop => {
            if (ts.isPropertyAssignment(prop) && prop.name.getText(sourceFile) === 'method' && ts.isStringLiteral(prop.initializer)) {
              method = prop.initializer.text.toUpperCase();
            }
          });
        }
      });

      if (url) {
        const urlObj = new URL(url, "https://baseurl.com"); // Use a dummy base URL for parsing
        const path = urlObj.pathname; // Extract path, ignoring the domain
        endpoints.push({ method, path });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return endpoints;
}

function tsParser(directoryPath: string): TSEndpoint[] {
  let endpoints: TSEndpoint[] = [];

  function readFilesFromDirectory(directory: string) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach(dirent => {
      const resolvedPath = path.resolve(directory, dirent.name);
      if (dirent.isDirectory()) {
        readFilesFromDirectory(resolvedPath);
      } else if (dirent.isFile() && dirent.name.endsWith('.ts')) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        endpoints = endpoints.concat(findEndpointsInFile(fileContent, dirent.name));
      }
    });
  }

  readFilesFromDirectory(directoryPath);

  return endpoints;
}

export { tsParser, TSEndpoint };
