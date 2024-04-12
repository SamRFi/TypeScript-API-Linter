"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTypes = void 0;
// src/linter/typeParser.ts
var ts = require("typescript");
var fs = require("fs");
var path = require("path");
function findTypesInFile(fileContent, fileName) {
    var types = [];
    var sourceFile = ts.createSourceFile(fileName, fileContent, ts.ScriptTarget.ES2015, 
    /*setParentNodes */ true);
    function visit(node) {
        if (ts.isInterfaceDeclaration(node)) {
            var typeName = node.name.getText(sourceFile);
            var typeProperties_1 = {};
            node.members.forEach(function (member) {
                if (ts.isPropertySignature(member)) {
                    var propertyName = member.name.getText(sourceFile);
                    var propertyType = member.type ? member.type.getText(sourceFile) : 'any';
                    typeProperties_1[propertyName] = propertyType;
                }
            });
            types.push({
                name: typeName,
                properties: typeProperties_1,
                usages: [],
            });
            //console.log(`Found interface: ${typeName}`);
            //console.log('Properties:');
            //console.log(typeProperties);
        }
        else if (ts.isTypeAliasDeclaration(node)) {
            var typeName = node.name.getText(sourceFile);
            var typeProperties_2 = {};
            if (ts.isTypeLiteralNode(node.type)) {
                node.type.members.forEach(function (member) {
                    if (ts.isPropertySignature(member)) {
                        var propertyName = member.name.getText(sourceFile);
                        var propertyType = member.type ? member.type.getText(sourceFile) : 'any';
                        typeProperties_2[propertyName] = propertyType;
                    }
                });
            }
            types.push({
                name: typeName,
                properties: typeProperties_2,
                usages: [],
            });
            //console.log(`Found type alias: ${typeName}`);
            //console.log('Properties:');
            //console.log(typeProperties);
        }
        else if (ts.isVariableDeclaration(node)) {
            var variableName = node.name.getText(sourceFile);
            var variableType_1 = node.type ? node.type.getText(sourceFile) : 'any';
            // Check if the variable type matches any of the extracted type names
            var matchingType = types.find(function (type) { return type.name === variableType_1; });
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
function parseTypes(directoryPath) {
    var types = [];
    function readFilesFromDirectory(directory) {
        fs.readdirSync(directory, { withFileTypes: true }).forEach(function (dirent) {
            var resolvedPath = path.resolve(directory, dirent.name);
            if (dirent.isDirectory()) {
                readFilesFromDirectory(resolvedPath);
            }
            else if (dirent.isFile()) {
                var fileContent = fs.readFileSync(resolvedPath, 'utf8');
                var fileTypes = findTypesInFile(fileContent, dirent.name);
                types = types.concat(fileTypes);
                //console.log(`Parsed types from file: ${dirent.name}`);
                //console.log(fileTypes);
            }
        });
    }
    readFilesFromDirectory(directoryPath);
    return types;
}
exports.parseTypes = parseTypes;
