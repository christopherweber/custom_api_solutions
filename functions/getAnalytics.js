const axios = require('axios');
const { parse } = require('json2csv');

exports.handler = async function(event) {
  try {
    const { authToken, startDate, endDate } = JSON.parse(event.body);
    const incidentsUrl = `https://api.firehydrant.io/v1/incidents?start_date=${startDate}&end_date=${endDate}`;

    const response = await axios.get(incidentsUrl, {
      headers: { 'Authorization': authToken }
    });

    const incidents = response.data.data || []; // Adjust based on actual API response structure

    const formattedIncidents = incidents.map(incident => {
      return {
        id: incident.id,
        name: incident.name,
        created_at: incident.created_at,
        started_at: incident.started_at,
        severity: incident.severity,
        priority: incident.priority,
        tags: incident.tag_list.join(', '),
        custom_fields: formatCustomFields(incident.custom_fields),
        opened_by: incident.created_by ? incident.created_by.name : 'N/A',
        milestones: formatMilestones(incident.milestones),
        impacts: formatImpacts(incident.impacts)
      };
    });

    const fields = ['id', 'name', 'created_at', 'started_at', 'severity', 'priority', 'tags', 'custom_fields', 'opened_by', 'milestones', 'impacts'];
    const csv = parse(formattedIncidents, { fields });

    return {
      statusCode: 200,
      body: JSON.stringify({ incidents: formattedIncidents, csv })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function formatCustomFields(fields) {
  return fields.map(field => `${field.name}: ${field.value_string || field.value_array.join(', ')}`).join('; ');
}

function formatMilestones(milestones) {
  return milestones.map(milestone => `${milestone.type} (duration: ${milestone.duration || 'N/A'})`).join('; ');
}

function formatImpacts(impacts) {
  return impacts.map(impact => `${impact.type}: ${impact.impact.name} (Condition: ${impact.condition.name})`).join('; ');
}
