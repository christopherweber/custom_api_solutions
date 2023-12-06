document.addEventListener('DOMContentLoaded', function() {
    fetchSidebar();
    setupFormListener();
    attachCSVUploadListener();
});

document.getElementById('csv-instructions-link').addEventListener('click', function() {
    var instructions = document.querySelector('.instructions-container');
    instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
});

function attachCSVUploadListener() {
    const csvUploadInput = document.getElementById('csvFileUpload');
    const componentFieldsContainer = document.getElementById('componentFieldsContainer'); // Adjust the ID to match your form
    const csvUploadMessage = document.getElementById('csvUploadMessage'); // Ensure you have a span/div for this message

    csvUploadInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            componentFieldsContainer.style.display = 'none'; // Hide the component fields
            csvUploadMessage.textContent = 'CSV file uploaded successfully.';
            csvUploadMessage.style.display = 'block'; // Show the message
            document.getElementById('optionalCsvText').style.display = 'none';

        } else {
            componentFieldsContainer.style.display = ''; // Show the component fields
            csvUploadMessage.style.display = 'none'; // Hide the message
        }
    });
}

function fetchSidebar() {
    fetch('../sidebar.html')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
    })
    .then(data => {
        document.getElementById('sidebar-placeholder').innerHTML = data;
    })
    .catch(error => console.error('Error loading the sidebar:', error));
}

function setupFormListener() {
    const form = document.getElementById('componentForm');
    form.addEventListener('submit', handleSubmit);
}

function handleSubmit(e) {
    e.preventDefault();

    const authToken = document.getElementById('authToken').value;
    const statusPageId = document.getElementById('statusPageId').value;
    const componentName = document.getElementById('componentName').value;
    const componentGroup = document.getElementById('componentGroup').value;
    const csvFile = document.getElementById('csvFileUpload').files[0];

    const data = { authToken, statusPageId };

    if (csvFile) {
        handleCSVUpload(csvFile, data);
    } else if (componentName && componentGroup) {
        data.componentName = componentName;
        data.componentGroup = componentGroup;
        sendDataToBackend(data);
    } else {
        alert('Please enter component details or upload a CSV file.');
    }
}

function handleCSVUpload(file, data) {
    const reader = new FileReader();
    reader.onload = function(event) {
        data.csv = event.target.result;
        console.log(`CSV content being sent: ${data.csv}`); // Log the CSV content to be sure it's complete
        sendDataToBackend(data);
    };
    reader.onerror = function(error) {
        console.log('Error reading CSV:', error);
        alert('Failed to read the CSV file.');
    };
    reader.readAsText(file);
}

