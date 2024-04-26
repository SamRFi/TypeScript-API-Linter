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
                    // Check if the property type is an object literal
                    if (member.type && ts.isTypeLiteralNode(member.type)) {
                        propertyType = 'object';
                    }
                    typeProperties_1[propertyName] = propertyType;
                }
            });
            types.push({
                name: typeName,
                properties: typeProperties_1,
                usages: [],
            });
        }
        else if (ts.isTypeAliasDeclaration(node)) {
            var typeName = node.name.getText(sourceFile);
            var typeProperties_2 = {};
            if (ts.isTypeLiteralNode(node.type)) {
                node.type.members.forEach(function (member) {
                    if (ts.isPropertySignature(member)) {
                        var propertyName = member.name.getText(sourceFile);
                        var propertyType = member.type ? member.type.getText(sourceFile) : 'any';
                        // Check if the property type is an object literal
                        if (member.type && ts.isTypeLiteralNode(member.type)) {
                            propertyType = 'object';
                        }
                        typeProperties_2[propertyName] = propertyType;
                    }
                });
            }
            else {
                // Handle other types of type aliases
                var aliasType = node.type.getText(sourceFile);
                typeProperties_2['type'] = aliasType;
            }
            types.push({
                name: typeName,
                properties: typeProperties_2,
                usages: [],
            });
        }
        else if (ts.isEnumDeclaration(node)) {
            var enumName = node.name.getText(sourceFile);
            var enumProperties_1 = {};
            node.members.forEach(function (member) {
                if (ts.isEnumMember(member)) {
                    var memberName = member.name.getText(sourceFile);
                    var memberValue = '';
                    if (member.initializer) {
                        if (ts.isStringLiteral(member.initializer)) {
                            memberValue = member.initializer.getText(sourceFile).replace(/'/g, '');
                        }
                        else if (ts.isNumericLiteral(member.initializer)) {
                            memberValue = member.initializer.getText(sourceFile);
                        }
                    }
                    enumProperties_1[memberName] = memberValue;
                }
            });
            types.push({
                name: enumName,
                properties: enumProperties_1,
                usages: [],
            });
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
                types.push.apply(types, fileTypes);
            }
        });
    }
    readFilesFromDirectory(directoryPath);
    return types;
}
exports.parseTypes = parseTypes;
