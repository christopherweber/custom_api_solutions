document.addEventListener('DOMContentLoaded', () => {
  // Fetch and insert the sidebar content
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

  const form = document.getElementById('apiKeyForm');
  form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const confirmation = confirm("Are you sure you want to submit?");
      if (confirmation) {
          const fhBot = document.getElementById('apiKey').value;
          try {
              const incidentTypesRemoved = await getIncidentTypesRemovePriority(fhBot);
              if (incidentTypesRemoved) {
                  await updateIncidentTypes(fhBot, incidentTypesRemoved);
                  alert('Incident types updated successfully.');
              }
          } catch (error) {
              alert(`An error occurred: ${error.message}`);
              console.error('Update failed:', error);
          }
      }
  });
});

const api = 'https://api.firehydrant.io/v1';

async function getIncidentTypesRemovePriority(fhBot) {
  try {
      const response = await axios.get(`${api}/incident_types`, {
          headers: {
              Authorization: `Bearer ${fhBot}`,
          },
      });

      const newIncidentTypesWithoutPriority = response.data.data.map(incidentType => {
          const { priority, ...restOfIncidentType } = incidentType;
          return restOfIncidentType;
      });

      return newIncidentTypesWithoutPriority;
  } catch (error) {
      console.error('Error fetching incident types:', error);
      throw new Error('Failed to fetch incident types.');
  }
}

async function updateIncidentTypes(fhBot, incidentTypes) {
  for (const incidentType of incidentTypes) {
      const incidentTypeId = incidentType.id;
      delete incidentType.template.priority;

      try {
          await axios.patch(`${api}/incident_types/${incidentTypeId}`, incidentType, {
              headers: {
                  Authorization: `Bearer ${fhBot}`,
              },
          });

          console.log(`Updated incident type with ID: ${incidentTypeId}`);
      } catch (error) {
          console.error(`Error updating incident type ID ${incidentTypeId}:`, error);
          throw new Error(`Failed to update incident type ID ${incidentTypeId}.`);
      }
  }
}
