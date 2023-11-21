const axios = require('axios');
const { parse } = require('json2csv');

exports.handler = async function(event) {
  try {
    // Parse the request body to get the parameters
    const { authToken, startDate, endDate } = JSON.parse(event.body);

    // Construct the URL for the FireHydrant API request
    const incidentsUrl = `https://api.firehydrant.io/v1/incidents?start_date=${startDate}&end_date=${endDate}`;
    console.log("API Request URL: " + incidentsUrl);

    // Fetch incidents data from the FireHydrant API
    const response = await axios.get(incidentsUrl, {
      headers: { 'Authorization': authToken }
    });

    // Check if the incidents data is in the expected format
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Unexpected response format from the FireHydrant API");
    }

    // Extract the incidents data from the response
    const incidents = response.data;

    // Convert the incidents data to CSV format
    const fields = ['id', 'name', 'created_at', 'started_at', 'discarded_at', 'summary', 'customer_impact_summary', 'description', 'current_milestone', 'number', 'priority', 'severity'];
    const csv = parse(incidents, { fields });

    // Log the incidents data and CSV for debugging
    console.log("Incidents Data:", incidents);
    console.log("CSV Data:", csv);

    // Return the incidents data and CSV in the response
    return {
      statusCode: 200,
      body: JSON.stringify({ incidents, csv })
    };
  } catch (error) {
    // Log and return the error
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
