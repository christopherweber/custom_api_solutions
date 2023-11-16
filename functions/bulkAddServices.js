const axios = require('axios');

exports.handler = async (event) => {
    // Check if the method is POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { authToken, services } = JSON.parse(event.body);
        console.log("Received data:", { authToken, services });

        const responses = [];
        for (const service of services) {
            // Construct the payload with additional fields
            const payload = {
                name: service.name,
                description: service.description,
                alert_on_add: service.alertOnAdd,
                auto_add_responding_team: service.autoAddRespondingTeam,
                external_resources: [
                    {
                        remote_id: service.remoteId,
                        connection_type: service.connectionType
                    }
                ],
                // Set owner only if ownerId is provided
                owner: service.ownerId ? { id: service.ownerId } : null,
                // Include teams if teamsId is provided
                teams: service.teamsId ? [{ id: service.teamsId }] : [],
                // Include functionalities if provided
                functionalities: service.functionalities ? service.functionalities.map(f => ({ id: f.id })) : []
            };

            const response = await axios.post('https://api.firehydrant.io/v1/services', payload, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            responses.push(response.data);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Services created successfully', data: responses }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        console.error("Error occurred:", error);
        return {
            statusCode: error.response ? error.response.status : 500,
            body: JSON.stringify({ message: error.message, errorDetail: error.response ? error.response.data : null }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
