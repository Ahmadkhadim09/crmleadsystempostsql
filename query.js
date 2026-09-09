fetch('http://localhost:3000/api/test-flow')
    .then(res => res.json())
    .then(json => console.log('Result:', json))
    .catch(err => console.error('Error:', err));
