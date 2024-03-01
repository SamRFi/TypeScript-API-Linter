// src/linter/lintRules.ts
import { EndpointDefinition } from '../postman/collectionParser';

interface TSEndpoint {
  method: string;
  path: string;
}

function lintEndpointRules(endpointDefinitions: EndpointDefinition[], tsEndpoints: TSEndpoint[]): string[] {
  const errors: string[] = [];

  // Normalize paths for comparison, if necessary
  const normalizePath = (path: string) => path.replace(/^\//, ''); // Example normalization

  // Check each endpoint definition against the TypeScript endpoints
  endpointDefinitions.forEach((def) => {
    const normalizedDefPath = normalizePath(def.path);
    if (!tsEndpoints.some(e => e.method === def.method && normalizePath(e.path) === normalizedDefPath)) {
      errors.push(`Endpoint defined in Postman collection not found in code: ${def.method} ${normalizedDefPath}`);
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
