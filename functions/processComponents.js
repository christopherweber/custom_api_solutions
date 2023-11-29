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


async function updateStatusPage(newComponent, authToken, statusPageId) {
    try {
        console.log("Received statusPageId:", statusPageId);
        console.log("Received newComponent:", JSON.stringify(newComponent));

        if (!statusPageId) {
            throw new Error('Status Page ID is missing or undefined');
        }

        // Fetch the current status page data
        const getStatusPageUrl = `https://api.firehydrant.io/v1/nunc_connections/${statusPageId}`;
        console.log("Fetching current status page data from URL:", getStatusPageUrl);

        const response = await axios.get(getStatusPageUrl, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        let currentComponents = response.data.components || [];
        console.log("Current components:", JSON.stringify(currentComponents));

        // Check if the component already exists (based on some unique property, e.g., id)
        const existingComponentIndex = currentComponents.findIndex(comp => comp.id === newComponent.id);
        if (existingComponentIndex !== -1) {
            // Update the existing component
            currentComponents[existingComponentIndex] = newComponent;
            console.log("Updated an existing component.");
        } else {
            // Add the new component
            currentComponents.push(newComponent);
            console.log("Added a new component.");
        }

        // Update the status page with the new list of components
        const updateUrl = `https://api.firehydrant.io/v1/nunc_connections/${statusPageId}`;
        console.log("Updating status page with URL:", updateUrl);

        await axios.put(updateUrl, { components: currentComponents }, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log("Status page updated successfully.");

    } catch (error) {
        console.error('Error updating status page:', error);
        throw error;
    }
}
