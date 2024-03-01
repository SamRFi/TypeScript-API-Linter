// Assuming you're using Jest for testing

import fs from 'fs';
import path from 'path';
import { parseCollection, PostmanCollection } from '../postman/collectionParser';

describe('parseCollection', () => {
  it('correctly parses endpoints from a Postman collection file', () => {
    // Path to your mock JSON file
    const filePath = path.join(__dirname, 'mockPostmanCollection.json');
    
    // Read and parse the JSON file
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const postmanCollection: PostmanCollection = JSON.parse(fileContents);
    
    // Call your parseCollection function with the parsed data
    const endpoints = parseCollection(postmanCollection);
    
    // Define your expected endpoints based on the mock data
    const expectedEndpoints = [
      {
        method: 'POST',
        path: 'auth/signin',
        name: 'Sign In',
      },
      // Add more expected endpoints as needed
    ];

    // Use Jest's expect function to assert the parsed endpoints against the expected ones
    expect(endpoints).toEqual(expectedEndpoints);
  });
});
