const axios = require('axios');

exports.handler = async (event) => {
  // Validate method
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  // Try to parse the body
  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (parseError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Bad request. The body could not be parsed.', error: parseError.message })
    };
  }

  const { authToken, autoAlert, autoAdd } = requestBody;
  const apiEndpoint = process.env.FIREHYDRANT_API_ENDPOINT || 'https://api.firehydrant.io';
  const bearerToken = `Bearer ${authToken || process.env.FIREHYDRANT_API_TOKEN}`;

  // Log the inputs for debugging
  console.log('Received token:', bearerToken);
  console.log('AutoAlert:', autoAlert);
  console.log('AutoAdd:', autoAdd);

  try {
    // Fetch services
    let servicesResponse;
    try {
      servicesResponse = await axios.get(`${apiEndpoint}/v1/services`, {
        headers: { Authorization: bearerToken }
      });
      console.log('API Response:', servicesResponse.data); // Log the whole response
    } catch (fetchError) {
      // Log the detailed error from fetching services
      return {
        statusCode: fetchError.response?.status || 500,
        body: JSON.stringify({
          message: 'Failed to fetch services.',
          error: fetchError.message,
          details: fetchError.response?.data || 'No additional error information from Firehydrant API.'
        })
      };
    }
    
    // If the response is not as expected, handle it accordingly
    if (!Array.isArray(servicesResponse.data)) {
      console.error('Error: Expected an array of services, received:', servicesResponse.data);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Internal Server Error',
          error: 'The API response is not in the expected format.'
        })
      };
    }

    // Log services for debugging
    console.log('Services fetched:', servicesResponse.data.length);

    // Update services
    const updatePromises = servicesResponse.data.map(service => {
      return axios.patch(`${apiEndpoint}/v1/services/${service.id}`, {
        alert_on_add: autoAlert,
        auto_add_responding_team: autoAdd
      }, {
        headers: { Authorization: bearerToken }
      }).catch(updateError => {
        // Catch errors in each individual update for logging
        console.error('Update error for service:', service.id, updateError.message);
        return {
          status: 'rejected',
          reason: updateError.message,
          serviceId: service.id
        };
      });
    });

    const results = await Promise.allSettled(updatePromises);
    const successResults = results.filter(result => result.status === 'fulfilled');
    const errorResults = results.filter(result => result.status === 'rejected');

    // Log results for debugging
    console.log('Update successful for:', successResults.length, 'services');
    errorResults.forEach((errorResult) => {
      console.error('Failed to update service ID:', errorResult.serviceId, 'Error:', errorResult.reason);
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, updated: successResults.length, errors: errorResults })
    };
  } catch (error) {
    // Catch-all error logging
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message })
    };
  }
};
