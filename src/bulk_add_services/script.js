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
    attachBulkServiceFormListener();
  });
  
  function attachBulkServiceFormListener() {
    const form = document.getElementById('bulkServiceForm');
    if (!form) {
      console.error('Bulk service form not found.');
      return;
    }
  
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const confirmation = confirm("Are you sure you want to submit the services?");
      if (!confirmation) {
        return;
      }
  
      const authToken = document.getElementById('authToken').value;
      const serviceFields = document.querySelectorAll('.serviceFields');
      const services = Array.from(serviceFields).map(fields => {
        return {
          name: fields.querySelector('[name="serviceName"]').value,
          remoteId: fields.querySelector('[name="remoteId"]').value,
          connectionType: fields.querySelector('[name="connectionType"]').value
        };
      });
  
      fetch('/.netlify/functions/bulkAddServices', {
        method: 'POST',
        body: JSON.stringify({ authToken, services }),
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
        alert('Services added successfully');
      })
      .catch(error => {
        alert(`An error occurred: ${error.message}`);
        console.error('Service addition failed:', error);
      });
    });
  
    document.getElementById('addServiceButton').addEventListener('click', function() {
      const container = document.getElementById('serviceFieldsContainer');
      const newFieldSet = container.firstElementChild.cloneNode(true);
      newFieldSet.querySelectorAll('input').forEach(input => input.value = '');
      container.appendChild(newFieldSet);
    });
  }
  