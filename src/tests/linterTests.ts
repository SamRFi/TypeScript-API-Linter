// tests/linterTests.ts
import { lintEndpointRules } from '../linter/lintRules';
import { parseCollection, readPostmanCollection } from '../postman/collectionParser';
import { tsParser } from '../linter/tsParser'; // Ensure tsParser is implemented to read TS files
import path from 'path';

describe('Linter Functionality', () => {
  it('should detect mismatched endpoints between TS files and Postman collection', async () => {
    // Path to the mock TypeScript file
    const tsFilePath = path.join(__dirname, 'mockRequests.ts');

    // Use tsParser to parse the mock TypeScript file and get endpoints
    const tsEndpoints = tsParser(tsFilePath); // Adjust tsParser as needed to support file path input

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
