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
