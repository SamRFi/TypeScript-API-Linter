import { DeleteCategoryResponseBody, DeleteSubcategoryResponseBody, NewCategoryRequestBody, NewCategoryResponseBody, NewSubcategoryRequestBody, NewSubcategoryResponseBody, ProfileResponseBody, RegisterRequestBody, RegisterResponseBody, SignInRequestBody, UpdateCategoryRequestBody, UpdateCategoryResponseBody, UpdateSubcategoryRequestBody, UpdateSubcategoryResponseBody } from "../succeedingMockTypes/mockTypes";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/auth`;

/**
 * Custom hook for authentication-related functionality.
 * 
 * @returns An object containing the following properties:
 *   - isLoading: A boolean indicating whether an authentication request is currently in progress.
 *   - error: A string containing an error message if an authentication request failed, or null otherwise.
 *   - signIn: A function that sends a sign-in request to the server with the provided credentials.
 *   - signOut: A function that sends a sign-out request to the server.
 *   - refreshToken: A function that sends a refresh token request to the server to obtain a new access token.
 */
export const useAuth = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  /**
 * Sends a sign-in request to the server with the provided credentials.
 * 
 * @param signInData An object containing the user's email and password.
 * @returns A Promise that resolves to true if the sign-in request was successful, or false otherwise.
 * @throws An error if the server returns a non-200 status code.
 */
  const signIn = async (signInData: SignInRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signInData),
        credentials: 'include'
      });

      if (response.status === 401) {
        throw new Error('Invalid email or password');
      } else if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Sign-in successful, status:', response.status);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Sign-in failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
}

export const signOut = async (): Promise<any> => {
  const response = await fetch('https://example.com/auth/signout', {
    method: 'POST',
  });
  return response.json();
};

export const refresh = async (): Promise<any> => {
  const response = await fetch('https://example.com/auth/refresh', {
    method: 'POST',
  });
  return response.json();
};

export const status = async (): Promise<any> => {
  const response = await fetch('https://example.com/auth/status');
  return response.json();
};

// src/api/userEndpoints.ts

export const register = async (data: RegisterRequestBody): Promise<RegisterResponseBody> => {

  const response = await fetch('https://example.com/users/register', {
    method: 'POST', 
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return response.json();
};

export const profile = async (): Promise<ProfileResponseBody> => {
  const response = await fetch('https://example.com/users/profile');
  return response.json();
};

export const updateCategory = async (id: string, data: UpdateCategoryRequestBody): Promise<UpdateCategoryResponseBody> => {
  const response = await fetch(`https://example.com/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

export const deleteCategory = async (id: string): Promise<DeleteCategoryResponseBody> => {
  const response = await fetch(`https://example.com/categories/${id}`, {
    method: 'DELETE',
  });
  return response.json();
};

// src/api/subcategoryEndpoints.ts

export const newSubcategory = async (categoryId: string, data: NewSubcategoryRequestBody): Promise<NewSubcategoryResponseBody> => {
  const response = await fetch(`https://example.com/categories/${categoryId}/subcategories`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

export const updateSubcategory = async (id: string, data: UpdateSubcategoryRequestBody): Promise<UpdateSubcategoryResponseBody> => {
  const response = await fetch(`https://example.com/subcategories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

export const deleteSubcategory = async (id: string): Promise<DeleteSubcategoryResponseBody> => {
  const response = await fetch(`https://example.com/subcategories/${id}`, {
    method: 'DELETE',
  });
  return response.json();
};
  
export { fetchData };

  function useState<T>(arg0: boolean): [any, any] {
    throw new Error("Function not implemented.");
  }
  