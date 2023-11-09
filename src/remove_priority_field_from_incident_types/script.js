document.getElementById('apiKeyForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const fhBot = document.getElementById('apiKey').value;
    getIncidentTypesRemovePriority(fhBot).then(updateIncidentTypes);
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

    // Since you can't use 'fs' in the browser, storing the result in local storage or handling it some other way
    localStorage.setItem('incidentTypes', JSON.stringify(newIncidentTypesWithoutPriority));

    return newIncidentTypesWithoutPriority;
  } catch (error) {
    console.error('yikes', error.message);
    return null;
  }
}

async function updateIncidentTypes() {
  const fhBot = document.getElementById('apiKey').value;
  try {
    const incidentTypes = JSON.parse(localStorage.getItem('incidentTypes'));

    for (const incidentType of incidentTypes) {
      const incidentTypeId = incidentType.id;
      delete incidentType.template.priority;

      await axios.patch(`${api}/incident_types/${incidentTypeId}`, incidentType, {
        headers: {
          Authorization: `Bearer ${fhBot}`,
        },
      });

      console.log(`Updated incident type with ID: ${incidentTypeId}`);
    }
  } catch (error) {
    console.error(error.message);
  }
}
