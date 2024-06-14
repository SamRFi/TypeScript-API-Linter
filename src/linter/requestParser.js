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
    var endpoints = []; // Initialize an array to store the found endpoints
    var basePath = ''; // Initialize a string to store the base path, which might be found in the file
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
                var method_1 = 'GET'; // Default method is GET, unless specified otherwise
                var path_1 = ''; // Initialize a string to store the path of the endpoint
                var requestBodyTypeName_1 = null; // Initialize a variable to store the request body type name, if any
                var responseBodyTypeName = null; // Initialize a variable to store the response body type name, if any
                // Iterate over the arguments of the call expression
                callExpression.getArguments().forEach(function (arg) {
                    // For each argument in the fetch call, we check its type and process accordingly
                    if (ts_morph_1.Node.isTemplateExpression(arg)) { // Check if the argument is a template expression
                        var templateExpression = arg; // Cast the argument to a TemplateExpression type
                        var templateSpans = templateExpression.getTemplateSpans(); // Get the spans of the template expression (non-placeholder parts)
                        var head = templateExpression.getHead().getText().replace(/`$/, ''); // Extract the head part of the template (before the first span)
                        var tail = templateSpans.map(function (span) { return span.getLiteral().getText(); }).join(''); // Join all literal parts of the spans to form the tail part (after the last span)
                        path_1 = (head + tail).replace('${}', '').replace(/`/g, ''); // Combine and clean up the path parts (remove placeholder syntax and backticks)
                        // Example: `https://api.example.com/user/${userId}` becomes 'https://api.example.com/user/'
                        //console.log(`Found path: ${path}`);
                    }
                    else if (ts_morph_1.Node.isStringLiteral(arg)) { // Check if the argument is a string literal
                        path_1 = arg.getLiteralValue(); // Extract the literal value of the string
                        // Example: "https://api.example.com/data" simply extracts the URL as is
                        //console.log(`Found path: ${path}`);
                    }
                    else if (ts_morph_1.Node.isObjectLiteralExpression(arg)) {
                        // This part processes additional options passed to fetch, usually the second argument
                        arg.getProperties().forEach(function (prop) {
                            if (prop.asKind(ts_morph_1.SyntaxKind.PropertyAssignment)) { // Check if the property is a property assignment
                                var propAssignment = prop; // Cast the property to a PropertyAssignment type
                                if (propAssignment.getName() === 'method') { // Check if the property name is 'method'
                                    var initializer = propAssignment.getInitializer(); // Get the initializer of the property assignment
                                    if (initializer && ts_morph_1.Node.isStringLiteral(initializer)) { // Check if the initializer is a string literal
                                        method_1 = initializer.getLiteralValue().toUpperCase(); // Set the method to the uppercased value of the string literal
                                        // Example: method: 'POST' sets method to 'POST'
                                        //console.log(`Found HTTP method: ${method}`);
                                    }
                                }
                                else if (propAssignment.getName() === 'body') { // Check if the property name is 'body'
                                    var initializer = propAssignment.getInitializer(); // Get the initializer of the property assignment
                                    if (ts_morph_1.Node.isCallExpression(initializer) && initializer.getExpression().getText() === 'JSON.stringify') { // Check if the initializer is a call to JSON.stringify
                                        var argument = initializer.getArguments()[0]; // Get the first argument of the JSON.stringify call
                                        if (ts_morph_1.Node.isIdentifier(argument)) { // Check if the argument is an identifier
                                            var typeNode = argument.getType(); // Get the type of the identifier
                                            var requestBodyType = typeNode.getText(); // Extract the text representation of the type
                                            // Recursively unwrap utility types to get to the core type (unwrap the wrappers aruound the core type)
                                            while (typeNode.isObject() && typeNode.getAliasSymbol()) {
                                                var typeArguments = typeNode.getTypeArguments(); // Get the type arguments of the utility type
                                                if (typeArguments.length > 0) {
                                                    requestBodyType = typeArguments[0].getText(); // Get the text representation of the first type argument
                                                    typeNode = typeArguments[0]; // Update the typeNode to the first type argument
                                                }
                                                else {
                                                    break; // Break the loop if there are no more type arguments
                                                }
                                            }
                                            // Extract the type name from the import statement
                                            var importMatch = requestBodyType.match(/import\(".*"\)\.(\w+)/);
                                            if (importMatch) {
                                                requestBodyType = importMatch[1]; // Set the request body type to the extracted type name
                                            }
                                            if (requestBodyType.endsWith('[]')) { // Check if the type is an array type
                                                requestBodyType = requestBodyType.slice(0, -2); // Remove the '[]' to get the core type name
                                            }
                                            requestBodyTypeName_1 = requestBodyType; // Set the requestBodyTypeName to the extracted type
                                            //console.log(`Found request body type: ${requestBodyTypeName}`);
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
                var parentNode = node.getParent(); // Get the parent node of the current node
                if (ts_morph_1.Node.isVariableDeclaration(parentNode)) { // Check if the parent node is a variable declaration
                    var variableDeclaration = parentNode; // Cast the parent node to a VariableDeclaration type
                    var typeNode = variableDeclaration.getTypeNode(); // Get the type node of the variable declaration
                    if (typeNode) {
                        responseBodyTypeName = typeNode.getText(); // Set the responseBodyTypeName to the text representation of the type node
                    }
                }
                else if (ts_morph_1.Node.isReturnStatement(parentNode)) { // Check if the parent node is a return statement
                    // Navigate up to find the parent function (could be several levels up if nested in blocks or other structures)
                    var current = parentNode; // Initialize a variable to traverse up the AST
                    while (current && !ts_morph_1.Node.isFunctionDeclaration(current) && !ts_morph_1.Node.isArrowFunction(current)) { // Traverse up until a function declaration or arrow function is found
                        current = current.getParent(); // Move to the parent node
                    }
                    if (current && (ts_morph_1.Node.isFunctionDeclaration(current) || ts_morph_1.Node.isArrowFunction(current))) { // Check if the current node is a function or arrow function
                        var returnTypeNode = current.getReturnTypeNode(); // Get the return type node of the function
                        if (returnTypeNode) {
                            responseBodyTypeName = returnTypeNode.getText(); // Set the responseBodyTypeName to the text representation of the return type node
                            // If the return type is a Promise, extract the generic type parameter
                            var match = responseBodyTypeName.match(/Promise<(.+)>/); // Check if the return type is a Promise and extract the generic type
                            if (match) {
                                responseBodyTypeName = match[1]; // Set the responseBodyTypeName to the extracted type within the Promise
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
                if (ts_morph_1.Node.isCallExpression(node) && node.getExpression().getText().includes('fetch')) { // Check if the node is a fetch call expression
                    // Find the enclosing function of the fetch call
                    var current = node; // Initialize a variable to traverse up the AST
                    while (current && !ts_morph_1.Node.isFunctionDeclaration(current) && !ts_morph_1.Node.isArrowFunction(current)) { // Traverse up until a function declaration or arrow function is found
                        current = current.getParent(); // Move to the parent node
                    }
                    if (current) { // Check if a function or arrow function was found
                        var functionNode = current; // Cast the current node to a FunctionDeclaration or ArrowFunction
                        var returnTypeNode = functionNode.getReturnTypeNode(); // Get the return type node of the function
                        if (returnTypeNode) {
                            var type = returnTypeNode.getType(); // Get the type of the return type node
                            var responseBodyType = type.getText(); // Get the text representation of the type
                            // Recursively unwrap utility types to get to the core type
                            while (type.isObject() && type.getAliasSymbol()) {
                                var typeArguments = type.getAliasTypeArguments(); // Get the type arguments of the utility type
                                if (typeArguments.length > 0) {
                                    responseBodyType = typeArguments[0].getText(); // Get the text representation of the first type argument
                                    type = typeArguments[0]; // Update the type to the first type argument
                                }
                                else {
                                    break; // Break the loop if there are no more type arguments
                                }
                            }
                            var unionMatch = responseBodyType.match(/^(.+?)\s*\|/); // Check if the type is a union type and extract the first type
                            if (unionMatch) {
                                responseBodyType = unionMatch[1]; // Set the responseBodyType to the extracted type
                            }
                            // Extract the type name from the import statement
                            var importMatch = responseBodyType.match(/import\(".*"\)\.(\w+)/); // Extract the type name from the import statement
                            if (importMatch) {
                                responseBodyType = importMatch[1]; // Set the responseBodyType to the extracted type name
                            }
                            if (responseBodyType.endsWith('[]')) { // Check if the type is an array type
                                responseBodyType = responseBodyType.slice(0, -2); // Remove the '[]' to get the core type name
                            }
                            responseBodyTypeName = responseBodyType; // Set the responseBodyTypeName to the extracted type
                            //console.log(`Found response body type: ${responseBodyTypeName}`);
                        }
                    }
                }
                if (path_1) { // Check if the path is not empty
                    var fullPath = ''; // Initialize a string to store the full path of the endpoint
                    if (path_1.startsWith('http://') || path_1.startsWith('https://')) { // Check if the path is a full URL
                        // If the path is a full URL, extract the path part
                        var url = new URL(path_1); // Create a URL object from the path
                        fullPath = url.pathname.replace(/\${}/g, '').replace(/^\//, ''); // Extract and clean the pathname part of the URL
                    }
                    else {
                        // If the path is a relative path, concatenate it with the base path
                        fullPath = (basePath + path_1).replace(/\${}/g, '').replace(/^\//, ''); // Combine the base path and relative path
                    }
                    //console.log(`Constructed full path: ${fullPath}`);
                    endpoints.push({
                        method: method_1, // HTTP method (e.g., GET, POST)
                        path: fullPath, // Full path of the endpoint
                        requestBodyType: requestBodyTypeName_1, // Type of the request body
                        responseBodyType: responseBodyTypeName, // Type of the response body
                    });
                    //console.log('Endpoint found:', { method, path: fullPath, requestBodyType: requestBodyTypeName, responseBodyType: responseBodyTypeName });
                }
            }
        }
        node.forEachChild(visit); // Recursively visit each child node of the current node
    }
    sourceFile.forEachChild(visit); // Start visiting nodes from the root of the source file
    return endpoints; // Return the list of endpoints found in the source file
}
/**
 * Parses the entire TypeScript project to extract all endpoints
 * @param project The TypeScript project instance created by ts-morph
 * @returns An array of TSEndpoint objects found in the project
 */
function tsParser(project) {
    var endpoints = []; // Initialize an array to hold all endpoints found in the project
    var sourceFiles = project.getSourceFiles(); // Get all source files in the project
    sourceFiles.forEach(function (sourceFile) {
        endpoints.push.apply(// Iterate over each source file
        endpoints, findEndpointsInFile(sourceFile)); // Extract and collect endpoints from the source file
    });
    return endpoints; // Return the collected endpoints
}
exports.tsParser = tsParser;
