// document.addEventListener('DOMContentLoaded', () => {
//     fetch('../sidebar.html')
//       .then(response => response.text())
//       .then(data => {
//         document.getElementById('sidebar-placeholder').innerHTML = data;
//         attachFormSubmitListener();
//       })
//       .catch(error => console.error('Error loading the sidebar:', error));
//   });
  
  function attachFormSubmitListener() {
    const form = document.getElementById('analyticsForm');
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      const authToken = document.getElementById('authToken').value;
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      showLoadingMessage();
      fetchAnalyticsData(authToken, startDate, endDate);
    });
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
  
  function showLoadingMessage() {
    const loadingElement = document.getElementById('loadingMessage');
    loadingElement.textContent = 'Loading... Please wait.';
    loadingElement.style.display = 'block';
  }
  
  function hideLoadingMessage() {
    document.getElementById('loadingMessage').style.display = 'none';
  }
  
  function displayReportResults(data) {
    const reportResultsElement = document.getElementById('reportResults');
    reportResultsElement.innerHTML = '';
    
    if (!data || !Array.isArray(data.incidents) || data.incidents.length === 0) {
        reportResultsElement.textContent = 'No data to display.';
        return;
    }

    const selectedMilestones = Array.from(document.getElementById('milestoneFilter').selectedOptions).map(option => option.value);
    const filteredIncidents = data.incidents.filter(incident => 
        incident.milestones.some(milestone => selectedMilestones.includes(milestone.type))
    );

    const table = createTable(filteredIncidents);
    reportResultsElement.appendChild(table);
}
  
function createTable(incidents) {
    const table = document.createElement('table');
    table.setAttribute('border', '1');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headers = ['id', 'name', 'created_at', 'started_at', 'severity', 'priority', 'tags', 'custom_fields', 'opened_by', 'milestones', 'impacts', 'lessons_learned'];
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
        if (header === 'lessons_learned') {
          cell.innerHTML = incident[header] ? incident[header] : 'N/A';
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