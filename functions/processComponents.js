const axios = require('axios');
const { parse } = require('csv-parse/sync');

const componentGroupsBaseUrl = 'https://api.firehydrant.io/v1/nunc_connections/';

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { csv, authToken, statusPageId, componentName, componentGroup } = JSON.parse(event.body);

    if (csv) {
        return processCSV(csv, authToken, statusPageId);
    } else if (componentName && componentGroup) {
        return processSingleComponent(componentName, componentGroup, authToken, statusPageId);
    } else {
        return { statusCode: 400, body: 'Invalid input data' };
    }
};

async function processSingleComponent(componentName, componentGroup, authToken, statusPageId) {
    try {
        const infrastructureId = await fetchInfrastructureId(componentName, authToken);
        const componentGroupId = await fetchComponentGroupId(componentGroup, authToken);

        if (infrastructureId && componentGroupId) {
            const component = {
                "infrastructure_type": "functionality",
                "infrastructure_id": infrastructureId,
                "component_group_id": componentGroupId
            };

            await updateStatusPage({id: statusPageId, components: [component]}, authToken);
            return { statusCode: 200, body: JSON.stringify({ message: 'Component processed successfully' }) };
        } else {
            return { statusCode: 404, body: 'Infrastructure or Component Group not found' };
        }
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
}


function processCSV(csv, authToken, statusPageId) {
    try {
        const records = parse(csv, {
            columns: true,
            skip_empty_lines: true
        });

        const processPromises = records.map(async (row) => {
            return processSingleComponent(row.Component, row['Component Group'], authToken, statusPageId);
        });

        return Promise.all(processPromises)
            .then(() => {
                return { statusCode: 200, body: JSON.stringify({ message: 'CSV processed successfully' }) };
            })
            .catch(error => {
                return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
            });
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Error processing CSV' }) };
    }
}

async function fetchInfrastructureId(name, authToken) {
    const infrastructuresUrl = 'https://api.firehydrant.io/v1/infrastructures'; // Define URL here
    try {
        const response = await axios.get(infrastructuresUrl, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const infrastructure = response.data.data.find(item => item.infrastructure.name === name);
        return infrastructure ? infrastructure.infrastructure.id : null;
    } catch (error) {
        console.error('Error fetching infrastructure ID:', error);
        throw error;
    }
}

async function fetchComponentGroupId(name, authToken, statusPageId) {
    const componentGroupsUrl = `${componentGroupsBaseUrl}${statusPageId}`; ; // Correct use of componentGroupsUrl
    try {
        const response = await axios.get(componentGroupsUrl, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const componentGroup = response.data.component_groups.find(group => group.name === name);
        return componentGroup ? componentGroup.id : null;
    } catch (error) {
        console.error('Error fetching component group ID:', error);
        throw error;
    }
}

async function updateStatusPage(payload, authToken) {
    try {
        const url = `https://api.firehydrant.io/v1/nunc_connections/${payload.id}`;
        await axios.put(url, payload, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
    } catch (error) {
        console.error('Error updating status:', error);
        throw error;
    }
}
