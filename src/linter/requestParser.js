"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tsParser = void 0;
// src/linter/requestParser.ts
var ts_morph_1 = require("ts-morph");
function findEndpointsInFile(sourceFile) {
    var endpoints = [];
    var basePath = '';
    // Find the base path variable declaration
    sourceFile.getVariableDeclarations().forEach(function (variableDeclaration) {
        var initializer = variableDeclaration.getInitializer();
        if (initializer && ts_morph_1.Node.isTemplateExpression(initializer)) {
            var templateExpression = initializer;
            var templateSpans = templateExpression.getTemplateSpans();
            var head = templateExpression.getHead().getText().replace(/`$/, '');
            var tail = templateSpans.map(function (span) { return span.getLiteral().getText(); }).join('');
            basePath = (head + tail).replace('${}/', '').replace(/`/g, '');
            //console.log(`Found base path: ${basePath}`);
        }
    });
    function visit(node) {
        if (ts_morph_1.Node.isCallExpression(node)) {
            var callExpression = node;
            if (callExpression.getExpression().getText().includes('fetch')) {
                var method_1 = 'GET';
                var path_1 = '';
                var requestBodyTypeName_1 = null;
                callExpression.getArguments().forEach(function (arg) {
                    if (ts_morph_1.Node.isTemplateExpression(arg)) {
                        var templateExpression = arg;
                        var templateSpans = templateExpression.getTemplateSpans();
                        var head = templateExpression.getHead().getText().replace(/`$/, '');
                        var tail = templateSpans.map(function (span) { return span.getLiteral().getText(); }).join('');
                        path_1 = (head + tail).replace('${}', '').replace(/`/g, '');
                        //console.log(`Found path: ${path}`);
                    }
                    else if (ts_morph_1.Node.isStringLiteral(arg)) {
                        path_1 = arg.getLiteralValue();
                        //console.log(`Found path: ${path}`);
                    }
                    else if (ts_morph_1.Node.isObjectLiteralExpression(arg)) {
                        arg.getProperties().forEach(function (prop) {
                            if (prop.asKind(ts_morph_1.SyntaxKind.PropertyAssignment)) {
                                var propAssignment = prop;
                                if (propAssignment.getName() === 'method') {
                                    var initializer = propAssignment.getInitializer();
                                    if (initializer && ts_morph_1.Node.isStringLiteral(initializer)) {
                                        method_1 = initializer.getLiteralValue().toUpperCase();
                                        //console.log(`Found HTTP method: ${method}`);
                                    }
                                }
                                else if (propAssignment.getName() === 'body') {
                                    var initializer = propAssignment.getInitializer();
                                    if (ts_morph_1.Node.isCallExpression(initializer) && initializer.getExpression().getText() === 'JSON.stringify') {
                                        var argument = initializer.getArguments()[0];
                                        if (ts_morph_1.Node.isIdentifier(argument)) {
                                            var typeSymbol = argument.getType().getSymbol();
                                            if (typeSymbol) {
                                                requestBodyTypeName_1 = typeSymbol.getName();
                                                //console.log(`Found request body type: ${requestBodyTypeName}`);
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
                if (path_1) {
                    var fullPath = '';
                    if (path_1.startsWith('http://') || path_1.startsWith('https://')) {
                        // If the path is a full URL, extract the path part
                        var url = new URL(path_1);
                        fullPath = url.pathname.replace(/\${}/g, '').replace(/^\//, ''); // Remove the leading slash
                    }
                    else {
                        // If the path is a relative path, concatenate it with the base path
                        fullPath = (basePath + path_1).replace(/\${}/g, '').replace(/^\//, ''); // Remove the leading slash
                    }
                    //console.log(`Constructed full path: ${fullPath}`);
                    endpoints.push({ method: method_1, path: fullPath, requestBodyType: requestBodyTypeName_1 });
                    //console.log('Endpoint found:', { method, path: fullPath, requestBodyType: requestBodyTypeName });
                }
            }
        }
        node.forEachChild(visit);
    }
    sourceFile.forEachChild(visit);
    return endpoints;
}
function tsParser(project) {
    var endpoints = [];
    var sourceFiles = project.getSourceFiles();
    sourceFiles.forEach(function (sourceFile) {
        endpoints.push.apply(endpoints, findEndpointsInFile(sourceFile));
    });
    return endpoints;
}
exports.tsParser = tsParser;
