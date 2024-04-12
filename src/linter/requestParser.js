"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tsParser = void 0;
// src/linter/requestParser.ts
var ts_morph_1 = require("ts-morph");
function findEndpointsInFile(sourceFile, postmanEndpoints) {
    var endpoints = [];
    function visit(node) {
        if (ts_morph_1.Node.isCallExpression(node)) {
            var callExpression = node;
            if (callExpression.getExpression().getText().includes('fetch')) {
                var method_1 = 'GET';
                var url_1 = '';
                var requestBodyTypeName_1 = null;
                //console.log('Found fetch call expression');
                callExpression.getArguments().forEach(function (arg) {
                    if (ts_morph_1.Node.isObjectLiteralExpression(arg)) {
                        //console.log('Processing object literal argument');
                        arg.getProperties().forEach(function (prop) {
                            if (prop.asKind(ts_morph_1.SyntaxKind.PropertyAssignment)) {
                                var propAssignment = prop;
                                if (propAssignment.getName() === 'body') {
                                    //console.log('Found body property');
                                    var initializer = propAssignment.getInitializer();
                                    if (ts_morph_1.Node.isCallExpression(initializer) && initializer.getExpression().getText() === 'JSON.stringify') {
                                        //console.log('Found JSON.stringify call');
                                        var argument = initializer.getArguments()[0];
                                        if (ts_morph_1.Node.isIdentifier(argument)) {
                                            //console.log('Processing identifier argument:', argument.getText());
                                            var typeSymbol = argument.getType().getSymbol();
                                            if (typeSymbol) {
                                                requestBodyTypeName_1 = typeSymbol.getName();
                                                //console.log('Extracted request body type name:', requestBodyTypeName);
                                            }
                                            else {
                                                //console.log('Type symbol not found for argument:', argument.getText());
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
                callExpression.getArguments().forEach(function (arg) {
                    if (ts_morph_1.Node.isStringLiteral(arg)) {
                        url_1 = arg.getLiteralValue();
                    }
                    else if (ts_morph_1.Node.isObjectLiteralExpression(arg)) {
                        arg.getProperties().forEach(function (prop) {
                            if (prop.asKind(ts_morph_1.SyntaxKind.PropertyAssignment)) {
                                var propAssignment = prop;
                                if (propAssignment.getName() === 'method') {
                                    var initializer = propAssignment.getInitializer();
                                    if (initializer && ts_morph_1.Node.isStringLiteral(initializer)) {
                                        method_1 = initializer.getLiteralValue().toUpperCase();
                                    }
                                }
                            }
                        });
                    }
                });
                if (url_1) {
                    var urlObj = new URL(url_1, "https://baseurl.com");
                    var path = urlObj.pathname;
                    endpoints.push({ method: method_1, path: path, requestBodyType: requestBodyTypeName_1 });
                    //console.log('Endpoint found:', { method, path, requestBodyType: requestBodyTypeName });
                }
            }
        }
        node.forEachChild(visit);
    }
    sourceFile.forEachChild(visit);
    return endpoints;
}
function tsParser(project, postmanEndpoints) {
    var endpoints = [];
    var sourceFiles = project.getSourceFiles();
    sourceFiles.forEach(function (sourceFile) {
        endpoints.push.apply(endpoints, findEndpointsInFile(sourceFile, postmanEndpoints));
    });
    return endpoints;
}
exports.tsParser = tsParser;
