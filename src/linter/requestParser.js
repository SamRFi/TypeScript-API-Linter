"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tsParser = void 0;
// src/linter/requestParser.ts
var ts_morph_1 = require("ts-morph");
/**
 * Finds all endpoints in a given source file
 * @param sourceFile The source file to search for endpoints
 * @returns An array of TSEndpoint objects
 */
function findEndpointsInFile(sourceFile) {
    // Initialize an empty array to store the found endpoints
    var endpoints = [];
    // Initialize an empty string to store the base path
    var basePath = '';
    // Find the base path variable declaration in the source file
    sourceFile.getVariableDeclarations().forEach(function (variableDeclaration) {
        // Get the initializer of the variable declaration to extract the base path value
        var initializer = variableDeclaration.getInitializer();
        // Check if the initializer is a template expression
        if (initializer && ts_morph_1.Node.isTemplateExpression(initializer)) {
            // Cast the initializer to a TemplateExpression type to access its methods and properties
            var templateExpression = initializer;
            // Get the template spans of the template expression to extract the head and tail parts
            // Temple spans are the parts of the template expression that are not placeholders
            var templateSpans = templateExpression.getTemplateSpans();
            // Get the head of the template expression (the part before the first template span) and remove the trailing backtick
            var head = templateExpression.getHead().getText().replace(/`$/, '');
            // Get the tail of the template expression (the part after the last template span) and join all spans together
            var tail = templateSpans.map(function (span) { return span.getLiteral().getText(); }).join('');
            // Construct the base path by concatenating the head and tail parts, removing the placeholder syntax `${}`
            basePath = (head + tail).replace('${}/', '').replace(/`/g, '');
            //console.log(`Found base path: ${basePath}`);
        }
    });
    /**
     * A recursive function to visit each node in the source file
     * @param node The current node to visit
     */
    function visit(node) {
        // Check if the node is a call expression
        if (ts_morph_1.Node.isCallExpression(node)) {
            // Cast the node to a CallExpression
            var callExpression = node;
            // Check if the call expression is a fetch call
            if (callExpression.getExpression().getText().includes('fetch')) {
                // Initialize the method, path, and request body type name
                var method_1 = 'GET';
                var path_1 = '';
                var requestBodyTypeName_1 = null;
                var responseBodyTypeName = null;
                // Iterate over the arguments of the call expression
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
                                            var typeNode = argument.getType();
                                            var requestBodyType = typeNode.getText();
                                            // Recursively unwrap utility types
                                            while (typeNode.isObject() && typeNode.getAliasSymbol()) {
                                                var typeArguments = typeNode.getTypeArguments();
                                                if (typeArguments.length > 0) {
                                                    requestBodyType = typeArguments[0].getText();
                                                    typeNode = typeArguments[0];
                                                }
                                                else {
                                                    break;
                                                }
                                            }
                                            // Extract the type name from the import statement
                                            var importMatch = requestBodyType.match(/import\(".*"\)\.(\w+)/);
                                            if (importMatch) {
                                                requestBodyType = importMatch[1];
                                            }
                                            if (requestBodyType.endsWith('[]')) {
                                                requestBodyType = requestBodyType.slice(0, -2);
                                            }
                                            requestBodyTypeName_1 = requestBodyType;
                                            //console.log(`Found request body type: ${requestBodyTypeName}`);
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
                var parentNode = node.getParent();
                if (ts_morph_1.Node.isVariableDeclaration(parentNode)) {
                    var variableDeclaration = parentNode;
                    var typeNode = variableDeclaration.getTypeNode();
                    if (typeNode) {
                        responseBodyTypeName = typeNode.getText();
                    }
                }
                else if (ts_morph_1.Node.isReturnStatement(parentNode)) {
                    // Navigate up to find the parent function (could be several levels up if nested in blocks or other structures)
                    var current = parentNode;
                    while (current && !ts_morph_1.Node.isFunctionDeclaration(current) && !ts_morph_1.Node.isArrowFunction(current)) {
                        current = current.getParent();
                    }
                    if (current && (ts_morph_1.Node.isFunctionDeclaration(current) || ts_morph_1.Node.isArrowFunction(current))) {
                        var returnTypeNode = current.getReturnTypeNode();
                        if (returnTypeNode) {
                            responseBodyTypeName = returnTypeNode.getText();
                            // If the return type is a Promise, extract the generic type parameter
                            var match = responseBodyTypeName.match(/Promise<(.+)>/);
                            if (match) {
                                responseBodyTypeName = match[1];
                            }
                        }
                        else {
                            //console.log("No return type node found.");
                        }
                    }
                    else {
                        //console.log("Parent is not a function declaration or arrow function.");
                    }
                }
                else {
                    //console.log("Parent node is not a variable declaration or return statement.");
                }
                if (ts_morph_1.Node.isCallExpression(node) && node.getExpression().getText().includes('fetch')) {
                    // Find the enclosing function of the fetch call
                    var current = node;
                    while (current && !ts_morph_1.Node.isFunctionDeclaration(current) && !ts_morph_1.Node.isArrowFunction(current)) {
                        current = current.getParent();
                    }
                    if (current) {
                        var functionNode = current;
                        var returnTypeNode = functionNode.getReturnTypeNode();
                        if (returnTypeNode) {
                            var type = returnTypeNode.getType();
                            var responseBodyType = type.getText();
                            // Recursively unwrap utility types
                            while (type.isObject() && type.getAliasSymbol()) {
                                var typeArguments = type.getAliasTypeArguments();
                                if (typeArguments.length > 0) {
                                    responseBodyType = typeArguments[0].getText();
                                    type = typeArguments[0];
                                }
                                else {
                                    break;
                                }
                            }
                            // Check if the unwrapped type is a union type
                            var unionMatch = responseBodyType.match(/^(.+?)\s*\|/);
                            if (unionMatch) {
                                // Extract the first type before the "|"
                                responseBodyType = unionMatch[1];
                            }
                            // Extract the type name from the import statement
                            var importMatch = responseBodyType.match(/import\(".*"\)\.(\w+)/);
                            if (importMatch) {
                                responseBodyType = importMatch[1];
                            }
                            if (responseBodyType.endsWith('[]')) {
                                responseBodyType = responseBodyType.slice(0, -2);
                            }
                            responseBodyTypeName = responseBodyType;
                            //console.log(`Found response body type: ${responseBodyTypeName}`);
                        }
                    }
                }
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
                    endpoints.push({
                        method: method_1,
                        path: fullPath,
                        requestBodyType: requestBodyTypeName_1,
                        responseBodyType: responseBodyTypeName,
                    });
                    //console.log('Endpoint found:', { method, path: fullPath, requestBodyType: requestBodyTypeName, responseBodyType: responseBodyTypeName });
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
