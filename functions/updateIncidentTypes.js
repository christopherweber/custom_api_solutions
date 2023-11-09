// functions/updateIncidentTypes.js
const axios = require('axios');

const api = 'https://api.firehydrant.io/v1';

exports.handler = async (event) => {
  // The API Key should be passed as part of the request body and not stored in the function
  const { apiKey } = JSON.parse(event.body);

  // Helper function to get incident types and remove priority
  async function getIncidentTypesRemovePriority() {
    try {
      const response = await axios.get(`${api}/incident_types`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
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

  // Helper function to update incident types
  async function updateIncidentTypes(incidentTypes) {
    for (const incidentType of incidentTypes) {
      const incidentTypeId = incidentType.id;
      delete incidentType.template.priority;

      await axios.patch(`${api}/incident_types/${incidentTypeId}`, incidentType, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
    }
  }

  try {
    const incidentTypesRemoved = await getIncidentTypesRemovePriority();
    await updateIncidentTypes(incidentTypesRemoved);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Incident types updated successfully" })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};
