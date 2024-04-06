// src/linter/index.ts
import * as ts from 'typescript';
import * as path from 'path';
import fs from 'fs';
import { lintEndpointRules } from './lintRules';
import { tsParser } from './tsParser';
import { parseTypes } from './typeParser';
import { EndpointDefinition } from '../types/Postman.types';

async function lintProject(tsFilesDirectory: string, typesDirectory: string, postmanEndpoints: EndpointDefinition[]) {
    // Create a single ts.Program instance
    const fileNames = [
        // Include all TypeScript files in the project
        ...getTypeScriptFiles(tsFilesDirectory),
        ...getTypeScriptFiles(typesDirectory),
    ];
    const options: ts.CompilerOptions = {
        // Specify your compiler options here
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.CommonJS,
        // ...
    };
    const program = ts.createProgram(fileNames, options);

    // Get endpoints from TS files
    const tsEndpoints = await tsParser(tsFilesDirectory, program);

    // Parse TypeScript type definitions
    const typeDefinitions = parseTypes(typesDirectory, program);

    const errors = lintEndpointRules(postmanEndpoints, tsEndpoints, typeDefinitions);

    if (errors.length > 0) {
        console.log('Linting errors found:');
        errors.forEach(error => console.log(error));
    } else {
        console.log('No linting errors found.');
    }

    return errors;
}

function getTypeScriptFiles(directory: string): string[] {
    const files: string[] = [];

    function readFilesFromDirectory(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                readFilesFromDirectory(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.ts')) {
                files.push(fullPath);
            }
        }
    }

    readFilesFromDirectory(directory);
    return files;
}

export { lintProject };
