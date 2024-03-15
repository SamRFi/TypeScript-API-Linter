// src/linter/lintRules.ts
import { EndpointDefinition } from '../postman/collectionParser';
import { TypeDefinition } from './typeParser';

interface TSEndpoint {
  method: string;
  path: string;
}

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
      // Check if the request body properties match the corresponding TypeScript type
      if (def.requestBody) {
        const matchingType = typeDefinitions.find(type => type.name === `${def.name}RequestBody`);

        if (!matchingType) {
          errors.push(`No matching type definition found for endpoint: ${def.name}`);
        } else {
          const missingProperties = Object.keys(def.requestBody).filter(
            prop => !matchingType.properties.hasOwnProperty(prop)
          );

          if (missingProperties.length > 0) {
            errors.push(
              `Missing properties in type definition for endpoint ${def.name}: ${missingProperties.join(', ')}`
            );
          }
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