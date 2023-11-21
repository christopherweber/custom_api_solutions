const axios = require('axios');
const { parse } = require('json2csv');

exports.handler = async function(event) {
  try {
    const { authToken, startDate, endDate } = JSON.parse(event.body);
    const incidentsUrl = `https://api.firehydrant.io/v1/incidents?start_date=${startDate}&end_date=${endDate}`;
    console.log("API Request URL: " + incidentsUrl);

    const response = await axios.get(incidentsUrl, {
      headers: { 'Authorization': authToken }
    });

    // Check and log the entire response to understand its structure
    console.log("Full API Response:", response.data);

    // Check if the incidents data is directly under the data key
    let incidents;
    if (Array.isArray(response.data)) {
      incidents = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      // If the data is under data.data
      incidents = response.data.data;
    } else {
      throw new Error("Unexpected response format from the FireHydrant API");
    }

    console.log("Incidents Data:", incidents);

    // Convert the incidents data to CSV format
    const fields = ['id', 'name', 'created_at', 'started_at', 'discarded_at', 'summary', 'customer_impact_summary', 'description', 'current_milestone', 'number', 'priority', 'severity'];
    const csv = parse(incidents, { fields });

    return {
      statusCode: 200,
      body: JSON.stringify({ incidents, csv })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};


// Additional functions (if needed) can be added below


async function fetchIncidentDetails(incidentId, authToken) {
  // Nothing here yet 
}
