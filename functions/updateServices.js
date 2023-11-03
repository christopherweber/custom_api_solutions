// /functions/updateServices.js
const axios = require('axios');

exports.handler = async (event, context) => {
  // Make sure we are dealing with a POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
      headers: { 'Allow': 'POST' },
    };
  }

  const { authToken, autoAlert, autoAdd } = JSON.parse(event.body);

  try {
    // Perform the GET request to retrieve services
    const servicesResponse = await axios.get('https://api.firehydrant.io/v1/services', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // ... Rest of your logic to update each service ...

    // Example of updating a service, you would loop over all services
    // const serviceUpdateResponse = await axios.patch(`https://api.firehydrant.io/v1/services/${serviceId}`, updateData, {
    //   headers: { 'Authorization': `Bearer ${authToken}` }
    // });

    // After all updates are done, send back a success response
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Services updated successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update services' }),
    };
  }
};
