document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('analyticsForm');
  if (form) {
      form.addEventListener('submit', handleSubmit);
  }

  const addFilterBtn = document.getElementById('addFilterBtn');
  if (addFilterBtn) {
      addFilterBtn.addEventListener('click', addFilter);
  }

  const retrospectiveFilterDropdown = document.getElementById('retrospectiveFilter');
  const severityFilterInput = document.getElementById('severityFilter');

  if (retrospectiveFilterDropdown) {
      retrospectiveFilterDropdown.addEventListener('change', handleFilterChange);
  }
  if (severityFilterInput) {
      severityFilterInput.addEventListener('input', handleFilterChange);
  }
});

function goBack() {
  window.history.back();
}

let dataFetched = false;

function handleSubmit(event) {
    event.preventDefault();
    const authToken = document.getElementById('authToken').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    fetchAnalyticsData(authToken, startDate, endDate, true);
}


function createPills() {
  const severityValue = document.getElementById('severityFilter').value || 'All';
  const milestoneValue = document.getElementById('retrospectiveFilter').value;
  const pillContainer = document.getElementById('filterPillsContainer');
  pillContainer.innerHTML = ''; // Clear existing pills

  createPill('Milestone', milestoneValue !== 'all' ? 'Retrospective Completed' : 'All', pillContainer);
  if (severityValue && severityValue !== 'All') {
      createPill('Severity', severityValue, pillContainer);
  }
}

function createPill(type, value, container) {
  const pill = document.createElement('span');
  pill.textContent = `${type}: ${value}`;
  pill.className = 'filter-pill';

  const xButton = document.createElement('button');
  xButton.textContent = '×';
  xButton.className = 'pill-remove-button';
  xButton.onclick = () => removePill(type, pill);

  pill.appendChild(xButton);
  container.appendChild(pill);
}


function removePill(type, pill) {
  if (type === 'Severity') {
      document.getElementById('severityFilter').value = '';
  } else if (type === 'Milestone') {
      document.getElementById('retrospectiveFilter').value = 'all';
  }
  pill.remove();
  handleFilterChange(); // Refetch data and update pills
}

const retrospectiveFilterDropdown = document.getElementById('retrospectiveFilter');
const severityFilterInput = document.getElementById('severityFilter');
const currentMilestoneText = document.getElementById('currentMilestoneText'); 

function handleFilterChange() {
  if (dataFetched) {
      const authToken = document.getElementById('authToken').value;
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      fetchAnalyticsData(authToken, startDate, endDate);
  }
  createPills();
}


// Attach the event listeners to the filters
if (retrospectiveFilterDropdown) {
  retrospectiveFilterDropdown.addEventListener('change', handleFilterChange);
}
if (severityFilterInput) {
  severityFilterInput.addEventListener('input', handleFilterChange);
}


function fetchAnalyticsData(authToken, startDate, endDate, updateFlag) {
  showLoadingMessage();
  fetch('/.netlify/functions/getAnalytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authToken, startDate, endDate })
  })
  .then(response => response.json())
  .then(data => {
      if (updateFlag) {
          dataFetched = true;
      }
      const severityFilterValue = document.getElementById('severityFilter') ? document.getElementById('severityFilter').value : '';
      const retrospectiveFilterValue = document.getElementById('retrospectiveFilter').value;
      
      const filteredData = applyFilters(data.incidents, severityFilterValue, retrospectiveFilterValue);
      hideLoadingMessage();
      displayReportResults(filteredData);
  })
  .catch(error => {
      console.error('Error:', error);
      hideLoadingMessage();
  });
}

function applyFilters(incidents, severity, retrospective) {
  return incidents.filter(incident => {
      const severityMatch = !severity || incident.severity === severity;
      const retrospectiveMatch = retrospective === 'all' || (retrospective === 'completed' && incident.current_milestone === 'postmortem_completed');
      return severityMatch && retrospectiveMatch;
  });
}


