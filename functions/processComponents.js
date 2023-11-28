const axios = require('axios');
const parse = require('csv-parse/lib/sync');

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const data = JSON.parse(event.body);
    const components = data.csv ? processCSV(data.csv) : [await processSingleComponent(data.componentName, data.componentGroup)];

    // Assuming a function to update status page
    // Update accordingly based on your existing logic
    // await updateStatusPage(components);

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Components processed successfully', data: components })
    };
};

function processCSV(csv) {
    const records = parse(csv, {
        columns: true,
        skip_empty_lines: true
    });

    // Process each row - adapt this based on your current Node.js script
    return records.map(record => ({
        componentName: record.Component,
        componentGroup: record['Component Group']
        // ... other processing ...
    }));
}

async function processSingleComponent(componentName, componentGroup) {
    // Implement logic to process single component
    // This is a placeholder function, replace with actual logic
    return { componentName, componentGroup };
}

// Add other helper functions from your script as needed
