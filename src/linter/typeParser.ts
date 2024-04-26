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
          let propertyType = member.type ? member.type.getText(sourceFile) : 'any';

          // Check if the property type is an object literal
          if (member.type && ts.isTypeLiteralNode(member.type)) {
            propertyType = 'object';
          }

          typeProperties[propertyName] = propertyType;
        }
      });

      types.push({
        name: typeName,
        properties: typeProperties,
        usages: [],
      });
    } else if (ts.isTypeAliasDeclaration(node)) {
      const typeName = node.name.getText(sourceFile);
      const typeProperties: { [key: string]: string } = {};

      if (ts.isTypeLiteralNode(node.type)) {
        node.type.members.forEach(member => {
          if (ts.isPropertySignature(member)) {
            const propertyName = member.name.getText(sourceFile);
            let propertyType = member.type ? member.type.getText(sourceFile) : 'any';

            // Check if the property type is an object literal
            if (member.type && ts.isTypeLiteralNode(member.type)) {
              propertyType = 'object';
            }

            typeProperties[propertyName] = propertyType;
          }
        });
      } else {
        // Handle other types of type aliases
        const aliasType = node.type.getText(sourceFile);
        typeProperties['type'] = aliasType;
      }

      types.push({
        name: typeName,
        properties: typeProperties,
        usages: [],
      });
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
        types.push(...fileTypes);
      }
    });
  }

  readFilesFromDirectory(directoryPath);

  return types;
}

export { parseTypes, TypeDefinition };
