const axios = require('axios');
const { parse } = require('json2csv');
const moment = require('moment');
require('moment-duration-format');

exports.handler = async function(event) {
    try {
        const { authToken, startDate, endDate } = JSON.parse(event.body);
        let allIncidents = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const incidentsUrl = `https://api.firehydrant.io/v1/incidents?start_date=${startDate}&end_date=${endDate}&page=${page}`;
            console.log(`Fetching page ${page}: ${incidentsUrl}`); 
            const response = await axios.get(incidentsUrl, {
                headers: { 'Authorization': authToken }
            });

            const incidents = response.data.data || [];
            console.log(`Fetched ${incidents.length} incidents on page ${page}`);
            if (incidents.length === 0) {
                hasMore = false;
            } else {
                allIncidents = allIncidents.concat(incidents);
                page++;
            }
        }

        console.log(`Total incidents fetched: ${allIncidents.length}`); // Log the total number of incidents fetched
        console.log(allIncidents);

        const formattedIncidents = await Promise.all(allIncidents.map(async incident => {
            let lessonsLearned = '';
            if (incident.report_id) {
                const retroResponse = await fetchRetrospective(incident.report_id, authToken);
                lessonsLearned = formatLessonsLearned(retroResponse.questions);
            }

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
        }));

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
    const reportUrl = `https://api.firehydrant.io/v1/post_mortems/reports/${reportId}`;
    const reportResponse = await axios.get(reportUrl, { headers: { 'Authorization': authToken } });
    return reportResponse.data;
}

function formatLessonsLearned(questions) {
    return questions
        .filter(question => question.title.toLowerCase().includes('lessons learned'))
        .map(question => question.body)
        .join(', ');
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
        const readableDuration = formatDuration(milestone.duration);
        return `${milestone.type} (duration: ${readableDuration || 'N/A'})`;
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
