// Import axios for making HTTP requests
const axios = require('axios');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  const { authToken, autoAlert, autoAdd } = JSON.parse(event.body);

  try {
    // Get all services
    const servicesResponse = await axios.get('https://api.firehydrant.io/v1/services', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    // Loop through services and update them
    const updatePromises = servicesResponse.data.map((service) => {
      return axios.patch(`https://api.firehydrant.io/v1/services/${service.id}`, {
        alert_on_add: autoAlert,
        auto_add_responding_team: autoAdd
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    // Return a success response
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error updating services:', error);

    // Return an error response
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
