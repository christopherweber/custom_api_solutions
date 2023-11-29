const axios = require('axios');
const { parse } = require('csv-parse/sync');

const componentGroupsBaseUrl = 'https://api.firehydrant.io/v1/nunc_connections/';

exports.handler = async function(event) {
    console.log('Received event:', event);

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { csv, authToken, statusPageId, componentName, componentGroup } = JSON.parse(event.body);
    console.log('Parsed body:', { csv, authToken, statusPageId, componentName, componentGroup });

    if (!statusPageId) {
        return { statusCode: 400, body: 'Status Page ID is missing' };
    }

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
        const componentGroupId = await fetchComponentGroupId(componentGroup, authToken, statusPageId);

        if (infrastructureId && componentGroupId) {
            const component = {
                "infrastructure_type": "functionality",
                "infrastructure_id": infrastructureId,
                "component_group_id": componentGroupId
            };

            return await updateStatusPage({ components: [component] }, authToken, statusPageId);
        } else {
            return { statusCode: 404, body: 'Infrastructure or Component Group not found' };
        }
    } catch (error) {
        console.error('Error in processSingleComponent:', error);
        throw error;
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
            .then(results => {
                return { statusCode: 200, body: JSON.stringify({ message: 'CSV processed successfully', results }) };
            })
            .catch(error => {
                console.error('Error in processCSV:', error);
                throw error;
            });
    } catch (error) {
        console.error('Error parsing CSV:', error);
        throw error;
    }
}

async function fetchInfrastructureId(name, authToken) {
    const infrastructuresUrl = 'https://api.firehydrant.io/v1/infrastructures';
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
    const componentGroupsUrl = `${componentGroupsBaseUrl}${statusPageId}`;
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

async function updateStatusPage(payload, authToken, statusPageId) {
    try {
        const getStatusPageUrl = `${componentGroupsBaseUrl}${statusPageId}`;
        console.log("URL " = getStatusPageUrl)
        const getResponse = await axios.get(getStatusPageUrl, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        let currentComponents = getResponse.data.components || [];
        const newComponents = payload.components;

        // Combine new components with current components
        newComponents.forEach(newComp => {
            const existingIndex = currentComponents.findIndex(c => c.infrastructure_id === newComp.infrastructure_id);
            if (existingIndex !== -1) {
                currentComponents[existingIndex] = newComp; // Update existing
            } else {
                currentComponents.push(newComp); // Add new
            }
        });

        const updateResponse = await axios.put(getStatusPageUrl, { components: currentComponents }, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        return { statusCode: 200, body: JSON.stringify({ message: 'Status page updated successfully', updateResponse: updateResponse.data }) };
    } catch (error) {
        console.error('Error updating status page:', error);
        throw error;
    }
}
