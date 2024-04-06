// src/linter/createProgram.ts
import * as ts from 'typescript';
import * as path from 'path';

export function createProgram(fileNames: string[], options: ts.CompilerOptions): ts.Program {
  const program = ts.createProgram(fileNames, options);
  return program;
}
