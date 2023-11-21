const axios = require('axios');
const { parse } = require('json2csv');

exports.handler = async function(event, context) {
  try {
    const { authToken, bucketSize, by, startDate, endDate } = JSON.parse(event.body);

    const response = await axios.get('https://api.firehydrant.io/v1/metrics/incidents', {
      headers: {
        'Authorization': authToken
      },
      params: {
        bucket_size: bucketSize,
        by,
        conditions: '', // You need to define how to set conditions
        end_date: endDate,
        start_date: startDate
      }
    });

    const csv = parse(response.data);

    return {
      statusCode: 200,
      body: JSON.stringify({ csv })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
