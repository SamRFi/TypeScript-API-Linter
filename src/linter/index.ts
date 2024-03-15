// src/linter/index.ts
import { endpointDefinitions } from '../postman';
import { lintEndpointRules } from './lintRules';
import { tsParser } from './tsParser';
import { parseTypes } from './typeParser';

async function lintProject(tsFilesDirectory: string, typesDirectory: string) {
    // Get endpoints from TS files
    const tsEndpoints = await tsParser(tsFilesDirectory);

    // Parse TypeScript type definitions
    const typeDefinitions = parseTypes(typesDirectory);

    const errors = lintEndpointRules(endpointDefinitions, tsEndpoints, typeDefinitions);

    if (errors.length > 0) {
        console.log('Linting errors found:');
        errors.forEach(error => console.log(error));
    } else {
        console.log('No linting errors found.');
    }
}

export { lintProject };