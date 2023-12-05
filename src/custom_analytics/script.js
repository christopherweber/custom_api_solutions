document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('analyticsForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  const addFilterBtn = document.getElementById('addFilterBtn');
  if (addFilterBtn) {
    addFilterBtn.addEventListener('click', addFilter);
  }

  const backToActionsBtn = document.getElementById('backToActions');
  if (backToActionsBtn) {
    backToActionsBtn.addEventListener('click', goBack);
  }
});

function goBack() {
  window.history.back();
}

function handleSubmit(event) {
  event.preventDefault();
  const authToken = document.getElementById('authToken').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  fetchAnalyticsData(authToken, startDate, endDate);
}

function fetchAnalyticsData(authToken, startDate, endDate) {
  showLoadingMessage();
  fetch('/.netlify/functions/getAnalytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authToken, startDate, endDate })
  })
  .then(response => response.json())
  .then(data => {
    hideLoadingMessage();
    displayReportResults(data);
  })
  .catch(error => {
    console.error('Error:', error);
    hideLoadingMessage();
  });
}

function addFilter() {
  const filtersContainer = document.getElementById('additionalFilters');
  filtersContainer.style.display = 'block';
  const newFilter = document.createElement('div');
  newFilter.className = 'form-field';
  newFilter.innerHTML = `
    <label for="milestoneDropdown">Milestone:</label>
    <select id="milestoneDropdown">
      <option value="started">Started</option>
      // Add other options as needed
    </select>
  `;
  filtersContainer.appendChild(newFilter);
}

function showLoadingMessage() {
  const loadingElement = document.getElementById('loadingMessage');
  loadingElement.textContent = 'Loading... Please wait.';
  loadingElement.style.display = 'block';
}

function hideLoadingMessage() {
  const loadingElement = document.getElementById('loadingMessage');
  loadingElement.style.display = 'none';
}

function displayReportResults(data) {
  const reportResultsElement = document.getElementById('reportResults');
  reportResultsElement.innerHTML = ''; // Clear previous results

  if (!data || !data.incidents || data.incidents.length === 0) {
      reportResultsElement.textContent = 'No data to display.';
      return;
  }

  // Create and display the table with incident data
  const table = createTable(data.incidents);
  reportResultsElement.appendChild(table);

  // Create and show the CSV download button
  const downloadCsvButton = document.createElement('button');
  downloadCsvButton.id = 'exportCsv';
  downloadCsvButton.textContent = 'Export to CSV';
  downloadCsvButton.addEventListener('click', function() {
      if (!data.csv) {
          alert('No CSV data available to download.');
          return;
      }
      const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'analytics-report.csv';
      link.click();
  });

  reportResultsElement.appendChild(downloadCsvButton);
}


function createAndShowDownloadButton(csvData) {
  // Create a new button element for downloading CSV
  const downloadCsvButton = document.createElement('button');
  downloadCsvButton.id = 'exportCsv';
  downloadCsvButton.textContent = 'Export to CSV';
  downloadCsvButton.addEventListener('click', function() {
      if (!csvData) {
          alert('No CSV data available to download.');
          return;
      }
      // Create a Blob from the CSV data and trigger the download
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'analytics-report.csv';
      link.click();
  });

  // Append the button to the report results element
  const reportResultsElement = document.getElementById('reportResults');
  reportResultsElement.appendChild(downloadCsvButton);
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

  
  document.getElementById('downloadCsv').addEventListener('click', function() {
    if (!csvData) {
        alert('No CSV data available to download.');
        return;
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'analytics-report.csv';
    link.click();
});
