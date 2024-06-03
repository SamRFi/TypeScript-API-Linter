# Typescript Fetch API Linter
Welcome to the TypeScript API Linter! This tool is designed to enhance API synchronization between frontend and backend components in TypeScript projects. By leveraging static analysis, the linter checks for routes (URIs), request methods, request body objects and their properties, and response objects and their properties. It ensures that your TypeScript code adheres to the defined API specifications by comparing it against the Postman collection JSON export. If there are discrepancies, the linter provides feedback to help you maintain consistency, prevent bugs, and streamline API integration. Whether you're working on a small project or a complex microservice architecture, this linter is here to ensure your APIs are correctly implemented and aligned.

## Setup

### Prerequisites
- Ensure you have Node.js and npm installed. You can download and install them from [Node.js official website](https://nodejs.org/).

### Install dependencies
Run the following command to install all necessary dependencies:
```sh
npm install
```

## Running the Application

To run the TypeScript API Linter, use the following command:
```
typescript-api-linter -r <request_files_directory> -t <type_files_directory> -c <postman_collection_file>
```
Replace `<request_files_directory>` with the path to your TypeScript files containing API requests, `<type_files_directory>` with the path to your TypeScript files containing type definitions, and `<postman_collection_file>` with the path to your Postman collection file.

### Running Tests

To run the tests, execute:
```
npm test
```
Note: The TypeScript API Linter only works with the Fetch API.

## Issues
Make sure the typescript files are compiled to javascript files.
```npx tsc src\cli\index.ts```  
(or just run ```npm test``` and the files will be compiled automatically)
### Known Issue with parsing URLs enclosed in backticks

Due to a specific behavior in our TypeScript setup, fetch calls with URLs defined as plain string literals (enclosed in backticks but without any embedded expressions) are not correctly parsed by our custom linter. This issue arises because our parsing logic explicitly looks for template expressions to process URLs between backticks, which leads to plain string literals being overlooked.

#### Example:
This will get parsed without problem:
```typescript
fetch(`https://example.com/api/data/${id}`, { method: 'GET' });
```
But this will **not** get parsed:
```typescript
fetch(`https://example.com/api/data`, { method: 'GET' });
```
#### Current Workaround
You can simply modify it to use ``` " " ``` or ``` ' ' ``` instead of ``` ` ` ```:
```typescript
fetch("https://example.com/api/data", { method: 'GET' });
```
Since no template expressions are present in the URL, this change will not affect your functionality logic but will ensure that the fetch call is correctly parsed by our linter.

# Examples of supported typescript requests and types
The examples provided below are not exhaustive, but they should give you a good idea of the types of requests and types that the linter can handle.

**Supported Request Methods**

The linter supports all standard HTTP request methods, including but not limited to:

* GET
* POST
* PUT
* DELETE
* PATCH
* HEAD
* OPTIONS

**Request Body Types**

The linter supports request bodies with defined types, such as:

```typescript
export interface CreateUserRequestBody {
  name: string;
  email: string;
  password: string;
}

const createUser = async (userData: CreateUserRequestBody): Promise<void> => {
  // ...
  const response = await fetch('/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  // ...
}
```
**Wrapped Request Types**

The linter can also find request types even if they are wrapped within another type. For example:

```typescript
export interface RequestData<T> {
  data: T;
}

export interface CreateUserRequestBody {
  name: string;
  email: string;
  password: string;
}

const createUser = async (requestData: RequestData<CreateUserRequestBody>): Promise<void> => {
  // ...
  const response = await fetch('/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData.data),
  });
  // ...
}
```
In this example, the linter will still find the `CreateUserRequestBody` type even though it is wrapped within the `RequestData` type.

**Nested Types**

If you use a defined type within another type, the linter will also check and lint the nested type. For example:

```typescript
export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface CreateUserRequestBody {
  name: string;
  email: string;
  password: string;
  address: Address;
}
```
In this example, the linter will check that the `address` property of the `CreateUserRequestBody` type conforms to the `Address` type.

**Array Types**

The linter also supports array types, such as:

```typescript
export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface CreateOrderRequestBody {
  products: Product[];
}
```
In this example, the linter will check that the `products` property of the `CreateOrderRequestBody` type is an array of `Product` objects.

**Type Definitions**

The linter supports type definitions for request bodies, including interfaces, types, and enums. For example:

```typescript
export enum UserRole {
  ADMIN,
  USER,
  GUEST,
}

export interface CreateUserRequestBody {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}
```
In this example, the linter will check that the `role` property of the `CreateUserRequestBody` type conforms to the `UserRole` enum.

**Function Return Types**

The linter can also find request types even if they are defined as function return types. For example:

```typescript
export interface CreateUserRequestBody {
  name: string;
  email: string;
  password: string;
}

const getCreateUserRequestBody = (): CreateUserRequestBody => {
  return {
    name: 'John Doe',
    email: 'johndoe@example.com',
    password: 'password123',
  };
}

const createUser = async (): Promise<void> => {
  const userData = getCreateUserRequestBody();
  // ...
  const response = await fetch('/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  // ...
}
```
In this example, the linter will still find the `CreateUserRequestBody` type even though it is defined as the return type of a function.

By using defined types for request bodies, you can ensure that your API requests are correctly formatted and reduce errors. The linter will check that the request body conforms to the defined type, including nested types, array types, and wrapped types.


**Handling Arrays of JSON Objects in Request Bodies**

The linter is equipped to handle request bodies that are arrays of JSON objects, ensuring that each object in the array adheres to the specified type. This feature is crucial for endpoints that accept bulk operations or multiple records in a single request.

```typescript
export const updateMultipleUsers = async (users: UserUpdate[]): Promise<void> => {
  const response = await fetch('https://example.com/users/bulk-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(users),
  });
};

export interface UserUpdate {
  userId: string;
  updates: {
    name?: string;
    email?: string;
  };
}
```

In this example, the linter will check that the `users` property of the `updateMultipleUsers` function is an array of `UserUpdate` objects, ensuring that the data structure sent to the server is correctly formatted.

**Handling Response Types for HTTP Status 200 and 201**

The linter can also validate that the response types for HTTP status codes 200 (OK) and 201 (Created) match the expected types declared in the Promise of the response. This ensures that the API responses are correctly handled based on their success status codes.

```typescript
export const createUser = async (userData: CreateUserRequestBody): Promise<UserDetails> => {
  const response = await fetch('https://example.com/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  if (response.status === 201) {
    return response.json();
  } else {
    throw new Error('Failed to create user');
  }
};

export interface UserDetails {
  userId: string;
  name: string;
  email: string;
}
```

In this example, the linter ensures that the response for a 201 status code correctly matches the `UserDetails` type expected in the Promise.

**Handling Complex Response Types with Limitations**

The linter supports complex response types, including cases where the response is a union of different types or when the response type is wrapped in TypeScript utility types such as `Readonly`. However, it's crucial to note a significant limitation in how the linter processes these types. When dealing with a union of types, the linter will only consider the first type in the union for linting purposes. This behavior means that developers should carefully order their types in a union, keeping in mind that only the first one will be validated by the linter.

### Disclaimer

When a response type is defined as a union of multiple types, the linter will unwrap the response and only lint against the first type specified in the union. This limitation should be taken into account when designing your API interactions and response handling logic.

```typescript
export const fetchUserData = async (): Promise<Readonly<UserDataResponseBody | ErrorResponse>> => {
  const response = await fetch('https://example.com/users/data');
  if (!response.ok) {
    return { error: 'Failed to fetch user data', statusCode: response.status };
  }
  return response.json();
};

export interface UserDataResponseBody {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface ErrorResponse {
  error: string;
  statusCode: number;
}
```

**Defining Base URLs**

You can define base URLs for your API requests using a variable, and the linter will still be able to parse the requests correctly. For example:

```typescript
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/auth`;

// ...

const signIn = async (signInData: SignInRequestBody): Promise<boolean> => {
  // ...
  const response = await fetch(`${BASE_URL}/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(signInData),
    credentials: 'include'
  });
  // ...
}
```
The linter will extract the base URL and the path from the `fetch` call, and use it to construct the full URL of the request.

**Multiple Files with Different Base URLs**

You can have multiple files with different base URLs defined, and the linter will parse them correctly. For example, you can have one file with a base URL for authentication endpoints:

```typescript
// auth.ts
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/auth`;

// ...
```
And another file with a base URL for category endpoints:

```typescript
// categories.ts
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/categories`;

// ...
```
The linter will parse each file separately and extract the correct base URL and path for each request, even if they are defined in different files. This allows you to organize your code into separate files for different domains or features, while still benefiting from the linter's ability to check and validate your API requests.

# Contributions
If you are interested in contributing to the TypeScript API Linter, please post a thread in the discussion section to notify the maintainers. We will then take steps to set up the contribution system on GitHub.