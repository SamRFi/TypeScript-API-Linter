// src/linter/lintRules.ts
import { EndpointDefinition } from '../postman/collectionParser';
import { TSEndpoint } from '../types/TSEndpoint';
import { TypeDefinition } from './typeParser';

const normalizePath = (path: string) => path.replace(/^\//, '');

function lintEndpointRules(endpointDefinitions: EndpointDefinition[], tsEndpoints: TSEndpoint[], typeDefinitions: TypeDefinition[]): string[] {
  const errors: string[] = [];

  endpointDefinitions.forEach((def) => {
    const normalizedDefPath = normalizePath(def.path);
    const matchingTSEndpoint = findMatchingTSEndpoint(tsEndpoints, def.method, normalizedDefPath);

    if (!matchingTSEndpoint) {
      errors.push(createEndpointNotFoundError(def.method, normalizedDefPath));
    } else {
      lintRequestBody(def, matchingTSEndpoint, typeDefinitions, errors);
    }
  });

  lintMissingEndpoints(tsEndpoints, endpointDefinitions, errors);

  return errors;
}

function findMatchingTSEndpoint(tsEndpoints: TSEndpoint[], method: string, path: string): TSEndpoint | undefined {
  return tsEndpoints.find(e => e.method === method && normalizePath(e.path) === path);
}

function createEndpointNotFoundError(method: string, path: string): string {
  return `Endpoint defined in Postman collection not found in code: ${method} ${path}`;
}

function lintRequestBody(def: EndpointDefinition, matchingTSEndpoint: TSEndpoint, typeDefinitions: TypeDefinition[], errors: string[]): void {
  if (def.requestBody) {
    const expectedProperties = Object.keys(def.requestBody);
    const matchingType = findMatchingType(typeDefinitions, matchingTSEndpoint.requestBodyType);

    if (!matchingType) {
      errors.push(createNoMatchingTypeError(def.name));
    } else {
      const actualProperties = Object.keys(matchingType.properties);
      lintMissingProperties(def.name, expectedProperties, actualProperties, errors);
      lintExtraProperties(def.name, expectedProperties, actualProperties, errors);
      lintPropertyTypes(def.name, def.requestBody, matchingType, expectedProperties, errors);
    }
  }
}

function findMatchingType(typeDefinitions: TypeDefinition[], requestBodyType: string | null | undefined): TypeDefinition | undefined {
  if (requestBodyType === null || requestBodyType === undefined) {
    return undefined;
  }
  return typeDefinitions.find(type => type.name === requestBodyType);
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
    const expectedType = typeof requestBody[prop];
    const actualType = matchingType.properties[prop];
    if (actualType !== expectedType) {
      errors.push(`Type mismatch for property '${prop}' in request body for endpoint ${endpointName}. Expected type: ${expectedType}, Actual type: ${actualType}`);
    }
  });
}

function lintMissingEndpoints(tsEndpoints: TSEndpoint[], endpointDefinitions: EndpointDefinition[], errors: string[]): void {
  tsEndpoints.forEach((e) => {
    const normalizedTSPath = normalizePath(e.path);
    if (!endpointDefinitions.some(def => def.method === e.method && normalizePath(def.path) === normalizedTSPath)) {
      errors.push(`Endpoint found in code but not defined in Postman collection: ${e.method} ${normalizedTSPath}`);
    }
  });
}

export { lintEndpointRules, TSEndpoint };