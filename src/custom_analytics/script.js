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
        const by = document.getElementById('by').value;
        const bucketSize = document.getElementById('bucketSize').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        showLoadingMessage();
        fetchAnalyticsData(authToken, by, bucketSize, startDate, endDate);
    });
}

function fetchAnalyticsData(authToken, by, bucketSize, startDate, endDate) {
    // Show the loading message
    showLoadingMessage();

    // Make a POST request to the Netlify function
    fetch('/.netlify/functions/getMetrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken, by, bucketSize, startDate, endDate })
    })
    .then(response => response.json())
    .then(data => {
        // Handle successful response
        // Hide the loading message
        hideLoadingMessage();
        displayReportResults(data);
    })
    .catch(error => {
        // Handle any errors
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
    reportResultsElement.innerHTML = ''; // Clear previous results

    // Create a table element
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Assuming data is an array of objects
    if (data.length > 0) {
        // Create headers
        const headers = Object.keys(data[0]);
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            const header = document.createElement('th');
            header.textContent = headerText;
            headerRow.appendChild(header);
        });
        thead.appendChild(headerRow);

        // Create rows
        data.forEach(item => {
            const row = document.createElement('tr');
            Object.values(item).forEach(text => {
                const cell = document.createElement('td');
                cell.textContent = text;
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
    } else {
        reportResultsElement.textContent = 'No data to display.';
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    reportResultsElement.appendChild(table);
}
