const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  // It seems you've hardcoded the apiEndpoint for troubleshooting.
  // Ensure that it's correct and the API endpoint requires no additional paths.
  const apiEndpoint = 'https://api.firehydrant.io';
  const { authToken, autoAlert, autoAdd } = JSON.parse(event.body);
  const bearerToken = `Bearer ${authToken}`;

  try {
    const servicesResponse = await axios.get(`${apiEndpoint}/v1/services`, {
      headers: { Authorization: bearerToken }
    });

    // Log the full services response data to debug the structure
    console.log('Services response data:', JSON.stringify(servicesResponse.data, null, 2));

    // Ensure to adjust this line based on the actual structure you find in the logs
    const services = servicesResponse.data.items || servicesResponse.data.services;

    if (!Array.isArray(services)) {
      throw new Error('Expected services to be an array');
    }

    // Process each service to update settings
    const updatePromises = services.map(service =>
      axios.patch(`${apiEndpoint}/v1/services/${service.id}`, {
        alert_on_add: autoAlert,
        auto_add_responding_team: autoAdd
      }, {
        headers: { Authorization: bearerToken }
      })
    );

    // Wait for all the update promises to settle
    const results = await Promise.allSettled(updatePromises);
    const success = results.filter(result => result.status === 'fulfilled');

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, updated: success.length })
    };
  } catch (error) {
    // Log the error details
    console.error('Error details:', error.response?.data || error.message);

    // Extract error status and message
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';

    // Return error response
    return {
      statusCode: status,
      body: JSON.stringify({ success: false, error: message })
    };
  }
};
