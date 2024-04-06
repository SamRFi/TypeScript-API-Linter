// tests/linterTests.ts
import { lintProject } from '../linter/index';
import { parseCollection, readPostmanCollection } from '../postman/collectionParser';
import path from 'path';

describe('Linter Functionality', () => {
  it('should detect mismatched endpoints and types between TS files and Postman collection', async () => {
    // Adjust the path to the directory containing your mock TypeScript file
    const tsFilesPath = path.join(__dirname, '../mockFiles/succeedingMockRequests'); 
    const typesPath = path.join(__dirname, '../mockFiles/succeedingMockTypes'); 

    // Path to the Postman collection JSON file
    const collectionFilePath = path.join(__dirname, '../mockFiles/mockPostmanCollection.json');
    const postmanCollection = readPostmanCollection(collectionFilePath);
    const postmanEndpoints = parseCollection(postmanCollection);

    // Run the linting project function
    const errors = await lintProject(tsFilesPath, typesPath, postmanEndpoints);

    // Assert there are no errors (or adjust assertion based on expected outcome)
    expect(errors).toEqual([]);
  });
});

describe('Linter Functionality - Failure Cases', () => {
  it('should correctly identify mismatched endpoints and types between TS files and Postman collection', async () => {
    // Path to the directory containing the intentionally failing mock TypeScript files
    const tsFilesPath = path.join(__dirname, '../mockFiles/failingMockRequests');
    const typesPath = path.join(__dirname, '../mockFiles/failingMockTypes');

    // Path to the Postman collection JSON file
    const collectionFilePath = path.join(__dirname, '../mockFiles/mockPostmanCollection.json');
    const postmanCollection = readPostmanCollection(collectionFilePath);
    const postmanEndpoints = parseCollection(postmanCollection);

    // Run the linting project function
    const errors = await lintProject(tsFilesPath, typesPath, postmanEndpoints);

    console.log(errors);
    // Assert that errors are present
    expect(errors.length).toBeGreaterThan(0);
    // Optionally, you can check for specific error messages if you want to ensure specific types of mismatches are detected
    // For example:
    // expect(errors).toContain("Expected error message");
  });
});
