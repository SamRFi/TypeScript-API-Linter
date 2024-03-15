import { SignInRequestBody } from "../succeedingMockTypes/mockTypes";

async function fetchData() {
  const requestBody: SignInRequestBody = {
    email: 'user@example.com',
    password: 'password123',
    stay_logged_in: true,
  };

  const response = await fetch('https://example.com/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response.json();
}

export { fetchData };
  