function addFilter() {
  const filtersContainer = document.getElementById('additionalFilters');
  if (filtersContainer.style.display === 'none') {
      filtersContainer.innerHTML = `
          <div class="form-field">
              <label for="severityFilter">Severity:</label>
              <input type="text" id="severityFilter" placeholder="Enter severity">
          </div>
      ` + filtersContainer.innerHTML;
      filtersContainer.style.display = 'block';

      const severityFilterInput = document.getElementById('severityFilter');
      if (severityFilterInput) {
          severityFilterInput.addEventListener('input', handleFilterChange);
      }
  } else {
      filtersContainer.style.display = 'none';
  }
}


function showLoadingMessage() {
  const loadingElement = document.getElementById('loadingMessage');
  loadingElement.style.display = 'flex';
}

function hideLoadingMessage() {
  const loadingElement = document.getElementById('loadingMessage');
  loadingElement.style.display = 'none';
}

let currentDisplayedIncidents = []; // Global variable to store currently displayed incidents

function displayReportResults(filteredIncidents) {
  const reportResultsElement = document.getElementById('reportResults');
  reportResultsElement.innerHTML = '';

  if (!filteredIncidents || filteredIncidents.length === 0) {
      reportResultsElement.textContent = 'No data to display.';
      return;
  }

  const table = createTable(filteredIncidents);
  reportResultsElement.appendChild(table);

  const downloadCsvButton = document.createElement('button');
  downloadCsvButton.id = 'exportCsv';
  downloadCsvButton.textContent = 'Export to CSV';

  const headerElement = document.getElementById('dashboard-header');
  headerElement.appendChild(downloadCsvButton);

  downloadCsvButton.addEventListener('click', function() {
    if (!filteredIncidents || filteredIncidents.length === 0) {
        alert('No CSV data available to download.');
        return;
    }
    const csvData = generateCsvFromIncidents(filteredIncidents);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

  
    const filename = `analytics-report-${startDate}-to-${endDate}.csv`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename; 
    link.click();
});

}


function generateCsvFromIncidents(incidents) {
  const headers = ['id', 'name', 'created_at', 'started_at', 'severity', 'priority', 'tags', 'custom_fields', 'opened_by', 'milestones', 'impacts', 'lessons_learned', 'current_milestone', 'incident_url', 'report_id'];
  let csvContent = headers.join(',') + '\n'; // CSV header row

  incidents.forEach(incident => {
      let row = headers.map(header => {
          let value = incident[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value; // Handle values containing commas
      }).join(',');
      csvContent += row + '\n';
  });

  return csvContent;
}


function addFilter() {
  const filtersContainer = document.getElementById('additionalFilters');
  filtersContainer.style.display = filtersContainer.style.display === 'block' ? 'none' : 'block';
}
  
function createTable(incidents) {
  const table = document.createElement('table');
  table.setAttribute('border', '1');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  // Add new headers for the additional fields
  const headers = [
      'id', 
      'name', 
      'created_at', 
      'started_at', 
      'severity', 
      'priority', 
      'tags', 
      'custom_fields', 
      'opened_by', 
      'milestones', 
      'impacts', 
      'lessons_learned',
      'current_milestone', // New field
      'incident_url',      // New field
      'report_id'          // New field
  ];

  const headerRow = document.createElement('tr');
  headers.forEach(headerText => {
      const header = document.createElement('th');
      header.textContent = headerText;
      headerRow.appendChild(header);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  incidents.forEach(incident => {
      const row = document.createElement('tr');
      headers.forEach(header => {
          const cell = document.createElement('td');
          if (header === 'incident_url') {
              // For URLs, create a hyperlink
              const link = document.createElement('a');
              link.href = incident[header];
              link.textContent = incident[header];
              link.target = '_blank';
              cell.appendChild(link);
          } else {
              cell.textContent = incident[header] || 'N/A';
          }
          row.appendChild(cell);
      });
      tbody.appendChild(row);
  });

  table.appendChild(tbody);
  return table;
}

