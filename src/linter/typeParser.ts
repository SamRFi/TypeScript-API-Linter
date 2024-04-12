// src/linter/typeParser.ts
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { TypeDefinition } from '../types/TypeDefinition';

function findTypesInFile(fileContent: string, fileName: string): TypeDefinition[] {
  const types: TypeDefinition[] = [];

  const sourceFile = ts.createSourceFile(
    fileName,
    fileContent,
    ts.ScriptTarget.ES2015,
    /*setParentNodes */ true
  );

  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node)) {
      const typeName = node.name.getText(sourceFile);
      const typeProperties: { [key: string]: string } = {};

      node.members.forEach(member => {
        if (ts.isPropertySignature(member)) {
          const propertyName = member.name.getText(sourceFile);
          const propertyType = member.type ? member.type.getText(sourceFile) : 'any';
          typeProperties[propertyName] = propertyType;
        }
      });

      types.push({
        name: typeName,
        properties: typeProperties,
        usages: [],
      });

      //console.log(`Found interface: ${typeName}`);
      //console.log('Properties:');
      //console.log(typeProperties);
    } else if (ts.isTypeAliasDeclaration(node)) {
      const typeName = node.name.getText(sourceFile);
      const typeProperties: { [key: string]: string } = {};

      if (ts.isTypeLiteralNode(node.type)) {
        node.type.members.forEach(member => {
          if (ts.isPropertySignature(member)) {
            const propertyName = member.name.getText(sourceFile);
            const propertyType = member.type ? member.type.getText(sourceFile) : 'any';
            typeProperties[propertyName] = propertyType;
          }
        });
      }

      types.push({
        name: typeName,
        properties: typeProperties,
        usages: [],
      });

      //console.log(`Found type alias: ${typeName}`);
      //console.log('Properties:');
      //console.log(typeProperties);
    } else if (ts.isVariableDeclaration(node)) {
      const variableName = node.name.getText(sourceFile);
      const variableType = node.type ? node.type.getText(sourceFile) : 'any';

      // Check if the variable type matches any of the extracted type names
      const matchingType = types.find(type => type.name === variableType);

      if (matchingType) {
        // If a matching type is found, add the variable declaration as a usage of that type
        matchingType.usages.push(variableName);
        //console.log(`Found usage of type ${variableType} in variable ${variableName}`);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return types;
}

function parseTypes(directoryPath: string): TypeDefinition[] {
  let types: TypeDefinition[] = [];

  function readFilesFromDirectory(directory: string) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach(dirent => {
      const resolvedPath = path.resolve(directory, dirent.name);
      if (dirent.isDirectory()) {
        readFilesFromDirectory(resolvedPath);
      } else if (dirent.isFile()) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        const fileTypes = findTypesInFile(fileContent, dirent.name);
        types = types.concat(fileTypes);
        //console.log(`Parsed types from file: ${dirent.name}`);
        //console.log(fileTypes);
      }
    });
  }

  readFilesFromDirectory(directoryPath);

  return types;
}

export { parseTypes, TypeDefinition };
