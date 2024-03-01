// src/cli.ts
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

function parseProjectFiles(rootFileNames: string[], options: ts.CompilerOptions): ts.Program {
  const program = ts.createProgram(rootFileNames, options);
  return program;
}

function lintProject(program: ts.Program) {
  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      // Traverse the AST of each source file
      ts.forEachChild(sourceFile, (node) => {
        // Implement your linting logic here
      });
    }
  }
}

// CLI logic
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: ts-node src/cli.ts <path-to-typescript-file-or-directory>');
  process.exit(1);
}

const projectPath = args[0];
const rootFileNames = [projectPath];
const options: ts.CompilerOptions = {
  noEmit: true,
  target: ts.ScriptTarget.ES2015,
  module: ts.ModuleKind.CommonJS,
};

// Support for both single file and directory
let filesToLint: string[] = [];
if (fs.statSync(projectPath).isDirectory()) {
  const tsFiles = fs.readdirSync(projectPath).filter(file => file.endsWith('.ts'));
  filesToLint = tsFiles.map(file => path.join(projectPath, file));
} else {
  filesToLint.push(projectPath);
}

const program = parseProjectFiles(filesToLint, options);
lintProject(program);