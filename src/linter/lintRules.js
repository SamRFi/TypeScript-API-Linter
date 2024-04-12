"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lintEndpointRules = void 0;
var normalizePath = function (path) { return path.replace(/^\//, ''); };
function lintEndpointRules(endpointDefinitions, tsEndpoints, typeDefinitions) {
    var errors = [];
    endpointDefinitions.forEach(function (def) {
        var normalizedDefPath = normalizePath(def.path);
        var matchingTSEndpoint = findMatchingTSEndpoint(tsEndpoints, def.method, normalizedDefPath);
        if (matchingTSEndpoint) {
            lintRequestBody(def, matchingTSEndpoint, typeDefinitions, errors);
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
        console.log("Endpoint: ".concat(def.name));
        console.log("Request Body Type: ".concat(matchingTSEndpoint.requestBodyType));
        var matchingType = findMatchingType(typeDefinitions, matchingTSEndpoint.requestBodyType);
        if (!matchingType) {
            console.log("No matching type found for endpoint: ".concat(def.name));
            errors.push(createNoMatchingTypeError(def.name));
        }
        else {
            console.log("Matching Type: ".concat(matchingType.name));
            var actualProperties = Object.keys(matchingType.properties);
            lintMissingProperties(def.name, expectedProperties, actualProperties, errors);
            lintExtraProperties(def.name, expectedProperties, actualProperties, errors);
            lintPropertyTypes(def.name, def.requestBody, matchingType, expectedProperties, errors);
        }
    }
}
function findMatchingType(typeDefinitions, requestBodyType) {
    if (requestBodyType === null || requestBodyType === undefined) {
        console.log("Request Body Type is null or undefined");
        return undefined;
    }
    console.log("Searching for type: ".concat(requestBodyType));
    var matchingType = typeDefinitions.find(function (type) { return type.name === requestBodyType; });
    if (matchingType) {
        console.log("Found matching type: ".concat(matchingType.name));
    }
    else {
        console.log("No matching type found for: ".concat(requestBodyType));
    }
    return matchingType;
}
function createNoMatchingTypeError(endpointName) {
    return "No matching type definition found for endpoint: ".concat(endpointName);
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
function lintPropertyTypes(endpointName, requestBody, matchingType, expectedProperties, errors) {
    expectedProperties.forEach(function (prop) {
        var expectedType = typeof requestBody[prop];
        var actualType = matchingType.properties[prop];
        if (actualType !== expectedType) {
            errors.push("Type mismatch for property '".concat(prop, "' in request body for endpoint ").concat(endpointName, ". Expected type: ").concat(expectedType, ", Actual type: ").concat(actualType));
        }
    });
}
function lintMissingEndpoints(tsEndpoints, endpointDefinitions, errors) {
    tsEndpoints.forEach(function (e) {
        var normalizedTSPath = normalizePath(e.path);
        if (!endpointDefinitions.some(function (def) { return def.method === e.method && normalizePath(def.path) === normalizedTSPath; })) {
            errors.push("Endpoint found in code but not defined in Postman collection: ".concat(e.method, " ").concat(normalizedTSPath));
        }
    });
}
function lintExtraEndpoints(tsEndpoints, endpointDefinitions, errors) {
    endpointDefinitions.forEach(function (def) {
        var normalizedDefPath = normalizePath(def.path);
        if (!tsEndpoints.some(function (e) { return e.method === def.method && normalizePath(e.path) === normalizedDefPath; })) {
            errors.push("Endpoint defined in Postman collection but not found in code: ".concat(def.method, " ").concat(def.path));
        }
    });
}
