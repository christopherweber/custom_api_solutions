const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const { authToken, autoAlert, autoAdd } = JSON.parse(event.body);
  const apiEndpoint = "https://api.firehydrant.io";
  const bearerToken = `Bearer ${authToken || process.env.FIREHYDRANT_API_TOKEN}`;

  try {
    const servicesResponse = await axios.get(`${apiEndpoint}/v1/services`, {
      headers: { Authorization: bearerToken }
    });

    // Assuming services are listed under 'items'. Replace 'items' with the correct property if different.
    const services = servicesResponse.data.items;

    if (!Array.isArray(services)) {
      throw new Error('Expected services to be an array');
    }

    const updatePromises = services.map(service =>
      axios.patch(`${apiEndpoint}/v1/services/${service.id}`, {
        alert_on_add: autoAlert,
        auto_add_responding_team: autoAdd
      }, {
        headers: { Authorization: bearerToken }
      })
    );

    const results = await Promise.allSettled(updatePromises);
    const success = results.filter(result => result.status === 'fulfilled');

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, updated: success.length })
    };
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || "An unexpected error occurred";

    console.error('Error details:', error.response?.data || error.message);

    return {
      statusCode: status,
      body: JSON.stringify({ success: false, error: message })
    };
  }
};
