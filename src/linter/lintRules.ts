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
    const expectedProperties = Object.keys(def.requestBody);
    console.log(`Endpoint: ${def.name}`);
    console.log(`Request Body Type: ${matchingTSEndpoint.requestBodyType}`);
    const matchingType = findMatchingType(typeDefinitions, matchingTSEndpoint.requestBodyType);

    if (!matchingType) {
      console.log(`No matching type found for endpoint: ${def.name}`);
      errors.push(createNoMatchingTypeError(def.name));
    } else {
      console.log(`Matching Type: ${matchingType.name}`);
      const actualProperties = Object.keys(matchingType.properties);
      lintMissingProperties(def.name, expectedProperties, actualProperties, errors);
      lintExtraProperties(def.name, expectedProperties, actualProperties, errors);
      lintPropertyTypes(def.name, def.requestBody, matchingType, expectedProperties, errors);
    }
  }
}

function findMatchingType(typeDefinitions: TypeDefinition[], requestBodyType: string | null | undefined): TypeDefinition | undefined {
  if (requestBodyType === null || requestBodyType === undefined) {
    console.log(`Request Body Type is null or undefined`);
    return undefined;
  }
  console.log(`Searching for type: ${requestBodyType}`);
  const matchingType = typeDefinitions.find(type => type.name === requestBodyType);
  if (matchingType) {
    console.log(`Found matching type: ${matchingType.name}`);
  } else {
    console.log(`No matching type found for: ${requestBodyType}`);
  }
  return matchingType;
}

function createNoMatchingTypeError(endpointName: string): string {
  return `No matching type definition found for endpoint: ${endpointName}`;
}

function lintMissingProperties(endpointName: string, expectedProperties: string[], actualProperties: string[], errors: string[]): void {
  const missingProperties = expectedProperties.filter(prop => !actualProperties.includes(prop));
  if (missingProperties.length > 0) {
    errors.push(`Missing properties in request body for endpoint ${endpointName}: ${missingProperties.join(', ')}. Expected properties: ${expectedProperties.join(', ')}`);
  }
}

function lintExtraProperties(endpointName: string, expectedProperties: string[], actualProperties: string[], errors: string[]): void {
  const extraProperties = actualProperties.filter(prop => !expectedProperties.includes(prop));
  if (extraProperties.length > 0) {
    errors.push(`Extra properties in request body for endpoint ${endpointName}: ${extraProperties.join(', ')}. Expected properties: ${expectedProperties.join(', ')}`);
  }
}

function lintPropertyTypes(endpointName: string, requestBody: any, matchingType: TypeDefinition, expectedProperties: string[], errors: string[]): void {
  expectedProperties.forEach(prop => {
    const expectedType = requestBody[prop];
    const actualType = matchingType.properties[prop];

    if (typeof expectedType === 'object' && expectedType !== null) {
      const expectedObjectType = JSON.stringify(getObjectTypeShape(expectedType), null, 2);
      const actualObjectType = formatObjectType(actualType);

      if (expectedObjectType !== actualObjectType) {
        errors.push(`Type mismatch for property '${prop}' in request body for endpoint ${endpointName}. Expected type: ${expectedObjectType}, Actual type: ${actualObjectType}`);
      }
    } else if (typeof expectedType !== actualType) {
      errors.push(`Type mismatch for property '${prop}' in request body for endpoint ${endpointName}. Expected type: ${typeof expectedType}, Actual type: ${actualType}`);
    }
  });
}

function getObjectTypeShape(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj;
  }

  const typeShape: any = {};
  for (const key in obj) {
    const value = getObjectTypeShape(obj[key]);
    typeShape[key] = value === 'string' ? 'string' : value;
  }
  return typeShape;
}

function formatObjectType(objectType: string): string {
  const trimmedType = objectType.trim().slice(1, -1); // Remove the outer curly braces
  const propertyPairs = trimmedType.split(';').map(pair => pair.trim());
  const formattedPairs = propertyPairs
    .filter(pair => pair !== '') // Filter out empty pairs
    .map(pair => {
      const [key, value] = pair.split(':').map(part => part.trim());
      return `  "${key}": "${value}"`;
    });
  return `{\n${formattedPairs.join(',\n')}\n}`;
}


function lintMissingEndpoints(tsEndpoints: TSEndpoint[], endpointDefinitions: EndpointDefinition[], errors: string[]): void {
  tsEndpoints.forEach((e) => {
    const normalizedTSPath = normalizePath(e.path);
    console.log(`Checking missing endpoint: ${e.method} ${normalizedTSPath}`);
    if (!endpointDefinitions.some(def => {
      const normalizedDefPath = normalizePath(def.path);
      console.log(`Comparing with Postman endpoint: ${def.method} ${normalizedDefPath}`);
      return def.method === e.method && normalizedTSPath === normalizedDefPath;
    })) {
      errors.push(`Endpoint found in code but not defined in Postman collection: ${e.method} ${e.path}`);
    }
  });
}

function lintExtraEndpoints(tsEndpoints: TSEndpoint[], endpointDefinitions: EndpointDefinition[], errors: string[]): void {
  endpointDefinitions.forEach((def) => {
    const normalizedDefPath = normalizePath(def.path);
    console.log(`Checking extra endpoint: ${def.method} ${normalizedDefPath}`);
    if (!tsEndpoints.some(e => {
      const normalizedTSPath = normalizePath(e.path);
      console.log(`Comparing with code endpoint: ${e.method} ${normalizedTSPath}`);
      return e.method === def.method && normalizedTSPath === normalizedDefPath;
    })) {
      errors.push(`Endpoint defined in Postman collection but not found in code: ${def.method} ${def.path}`);
    }
  });
}

export { lintEndpointRules, TSEndpoint };