const axios = require('axios');
const { parse } = require('json2csv');
const moment = require('moment');
require('moment-duration-format');

exports.handler = async function(event) {
  try {
    const { authToken, startDate, endDate } = JSON.parse(event.body);
    let allIncidents = [];
    let page = 1;
    let incidentsCount;

    do {
        const incidentsUrl = `https://api.firehydrant.io/v1/incidents?start_date=${startDate}&end_date=${endDate}&page=${page}`;
        const response = await axios.get(incidentsUrl, {
            headers: { 'Authorization': authToken }
        });

        const incidents = response.data.data || [];
        incidentsCount = incidents.length;
        allIncidents = allIncidents.concat(incidents);

        if (incidentsCount === 20) {
            page++;
        }
    } while (incidentsCount === 20);

        // Fetch additional details for each incident
        const fetchPromises = allIncidents.map(async (incident) => {
            let lessonsLearned = 'N/A';

            if (incident.report_id) {
              const retroResponse = await fetchRetrospective(incident.report_id, authToken);
              if (retroResponse) {
                  lessonsLearned = formatLessonsLearned(retroResponse.questions);
                  console.log(`Lessons learned for report ID ${incident.report_id}: `, lessonsLearned);
              }
          }

            // Format the incident data
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
                impacts: formatImpacts(incident.impacts),
                lessons_learned: lessonsLearned,
                current_milestone: incident.current_milestone,
                incident_url: incident.incident_url,
                report_id: incident.report_id
            };
        });

        // Resolve all promises and format the final incidents array
        const formattedIncidents = await Promise.all(fetchPromises);

        const fields = ['id', 'name', 'created_at', 'started_at', 'severity', 'priority', 'tags', 'custom_fields', 'opened_by', 'milestones', 'impacts', 'lessons_learned', 'current_milestone', 'incident_url', 'report_id'];
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

async function fetchRetrospective(reportId, authToken) {
  try {
      const reportUrl = `https://api.firehydrant.io/v1/post_mortems/reports/${reportId}`;
      const reportResponse = await axios.get(reportUrl, { headers: { 'Authorization': authToken } });
      console.log(`Fetched retrospective for report ID ${reportId}: `, reportResponse.data);
      return reportResponse.data;
  } catch (error) {
      console.error(`Error fetching retrospective for report ID ${reportId}: `, error);
      return null; // Return null if there is an error
  }
}

function formatLessonsLearned(questions) {
  if (!questions || !Array.isArray(questions)) {
      console.log('Invalid or empty questions array:', questions);
      return 'N/A';
  }
  return questions.map(question => {
      let lesson = '';
      if (question.title) {
          lesson += `Question: ${question.title}`;
      }
      if (question.body) {
          lesson += `; Answer: ${question.body}`;
      } else {
          lesson += '; Answer: N/A';
      }
      return lesson;
  }).join('; ');
}



function formatCustomFields(fields) {
    if (!Array.isArray(fields)) {
        return 'N/A';
    }
    return fields.map(field => {
        const fieldValue = Array.isArray(field.value_array) ? field.value_array.join(', ') : field.value_string;
        return `${field.name}: ${fieldValue || 'N/A'}`;
    }).join('; ');
}

function formatMilestones(milestones) {
    if (!Array.isArray(milestones)) {
        return 'N/A';
    }
    return milestones.map(milestone => {
        const durationFormatted = milestone.duration ? moment.duration(milestone.duration).format('d[d] h[h] m[m] s[s]') : 'N/A';
        return `${milestone.type} (duration: ${durationFormatted})`;
    }).join('; ');
}

function formatImpacts(impacts) {
    if (!Array.isArray(impacts)) {
        return 'N/A';
    }
    return impacts.map(impact => {
        const impactName = impact.impact && impact.impact.name ? impact.impact.name : 'N/A';
        const conditionName = impact.condition && impact.condition.name ? impact.condition.name : 'N/A';
        return `${impact.type}: ${impactName} (Condition: ${conditionName})`;
    }).join('; ');
}

function formatDuration(isoDuration) {
    return moment.duration(isoDuration).format('y [years], M [months], d [days], h [hours], m [minutes], s [seconds]');
}
