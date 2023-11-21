const axios = require('axios');
const { parse } = require('json2csv');

exports.handler = async function(event, context) {
  try {
    const { authToken, bucketSize, by, startDate, endDate } = JSON.parse(event.body);

    // Build the params object dynamically
    let params = {
      bucket_size: bucketSize,
      by: by,
      end_date: endDate,
      start_date: startDate
    };

    // If conditions are not needed, they should not be included in the params
    // if (conditions) {
    //   params.conditions = conditions; // Only include conditions if it's provided
    // }

    const response = await axios.get('https://api.firehydrant.io/v1/metrics/incidents', {
      headers: {
        'Authorization': authToken
      },
      params: params // Use the params object
    });

    // Convert the data to CSV
    const csv = parse(response.data);

    return {
      statusCode: 200,
      body: JSON.stringify({ csv })
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
