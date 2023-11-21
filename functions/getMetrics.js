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

    // Construct the URL for logging
    const url = new URL('https://api.firehydrant.io/v1/metrics/incidents');
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    // Log the URL
    console.log('Request URL:', url.href);

    const response = await axios.get(url.href, {
      headers: {
        'Authorization': authToken
      }
    });

    // Log the response data
    console.log('Response data:', response.data);

    const csv = parse(response.data);

    return {
      statusCode: 200,
      body: JSON.stringify({ csv })
    };
  } catch (error) {
    // Log the error and the full error object
    console.error('Error:', error);
    console.error('Error details:', error.response ? error.response.data : error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
