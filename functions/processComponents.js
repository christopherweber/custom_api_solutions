const axios = require('axios');
const { parse } = require('csv-parse/sync');

const componentGroupsBaseUrl = 'https://api.firehydrant.io/v1/nunc_connections/';

exports.handler = async function (event) {
  console.log('Received event:', event);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { csv, authToken, statusPageId, componentName, componentGroup, batchIndex } = JSON.parse(event.body);
  console.log('Parsed body:', { csv, authToken, statusPageId, componentName, componentGroup, batchIndex });

  if (!statusPageId) {
    return { statusCode: 400, body: 'Status Page ID is missing' };
  }

  if (csv) {
    return processCSV(csv, authToken, statusPageId, batchIndex);
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

    if (!infrastructureId) {
      throw new Error(`Infrastructure '${componentName}' not found.`);
    }
    if (!componentGroupId) {
      throw new Error(`Component Group '${componentGroup}' not found.`);
    }

    const component = {
      "infrastructure_type": "functionality",
      "infrastructure_id": infrastructureId,
      "component_group_id": componentGroupId
    };

    return await updateStatusPage({ components: [component] }, authToken, statusPageId);
  } catch (error) {
    console.error('Error in processSingleComponent:', error);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
}

async function processCSV(csv, authToken, statusPageId, batchIndex) {
  try {
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true
    });

    console.log(`Parsed CSV records: ${JSON.stringify(records)}`);

    const batchSize = 100; // Set an appropriate batch size
    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, records.length);
    const batchRecords = records.slice(start, end);

    const processPromises = batchRecords.map((row, index) =>
      new Promise(resolve => setTimeout(resolve, index * 1000))
        .then(() => processSingleComponent(row.Component, row['Component Group'], authToken, statusPageId))
    );

    return Promise.allSettled(processPromises)
      .then(results => {
        const successfulResults = results.filter(result => result.status === 'fulfilled');
        const errors = results.filter(result => result.status === 'rejected').map(result => result.reason);
        if (errors.length > 0) {
          return { statusCode: 207, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Some components failed to process', successfulResults, errors }) };
        }
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'CSV processed successfully', results: successfulResults }) };
      });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to parse CSV' }) };
  }
}

async function fetchInfrastructureId(name, authToken) {
  const baseUrl = 'https://api.firehydrant.io/v1/infrastructures';
  let currentPage = 1;
  let totalInfrastructuresProcessed = 0;

  try {
    while (true) {
      const url = `${baseUrl}?page=${currentPage}`;
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const infrastructures = response.data.data;
      totalInfrastructuresProcessed += infrastructures.length;
      console.log(`Page ${currentPage}: Retrieved ${infrastructures.length} infrastructures (Total processed: ${totalInfrastructuresProcessed})`);

      const infrastructure = infrastructures.find(item => item.infrastructure.name === name);
      if (infrastructure) {
        console.log(`Found infrastructure: ${JSON.stringify(infrastructure)}`);
        return infrastructure.infrastructure.id;
      }

      // Check if there are more pages to fetch
      if (infrastructures.length < 20) {
        console.log(`No more pages to fetch. Total infrastructures checked: ${totalInfrastructuresProcessed}. Infrastructure with name '${name}' not found.`);
        return null;
      }

      // Move to the next page
      currentPage++;
    }
  } catch (error) {
    console.error('Error fetching infrastructure ID:', error);
    throw error;
  }
}

async function fetchComponentGroupId(name, authToken, statusPageId) {
  const componentGroupsUrl = `${componentGroupsBaseUrl}${statusPageId}`;
  console.log("URL in FetchComp" + componentGroupsUrl)
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
    console.log("Fetching current status page data from URL:", getStatusPageUrl);

    const getResponse = await axios.get(getStatusPageUrl, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    let currentComponents = getResponse.data.components || [];
    const newComponents = payload.components;

    newComponents.forEach(newComp => {
      const existingIndex = currentComponents.findIndex(c => c.infrastructure_id === newComp.infrastructure_id);
      if (existingIndex !== -1) {
        currentComponents[existingIndex] = newComp;
      } else {
        currentComponents.push(newComp);
      }
    });

    console.log("Updating status page with new component list.");
    const updateResponse = await axios.put(getStatusPageUrl, { components: currentComponents }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log("Status page updated successfully.");
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Status page updated successfully', updateResponse: updateResponse.data }) };
  } catch (error) {
    console.error('Error updating status page:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to update status page' }) }; // Changed to return an error response
  }
}
