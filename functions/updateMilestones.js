const https = require('https');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { authToken, startingMilestone, targetMilestone } = JSON.parse(event.body);

        if (!authToken || !startingMilestone || !targetMilestone) {
            return { statusCode: 400, body: 'Missing required fields' };
        }

        console.log(`Updating from ${startingMilestone} to ${targetMilestone} with token: ${authToken}`);

        const apiResponse = await yourApiRequestFunction();
        console.log('API Response:', apiResponse);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Milestones updated successfully' })
        };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: `Server Error: ${error.message}` };
    }
};
