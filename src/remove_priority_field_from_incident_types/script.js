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
  const apiKey = document.getElementById('apiKey').value;

  const nodeSnippet = `// Your Node/Axios code using apiKey: ${apiKey}`;
  const pythonSnippet = `# Your Python code using apiKey: ${apiKey}`;

  document.getElementById('codeSnippetNodeJs').textContent = nodeSnippet;
  document.getElementById('codeSnippetPython').textContent = pythonSnippet;
}

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