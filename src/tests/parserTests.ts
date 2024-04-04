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
          email: 'user5@example.com',
          password: 'Securepassword123!',
          stay_logged_in: true,
        },
      },
      {
        method: 'POST',
        path: 'auth/signout',
        name: 'Sign Out',
        requestBody: undefined,
      },
      {
        method: 'POST',
        path: 'auth/refresh',
        name: 'Refresh',
        requestBody: undefined,
      },
      {
        method: 'GET',
        path: 'auth/status',
        name: 'Status',
        requestBody: undefined,
      },
      {
        method: 'POST',
        path: 'users/register',
        name: 'Register',
        requestBody: {
          email: 'user5@example.com',
          password: 'Securepassword123!',
          name: 'John Doe',
          phone_number: '123-456-7890',
        },
      },
      {
        method: 'GET',
        path: 'users/profile',
        name: 'Profile',
        requestBody: undefined,
      },
    ];

    // Use Jest's expect function to assert the parsed endpoints against the expected ones
    expect(endpoints).toEqual(expectedEndpoints);
  });
});