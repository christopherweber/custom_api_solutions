form.addEventListener('submit', async function (e) {
  e.preventDefault();
  const confirmation = confirm("Are you sure you want to submit?");
  if (!confirmation) {
    return;
  }
  const apiKey = document.getElementById('apiKey').value;
  
  // Post to Netlify function
  fetch('/.netlify/functions/updateIncidentTypes', {
    method: 'POST',
    body: JSON.stringify({ apiKey }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
  })
  .catch(error => {
    alert(`An error occurred: ${error.message}`);
    console.error('Update failed:', error);
  });
});
