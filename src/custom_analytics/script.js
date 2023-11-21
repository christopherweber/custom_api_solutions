document.addEventListener('DOMContentLoaded', () => {
    fetch('../sidebar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebar-placeholder').innerHTML = data;
            attachFormSubmitListener();
        })
        .catch(error => console.error('Error loading the sidebar:', error));
});

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
        console.log("Received data:", data); // Debugging line
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

    if (!data || !data.incidents || data.incidents.length === 0) {
        reportResultsElement.textContent = 'No data to display.';
        return;
    }

    // Create and populate table
    const table = createTable(data.incidents);
    reportResultsElement.appendChild(table);

    // Create CSV download link
    const csvDownloadLink = createCSVDownloadLink(data.csv);
    reportResultsElement.appendChild(csvDownloadLink);
}

function createTable(incidents) {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create headers based on incident fields
    const headers = ['id', 'name', 'created_at', 'started_at', 'discarded_at', 'summary', 'customer_impact_summary', 'description', 'current_milestone', 'number', 'priority', 'severity', /* Add other headers as necessary */];
    const headerRow = document.createElement('tr');
    headers.forEach(headerText => {
        const header = document.createElement('th');
        header.textContent = headerText;
        headerRow.appendChild(header);
    });
    thead.appendChild(headerRow);

    // Create rows
    incidents.forEach(incident => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const cell = document.createElement('td');
            cell.textContent = incident[header] || ''; // Handle null or undefined values
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
}

function createCSVDownloadLink(csvData) {
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
    link.download = 'incidents_report.csv';
    link.textContent = 'Download CSV';
    return link;
}