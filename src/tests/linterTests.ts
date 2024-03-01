// tests/linterTests.ts
import { lintEndpointRules } from '../linter/lintRules';
import { parseCollection, readPostmanCollection } from '../postman/collectionParser';
import { tsParser, TSEndpoint } from '../linter/tsParser';
import path from 'path';

describe('Linter Functionality', () => {
  it('should detect mismatched endpoints between TS files and Postman collection', () => {
    // Adjust the path to the directory containing your mock TypeScript file
    const tsFilesPath = path.join(__dirname, 'succeedingMockRequests'); // Assuming mockRequests.ts is in the tests directory

    // Use tsParser to parse TypeScript files in the directory and get endpoints
    const tsEndpoints: TSEndpoint[] = tsParser(tsFilesPath);

    // Path to the Postman collection JSON file
    const collectionFilePath = path.join(__dirname, 'mockPostmanCollection.json');
    const postmanCollection = readPostmanCollection(collectionFilePath);
    const postmanEndpoints = parseCollection(postmanCollection);

    // Run the linting rule checker
    const errors = lintEndpointRules(postmanEndpoints, tsEndpoints);

    // Assert there are no errors (or adjust assertion based on expected outcome)
    expect(errors).toEqual([]);
  });
});

describe('Linter Functionality - Failure Cases', () => {
  it('should correctly identify mismatched endpoints between TS files and Postman collection', () => {
    // Path to the directory containing the intentionally failing mock TypeScript files
    const tsFilesPath = path.join(__dirname, 'failingMockRequests');

    // Use tsParser to parse TypeScript files in the directory and get endpoints
    const tsEndpoints: TSEndpoint[] = tsParser(tsFilesPath);

    // Path to the Postman collection JSON file
    const collectionFilePath = path.join(__dirname, 'mockPostmanCollection.json');
    const postmanCollection = readPostmanCollection(collectionFilePath);
    const postmanEndpoints = parseCollection(postmanCollection);

    // Run the linting rule checker
    const errors = lintEndpointRules(postmanEndpoints, tsEndpoints);

    // Assert that errors are present
    expect(errors.length).toBeGreaterThan(0);
    console.log('Linting errors found:' + errors);
    // Optionally, you can check for specific error messages if you want to ensure specific types of mismatches are detected
    // For example:
    // expect(errors).toContain("Expected error message");
  });
});

