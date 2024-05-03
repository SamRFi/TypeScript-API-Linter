// src/linter/lintRules.ts
import { EndpointDefinition } from '../postman/collectionParser';
import { TSEndpoint } from '../types/TSEndpoint';
import { TypeDefinition } from './typeParser';

const normalizePath = (path: string) => path.replace(/^\//, '').replace(/\/:\w+/g, '').replace(/\/$/, '').replace(/\/\//g, '/');

function lintEndpointRules(endpointDefinitions: EndpointDefinition[], tsEndpoints: TSEndpoint[], typeDefinitions: TypeDefinition[]): string[] {
  const errors: string[] = [];

  endpointDefinitions.forEach((def) => {
    const normalizedDefPath = normalizePath(def.path);
    const matchingTSEndpoint = findMatchingTSEndpoint(tsEndpoints, def.method, normalizedDefPath);

    if (matchingTSEndpoint) {
      lintRequestBody(def, matchingTSEndpoint, typeDefinitions, errors);
      lintResponseBody(def, matchingTSEndpoint, typeDefinitions, errors);
    }
  });

  lintMissingEndpoints(tsEndpoints, endpointDefinitions, errors);
  lintExtraEndpoints(tsEndpoints, endpointDefinitions, errors);

  return errors;
}

function findMatchingTSEndpoint(tsEndpoints: TSEndpoint[], method: string, path: string): TSEndpoint | undefined {
  return tsEndpoints.find(e => e.method === method && normalizePath(e.path) === path);
}

function lintRequestBody(def: EndpointDefinition, matchingTSEndpoint: TSEndpoint, typeDefinitions: TypeDefinition[], errors: string[]): void {
  if (def.requestBody) {
    
    // Handle non-array request bodies
    const matchingType = findMatchingType(typeDefinitions, matchingTSEndpoint.requestBodyType);
    if (!matchingType) {
      errors.push(createNoMatchingTypeError(def.name));
      return;
    }

    const expectedProperties = Object.keys(matchingType.properties);
    const actualProperties = Object.keys(def.requestBody);
    lintMissingProperties(def.name, expectedProperties, actualProperties, errors, 'request');
    lintExtraProperties(def.name, expectedProperties, actualProperties, errors, 'request');
    lintPropertyTypes(def.name, def.requestBody, matchingType, expectedProperties, typeDefinitions, errors, 'request');
  
  }
}



function lintResponseBody(def: EndpointDefinition, matchingTSEndpoint: TSEndpoint, typeDefinitions: TypeDefinition[], errors: string[]): void {
  if (def.responseBody) {
    const expectedProperties = Object.keys(def.responseBody);
    const matchingType = findMatchingType(typeDefinitions, matchingTSEndpoint.responseBodyType);

    if (!matchingType) {
      errors.push(createNoMatchingResponseError(def.name));
    } else {

        const actualProperties = Object.keys(matchingType.properties);
        lintMissingProperties(def.name, expectedProperties, actualProperties, errors, 'response');
        lintExtraProperties(def.name, expectedProperties, actualProperties, errors, 'response');
        lintPropertyTypes(def.name, def.responseBody, matchingType, expectedProperties, typeDefinitions, errors, 'response');
      
    }
  }
}



function findMatchingType(typeDefinitions: TypeDefinition[], typeName: string | null | undefined): TypeDefinition | undefined {
  if (typeName === null || typeName === undefined) {
    return undefined;
  }

  // Check if the type name ends with "[]"
  const isArrayType = typeName.endsWith('[]');
  const baseTypeName = isArrayType ? typeName.slice(0, -2) : typeName;

  const matchingType = typeDefinitions.find(type => type.name === baseTypeName);

  return matchingType;
}

function createNoMatchingTypeError(endpointName: string): string {
  return `No matching request type definition found for endpoint: ${endpointName}`;
}

function createNoMatchingResponseError(endpointName: string): string {
  return `No matching response type definition found for endpoint: ${endpointName}`;
}

function lintMissingProperties(endpointName: string, expectedProperties: string[], actualProperties: string[], errors: string[], bodyType: 'request' | 'response'): void {
  const missingProperties = expectedProperties.filter(prop => !actualProperties.includes(prop));
  if (missingProperties.length > 0) {
    errors.push(`Missing properties in ${bodyType} body for endpoint ${endpointName}: ${missingProperties.join(', ')}. Expected properties: ${expectedProperties.join(', ')}`);
  }
}

function lintExtraProperties(endpointName: string, expectedProperties: string[], actualProperties: string[], errors: string[], bodyType: 'request' | 'response'): void {
  const extraProperties = actualProperties.filter(prop => !expectedProperties.includes(prop));
  if (extraProperties.length > 0) {
    errors.push(`Extra properties in ${bodyType} body for endpoint ${endpointName}: ${extraProperties.join(', ')}. Expected properties: ${expectedProperties.join(', ')}`);
  }
}


function lintPropertyTypes(endpointName: string, requestBody: any, matchingType: TypeDefinition, expectedProperties: string[], typeDefinitions: TypeDefinition[], errors: string[], bodyType: 'request' | 'response'): void {
  expectedProperties.forEach(prop => {
    const expectedType = requestBody[prop];
    const actualType = matchingType.properties[prop];

    // Check if actualType is defined
    if (!actualType) {
      errors.push(`Property '${prop}' is missing in the type definition for endpoint ${endpointName}`);
      return; // Skip further checks for this property
    }

    // If the expected type is undefined, skip the mismatch error
    if (typeof expectedType === 'undefined') {
      return; // Do not report an error if the expected type is undefined
    }

    // Check if the actual type is an enum
    const enumType = typeDefinitions.find(type => type.name === actualType);
    if (enumType) {
      const enumValues = Object.values(enumType.properties);
      if (typeof expectedType === 'string' && !enumValues.includes(expectedType)) {
        errors.push(`Invalid enum value for property '${prop}' in ${bodyType} body for endpoint ${endpointName}. Expected one of ${enumValues.join(', ')}, but got: ${expectedType}`);
      }
    } else if (Array.isArray(expectedType)) {
      if (actualType.endsWith('[]')) {
        const referencedType = actualType.slice(0, -2);
        const matchingReferencedType = findMatchingType(typeDefinitions, referencedType);

        if (!matchingReferencedType) {
          errors.push(`Referenced type '${referencedType}' not found for property '${prop}' in ${bodyType} body for endpoint ${endpointName}`);
        }
      } else {
        errors.push(`Type mismatch for property '${prop}' in ${bodyType} body for endpoint ${endpointName}. Expected an array, but got: ${actualType}`);
      }
    } else if (typeof expectedType === 'object' && expectedType !== null) {
      if (actualType !== 'object') {
        const matchingReferencedType = findMatchingType(typeDefinitions, actualType);
        if (!matchingReferencedType) {
          errors.push(`Type mismatch for property '${prop}' in ${bodyType} body for endpoint ${endpointName}. Expected an object, but got: ${actualType}`);
        }
      }
    } else if (typeof expectedType !== actualType) {
      errors.push(`Type mismatch for property '${prop}' in ${bodyType} body for endpoint ${endpointName}. Expected type: ${typeof expectedType}, Actual type: ${actualType}`);
    }
  });
}


function lintMissingEndpoints(tsEndpoints: TSEndpoint[], endpointDefinitions: EndpointDefinition[], errors: string[]): void {
  tsEndpoints.forEach((e) => {
    const normalizedTSPath = normalizePath(e.path);
    //console.log(`Checking missing endpoint: ${e.method} ${normalizedTSPath}`);
    if (!endpointDefinitions.some(def => {
      const normalizedDefPath = normalizePath(def.path);
      //console.log(`Comparing with Postman endpoint: ${def.method} ${normalizedDefPath}`);
      return def.method === e.method && normalizedTSPath === normalizedDefPath;
    })) {
      errors.push(`Endpoint found in code but not defined in Postman collection: ${e.method} ${e.path}`);
    }
  });
}

function lintExtraEndpoints(tsEndpoints: TSEndpoint[], endpointDefinitions: EndpointDefinition[], errors: string[]): void {
  endpointDefinitions.forEach((def) => {
    const normalizedDefPath = normalizePath(def.path);
    if (!tsEndpoints.some(e => e.method === def.method && normalizePath(e.path) === normalizedDefPath)) {
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

  



export { lintEndpointRules, TSEndpoint };