import * as path from 'path';
import fs from 'fs';
import { lintEndpointRules } from './lintRules';
import { tsParser } from './requestParser';
import { parseTypes } from './typeParser';
import { EndpointDefinition } from '../types/Postman.types';
import { Project } from 'ts-morph';

/**
 * Main function to lint a project by comparing TypeScript API definitions with Postman API definitions.
 * @param requestFilesDirectory The directory containing the TypeScript files that define API endpoints
 * @param typesDirectory The directory containing TypeScript files that define types
 * @param postmanEndpoints An array of endpoint definitions extracted from a Postman collection
 * @returns An array of linting error messages if discrepancies are found
 */
async function lintProject(requestFilesDirectory: string, typesDirectory: string, postmanEndpoints: EndpointDefinition[]) {
    const project = new Project(); // Create a new TypeScript project using ts-morph
    // Add all source files in the request files directory to the project
    project.addSourceFilesAtPaths(`${requestFilesDirectory}/**/*`);
    // Add all source files in the types directory to the project
    project.addSourceFilesAtPaths(`${typesDirectory}/**/*`);

    // Parse TypeScript files to get endpoint definitions from the request files
    const requestEndpoints = await tsParser(project);

    // Parse TypeScript files to get type definitions from the types directory
    const typeDefinitions = parseTypes(typesDirectory);

    // Lint the parsed TypeScript endpoints against the Postman endpoint definitions
    const errors = lintEndpointRules(postmanEndpoints, requestEndpoints, typeDefinitions);

    if (errors.length > 0) {
        // Uncomment the following lines to log errors to the console
        //console.log('Linting errors found:');
        //errors.forEach(error => console.log(error));
    } else {
        // Uncomment the following line to log success message to the console
        //console.log('No linting errors found.');
    }

    return errors; // Return the array of linting error messages
}

export { lintProject }; // Export the lintProject function for use in other modules
