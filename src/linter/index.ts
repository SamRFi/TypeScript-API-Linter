// src/linter/index.ts
import * as ts from 'typescript';
import * as path from 'path';
import fs from 'fs';
import { lintEndpointRules } from './lintRules';
import { tsParser } from './tsParser';
import { parseTypes } from './typeParser';
import { EndpointDefinition } from '../types/Postman.types';
import { Project } from 'ts-morph';

async function lintProject(tsFilesDirectory: string, typesDirectory: string, postmanEndpoints: EndpointDefinition[]) {
    const project = new Project();
    project.addSourceFilesAtPaths(`${tsFilesDirectory}/**/*.ts`);
    project.addSourceFilesAtPaths(`${typesDirectory}/**/*.ts`);
    // Get endpoints from TS files
    const tsEndpoints = await tsParser(project, postmanEndpoints);

    // Parse TypeScript type definitions
    const typeDefinitions = parseTypes(typesDirectory);

    const errors = lintEndpointRules(postmanEndpoints, tsEndpoints, typeDefinitions);

    if (errors.length > 0) {
        console.log('Linting errors found:');
        errors.forEach(error => console.log(error));
    } else {
        console.log('No linting errors found.');
    }

    return errors;
}

export { lintProject };
