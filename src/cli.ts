import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

function parseProjectFiles(rootFileNames: string[], options: ts.CompilerOptions): ts.Program {
  const program = ts.createProgram(rootFileNames, options);
  return program;
}

function lintProject(program: ts.Program) {
  function visit(node: ts.Node, sourceFile: ts.SourceFile) {
    try {
      if (ts.isCallExpression(node) && node.expression) {
        const callExpressionText = node.expression.getText(sourceFile);
        if (callExpressionText.includes('fetch')) {
          const args = node.arguments;
          // Check if fetch call has options object
          if (args.length > 1 && ts.isObjectLiteralExpression(args[1])) {
            const methodProperty = args[1].properties.find(property => 
              ts.isPropertyAssignment(property) &&
              ts.isIdentifier(property.name) &&
              property.name.text === 'method'
            );

            if (methodProperty) {
              const methodValue = (methodProperty as ts.PropertyAssignment).initializer;
              // Check if the method is not a GET request
              if (!ts.isStringLiteral(methodValue) || methodValue.text.toUpperCase() !== 'GET') {
                console.error(`Non-GET request found: ${methodValue.getFullText(sourceFile)}`);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing node in file ${sourceFile.fileName}:`, error);
      if (node) {
        console.error(`Node kind: ${ts.SyntaxKind[node.kind]}`);
      }
    }

    ts.forEachChild(node, child => visit(child, sourceFile));
  }

  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile && !sourceFile.fileName.includes('node_modules') && !sourceFile.fileName.includes('vite.config')) {
      console.log(`Analyzing file: ${sourceFile.fileName}`);
      visit(sourceFile, sourceFile);
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
const options: ts.CompilerOptions = {
  noEmit: true,
  target: ts.ScriptTarget.ES2015,
  module: ts.ModuleKind.CommonJS,
};

let filesToLint: string[] = [];
if (fs.statSync(projectPath).isDirectory()) {
  const tsFiles = fs.readdirSync(projectPath);
  filesToLint = tsFiles.map(file => path.join(projectPath, file));
} else {
  filesToLint.push(projectPath);
}


const program = parseProjectFiles(filesToLint, options);
lintProject(program);
