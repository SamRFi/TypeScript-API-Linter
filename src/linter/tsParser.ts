import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import { TSEndpoint } from '../types/TSEndpoint';
import { createProgram } from './createProgram';

function findEndpointsInFile(fileContent: string, fileName: string, program: ts.Program): TSEndpoint[] {
  let endpoints: TSEndpoint[] = [];

  const sourceFile = ts.createSourceFile(
    fileName,
    fileContent,
    ts.ScriptTarget.ES2019,
    /*setParentNodes */ true
  );

  const typeChecker = program.getTypeChecker();

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(sourceFile).includes('fetch')) {
      let method = 'GET';
      let url = '';
      let requestBodyType: string | null = null;

      console.log('Found fetch call expression');

      node.arguments.forEach(arg => {
        if (ts.isObjectLiteralExpression(arg)) {
          console.log('Processing object literal argument');

          arg.properties.forEach(prop => {
            if (ts.isPropertyAssignment(prop) && prop.name.getText(sourceFile) === 'body') {
              console.log('Found body property');

              const initializer = prop.initializer;
              if (ts.isCallExpression(initializer) && initializer.expression.getText(sourceFile) === 'JSON.stringify') {
                console.log('Found JSON.stringify call');

                const argument = initializer.arguments[0];
                if (ts.isIdentifier(argument)) {
                  console.log('Processing identifier argument:', argument.getText(sourceFile));

                  const type = typeChecker.getTypeAtLocation(argument);
                  requestBodyType = typeChecker.typeToString(type);

                  console.log('Extracted request body type:', requestBodyType);
                }
              }
            }
          });
        }
      });

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
        const urlObj = new URL(url, "https://baseurl.com");
        const path = urlObj.pathname;
        endpoints.push({ method, path, requestBodyType });

        console.log('Endpoint found:', { method, path, requestBodyType });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return endpoints;
}

function tsParser(directoryPath: string, program: ts.Program): TSEndpoint[] {
  let endpoints: TSEndpoint[] = [];

  function readFilesFromDirectory(directory: string) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach(dirent => {
      const resolvedPath = path.resolve(directory, dirent.name);
      if (dirent.isDirectory()) {
        readFilesFromDirectory(resolvedPath);
      } else if (dirent.isFile() && dirent.name.endsWith('.ts')) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        endpoints = endpoints.concat(findEndpointsInFile(fileContent, dirent.name, program));
      }
    });
  }

  readFilesFromDirectory(directoryPath);

  return endpoints;
}

export { tsParser, TSEndpoint };
