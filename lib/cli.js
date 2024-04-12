"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts = __importStar(require("typescript"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function parseProjectFiles(rootFileNames, options) {
    const program = ts.createProgram(rootFileNames, options);
    return program;
}
function lintProject(program) {
    function visit(node, sourceFile) {
        try {
            if (ts.isCallExpression(node) && node.expression) {
                const callExpressionText = node.expression.getText(sourceFile);
                if (callExpressionText.includes('fetch')) {
                    const args = node.arguments;
                    // Check if fetch call has options object
                    if (args.length > 1 && ts.isObjectLiteralExpression(args[1])) {
                        const methodProperty = args[1].properties.find(property => ts.isPropertyAssignment(property) &&
                            ts.isIdentifier(property.name) &&
                            property.name.text === 'method');
                        if (methodProperty) {
                            const methodValue = methodProperty.initializer;
                            // Check if the method is not a GET request
                            if (!ts.isStringLiteral(methodValue) || methodValue.text.toUpperCase() !== 'GET') {
                                console.error(`Non-GET request found: ${methodValue.getFullText(sourceFile)}`);
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
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
const options = {
    noEmit: true,
    target: ts.ScriptTarget.ES2015,
    module: ts.ModuleKind.CommonJS,
};
let filesToLint = [];
if (fs.statSync(projectPath).isDirectory()) {
    const tsFiles = fs.readdirSync(projectPath);
    filesToLint = tsFiles.map(file => path.join(projectPath, file));
}
else {
    filesToLint.push(projectPath);
}
const program = parseProjectFiles(filesToLint, options);
lintProject(program);
