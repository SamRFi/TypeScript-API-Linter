// tests/mockRequests.ts
async function fetchData() {
    const response = await fetch('https://example.com/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: 'test', password: 'test' }),
    });
  
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
  
    return response.json();
  }
  
  export { fetchData };
  