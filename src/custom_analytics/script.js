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

    // Check if the data is in the expected format
    if (!data || !data.data || data.data.length === 0) {
        reportResultsElement.textContent = 'No data to display.';
        return;
    }

    // Assuming data is wrapped in a "data" key as per your example
    const incidents = data.data;

    // Extract and display only the IDs
    const ids = incidents.map(incident => incident.id);
    const list = document.createElement('ul');
    ids.forEach(id => {
        const listItem = document.createElement('li');
        listItem.textContent = id;
        list.appendChild(listItem);
    });

    reportResultsElement.appendChild(list);
}


function createTable(incidents) {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create headers based on keys of the first incident
    const headers = Object.keys(incidents[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(headerText => {
        const header = document.createElement('th');
        header.textContent = headerText;
        headerRow.appendChild(header);
    });
    thead.appendChild(headerRow);

    // Create rows for each incident
    incidents.forEach(incident => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const cell = document.createElement('td');
            if (header in incident) {
                // Check if the value is an object and convert it to string
                cell.textContent = typeof incident[header] === 'object' ? JSON.stringify(incident[header]) : incident[header];
            } else {
                cell.textContent = '';
            }
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
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