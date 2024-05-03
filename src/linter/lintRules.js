"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lintEndpointRules = void 0;
var normalizePath = function (path) { return path.replace(/^\//, '').replace(/\/:\w+/g, '').replace(/\/$/, '').replace(/\/\//g, '/'); };
function lintEndpointRules(endpointDefinitions, tsEndpoints, typeDefinitions) {
    var errors = [];
    endpointDefinitions.forEach(function (def) {
        var normalizedDefPath = normalizePath(def.path);
        var matchingTSEndpoint = findMatchingTSEndpoint(tsEndpoints, def.method, normalizedDefPath);
        if (matchingTSEndpoint) {
            lintRequestBody(def, matchingTSEndpoint, typeDefinitions, errors);
            lintResponseBody(def, matchingTSEndpoint, typeDefinitions, errors);
        }
    });
    lintMissingEndpoints(tsEndpoints, endpointDefinitions, errors);
    lintExtraEndpoints(tsEndpoints, endpointDefinitions, errors);
    return errors;
}
exports.lintEndpointRules = lintEndpointRules;
function findMatchingTSEndpoint(tsEndpoints, method, path) {
    return tsEndpoints.find(function (e) { return e.method === method && normalizePath(e.path) === path; });
}
function lintRequestBody(def, matchingTSEndpoint, typeDefinitions, errors) {
    if (def.requestBody) {
        var expectedProperties = Object.keys(def.requestBody);
        var matchingType_1 = findMatchingType(typeDefinitions, matchingTSEndpoint.isRequestBodyArray ? "".concat(matchingTSEndpoint.requestBodyType, "[]") : matchingTSEndpoint.requestBodyType);
        if (!matchingType_1) {
            errors.push(createNoMatchingTypeError(def.name));
        }
        else {
            if (matchingTSEndpoint.isRequestBodyArray) {
                if (Array.isArray(def.requestBody) && def.requestBody.length > 0) {
                    var arrayItemType = def.requestBody[0];
                    var expectedItemProperties_1 = Object.keys(arrayItemType);
                    var actualProperties_1 = Object.keys(matchingType_1.properties);
                    def.requestBody.forEach(function (item) {
                        lintMissingProperties(def.name, expectedItemProperties_1, actualProperties_1, errors, 'request');
                        lintExtraProperties(def.name, expectedItemProperties_1, actualProperties_1, errors, 'request');
                        lintPropertyTypes(def.name, item, matchingType_1, expectedItemProperties_1, typeDefinitions, errors);
                    });
                }
                else {
                    errors.push("Expected request body to be an array for endpoint: ".concat(def.name));
                }
            }
            else {
                var actualProperties = Object.keys(matchingType_1.properties);
                lintMissingProperties(def.name, expectedProperties, actualProperties, errors, 'request');
                lintExtraProperties(def.name, expectedProperties, actualProperties, errors, 'request');
                lintPropertyTypes(def.name, def.requestBody, matchingType_1, expectedProperties, typeDefinitions, errors);
            }
        }
    }
}
function lintResponseBody(def, matchingTSEndpoint, typeDefinitions, errors) {
    if (def.responseBody) {
        var expectedProperties = Object.keys(def.responseBody);
        var matchingType = findMatchingType(typeDefinitions, matchingTSEndpoint.responseBodyType);
        if (!matchingType) {
            errors.push(createNoMatchingResponseError(def.name));
        }
        else {
            if (matchingTSEndpoint.isResponseBodyArray) {
                if (Array.isArray(def.responseBody) && def.responseBody.length > 0) {
                    var arrayItemType = def.responseBody[0];
                    var expectedItemProperties = Object.keys(arrayItemType);
                    var actualProperties = Object.keys(matchingType.properties);
                    lintMissingProperties(def.name, expectedItemProperties, actualProperties, errors, 'response');
                    lintExtraProperties(def.name, expectedItemProperties, actualProperties, errors, 'response');
                    lintPropertyTypes(def.name, arrayItemType, matchingType, expectedItemProperties, typeDefinitions, errors);
                }
                else {
                    errors.push("Expected response body to be an array for endpoint: ".concat(def.name));
                }
            }
            else {
                var actualProperties = Object.keys(matchingType.properties);
                lintMissingProperties(def.name, expectedProperties, actualProperties, errors, 'response');
                lintExtraProperties(def.name, expectedProperties, actualProperties, errors, 'response');
                lintPropertyTypes(def.name, def.responseBody, matchingType, expectedProperties, typeDefinitions, errors);
            }
        }
    }
}
function findMatchingType(typeDefinitions, typeName) {
    if (typeName === null || typeName === undefined) {
        return undefined;
    }
    // Check if the type name ends with "[]"
    var isArrayType = typeName.endsWith('[]');
    var baseTypeName = isArrayType ? typeName.slice(0, -2) : typeName;
    var matchingType = typeDefinitions.find(function (type) { return type.name === baseTypeName; });
    return matchingType;
}
function createNoMatchingTypeError(endpointName) {
    return "No matching request type definition found for endpoint: ".concat(endpointName);
}
function createNoMatchingResponseError(endpointName) {
    return "No matching response type definition found for endpoint: ".concat(endpointName);
}
function lintMissingProperties(endpointName, expectedProperties, actualProperties, errors, bodyType) {
    var missingProperties = expectedProperties.filter(function (prop) { return !actualProperties.includes(prop); });
    if (missingProperties.length > 0) {
        errors.push("Missing properties in ".concat(bodyType, " body for endpoint ").concat(endpointName, ": ").concat(missingProperties.join(', '), ". Expected properties: ").concat(expectedProperties.join(', ')));
    }
}
function lintExtraProperties(endpointName, expectedProperties, actualProperties, errors, bodyType) {
    var extraProperties = actualProperties.filter(function (prop) { return !expectedProperties.includes(prop); });
    if (extraProperties.length > 0) {
        errors.push("Extra properties in ".concat(bodyType, " body for endpoint ").concat(endpointName, ": ").concat(extraProperties.join(', '), ". Expected properties: ").concat(expectedProperties.join(', ')));
    }
}
function lintPropertyTypes(endpointName, requestBody, matchingType, expectedProperties, typeDefinitions, errors) {
    expectedProperties.forEach(function (prop) {
        var expectedType = requestBody[prop];
        var actualType = matchingType.properties[prop];
        // Check if actualType is defined
        if (!actualType) {
            errors.push("Property '".concat(prop, "' is missing in the type definition for endpoint ").concat(endpointName));
            return; // Skip further checks for this property
        }
        // Check if the actual type is an enum
        var enumType = typeDefinitions.find(function (type) { return type.name === actualType; });
        if (enumType) {
            var enumValues = Object.values(enumType.properties);
            if (typeof expectedType === 'string' && !enumValues.includes(expectedType)) {
                errors.push("Invalid enum value for property '".concat(prop, "' in request body for endpoint ").concat(endpointName, ". Expected one of ").concat(enumValues.join(', '), ", but got: ").concat(expectedType));
            }
        }
        else if (Array.isArray(expectedType)) {
            if (actualType.endsWith('[]')) {
                var referencedType = actualType.slice(0, -2);
                var matchingReferencedType = findMatchingType(typeDefinitions, referencedType);
                if (!matchingReferencedType) {
                    errors.push("Referenced type '".concat(referencedType, "' not found for property '").concat(prop, "' in request body for endpoint ").concat(endpointName));
                }
            }
            else {
                errors.push("Type mismatch for property '".concat(prop, "' in request body for endpoint ").concat(endpointName, ". Expected an array, but got: ").concat(actualType));
            }
        }
        else if (typeof expectedType === 'object' && expectedType !== null) {
            if (actualType !== 'object') {
                var matchingReferencedType = findMatchingType(typeDefinitions, actualType);
                if (!matchingReferencedType) {
                    errors.push("Type mismatch for property '".concat(prop, "' in request body for endpoint ").concat(endpointName, ". Expected an object, but got: ").concat(actualType));
                }
            }
        }
        else if (typeof expectedType !== actualType) {
            errors.push("Type mismatch for property '".concat(prop, "' in request body for endpoint ").concat(endpointName, ". Expected type: ").concat(typeof expectedType, ", Actual type: ").concat(actualType));
        }
    });
}
function lintMissingEndpoints(tsEndpoints, endpointDefinitions, errors) {
    tsEndpoints.forEach(function (e) {
        var normalizedTSPath = normalizePath(e.path);
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
function lintExtraEndpoints(tsEndpoints, endpointDefinitions, errors) {
    endpointDefinitions.forEach(function (def) {
        var normalizedDefPath = normalizePath(def.path);
        if (!tsEndpoints.some(function (e) { return e.method === def.method && normalizePath(e.path) === normalizedDefPath; })) {
            var requestBodyDetails = '';
            if (def.requestBody) {
                // Construct a string that lists each property name along with its inferred type
                requestBodyDetails = Object.keys(def.requestBody).map(function (key) {
                    var value = def.requestBody[key];
                    var type;
                    if (Array.isArray(value)) {
                        type = 'array';
                    }
                    else if (typeof value === 'object' && value !== null) {
                        type = 'object';
                    }
                    else {
                        type = typeof value;
                    }
                    return "".concat(key, ": ").concat(type);
                }).join(', ');
                if (requestBodyDetails) {
                    requestBodyDetails = " with expected request body: { ".concat(requestBodyDetails, " }");
                }
            }
            errors.push("Endpoint defined in Postman collection but not found in code: ".concat(def.method, " ").concat(def.path).concat(requestBodyDetails));
        }
    });
}
