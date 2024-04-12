"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tsParser = void 0;
// src/linter/requestParser.ts
var ts_morph_1 = require("ts-morph");
function findEndpointsInFile(sourceFile) {
    var endpoints = [];
    function visit(node) {
        if (ts_morph_1.Node.isCallExpression(node)) {
            var callExpression = node;
            if (callExpression.getExpression().getText().includes('fetch')) {
                var method_1 = 'GET';
                var url_1 = '';
                var requestBodyTypeName_1 = null;
                callExpression.getArguments().forEach(function (arg) {
                    if (ts_morph_1.Node.isTemplateExpression(arg)) {
                        var templateExpression = arg;
                        var templateSpans = templateExpression.getTemplateSpans();
                        var head = templateExpression.getHead().getText().replace(/`$/, '');
                        var tail = templateSpans.map(function (span) { return span.getLiteral().getText(); }).join('');
                        url_1 = head + tail;
                    }
                    else if (ts_morph_1.Node.isStringLiteral(arg)) {
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
                                else if (propAssignment.getName() === 'body') {
                                    var initializer = propAssignment.getInitializer();
                                    if (ts_morph_1.Node.isCallExpression(initializer) && initializer.getExpression().getText() === 'JSON.stringify') {
                                        var argument = initializer.getArguments()[0];
                                        if (ts_morph_1.Node.isIdentifier(argument)) {
                                            var typeSymbol = argument.getType().getSymbol();
                                            if (typeSymbol) {
                                                requestBodyTypeName_1 = typeSymbol.getName();
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
                if (url_1) {
                    var path = '';
                    // Check if the URL starts with "http" or "https"
                    if (url_1.startsWith('http://') || url_1.startsWith('https://')) {
                        var urlObj = new URL(url_1);
                        path = urlObj.pathname + urlObj.search;
                    }
                    else {
                        // Remove any leading or trailing backticks and whitespace
                        url_1 = url_1.replace(/^`\s*|\s*`$/g, '');
                        // Extract the path part of the URL
                        var urlObj = new URL(url_1, 'https://example.com');
                        path = urlObj.pathname + urlObj.search;
                        // Omit URL-encoded placeholders
                        path = path.replace(/%7B.*?%7D/g, '');
                        path = path.replace('$', '');
                    }
                    endpoints.push({ method: method_1, path: path, requestBodyType: requestBodyTypeName_1 });
                    console.log('Endpoint found:', { method: method_1, path: path, requestBodyType: requestBodyTypeName_1 });
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
