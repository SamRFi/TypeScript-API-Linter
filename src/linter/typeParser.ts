// src/linter/typeParser.ts
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

interface TypeDefinition {
  name: string;
  properties: { [key: string]: string };
}

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
        });
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
      } else if (dirent.isFile() && dirent.name.endsWith('.ts')) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        types = types.concat(findTypesInFile(fileContent, dirent.name));
      }
    });
  }

  readFilesFromDirectory(directoryPath);

  return types;
}

export { parseTypes, TypeDefinition };