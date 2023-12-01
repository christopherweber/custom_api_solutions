const axios = require('axios');
const { parse } = require('csv-parse/sync');

const componentGroupsBaseUrl = 'https://api.firehydrant.io/v1/nunc_connections/';
const rateLimitDelay = 10000; // 10 seconds delay for rate limit retry

exports.handler = async function (event) {
    console.log('Received event:', event);

    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: 'Method Not Allowed' }) 
        };
    }

    const { csv, authToken, statusPageId, componentName, componentGroup } = JSON.parse(event.body);
    console.log('Parsed body:', { csv, authToken, statusPageId, componentName, componentGroup });

    if (!statusPageId) {
        return { 
            statusCode: 400, 
            body: JSON.stringify({ error: 'Status Page ID is missing' }) 
        };
    }

    try {
        let response;
        if (csv) {
            response = await processWithRetries(() => processCSV(csv, authToken, statusPageId));
        } else if (componentName && componentGroup) {
            response = await processWithRetries(() => processSingleComponent(componentName, componentGroup, authToken, statusPageId));
        } else {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: 'Invalid input data' }) 
            };
        }

        return response;
    } catch (error) {
        console.error('Error:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Internal Server Error' }) 
        };
    }
};

async function processWithRetries(processFunction, retries = 3) {
    try {
        return await processFunction();
    } catch (error) {
        if (retries > 0 && error.response && error.response.status === 429) {
            console.log("Rate limit reached. Retrying after delay...");
            await delay(rateLimitDelay);
            return processWithRetries(processFunction, retries - 1);
        }
        throw error; // Rethrow error if not a rate limit issue or retries exhausted
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

function chunkArray(array, chunkSize) {
    const chunkedArray = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunkedArray.push(array.slice(i, i + chunkSize));
    }
    return chunkedArray;
  }
  
  async function processCSV(csv, authToken, statusPageId) {
    try {
        const records = parse(csv, {
            columns: true,
            skip_empty_lines: true
        });

        if (records.length === 0) {
            throw new Error('CSV is empty');
        }

        const batchSize = calculateBatchSize(records.length);
        const batches = chunkArray(records, batchSize);
        let processedResults = [];

        for (let batch of batches) {
            const processPromises = batch.map(row => 
                processSingleComponent(row.Component, row['Component Group'], authToken, statusPageId)
            );

            let results = await Promise.allSettled(processPromises);
            processedResults.push(...results.map(result => {
                if (result.status === 'fulfilled' && result.value.statusCode === 200) {
                    return { status: 'fulfilled', value: JSON.parse(result.value.body) };
                } else if (result.status === 'fulfilled' && result.value.statusCode !== 200) {
                    return { status: 'rejected', reason: JSON.parse(result.value.body).error };
                } else if (result.status === 'rejected') {
                    return { status: 'rejected', reason: result.reason.message };
                }
            }));
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results: processedResults })
        };

    } catch (error) {
        console.error('Error processing CSV:', error);
        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ error: error.message }) 
        };
    }
}



  
  // Calculate the batch size based on the maximum execution time
  function calculateBatchSize(totalRecords) {
    return 50;
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

async function updateStatusPage(payload, authToken, statusPageId, retries = 3) {
  const getStatusPageUrl = `${componentGroupsBaseUrl}${statusPageId}`;
  const rateLimitDelay = 10000; // Delay in milliseconds (10 seconds)

  try {
      // Fetch current status page data
      const getResponse = await axios.get(getStatusPageUrl, {
          headers: { 'Authorization': `Bearer ${authToken}` }
      });

      let currentComponents = getResponse.data.components || [];
      const newComponents = payload.components;

      // Merge new components with existing ones
      newComponents.forEach(newComp => {
          const existingIndex = currentComponents.findIndex(c => c.infrastructure_id === newComp.infrastructure_id);
          if (existingIndex !== -1) {
              currentComponents[existingIndex] = newComp;
          } else {
              currentComponents.push(newComp);
          }
      });

      // Update the status page with merged components
      const updateResponse = await axios.put(getStatusPageUrl, { components: currentComponents }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
      });

      console.log("Status page updated successfully.");
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateResponse.data) };
  } catch (error) {
      // Handle rate limiting
      if (retries > 0 && error.response && error.response.status === 429) {
          console.log("Rate limit reached. Retrying after delay...");
          await new Promise(resolve => setTimeout(resolve, rateLimitDelay)); // Wait for the specified delay
          return updateStatusPage(payload, authToken, statusPageId, retries - 1); // Recursive call with decremented retries
      }
      console.error('Error updating status page:', error);
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to update status page' }) };
  }
}

