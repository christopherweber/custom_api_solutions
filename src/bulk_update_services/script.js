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
  // Fetch values directly as boolean from the checkboxes
  const authToken = document.getElementById('authToken').value;
  const autoAlert = document.getElementById('autoAlert').checked;
  const autoAdd = document.getElementById('autoAdd').checked;

  const nodeSnippet = `// Node.js code
const fetch = require('node-fetch');
const authToken = '${authToken}';
const autoAlert = ${autoAlert};
const autoAdd = ${autoAdd};

// Add the rest of the Node.js logic here`;

  const pythonSnippet = `# Python code
import requests
auth_token = '${authToken}'
auto_alert = ${autoAlert}
auto_add = ${autoAdd}

# Add the rest of the Python logic here`;

  // Insert the snippets into the HTML elements
  document.getElementById('codeSnippetNodeJs').textContent = nodeSnippet;
  document.getElementById('codeSnippetPython').textContent = pythonSnippet;
}
