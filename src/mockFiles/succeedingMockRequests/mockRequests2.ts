import { CreateCategoryRequestBody } from "../succeedingMockTypes/mockTypes";; // Import the CreateCategoryRequestBody type

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;
/**
   * Creates a new category on the server.
   * @param category - The category data to create.
   * @returns Promise<void>
   */
const createCategory = useCallback(
    async (category: CreateCategoryRequestBody): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchWithRetry(`${BASE_URL}/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(category),
        });

        if (response.status !== 201) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle the response data
        console.log('Category created successfully');
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unexpected error occurred');
        }
        console.error('Failed to create category:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchWithRetry]
  );