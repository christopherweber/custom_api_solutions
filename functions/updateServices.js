const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const { authToken, autoAlert, autoAdd } = JSON.parse(event.body);
  console.log('Received values:', { authToken, autoAlert, autoAdd });
  const apiEndpoint = 'https://api.firehydrant.io/v1/services';
  const bearerToken = `Bearer ${authToken}`;

  try {
    const servicesResponse = await axios.get(apiEndpoint, {
      headers: { Authorization: bearerToken }
    });

    // Log the body of the GET request to see the services data
    console.log('Services response data:', servicesResponse.data);

    // Assuming the structure of the response is { data: [...services] }
    const services = servicesResponse.data.data; 

    if (!Array.isArray(services)) {
      throw new Error('Expected services to be an array');
    }

    const updatePromises = services.map(service =>
      axios.patch(`${apiEndpoint}/${service.id}`, {
        alert_on_add: autoAlert, // Assuming autoAlert is already a boolean
        auto_add_responding_team: autoAdd // Assuming autoAdd is already a boolean
      }, {
        headers: { Authorization: bearerToken }
      })
    );    

    const results = await Promise.allSettled(updatePromises);

    // Console log each result for debugging
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        console.log('Update success for service:', result.value.data);
      } else {
        console.log('Update failed for service:', result.reason);
      }
    });

    const successes = results.filter(result => result.status === 'fulfilled');

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, updated: successes.length })
    };
  } catch (error) {
    console.error('Error details:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'An unexpected error occurred';
    return {
      statusCode: status,
      body: JSON.stringify({ success: false, error: message })
    };
  }
};
