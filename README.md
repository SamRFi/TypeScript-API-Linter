# How to use?
## Issues
Make sure the typescript files are compiled to javascript files.
```npx tsc src\cli\index.ts```  
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



## Install dependencies
```
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