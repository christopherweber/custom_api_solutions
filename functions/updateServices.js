const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const { authToken, autoAlert, autoAdd } = JSON.parse(event.body);
  const apiEndpoint = process.env.FIREHYDRANT_API_ENDPOINT;
  const bearerToken = `Bearer ${authToken || process.env.FIREHYDRANT_API_TOKEN}`;

  try {
    const servicesResponse = await axios.get(`${apiEndpoint}/v1/services`, {
      headers: { Authorization: bearerToken }
    });

    const updatePromises = servicesResponse.data.map(service =>
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
    const message = error.response?.statusText || error.message;

    return {
      statusCode: status,
      body: JSON.stringify({ success: false, error: message })
    };
  }
};
