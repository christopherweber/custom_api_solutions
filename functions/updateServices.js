const axios = require('axios');

exports.handler = async (event) => {
  // Reject any request that isn't POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  // Parse the body to get form values
  const { authToken, autoAlert, autoAdd } = JSON.parse(event.body);
  const apiEndpoint = 'https://api.firehydrant.io/v1/services';
  const bearerToken = `Bearer ${authToken}`;

  try {
    // GET request to fetch services
    const servicesResponse = await axios.get(apiEndpoint, {
      headers: { Authorization: bearerToken }
    });

    // Extract services from the response data
    const services = servicesResponse.data.data; // Based on the schema, data is nested within response.data

    // Check if the extracted services is an array
    if (!Array.isArray(services)) {
      throw new Error('Expected services to be an array');
    }

    // Map over services to create a list of PATCH requests
    const updatePromises = services.map(service =>
      axios.patch(`${apiEndpoint}/${service.id}`, {
        alert_on_add: autoAlert === 'true', // Assuming form value is a string 'true' or 'false'
        auto_add_responding_team: autoAdd === 'true'
      }, {
        headers: { Authorization: bearerToken }
      })
    );

    // Execute all the PATCH requests concurrently and wait for all to settle
    const results = await Promise.allSettled(updatePromises);

    // Filter the results to count successful updates
    const successes = results.filter(result => result.status === 'fulfilled');

    // Return success response with the count of successfully updated services
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, updated: successes.length })
    };
  } catch (error) {
    // Log the error
    console.error('Error details:', error.response?.data || error.message);

    // Return error response with status code and message
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'An unexpected error occurred';
    return {
      statusCode: status,
      body: JSON.stringify({ success: false, error: message })
    };
  }
};