function sendDataToBackend(data) {
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessageDiv = document.getElementById('errorMessage'); // Get the error message div
    loadingMessage.style.display = 'block';

    console.log('Sending data to backend:', JSON.stringify(data)); // Log the data being sent

    fetch('/.netlify/functions/processComponents', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) {
            // If response is not OK, parse the response and extract error messages
            return response.json().then(data => {
                console.log('Error response from server:', data); // Log the error response
                throw new Error(data.error || 'No response from server or malformed response.');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Response data from server:', data); // Log the full response data
        loadingMessage.style.display = 'none';

        if (data && data.results) {
            let errors = data.results
                .filter(result => result.status === 'rejected')
                .map(result => result.reason);

            if (errors.length > 0) {
                displayErrorMessage(`Errors: ${errors.join(', ')}`);
            } else {
                errorMessageDiv.style.display = 'none'; // Hide the error message div on success
                alert(`Components processed successfully`);
                resetForm();
            }
        } else {
            alert('No response from server or malformed response.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        displayErrorMessage(error.message);
    });
}

document.getElementById('btnNodeJs').addEventListener('click', function() {
    updateCodeSnippets();
    showNodeJsSnippet();
  });
  
  document.getElementById('btnPython').addEventListener('click', function() {
    updateCodeSnippets();
    showPythonSnippet();
  });
  
//   function showNodeJsSnippet() {
//     document.getElementById('nodeJsSnippetContainer').style.display = 'block';
//     document.getElementById('pythonSnippetContainer').style.display = 'none';
//   }
  
//   function showPythonSnippet() {
//     document.getElementById('nodeJsSnippetContainer').style.display = 'none';
//     document.getElementById('pythonSnippetContainer').style.display = 'block';
//   }

  function updateCodeSnippets() {
    const authToken = document.getElementById('apiKey').value;
  
    const nodeSnippet = `const axios = require('axios');
const { parse } = require('csv-parse/sync');
const fs = require('fs');

const componentGroupsBaseUrl = 'https://api.firehydrant.io/v1/nunc_connections/';
const authToken = 'fhb-6f53d1222c451f55cb842d41f743fd60';
const statusPageId = '300ad72c-d82c-432c-a899-f6b4ed3e5824';
const csvFilePath = 'functionalities(80)copy.csv';

const csvData = fs.readFileSync(csvFilePath, 'utf8');

async function main() {
  try {
    console.log('Processing CSV data');
    let response = await processCSV(csvData, authToken, statusPageId);
    console.log('CSV processed', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

async function processSingleComponent(componentName, componentGroup, authToken, statusPageId) {
  console.log('Processing single component:', componentName, componentGroup);
  try {
    const infrastructureId = await fetchInfrastructureId(componentName, authToken);
    const componentGroupId = await fetchComponentGroupId(componentGroup, authToken, statusPageId);

    if (!infrastructureId) {
      throw new Error(\`Infrastructure '\${componentName}' not found.\`);
    }
    if (!componentGroupId) {
      throw new Error(\`Component Group '\${componentGroup}' not found.\`);
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
  console.log('Starting CSV processing');
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

function calculateBatchSize(totalRecords) {
  return 50; // Adjust this value based on your specific requirements
}

async function fetchInfrastructureId(name, authToken) {
  const baseUrl = 'https://api.firehydrant.io/v1/infrastructures';
  let currentPage = 1;
  let totalInfrastructuresProcessed = 0;

  try {
    while (true) {
      const url = \`\${baseUrl}?page=\${currentPage}\`;
      const response = await axios.get(url, {
        headers: { 'Authorization': \`Bearer \${authToken}\` }
      });

      const infrastructures = response.data.data;
      totalInfrastructuresProcessed += infrastructures.length;

      const infrastructure = infrastructures.find(item => item.infrastructure.name === name);
      if (infrastructure) {
        return infrastructure.infrastructure.id;
      }

      if (infrastructures.length < 20) {
        return null;
      }

      currentPage++;
    }
  } catch (error) {
    console.error('Error fetching infrastructure ID:', error);
    throw error;
  }
}

async function fetchComponentGroupId(name, authToken, statusPageId) {
  const componentGroupsUrl = \`\${componentGroupsBaseUrl}\${statusPageId}\`;
  try {
    const response = await axios.get(componentGroupsUrl, {
      headers: { 'Authorization': \`Bearer \${authToken}\` }
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
    const getStatusPageUrl = \`\${componentGroupsBaseUrl}\${statusPageId}\`;

    const getResponse = await axios.get(getStatusPageUrl, {
      headers: { 'Authorization': \`Bearer \${authToken}\` }
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

    const updateResponse = await axios.put(getStatusPageUrl, { components: currentComponents }, {
      headers: { 'Authorization': \`Bearer \${authToken}\` }
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Status page updated successfully', updateResponse: updateResponse.data }) };
  } catch (error) {
    console.error('Error updating status page:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Failed to update status page' }) };
  }
}

main();`;

const nodeJsSnippetContainer = document.getElementById('codeSnippetNodeJs');
if (nodeJsSnippetContainer) {
    nodeJsSnippetContainer.textContent = nodeSnippet;
} else {
    console.error('Node.js snippet container not found');
}
  }

document.getElementById('apiKey').addEventListener('input', updateCodeSnippets);
document.addEventListener('DOMContentLoaded', updateCodeSnippets);

async function copyToClipboard(elementId) {
  const snippetText = document.getElementById(elementId).textContent;
  try {
    await navigator.clipboard.writeText(snippetText);
    console.log('Text copied:', snippetText); // Debugging log

    const copyMsg = document.getElementById('copyMessage');
    if (!copyMsg) {
      console.error('copyMessage element not found');
      return;
    }

    copyMsg.textContent = 'Code snippet copied to clipboard!';
    copyMsg.style.display = 'block';

    setTimeout(() => {
      copyMsg.style.display = 'none';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}
  

function displayErrorMessage(message) {
    const errorMessageDiv = document.getElementById('errorMessage');
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
}

function resetForm() {
    document.getElementById('componentForm').reset();
    document.getElementById('componentFieldsContainer').style.display = '';
    document.getElementById('csvUploadMessage').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    attachFormSubmitListener();
    updateCodeSnippets(); //
  });