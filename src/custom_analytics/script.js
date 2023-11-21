document.getElementById('parameters-form').addEventListener('submit', function(event) {
    event.preventDefault();
    fetch('../sidebar.html')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
    })
    .then(data => {
        document.getElementById('sidebar-placeholder').innerHTML = data;
        populateMilestoneOptions();
        attachFormSubmitListener();
    })
    .catch(error => console.error('Error loading the sidebar:', error));
    
    const authToken = document.getElementById('auth-token').value;
    const bucketSize = document.getElementById('bucket-size').value;
    const by = document.getElementById('by').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
  
    // Trigger the Netlify function
    fetchData(authToken, bucketSize, by, startDate, endDate);
  });
  
  function fetchData(authToken, bucketSize, by, startDate, endDate) {
    fetch('/.netlify/functions/getMetrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authToken, bucketSize, by, startDate, endDate })
    })
    .then(response => response.json())
    .then(data => {
      displayData(data);
      document.getElementById('download-csv').style.display = 'block';
    })
    .catch(error => console.error('Error:', error));
  }
  
  function displayData(data) {
    // Code to display data on the page
  }
  
  document.getElementById('download-csv').addEventListener('click', function() {
    // Code to handle CSV download
  });
  