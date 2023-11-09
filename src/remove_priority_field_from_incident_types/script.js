document.addEventListener('DOMContentLoaded', () => {
  fetch('../sidebar.html') // Adjust the path to your sidebar.html
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      document.getElementById('sidebar-placeholder').innerHTML = data;
      attachFormSubmitListener(); // Make sure this is called after the sidebar is loaded
    })
    .catch(error => console.error('Error loading the sidebar:', error));
});

function attachFormSubmitListener() {
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
    try {
      const incidentTypesRemoved = await getIncidentTypesRemovePriority(apiKey);
      if (incidentTypesRemoved) {
        await updateIncidentTypes(apiKey, incidentTypesRemoved);
        alert('Incident types updated successfully.');
      }
    } catch (error) {
      alert(`An error occurred: ${error.message}`);
      console.error('Update failed:', error);
    }
  });
}

const api = 'https://api.firehydrant.io/v1';

async function getIncidentTypesRemovePriority(apiKey) {
  try {
    const response = await axios.get(`${api}/incident_types`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return response.data.data.map(({ priority, ...restOfIncidentType }) => restOfIncidentType);
  } catch (error) {
    console.error('Error fetching incident types:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

async function updateIncidentTypes(apiKey, incidentTypes) {
  try {
    for (const incidentType of incidentTypes) {
      const incidentTypeId = incidentType.id;
      delete incidentType.priority; // Assuming 'priority' is a direct property

      await axios.patch(`${api}/incident_types/${incidentTypeId}`, incidentType, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      console.log(`Updated incident type with ID: ${incidentTypeId}`);
    }
  } catch (error) {
    console.error('Error updating incident types:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
}
