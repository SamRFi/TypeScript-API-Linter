// src/linter/lintRules.ts
import { EndpointDefinition } from '../postman/collectionParser';
import { TypeDefinition } from './typeParser';

interface TSEndpoint {
  method: string;
  path: string;
  requestBodyType?: string | null;
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
        if (matchingTSEndpoint && matchingTSEndpoint.requestBodyType) {
          const matchingType = typeDefinitions.find(type => type.name === matchingTSEndpoint.requestBodyType);
      
          if (!matchingType) {
            errors.push(`No matching type definition found for endpoint: ${def.name}`);
          } else {
            const requestBodyProperties = Object.keys(def.requestBody);
            const typeProperties = Object.keys(matchingType.properties);
      
            const missingProperties = requestBodyProperties.filter(
              prop => !typeProperties.includes(prop)
            );
      
            const extraProperties = typeProperties.filter(
              prop => !requestBodyProperties.includes(prop)
            );
      
            if (missingProperties.length > 0) {
              errors.push(
                `Missing properties in request body for endpoint ${def.name}: ${missingProperties.join(', ')}`
              );
            }
      
            if (extraProperties.length > 0) {
              errors.push(
                `Extra properties in request body for endpoint ${def.name}: ${extraProperties.join(', ')}`
              );
            }
      
            requestBodyProperties.forEach(prop => {
              const requestBodyPropertyType = typeof def.requestBody[prop];
              const typePropertyType = matchingType.properties[prop];
      
              if (requestBodyPropertyType !== typePropertyType) {
                errors.push(
                  `Type mismatch for property '${prop}' in request body for endpoint ${def.name}. ` +
                  `Expected type: ${typePropertyType}, Actual type: ${requestBodyPropertyType}`
                );
              }
            });
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