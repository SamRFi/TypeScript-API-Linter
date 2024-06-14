// src/linter/typeParser.ts
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { TypeDefinition } from '../types/TypeDefinition';

/**
 * Finds and extracts type definitions (interfaces, type aliases, enums) from a TypeScript file's content
 * @param fileContent The content of the TypeScript file
 * @param fileName The name of the file being processed
 * @returns An array of TypeDefinition objects representing found types
 */
function findTypesInFile(fileContent: string, fileName: string): TypeDefinition[] {
  const types: TypeDefinition[] = []; // Initialize an array to store the extracted type definitions

  const sourceFile = ts.createSourceFile( // Create a TypeScript source file object from the content provided
    fileName,
    fileContent,
    ts.ScriptTarget.ES2015,
    /*setParentNodes */ true // Set this to true to retain parent references in the AST
  );

  /**
   * A recursive function to visit each node in the AST and extract type definitions
   * @param node The current node in the AST being visited
   */
  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node)) { // Check if the node is an interface declaration
      const typeName = node.name.getText(sourceFile); // Get the name of the interface
      const typeProperties: { [key: string]: string } = {}; // Initialize an object to store properties of the interface

      node.members.forEach(member => { // Iterate over each member of the interface
        if (ts.isPropertySignature(member)) { // Check if the member is a property signature (i.e., a property in an interface)
          const propertyName = member.name.getText(sourceFile); // Get the name of the property
          let propertyType = member.type ? member.type.getText(sourceFile) : 'any'; // Get the type of the property or default to 'any' if not specified

          // Check if the property type is an object literal (inline type declaration within the interface)
          if (member.type && ts.isTypeLiteralNode(member.type)) {
            propertyType = 'object'; // Set the type to 'object' if it is an object literal
          }

          typeProperties[propertyName] = propertyType; // Add the property name and type to the typeProperties object
        }
      });

      types.push({
        name: typeName, // The name of the interface
        properties: typeProperties, // The properties of the interface
        usages: [], // Placeholder for usages, not populated in this function
      });
    } else if (ts.isTypeAliasDeclaration(node)) { // Check if the node is a type alias declaration
      const typeName = node.name.getText(sourceFile); // Get the name of the type alias
      const typeProperties: { [key: string]: string } = {}; // Initialize an object to store properties or the type alias itself

      if (ts.isTypeLiteralNode(node.type)) { // Check if the type alias is an object literal type
        node.type.members.forEach(member => { // Iterate over each member of the type literal
          if (ts.isPropertySignature(member)) { // Check if the member is a property signature
            const propertyName = member.name.getText(sourceFile); // Get the name of the property
            let propertyType = member.type ? member.type.getText(sourceFile) : 'any'; // Get the type of the property or default to 'any' if not specified

            // Check if the property type is an object literal
            if (member.type && ts.isTypeLiteralNode(member.type)) {
              propertyType = 'object'; // Set the type to 'object' if it is an object literal
            }

            typeProperties[propertyName] = propertyType; // Add the property name and type to the typeProperties object
          }
        });
      } else {
        // Handle other types of type aliases (e.g., simple type aliases, unions, etc.)
        const aliasType = node.type.getText(sourceFile); // Get the text representation of the alias type
        typeProperties['type'] = aliasType; // Store the alias type in the typeProperties object
      }

      types.push({
        name: typeName, // The name of the type alias
        properties: typeProperties, // The properties or the alias type itself
        usages: [], // Placeholder for usages, not populated in this function
      });
    } else if (ts.isEnumDeclaration(node)) { // Check if the node is an enum declaration
      const enumName = node.name.getText(sourceFile); // Get the name of the enum
      const enumProperties: { [key: string]: string } = {}; // Initialize an object to store enum members and their values

      node.members.forEach(member => { // Iterate over each member of the enum
        if (ts.isEnumMember(member)) { // Check if the member is an enum member
          const memberName = member.name.getText(sourceFile); // Get the name of the enum member
          let memberValue = ''; // Initialize a variable to store the value of the enum member

          if (member.initializer) { // Check if the enum member has an initializer (value assigned)
            if (ts.isStringLiteral(member.initializer)) { // Check if the initializer is a string literal
              memberValue = member.initializer.getText(sourceFile).replace(/'/g, ''); // Extract and clean the string literal value
            } else if (ts.isNumericLiteral(member.initializer)) { // Check if the initializer is a numeric literal
              memberValue = member.initializer.getText(sourceFile); // Extract the numeric literal value
            }
          }

          enumProperties[memberName] = memberValue; // Add the enum member name and value to the enumProperties object
        }
      });

      types.push({
        name: enumName, // The name of the enum
        properties: enumProperties, // The members of the enum and their values
        usages: [], // Placeholder for usages, not populated in this function
      });
    }

    ts.forEachChild(node, visit); // Recursively visit each child node of the current node
  }

  visit(sourceFile); // Start visiting nodes from the root of the source file

  return types; // Return the list of found type definitions
}

/**
 * Parses all TypeScript files in a given directory to extract type definitions
 * @param directoryPath The path to the directory containing TypeScript files
 * @returns An array of TypeDefinition objects representing found types in all files
 */
function parseTypes(directoryPath: string): TypeDefinition[] {
  let types: TypeDefinition[] = []; // Initialize an array to hold all types found in the directory

  /**
   * Recursively reads and processes all files in a directory
   * @param directory The current directory to read files from
   */
  function readFilesFromDirectory(directory: string) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach(dirent => { // Read all entries in the directory
      const resolvedPath = path.resolve(directory, dirent.name); // Resolve the full path of the directory entry
      if (dirent.isDirectory()) { // Check if the entry is a directory
        readFilesFromDirectory(resolvedPath); // Recursively process the subdirectory
      } else if (dirent.isFile()) { // Check if the entry is a file
        const fileContent = fs.readFileSync(resolvedPath, 'utf8'); // Read the file content as a UTF-8 string
        const fileTypes = findTypesInFile(fileContent, dirent.name); // Extract type definitions from the file content
        types.push(...fileTypes); // Add the extracted types to the main types array
      }
    });
  }

  readFilesFromDirectory(directoryPath); // Start reading files from the given directory path

  return types; // Return the collected types from all processed files
}

export { parseTypes, TypeDefinition }; // Export the parseTypes function and TypeDefinition type for use in other modules
