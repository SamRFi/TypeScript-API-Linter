import { DeleteCategoryResponseBody, DeleteSubcategoryResponseBody, NewCategoryRequestBody, NewCategoryResponseBody, NewSubcategoryRequestBody, NewSubcategoryResponseBody, ProfileResponseBody, RegisterRequestBody, RegisterResponseBody, SignInRequestBody, UpdateCategoryRequestBody, UpdateCategoryResponseBody, UpdateSubcategoryRequestBody, UpdateSubcategoryResponseBody } from "../failingMockTypes/mockTypes";


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

// src/api/categoryEndpoints.ts

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

export { };
  