// src/linter/lintRules.ts
import { EndpointDefinition } from '../postman/collectionParser';
import { TSEndpoint } from '../types/TSEndpoint';
import { TypeDefinition } from './typeParser';



function lintEndpointRules(endpointDefinitions: EndpointDefinition[], tsEndpoints: TSEndpoint[], typeDefinitions: TypeDefinition[]): string[] {
  const errors: string[] = [];

  // Normalize paths for comparison, if necessary
  const normalizePath = (path: string) => path.replace(/^\//, ''); // Example normalization

  // Check each endpoint definition against the TypeScript endpoints
  endpointDefinitions.forEach((def) => {
    const normalizedDefPath = normalizePath(def.path);
    const matchingTSEndpoint = tsEndpoints.find(e => e.method === def.method && normalizePath(e.path) === normalizedDefPath);

    if (!matchingTSEndpoint) {
      errors.push(`Endpoint defined in Postman collection not found in code: ${def.method} ${normalizedDefPath}`);
    } else {
      // Check if the request body properties match the expected properties from the mock JSON
      if (def.requestBody) {
        const expectedProperties = Object.keys(def.requestBody);
        const matchingType = typeDefinitions.find(type => type.name === matchingTSEndpoint.requestBodyType);

        if (!matchingType) {
          errors.push(`No matching type definition found for endpoint: ${def.name}`);
        } else {
          const actualProperties = Object.keys(matchingType.properties);

          const missingProperties = expectedProperties.filter(
            prop => !actualProperties.includes(prop)
          );

          const extraProperties = actualProperties.filter(
            prop => !expectedProperties.includes(prop)
          );

          if (missingProperties.length > 0) {
            errors.push(
              `Missing properties in request body for endpoint ${def.name}: ${missingProperties.join(', ')}. ` +
              `Expected properties: ${expectedProperties.join(', ')}`
            );
          }

          if (extraProperties.length > 0) {
            errors.push(
              `Extra properties in request body for endpoint ${def.name}: ${extraProperties.join(', ')}. ` +
              `Expected properties: ${expectedProperties.join(', ')}`
            );
          }

          expectedProperties.forEach(prop => {
            const expectedType = typeof def.requestBody[prop];
            const actualType = matchingType.properties[prop];

            if (actualType !== expectedType) {
              errors.push(
                `Type mismatch for property '${prop}' in request body for endpoint ${def.name}. ` +
                `Expected type: ${expectedType}, Actual type: ${actualType}`
              );
            }
          });
        }
      }
    }
  });

  // Optionally, check for TypeScript endpoints not defined in the Postman collection
  tsEndpoints.forEach((e) => {
    const normalizedTSPath = normalizePath(e.path);
    if (!endpointDefinitions.some(def => def.method === e.method && normalizePath(def.path) === normalizedTSPath)) {
      errors.push(`Endpoint found in code but not defined in Postman collection: ${e.method} ${normalizedTSPath}`);
    }
  });

  return errors;
}

export { lintEndpointRules, TSEndpoint };