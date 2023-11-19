const https = require('https');

const milestonesSequence = [
    "started",
    "detected",
    "acknowledged",
    "investigating",
    "identified",
    "mitigated",
    "resolved",
    "postmortem_started",
    "postmortem_completed"
];

const makeHttpsRequest = (options, postData) => {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(responseBody));
                } else {
                    reject(new Error(`Request failed. Status: ${res.statusCode}, Body: ${responseBody}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (postData) {
            req.write(postData);
        }

        req.end();
    });
};

const fetchIncidents = async (authToken, milestone) => {
    const options = {
        host: 'api.firehydrant.io',
        path: `/v1/incidents?current_milestones=${milestone}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    };

    try {
        const response = await makeHttpsRequest(options);
        console.log("API response for fetching incidents:", response);

        // Adjust the line below based on the actual response structure
        const incidents = response.data || []; // Example - adjust based on actual API response

        if (!Array.isArray(incidents)) {
            throw new Error("Fetched data is not iterable. Expected an array of incidents.");
        }

        return incidents;
    } catch (error) {
        console.error("Error fetching incidents:", error);
        throw error;
    }
};

const updateIncidentMilestone = async (authToken, incidentId, milestone) => {
    const options = {
        host: 'api.firehydrant.io',
        path: `/v1/incidents/${incidentId}/milestones/bulk_update`,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }

    };

    const postData = JSON.stringify({
        "bulk": "true",
        "milestones": [
            {
                "type": milestone,
                "occurred_at": new Date().toISOString()
            }
        ]
    });

    return makeHttpsRequest(options, postData);
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { authToken, startingMilestone, targetMilestone } = JSON.parse(event.body);

        if (!authToken || !startingMilestone || !targetMilestone) {
            return { statusCode: 400, body: 'Missing required fields' };
        }

        const incidents = await fetchIncidents(authToken, startingMilestone);

        if (!Array.isArray(incidents)) {
            throw new Error("Fetched data is not iterable. Expected an array of incidents.");
        }

        for (const incident of incidents) {
            let currentMilestoneIndex = milestonesSequence.indexOf(incident.current_milestone);
            let targetIndex = milestonesSequence.indexOf(targetMilestone);

            while (currentMilestoneIndex < targetIndex) {
                const nextMilestone = milestonesSequence[currentMilestoneIndex + 1];
                await updateIncidentMilestone(authToken, incident.id, nextMilestone);
                currentMilestoneIndex++;
            }
        }

        return { statusCode: 200, body: JSON.stringify({ message: 'All incidents have been processed.' }) };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: JSON.stringify({ message: `Server Error: ${error.message}` }) };
    }
};
