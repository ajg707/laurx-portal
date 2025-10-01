async function testAdminAPI() {
  try {
    console.log('Testing admin API endpoint...');
    
    const response = await fetch('http://localhost:3001/api/admin/auth/request-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'mglynn@mylaurelrose.com'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const jsonData = JSON.parse(responseText);
        console.log('Parsed JSON:', jsonData);
      } catch (e) {
        console.log('Failed to parse as JSON:', e.message);
      }
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAdminAPI();
