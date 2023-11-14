const axios = require('axios');

exports.handler = async (event) => {
    // Check if the method is POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { authToken, services } = JSON.parse(event.body);

        // Log the received data for debugging
        console.log("Received data:", { authToken, services });

        const responses = [];
        for (const service of services) {
            const payload = {
                name: service.name,
                owner: null,
                external_resources: [
                    {
                        remote_id: service.remoteId,
                        connection_type: service.connectionType
                    }
                ]
                // Add other fields as necessary
            };

            const response = await axios.post('https://api.firehydrant.io/v1/services', payload, {
                headers: { 'Authorization': `Bearer ${authToken}` } // Use the single authToken for all requests
            });

            responses.push(response.data);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Services created successfully', data: responses }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        // Log the error for debugging
        console.error("Error occurred:", error);

        return {
            statusCode: error.response ? error.response.status : 500,
            body: JSON.stringify({ message: error.message }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
