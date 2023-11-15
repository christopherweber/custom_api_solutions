const axios = require('axios');

exports.handler = async (event) => {
    const authToken = event.queryStringParameters.authToken;

    if (!authToken) {
        return { 
            statusCode: 400, 
            body: JSON.stringify({ message: 'Missing authorization token' }) 
        };
    }

    try {
        const response = await axios.get('https://api.firehydrant.io/v1/functionalities', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return {
            statusCode: 200,
            body: JSON.stringify(response.data),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Set appropriate CORS headers
            }
        };
    } catch (error) {
        console.error('Error fetching functionalities:', error);
        return {
            statusCode: error.response ? error.response.status : 500,
            body: JSON.stringify({ message: 'Error fetching functionalities' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
