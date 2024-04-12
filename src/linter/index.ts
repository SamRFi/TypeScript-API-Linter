import * as path from 'path';
import fs from 'fs';
import { lintEndpointRules } from './lintRules';
import { tsParser } from './requestParser';
import { parseTypes } from './typeParser';
import { EndpointDefinition } from '../types/Postman.types';
import { Project } from 'ts-morph';

async function lintProject(requestFilesDirectory: string, typesDirectory: string, postmanEndpoints: EndpointDefinition[]) {
    const project = new Project();
    project.addSourceFilesAtPaths(`${requestFilesDirectory}/**/*`);
    project.addSourceFilesAtPaths(`${typesDirectory}/**/*`);

    // Get endpoints from request files
    const requestEndpoints = await tsParser(project, postmanEndpoints);

    // Parse type definitions
    const typeDefinitions = parseTypes(typesDirectory);

    const errors = lintEndpointRules(postmanEndpoints, requestEndpoints, typeDefinitions);

    if (errors.length > 0) {
        console.log('Linting errors found:');
        errors.forEach(error => console.log(error));
    } else {
        console.log('No linting errors found.');
    }

    return errors;
}

export { lintProject };
