document.addEventListener('DOMContentLoaded', () => {
  fetch('../sidebar.html') // Make sure the path to sidebar.html is correct
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      document.getElementById('sidebar-placeholder').innerHTML = data;
      // Ensure the form is present in the sidebar HTML
      // Then attach the event listener to the form
      attachFormSubmitListener();
    })
    .catch(error => console.error('Error loading the sidebar:', error));
});

function attachFormSubmitListener() {
  // Now we select the form within this function to ensure it is defined
  const form = document.getElementById('apiKeyForm');
  if (!form) {
    console.error('Form not found.');
    return;
  }
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const confirmation = confirm("Are you sure you want to submit?");
    if (!confirmation) {
      return;
    }
    const apiKey = document.getElementById('apiKey').value;

    // Update the path to match your Netlify functions endpoint
    fetch('/.netlify/functions/updateIncidentTypes', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
      return response.json();
    })
    .then(data => {
      alert(data.message);
    })
    .catch(error => {
      alert(`An error occurred: ${error.message}`);
      console.error('Update failed:', error);
    });
  });
}

// Existing JavaScript code

// Event listeners and functions for the code snippets toggle box
document.getElementById('btnNodeJs').addEventListener('click', function() {
  updateCodeSnippets();
  showNodeJsSnippet();
});

document.getElementById('btnPython').addEventListener('click', function() {
  updateCodeSnippets();
  showPythonSnippet();
});

function showNodeJsSnippet() {
  document.getElementById('nodeJsSnippetContainer').style.display = 'block';
  document.getElementById('pythonSnippetContainer').style.display = 'none';
}

function showPythonSnippet() {
  document.getElementById('nodeJsSnippetContainer').style.display = 'none';
  document.getElementById('pythonSnippetContainer').style.display = 'block';
}

function updateCodeSnippets() {
  const authToken = document.getElementById('apiKey').value;

  const nodeSnippet = `const axios = require('axios');
  const fs = require('fs').promises;
  
  const apiEndpoint = 'https://api.firehydrant.io/v1';
  const fhBotToken = '${authToken}'
  
  async function getIncidentTypesRemovePriority() {
    try {
      const response = await axios.get(\`\${apiEndpoint}/incident_types\`, {
        headers: {
          Authorization: \`Bearer \ fhBotToken\`,
        },
      });
  
      const newIncidentTypesWithoutPriority = response.data.data.map(({ priority, ...rest }) => rest);
  
      await fs.writeFile('incidentTypes.json', JSON.stringify(newIncidentTypesWithoutPriority, null, 2));
      console.log('Incident types without priority saved to file.');
  
      return newIncidentTypesWithoutPriority;
    } catch (error) {
      console.error('Error fetching incident types:', error.message);
      return null;
    }
  }
  
  async function updateIncidentTypes() {
    try {
      const incidentTypes = await fs.readFile('./incidentTypes.json', 'utf8');
      const parsedIncidentTypes = JSON.parse(incidentTypes);
  
      for (const incidentType of parsedIncidentTypes) {
        const { id, template, ...rest } = incidentType;
        const updatedIncidentType = { ...rest, template: { ...template, priority: undefined } };
  
        await axios.patch(\`\${apiEndpoint}/incident_types/\${id}\`, updatedIncidentType, {
          headers: {
            Authorization: \`Bearer \ fhBotToken\`,
          },
        });
  
        console.log(\`Updated incident type with ID: \${id}\`);
      }
    } catch (error) {
      console.error('Error updating incident types:', error.message);
    }
  }
  
  getIncidentTypesRemovePriority()
    .then(updateIncidentTypes)
    .catch(error => console.error('An error occurred:', error.message));`;
  
    const pythonSnippet = `import requests
    import json
    
    api_endpoint = 'https://api.firehydrant.io/v1'
    fh_bot_token = '${authToken}'
    
    def get_incident_types_remove_priority():
        try:
            response = requests.get(f'{api_endpoint}/incident_types', headers={'Authorization': f'Bearer {fh_bot_token}'})
            response.raise_for_status()
    
            new_incident_types_without_priority = [{key: value for key, value in incident_type.items() if key != 'priority'} for incident_type in response.json()['data']]
    
            with open('incidentTypes.json', 'w') as file:
                json.dump(new_incident_types_without_priority, file, indent=2)
            print('Incident types without priority saved to file.')
    
            return new_incident_types_without_priority
        except requests.RequestException as error:
            print('Error fetching incident types:', error)
            return None
    
    def update_incident_types():
        try:
            with open('incidentTypes.json', 'r') as file:
                incident_types = json.load(file)
    
            for incident_type in incident_types:
                incident_type_id = incident_type['id']
                if 'template' in incident_type and 'priority' in incident_type['template']:
                    del incident_type['template']['priority']
    
                response = requests.patch(f'{api_endpoint}/incident_types/{incident_type_id}', json=incident_type, headers={'Authorization': f'Bearer {fh_bot_token}'})
                response.raise_for_status()
    
                print(f'Updated incident type with ID: {incident_type_id}')
        except requests.RequestException as error:
            print('Error updating incident types:', error)
    
    get_incident_types_remove_priority()
    update_incident_types()`;
    

  document.getElementById('codeSnippetNodeJs').textContent = nodeSnippet;
  document.getElementById('codeSnippetPython').textContent = pythonSnippet;
}


document.getElementById('apiKey').addEventListener('input', updateCodeSnippets);
document.addEventListener('DOMContentLoaded', updateCodeSnippets);

function copyToClipboard(id) {
  const text = document.getElementById(id).innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard!');
  }).catch(err => {
    console.error('Error in copying text: ', err);
  });
}

// Ensure this function is called when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  attachFormSubmitListener();
  updateCodeSnippets(); // Initialize code snippets
});