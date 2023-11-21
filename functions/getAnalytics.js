const axios = require('axios');
const { parse } = require('json2csv');

exports.handler = async function(event) {
  try {
    const { authToken, startDate, endDate } = JSON.parse(event.body);
    const incidentsUrl = `https://api.firehydrant.io/v1/incidents?start_date=${startDate}&end_date=${endDate}`;
    console.log("in analytics.js")
    console.log("here is the URL: " + incidentsUrl)

    // Fetch incidents
    const incidentsResponse = await axios.get(incidentsUrl, { headers: { 'Authorization': authToken } });
    const incidents = incidentsResponse.data.incidents;  // Assuming the API returns an object with an 'incidents' array
    console.log("here is the incidents from getAnalytics.js " + incidents)
    
    // Convert to CSV
    const fields = ['id', 'name', 'created_at', 'started_at', 'discarded_at', 'summary', 'customer_impact_summary', 'description', 'current_milestone', 'number', 'priority', 'severity', /* Add other fields as necessary */];
    const csv = parse(incidents, { fields });

    console.log(JSON.stringify({ incidents, csv })); // Add this line in getAnalytics.js before the return statement
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

async function fetchIncidentDetails(incidentId, authToken) {
  // Nothing here yet
}
