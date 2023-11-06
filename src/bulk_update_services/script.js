// Fetch and insert the sidebar content
fetch('../sidebar.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('sidebar-placeholder').innerHTML = data;
  })
  .catch(error => console.error('Error loading the sidebar:', error));

// Event listener for the form submission
document.getElementById('bulkUpdateForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const authToken = document.getElementById('authToken').value;
    // Parse the boolean values directly from the form inputs
    const autoAlert = document.getElementById('autoAlert').checked;
    const autoAdd = document.getElementById('autoAdd').checked;

    try {
        const response = await fetch('/.netlify/functions/updateServices', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ authToken, autoAlert, autoAdd })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            alert('Services updated successfully!');
            document.getElementById('authToken').value = ''; // Clear the authorization field
        } else {
            alert('Error updating services: ' + result.error);
        }
    } catch (error) {
        console.error('Error while sending request to backend:', error);
        alert('Failed to update services. Check the console for more information.');
    }

    // Update code snippets after submission
    updateCodeSnippets();
});

// Toggle the expandable fields
function toggleExpandableFields() {
    const fields = document.querySelector('.expandable-field .fields');
    fields.style.display = fields.style.display === 'none' ? 'block' : 'none';
}

// Event listeners and functions for the code snippets toggle box
document.getElementById('btnNodeJs').addEventListener('click', function() {
  updateCodeSnippets();
  toggleCodeSnippet('codeSnippetNodeJs');
});

document.getElementById('btnPython').addEventListener('click', function() {
  updateCodeSnippets();
  toggleCodeSnippet('codeSnippetPython');
});

function toggleCodeSnippet(id) {
  document.querySelectorAll('.code-snippet').forEach(function(snippet) {
    snippet.style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
}

function updateCodeSnippets() {
    // Fetch values from the form elements
    const authToken = document.getElementById('authToken').value;
    // Since autoAlert and autoAdd are now selects, we use .value
    const autoAlert = document.getElementById('autoAlert').value === 'true';
    const autoAdd = document.getElementById('autoAdd').value === 'true';
  
    const nodeSnippet = `const axios = require('axios');
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Function to prompt for user input
    function prompt(query) {
      return new Promise((resolve) => {
        readline.question(query, resolve);
      });
    }
    
    async function updateServices() {
      // These values are dynamically set from the form inputs
      const authToken = '${authToken}';
      const autoAlert = ${autoAlert === 'true'};
      const autoAdd = ${autoAdd === 'true'};
    
      // Rest of the Node.js code
      try {
        const apiEndpoint = 'https://api.firehydrant.io/v1/services';
        const bearerToken = \`Bearer \${authToken}\`;
    
        const servicesResponse = await axios.get(apiEndpoint, {
          headers: { Authorization: bearerToken }
        });
        console.log('Services response data:', servicesResponse.data);
        
        const services = servicesResponse.data.data; 
        if (!Array.isArray(services)) {
          throw new Error('Expected services to be an array');
        }
    
        const updatePromises = services.map(service =>
          axios.patch(\`\${apiEndpoint}/\${service.id}\`, {
            alert_on_add: autoAlert,
            auto_add_responding_team: autoAdd
          }, {
            headers: { Authorization: bearerToken }
          })
        );
    
        const results = await Promise.allSettled(updatePromises);
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            console.log('Update success for service:', result.value.data);
          } else {
            console.error('Update failed for service:', result.reason);
          }
        });
    
        const successes = results.filter(result => result.status === 'fulfilled');
        console.log(\`Services updated successfully: \${successes.length}\`);
        
      } catch (error) {
        console.error('Error details:', error.response?.data || error.message);
      } finally {
        readline.close();
      }
    }
    
    updateServices();`;
  
    // Update Node.js snippet
    document.getElementById('codeSnippetNodeJs').textContent = nodeSnippet;
    
    // If you have a Python snippet that needs updating, add similar logic for it here
    // ...
  
  }
  
  // Event listeners for form elements to update the code snippets as the user interacts with the form
  document.getElementById('authToken').addEventListener('input', updateCodeSnippets);
  document.getElementById('autoAlert').addEventListener('change', updateCodeSnippets);
  document.getElementById('autoAdd').addEventListener('change', updateCodeSnippets);
  
  // Initialize the code snippets on page load
  document.addEventListener('DOMContentLoaded', updateCodeSnippets);
  
  // Function to handle form submission
  function handleSubmit(event) {
    event.preventDefault(); // Prevent the default form submission
    updateCodeSnippets();   // Update the code snippets with current form data
    // Consider if you want to clear the form here or not after submission
  }
  
  // Attach the submit event listener to the form
  document.getElementById('bulkUpdateForm').addEventListener('submit', handleSubmit);
  
