const axios = require('axios');
const { parse } = require('json2csv');

exports.handler = async function(event, context) {
  try {
    // Log the event to see if it's receiving the correct data
    console.log('Event:', event);
    
    const { authToken, bucketSize, by, startDate, endDate } = JSON.parse(event.body);

    // Log the parsed body to make sure it contains the right parameters
    console.log('Parsed body:', { authToken, bucketSize, by, startDate, endDate });

    const response = await axios.get('https://api.firehydrant.io/v1/metrics/incidents', {
      headers: {
        'Authorization': authToken
      },
      params: {
        bucket_size: bucketSize,
        by: by,
        conditions: '', // Ensure this is the intended usage
        end_date: endDate,
        start_date: startDate
      }
    });

    // Log the response status and data
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);

    const csv = parse(response.data);

    // Log the CSV to see if it's formatted correctly
    console.log('CSV:', csv);

    return {
      statusCode: 200,
      body: JSON.stringify({ csv })
    };
  } catch (error) {
    // Log the error to see what went wrong
    console.error('Error:', error);

    // It's helpful to log the error message and stack for detailed info
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
