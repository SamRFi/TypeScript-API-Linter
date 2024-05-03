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
        //console.log(`Endpoint: ${def.name}`);
        //console.log(`Request Body Type: ${matchingTSEndpoint.requestBodyType}`);
        var matchingType = findMatchingType(typeDefinitions, matchingTSEndpoint.requestBodyType);
        if (!matchingType) {
            //console.log(`No matching type found for endpoint: ${def.name}`);
            errors.push(createNoMatchingTypeError(def.name));
        }
        else {
            //console.log(`Matching Type: ${matchingType.name}`);
            var actualProperties = Object.keys(matchingType.properties);
            lintMissingProperties(def.name, expectedProperties, actualProperties, errors);
            lintExtraProperties(def.name, expectedProperties, actualProperties, errors);
            lintPropertyTypes(def.name, def.requestBody, matchingType, expectedProperties, typeDefinitions, errors);
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
            var actualProperties = Object.keys(matchingType.properties);
            lintMissingProperties(def.name, expectedProperties, actualProperties, errors);
            lintExtraProperties(def.name, expectedProperties, actualProperties, errors);
            lintPropertyTypes(def.name, def.responseBody, matchingType, expectedProperties, typeDefinitions, errors);
        }
    }
}
function findMatchingType(typeDefinitions, requestBodyType) {
    if (requestBodyType === null || requestBodyType === undefined) {
        //console.log(`Request Body Type is null or undefined`);
        return undefined;
    }
    //console.log(`Searching for type: ${requestBodyType}`);
    var matchingType = typeDefinitions.find(function (type) { return type.name === requestBodyType; });
    if (matchingType) {
        //console.log(`Found matching type: ${matchingType.name}`);
    }
    else {
        //console.log(`No matching type found for: ${requestBodyType}`);
    }
    return matchingType;
}
function createNoMatchingTypeError(endpointName) {
    return "No matching type definition found for endpoint: ".concat(endpointName);
}
function createNoMatchingResponseError(endpointName) {
    return "No matching response type definition found for endpoint: ".concat(endpointName);
}
function lintMissingProperties(endpointName, expectedProperties, actualProperties, errors) {
    var missingProperties = expectedProperties.filter(function (prop) { return !actualProperties.includes(prop); });
    if (missingProperties.length > 0) {
        errors.push("Missing properties in request body for endpoint ".concat(endpointName, ": ").concat(missingProperties.join(', '), ". Expected properties: ").concat(expectedProperties.join(', ')));
    }
}
function lintExtraProperties(endpointName, expectedProperties, actualProperties, errors) {
    var extraProperties = actualProperties.filter(function (prop) { return !expectedProperties.includes(prop); });
    if (extraProperties.length > 0) {
        errors.push("Extra properties in request body for endpoint ".concat(endpointName, ": ").concat(extraProperties.join(', '), ". Expected properties: ").concat(expectedProperties.join(', ')));
    }
}
function lintPropertyTypes(endpointName, requestBody, matchingType, expectedProperties, typeDefinitions, errors) {
    expectedProperties.forEach(function (prop) {
        var expectedType = requestBody[prop];
        var actualType = matchingType.properties[prop];
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
