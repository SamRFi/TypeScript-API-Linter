// src/linter/lintRules.ts
import { EndpointDefinition } from '../postman/collectionParser';
import { TSEndpoint } from '../types/TSEndpoint';
import { TypeDefinition } from './typeParser';

/**
 * Normalizes a given path by removing leading slashes, dynamic segments, trailing slashes, and redundant slashes.
 * @param path The path to normalize
 * @returns The normalized path
 */
const normalizePath = (path: string) => path.replace(/^\//, '').replace(/\/:\w+/g, '').replace(/\/$/, '').replace(/\/\//g, '/');

/**
 * Lints the TypeScript endpoints against the Postman endpoint definitions and returns any discrepancies.
 * @param endpointDefinitions The list of endpoints defined in the Postman collection
 * @param tsEndpoints The list of endpoints defined in TypeScript code
 * @param typeDefinitions The list of type definitions extracted from TypeScript code
 * @returns An array of error messages indicating discrepancies
 */
function lintEndpointRules(endpointDefinitions: EndpointDefinition[], tsEndpoints: TSEndpoint[], typeDefinitions: TypeDefinition[]): string[] {
  const errors: string[] = []; // Initialize an array to store any error messages

  // Iterate over each endpoint defined in the Postman collection
  endpointDefinitions.forEach((def) => {
    const normalizedDefPath = normalizePath(def.path); // Normalize the endpoint path from the Postman definition
    const matchingTSEndpoint = findMatchingTSEndpoint(tsEndpoints, def.method, normalizedDefPath); // Find a matching endpoint in the TypeScript definitions

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

/**
 * Finds a matching TypeScript endpoint based on method and normalized path.
 * @param tsEndpoints The list of endpoints defined in TypeScript code
 * @param method The HTTP method to match
 * @param path The normalized path to match
 * @returns The matching TSEndpoint or undefined if no match is found
 */
function findMatchingTSEndpoint(tsEndpoints: TSEndpoint[], method: string, path: string): TSEndpoint | undefined {
  return tsEndpoints.find(e => e.method === method && normalizePath(e.path) === path);
}

/**
 * Lints the request body of a matching TypeScript endpoint against the Postman endpoint definition.
 * @param def The endpoint definition from Postman
 * @param matchingTSEndpoint The matching TypeScript endpoint
 * @param typeDefinitions The list of type definitions extracted from TypeScript code
 * @param errors An array to store any found errors
 */
function lintRequestBody(def: EndpointDefinition, matchingTSEndpoint: TSEndpoint, typeDefinitions: TypeDefinition[], errors: string[]): void {
  if (def.requestBody) { // Check if the Postman definition has a request body
    // Find the matching type definition for the request body in the TypeScript endpoint
    // Handle non-array request bodies
    const matchingType = findMatchingType(typeDefinitions, matchingTSEndpoint.requestBodyType);
    if (!matchingType) { // If no matching type is found, log an error
      errors.push(createNoMatchingTypeError(def.name));
      return;
    }

    // Compare the properties of the request body in Postman and TypeScript
    const expectedProperties = Object.keys(matchingType.properties);
    const actualProperties = Object.keys(def.requestBody);
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
function lintResponseBody(def: EndpointDefinition, matchingTSEndpoint: TSEndpoint, typeDefinitions: TypeDefinition[], errors: string[]): void {
  if (def.responseBody) { // Check if the Postman definition has a response body
    const expectedProperties = Object.keys(def.responseBody); // Get the properties of the response body from the Postman definition
    const matchingType = findMatchingType(typeDefinitions, matchingTSEndpoint.responseBodyType); // Find the matching type definition for the response body

    if (!matchingType) { // If no matching type is found, log an error
      errors.push(createNoMatchingResponseError(def.name));
    } else {
        // Compare the properties of the response body in Postman and TypeScript
        const actualProperties = Object.keys(matchingType.properties);
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
function findMatchingType(typeDefinitions: TypeDefinition[], typeName: string | null | undefined): TypeDefinition | undefined {
  if (typeName === null || typeName === undefined) {
    return undefined; // Return undefined if the type name is null or undefined
  }

  // Check if the type name ends with "[]", indicating an array type
  const isArrayType = typeName.endsWith('[]');
  const baseTypeName = isArrayType ? typeName.slice(0, -2) : typeName; // Get the base type name without the array brackets

  // Find the matching type definition by its name
  const matchingType = typeDefinitions.find(type => type.name === baseTypeName);

  return matchingType; // Return the found type definition or undefined
}

/**
 * Creates an error message for missing request type definitions.
 * @param endpointName The name of the endpoint
 * @returns The error message string
 */
function createNoMatchingTypeError(endpointName: string): string {
  return `No matching request type definition found for endpoint: ${endpointName}`;
}

/**
 * Creates an error message for missing response type definitions.
 * @param endpointName The name of the endpoint
 * @returns The error message string
 */
function createNoMatchingResponseError(endpointName: string): string {
  return `No matching response type definition found for endpoint: ${endpointName}`;
}

/**
 * Lints for missing properties in the request or response body.
 * @param endpointName The name of the endpoint
 * @param expectedProperties The list of expected properties
 * @param actualProperties The list of actual properties found
 * @param errors An array to store any found errors
 * @param bodyType Indicates whether this is a 'request' or 'response' body
 */
function lintMissingProperties(endpointName: string, expectedProperties: string[], actualProperties: string[], errors: string[], bodyType: 'request' | 'response'): void {
  const missingProperties = expectedProperties.filter(prop => !actualProperties.includes(prop)); // Find properties that are expected but not present in actual properties
  if (missingProperties.length > 0) { // If there are missing properties, log an error
    errors.push(`Missing properties in ${bodyType} body for endpoint ${endpointName}: ${missingProperties.join(', ')}. Expected properties: ${expectedProperties.join(', ')}`);
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
function lintExtraProperties(endpointName: string, expectedProperties: string[], actualProperties: string[], errors: string[], bodyType: 'request' | 'response'): void {
  const extraProperties = actualProperties.filter(prop => !expectedProperties.includes(prop)); // Find properties that are present but not expected
  if (extraProperties.length > 0) { // If there are extra properties, log an error
    errors.push(`Extra properties in ${bodyType} body for endpoint ${endpointName}: ${extraProperties.join(', ')}. Expected properties: ${expectedProperties.join(', ')}`);
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
function lintPropertyTypes(endpointName: string, requestBody: any, matchingType: TypeDefinition, expectedProperties: string[], typeDefinitions: TypeDefinition[], errors: string[], bodyType: 'request' | 'response'): void {
  expectedProperties.forEach(prop => { // Iterate over each expected property
    const expectedType = requestBody[prop]; // Get the expected type from the request body
    const actualType = matchingType.properties[prop]; // Get the actual type from the type definition

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
    const enumType = typeDefinitions.find(type => type.name === actualType);
    if (enumType) {
      // Validate if the expected value matches one of the enum values
      const enumValues = Object.values(enumType.properties);
      if (typeof expectedType === 'string' && !enumValues.includes(expectedType)) {
        errors.push(`Invalid enum value for property '${prop}' in ${bodyType} body for endpoint ${endpointName}. Expected one of ${enumValues.join(', ')}, but got: ${expectedType}`);
      }
    } else if (Array.isArray(expectedType)) {
      // Validate array types
      if (actualType.endsWith('[]')) {
        const baseType = actualType.slice(0, -2); // Get the base type for the array

        // Define a set of primitive types
        const primitiveTypes = ['string', 'number', 'boolean', 'any'];

        if (primitiveTypes.includes(baseType)) {
          // Determine the type of items in the expected array
          const itemType = expectedType.length > 0 ? typeof expectedType[0] : 'unknown';
          if (expectedType.some((item) => typeof item !== itemType)) {
            errors.push(
              `Type mismatch for array property '${prop}' in ${bodyType} body for endpoint ${endpointName}. Expected an array of ${itemType}, but got: ${actualType}`
            );
          } else if (itemType !== baseType) {
            // If the array item type doesn't match the base type, report the mismatch
            errors.push(
              `Type mismatch for array property '${prop}' in ${bodyType} body for endpoint ${endpointName}. Expected: an array of ${itemType}, but got: an array of ${baseType}`
            );
          }
        } else {
          // The array is of a custom type, check the referenced type
          const matchingReferencedType = findMatchingType(typeDefinitions, baseType);

          if (!matchingReferencedType) {
            errors.push(
              `Referenced type '${baseType}' not found for property '${prop}' in ${bodyType} body for endpoint ${endpointName}.`
            );
          }
        }
      } else {
        errors.push(`Type mismatch for property '${prop}' in ${bodyType} body for endpoint ${endpointName}. Expected an array, but got: ${actualType}`);
      }
    } else if (typeof expectedType === 'object' && expectedType !== null) {
      // Validate object types
      if (actualType !== 'object') {
        const matchingReferencedType = findMatchingType(typeDefinitions, actualType);
        if (!matchingReferencedType) {
          errors.push(`Type mismatch for property '${prop}' in ${bodyType} body for endpoint ${endpointName}. Expected an object, but got: ${actualType}`);
        }
      }
    } else if (typeof expectedType !== actualType) {
      // Log an error if there is a type mismatch
      errors.push(`Type mismatch for property '${prop}' in ${bodyType} body for endpoint ${endpointName}. Expected type: ${typeof expectedType}, Actual type: ${actualType}`);
    }
  });
}

/**
 * Lints for endpoints that are missing in the Postman collection but present in the TypeScript code.
 * @param tsEndpoints The list of endpoints defined in TypeScript code
 * @param endpointDefinitions The list of endpoints defined in the Postman collection
 * @param errors An array to store any found errors
 */
function lintMissingEndpoints(tsEndpoints: TSEndpoint[], endpointDefinitions: EndpointDefinition[], errors: string[]): void {
  tsEndpoints.forEach((e) => {
    const normalizedTSPath = normalizePath(e.path); // Normalize the path of the TypeScript endpoint
    //console.log(`Checking missing endpoint: ${e.method} ${normalizedTSPath}`);
    if (!endpointDefinitions.some(def => { // Check if the normalized path matches any endpoint in the Postman definitions
      const normalizedDefPath = normalizePath(def.path);
      //console.log(`Comparing with Postman endpoint: ${def.method} ${normalizedDefPath}`);
      return def.method === e.method && normalizedTSPath === normalizedDefPath;
    })) {
      errors.push(`Endpoint found in code but not defined in Postman collection: ${e.method} ${e.path}`);
    }
  });
}

/**
 * Lints for endpoints that are defined in the Postman collection but not found in the TypeScript code.
 * @param tsEndpoints The list of endpoints defined in TypeScript code
 * @param endpointDefinitions The list of endpoints defined in the Postman collection
 * @param errors An array to store any found errors
 */
function lintExtraEndpoints(tsEndpoints: TSEndpoint[], endpointDefinitions: EndpointDefinition[], errors: string[]): void {
  endpointDefinitions.forEach((def) => {
    const normalizedDefPath = normalizePath(def.path); // Normalize the path of the Postman endpoint
    if (!tsEndpoints.some(e => e.method === def.method && normalizePath(e.path) === normalizedDefPath)) { // Check if the normalized path matches any endpoint in the TypeScript definitions
      let details = '';

      if (def.requestBody) {
        // Construct a string that lists each property name along with its inferred type for request body
        const requestBodyDetails = Object.keys(def.requestBody).map((key) => {
          const value = def.requestBody[key];
          const type = Array.isArray(value) ? 'array' : typeof value === 'object' && value !== null ? 'object' : typeof value;
          return `${key}: ${type}`;
        }).join(', ');

        if (requestBodyDetails) {
          details += ` with expected request body: { ${requestBodyDetails} }`;
        }
      }

      if (def.responseBody) {
        // Construct a string that lists each property name along with its inferred type for response body
        const responseBodyDetails = Object.keys(def.responseBody).map((key) => {
          const value = def.responseBody[key];
          const type = Array.isArray(value) ? 'array' : typeof value === 'object' && value !== null ? 'object' : typeof value;
          return `${key}: ${type}`;
        }).join(', ');

        if (responseBodyDetails) {
          details += ` and expected response body: { ${responseBodyDetails} }`;
        }
      }

      errors.push(`Endpoint defined in Postman collection but not found in code: ${def.method} ${def.path}${details}`);
    }
  });
}

  



export { lintEndpointRules, TSEndpoint }; // Export the lintEndpointRules function and TSEndpoint type for use in other modules