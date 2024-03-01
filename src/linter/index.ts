// src/linter/index.ts

import { endpointDefinitions } from '../postman';
import { lintEndpointRules } from './lintRules';
import { tsParser } from './tsParser'; // Assuming tsParser is a function you've defined to parse TS files and get endpoints

async function lintProject() {
    // Example function to get endpoints from TS files
    const tsEndpoints = await tsParser('path/to/ts/files'); // Define your logic to get TS endpoints

    const errors = lintEndpointRules(endpointDefinitions, tsEndpoints);

    if (errors.length > 0) {
        console.log('Linting errors found:');
        errors.forEach(error => console.log(error));
    } else {
        console.log('No linting errors found.');
    }
}

lintProject();
