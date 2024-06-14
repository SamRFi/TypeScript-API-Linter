"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lintEndpointRules = void 0;
/**
 * Normalizes a given path by removing leading slashes, dynamic segments, trailing slashes, and redundant slashes.
 * @param path The path to normalize
 * @returns The normalized path
 */
var normalizePath = function (path) { return path.replace(/^\//, '').replace(/\/:\w+/g, '').replace(/\/$/, '').replace(/\/\//g, '/'); };
/**
 * Lints the TypeScript endpoints against the Postman endpoint definitions and returns any discrepancies.
 * @param endpointDefinitions The list of endpoints defined in the Postman collection
 * @param tsEndpoints The list of endpoints defined in TypeScript code
 * @param typeDefinitions The list of type definitions extracted from TypeScript code
 * @returns An array of error messages indicating discrepancies
 */
function lintEndpointRules(endpointDefinitions, tsEndpoints, typeDefinitions) {
    var errors = []; // Initialize an array to store any error messages
    // Iterate over each endpoint defined in the Postman collection
    endpointDefinitions.forEach(function (def) {
        var normalizedDefPath = normalizePath(def.path); // Normalize the endpoint path from the Postman definition
        var matchingTSEndpoint = findMatchingTSEndpoint(tsEndpoints, def.method, normalizedDefPath); // Find a matching endpoint in the TypeScript definitions
        if (matchingTSEndpoint) {
            // Lint the request and response bodies if a matching TypeScript endpoint is found
            lintRequestBody(def, matchingTSEndpoint, typeDefinitions, errors);
            lintResponseBody(def, matchingTSEndpoint, typeDefinitions, errors);
        }
    });
    // Lint for any missing or extra endpoints between TypeScript and Postman definitions
    lintMissingEndpoints(tsEndpoints, endpointDefinitions, errors);
    lintExtraEndpoints(tsEndpoints, endpointDefinitions, errors);
    return errors; // Return the list of found errors
}
exports.lintEndpointRules = lintEndpointRules;
/**
 * Finds a matching TypeScript endpoint based on method and normalized path.
 * @param tsEndpoints The list of endpoints defined in TypeScript code
 * @param method The HTTP method to match
 * @param path The normalized path to match
 * @returns The matching TSEndpoint or undefined if no match is found
 */
function findMatchingTSEndpoint(tsEndpoints, method, path) {
    return tsEndpoints.find(function (e) { return e.method === method && normalizePath(e.path) === path; });
}
/**
 * Lints the request body of a matching TypeScript endpoint against the Postman endpoint definition.
 * @param def The endpoint definition from Postman
 * @param matchingTSEndpoint The matching TypeScript endpoint
 * @param typeDefinitions The list of type definitions extracted from TypeScript code
 * @param errors An array to store any found errors
 */
function lintRequestBody(def, matchingTSEndpoint, typeDefinitions, errors) {
    if (def.requestBody) { // Check if the Postman definition has a request body
        // Find the matching type definition for the request body in the TypeScript endpoint
        // Handle non-array request bodies
        var matchingType = findMatchingType(typeDefinitions, matchingTSEndpoint.requestBodyType);
        if (!matchingType) { // If no matching type is found, log an error
            errors.push(createNoMatchingTypeError(def.name));
            return;
        }
        // Compare the properties of the request body in Postman and TypeScript
        var expectedProperties = Object.keys(matchingType.properties);
        var actualProperties = Object.keys(def.requestBody);
        lintMissingProperties(def.name, expectedProperties, actualProperties, errors, 'request');
        lintExtraProperties(def.name, expectedProperties, actualProperties, errors, 'request');
        lintPropertyTypes(def.name, def.requestBody, matchingType, expectedProperties, typeDefinitions, errors, 'request');
    }
}
/**
 * Lints the response body of a matching TypeScript endpoint against the Postman endpoint definition.
 * @param def The endpoint definition from Postman
 * @param matchingTSEndpoint The matching TypeScript endpoint
 * @param typeDefinitions The list of type definitions extracted from TypeScript code
 * @param errors An array to store any found errors
 */
function lintResponseBody(def, matchingTSEndpoint, typeDefinitions, errors) {
    if (def.responseBody) { // Check if the Postman definition has a response body
        var expectedProperties = Object.keys(def.responseBody); // Get the properties of the response body from the Postman definition
        var matchingType = findMatchingType(typeDefinitions, matchingTSEndpoint.responseBodyType); // Find the matching type definition for the response body
        if (!matchingType) { // If no matching type is found, log an error
            errors.push(createNoMatchingResponseError(def.name));
        }
        else {
            // Compare the properties of the response body in Postman and TypeScript
            var actualProperties = Object.keys(matchingType.properties);
            lintMissingProperties(def.name, expectedProperties, actualProperties, errors, 'response');
            lintExtraProperties(def.name, expectedProperties, actualProperties, errors, 'response');
            lintPropertyTypes(def.name, def.responseBody, matchingType, expectedProperties, typeDefinitions, errors, 'response');
        }
    }
}
/**
 * Finds a matching type definition based on the provided type name.
 * @param typeDefinitions The list of type definitions extracted from TypeScript code
 * @param typeName The name of the type to find
 * @returns The matching TypeDefinition or undefined if no match is found
 */
function findMatchingType(typeDefinitions, typeName) {
    if (typeName === null || typeName === undefined) {
        return undefined; // Return undefined if the type name is null or undefined
    }
    // Check if the type name ends with "[]", indicating an array type
    var isArrayType = typeName.endsWith('[]');
    var baseTypeName = isArrayType ? typeName.slice(0, -2) : typeName; // Get the base type name without the array brackets
    // Find the matching type definition by its name
    var matchingType = typeDefinitions.find(function (type) { return type.name === baseTypeName; });
    return matchingType; // Return the found type definition or undefined
}
/**
 * Creates an error message for missing request type definitions.
 * @param endpointName The name of the endpoint
 * @returns The error message string
 */
function createNoMatchingTypeError(endpointName) {
    return "No matching request type definition found for endpoint: ".concat(endpointName);
}
/**
 * Creates an error message for missing response type definitions.
 * @param endpointName The name of the endpoint
 * @returns The error message string
 */
function createNoMatchingResponseError(endpointName) {
    return "No matching response type definition found for endpoint: ".concat(endpointName);
}
/**
 * Lints for missing properties in the request or response body.
 * @param endpointName The name of the endpoint
 * @param expectedProperties The list of expected properties
 * @param actualProperties The list of actual properties found
 * @param errors An array to store any found errors
 * @param bodyType Indicates whether this is a 'request' or 'response' body
 */
function lintMissingProperties(endpointName, expectedProperties, actualProperties, errors, bodyType) {
    var missingProperties = expectedProperties.filter(function (prop) { return !actualProperties.includes(prop); }); // Find properties that are expected but not present in actual properties
    if (missingProperties.length > 0) { // If there are missing properties, log an error
        errors.push("Missing properties in ".concat(bodyType, " body for endpoint ").concat(endpointName, ": ").concat(missingProperties.join(', '), ". Expected properties: ").concat(expectedProperties.join(', ')));
    }
}
/**
 * Lints for extra properties in the request or response body.
 * @param endpointName The name of the endpoint
 * @param expectedProperties The list of expected properties
 * @param actualProperties The list of actual properties found
 * @param errors An array to store any found errors
 * @param bodyType Indicates whether this is a 'request' or 'response' body
 */
function lintExtraProperties(endpointName, expectedProperties, actualProperties, errors, bodyType) {
    var extraProperties = actualProperties.filter(function (prop) { return !expectedProperties.includes(prop); }); // Find properties that are present but not expected
    if (extraProperties.length > 0) { // If there are extra properties, log an error
        errors.push("Extra properties in ".concat(bodyType, " body for endpoint ").concat(endpointName, ": ").concat(extraProperties.join(', '), ". Expected properties: ").concat(expectedProperties.join(', ')));
    }
}
/**
 * Lints for type mismatches in the properties of the request or response body.
 * @param endpointName The name of the endpoint
 * @param requestBody The request body object to compare
 * @param matchingType The matching type definition for comparison
 * @param expectedProperties The list of expected properties
 * @param typeDefinitions The list of type definitions extracted from TypeScript code
 * @param errors An array to store any found errors
 * @param bodyType Indicates whether this is a 'request' or 'response' body
 */
function lintPropertyTypes(endpointName, requestBody, matchingType, expectedProperties, typeDefinitions, errors, bodyType) {
    expectedProperties.forEach(function (prop) {
        var expectedType = requestBody[prop]; // Get the expected type from the request body
        var actualType = matchingType.properties[prop]; // Get the actual type from the type definition
        // Check if actualType is defined
        if (!actualType) {
            //errors.push(`Property '${prop}' is missing in the type definition for endpoint ${endpointName}`);
            return; // Skip further checks for this property
        }
        // If the expected type is undefined, skip the mismatch error
        if (typeof expectedType === 'undefined') {
            return; // Do not report an error if the expected type is undefined
        }
        // Check if the actual type is an enum by looking it up in the type definitions
        var enumType = typeDefinitions.find(function (type) { return type.name === actualType; });
        if (enumType) {
            // Validate if the expected value matches one of the enum values
            var enumValues = Object.values(enumType.properties);
            if (typeof expectedType === 'string' && !enumValues.includes(expectedType)) {
                errors.push("Invalid enum value for property '".concat(prop, "' in ").concat(bodyType, " body for endpoint ").concat(endpointName, ". Expected one of ").concat(enumValues.join(', '), ", but got: ").concat(expectedType));
            }
        }
        else if (Array.isArray(expectedType)) {
            // Validate array types
            if (actualType.endsWith('[]')) {
                var baseType = actualType.slice(0, -2); // Get the base type for the array
                // Define a set of primitive types
                var primitiveTypes = ['string', 'number', 'boolean', 'any'];
                if (primitiveTypes.includes(baseType)) {
                    // Determine the type of items in the expected array
                    var itemType_1 = expectedType.length > 0 ? typeof expectedType[0] : 'unknown';
                    if (expectedType.some(function (item) { return typeof item !== itemType_1; })) {
                        errors.push("Type mismatch for array property '".concat(prop, "' in ").concat(bodyType, " body for endpoint ").concat(endpointName, ". Expected an array of ").concat(itemType_1, ", but got: ").concat(actualType));
                    }
                    else if (itemType_1 !== baseType) {
                        // If the array item type doesn't match the base type, report the mismatch
                        errors.push("Type mismatch for array property '".concat(prop, "' in ").concat(bodyType, " body for endpoint ").concat(endpointName, ". Expected: an array of ").concat(itemType_1, ", but got: an array of ").concat(baseType));
                    }
                }
                else {
                    // The array is of a custom type, check the referenced type
                    var matchingReferencedType = findMatchingType(typeDefinitions, baseType);
                    if (!matchingReferencedType) {
                        errors.push("Referenced type '".concat(baseType, "' not found for property '").concat(prop, "' in ").concat(bodyType, " body for endpoint ").concat(endpointName, "."));
                    }
                }
            }
            else {
                errors.push("Type mismatch for property '".concat(prop, "' in ").concat(bodyType, " body for endpoint ").concat(endpointName, ". Expected an array, but got: ").concat(actualType));
            }
        }
        else if (typeof expectedType === 'object' && expectedType !== null) {
            // Validate object types
            if (actualType !== 'object') {
                var matchingReferencedType = findMatchingType(typeDefinitions, actualType);
                if (!matchingReferencedType) {
                    errors.push("Type mismatch for property '".concat(prop, "' in ").concat(bodyType, " body for endpoint ").concat(endpointName, ". Expected an object, but got: ").concat(actualType));
                }
            }
        }
        else if (typeof expectedType !== actualType) {
            // Log an error if there is a type mismatch
            errors.push("Type mismatch for property '".concat(prop, "' in ").concat(bodyType, " body for endpoint ").concat(endpointName, ". Expected type: ").concat(typeof expectedType, ", Actual type: ").concat(actualType));
        }
    });
}
/**
 * Lints for endpoints that are missing in the Postman collection but present in the TypeScript code.
 * @param tsEndpoints The list of endpoints defined in TypeScript code
 * @param endpointDefinitions The list of endpoints defined in the Postman collection
 * @param errors An array to store any found errors
 */
function lintMissingEndpoints(tsEndpoints, endpointDefinitions, errors) {
    tsEndpoints.forEach(function (e) {
        var normalizedTSPath = normalizePath(e.path); // Normalize the path of the TypeScript endpoint
        //console.log(`Checking missing endpoint: ${e.method} ${normalizedTSPath}`);
        if (!endpointDefinitions.some(function (def) {
            var normalizedDefPath = normalizePath(def.path);
            //console.log(`Comparing with Postman endpoint: ${def.method} ${normalizedDefPath}`);
            return def.method === e.method && normalizedTSPath === normalizedDefPath;
        })) {
            errors.push("Endpoint found in code but not defined in Postman collection: ".concat(e.method, " ").concat(e.path));
        }
    });
}
/**
 * Lints for endpoints that are defined in the Postman collection but not found in the TypeScript code.
 * @param tsEndpoints The list of endpoints defined in TypeScript code
 * @param endpointDefinitions The list of endpoints defined in the Postman collection
 * @param errors An array to store any found errors
 */
function lintExtraEndpoints(tsEndpoints, endpointDefinitions, errors) {
    endpointDefinitions.forEach(function (def) {
        var normalizedDefPath = normalizePath(def.path); // Normalize the path of the Postman endpoint
        if (!tsEndpoints.some(function (e) { return e.method === def.method && normalizePath(e.path) === normalizedDefPath; })) { // Check if the normalized path matches any endpoint in the TypeScript definitions
            var details = '';
            if (def.requestBody) {
                // Construct a string that lists each property name along with its inferred type for request body
                var requestBodyDetails = Object.keys(def.requestBody).map(function (key) {
                    var value = def.requestBody[key];
                    var type = Array.isArray(value) ? 'array' : typeof value === 'object' && value !== null ? 'object' : typeof value;
                    return "".concat(key, ": ").concat(type);
                }).join(', ');
                if (requestBodyDetails) {
                    details += " with expected request body: { ".concat(requestBodyDetails, " }");
                }
            }
            if (def.responseBody) {
                // Construct a string that lists each property name along with its inferred type for response body
                var responseBodyDetails = Object.keys(def.responseBody).map(function (key) {
                    var value = def.responseBody[key];
                    var type = Array.isArray(value) ? 'array' : typeof value === 'object' && value !== null ? 'object' : typeof value;
                    return "".concat(key, ": ").concat(type);
                }).join(', ');
                if (responseBodyDetails) {
                    details += " and expected response body: { ".concat(responseBodyDetails, " }");
                }
            }
            errors.push("Endpoint defined in Postman collection but not found in code: ".concat(def.method, " ").concat(def.path).concat(details));
        }
    });
}
