// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    "**/tests/**/*.ts", // Look for .ts files in tests folder
    "**/?(*.)+(spec|test).ts" // Also look for .spec.ts and .test.ts files
  ],
};
