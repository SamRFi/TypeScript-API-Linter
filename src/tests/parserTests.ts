// tests/parserTests.ts
import fs from 'fs';
import path from 'path';
import { parseCollection, PostmanCollection, EndpointDefinition } from '../postman/collectionParser';

describe('parseCollection', () => {
  it('correctly parses endpoints from a Postman collection file', () => {
    // Path to your mock JSON file
    const filePath = path.join(__dirname, '../mockFiles/mockPostmanCollection.json');

    // Read and parse the JSON file
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const postmanCollection: PostmanCollection = JSON.parse(fileContents);

    // Call your parseCollection function with the parsed data
    const endpoints: EndpointDefinition[] = parseCollection(postmanCollection);

    // Define your expected endpoints based on the mock data
    const expectedEndpoints: EndpointDefinition[] = [
      {
        method: 'POST',
        path: 'auth/signin',
        name: 'Sign In',
        requestBody: {
          email: 'user@example.com',
          password: 'password123',
          stay_logged_in: true
        }
      }
    ];

    // Use Jest's expect function to assert the parsed endpoints against the expected ones
    expect(endpoints).toEqual(expectedEndpoints);
  });
});