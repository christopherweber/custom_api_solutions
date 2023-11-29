document.addEventListener('DOMContentLoaded', function() {
    fetchSidebar();
    setupFormListener();
    attachCSVUploadListener();
});

function attachCSVUploadListener() {
    const csvUploadInput = document.getElementById('csvFileUpload');
    const componentFieldsContainer = document.getElementById('componentFieldsContainer'); // Adjust the ID to match your form
    const csvUploadMessage = document.getElementById('csvUploadMessage'); // Ensure you have a span/div for this message

    csvUploadInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            componentFieldsContainer.style.display = 'none'; // Hide the component fields
            csvUploadMessage.textContent = 'CSV file uploaded successfully.';
            csvUploadMessage.style.display = 'block'; // Show the message
        } else {
            componentFieldsContainer.style.display = ''; // Show the component fields
            csvUploadMessage.style.display = 'none'; // Hide the message
        }
    });
}

function fetchSidebar() {
    fetch('../sidebar.html')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
    })
    .then(data => {
        document.getElementById('sidebar-placeholder').innerHTML = data;
    })
    .catch(error => console.error('Error loading the sidebar:', error));
}

function setupFormListener() {
    const form = document.getElementById('componentForm');
    form.addEventListener('submit', handleSubmit);
}

function handleSubmit(e) {
    e.preventDefault();

    const authToken = document.getElementById('authToken').value;
    const statusPageId = document.getElementById('statusPageId').value;
    const componentName = document.getElementById('componentName').value;
    const componentGroup = document.getElementById('componentGroup').value;
    const csvFile = document.getElementById('csvFileUpload').files[0];

    const data = { authToken, statusPageId };

    if (csvFile) {
        handleCSVUpload(csvFile, data);
    } else if (componentName && componentGroup) {
        data.componentName = componentName;
        data.componentGroup = componentGroup;
        sendDataToBackend(data);
    } else {
        alert('Please enter component details or upload a CSV file.');
    }
}

function handleCSVUpload(file, data) {
    const reader = new FileReader();
    reader.onload = function(event) {
        data.csv = event.target.result;
        console.log(`CSV content being sent: ${data.csv}`); // Log the CSV content to be sure it's complete
        document.getElementById('optionalCsvText').style.display = 'none';
        sendDataToBackend(data);
    };
    reader.onerror = function(error) {
        console.log('Error reading CSV:', error);
        alert('Failed to read the CSV file.');
    };
    reader.readAsText(file);
}

function sendDataToBackend(data) {
    fetch('/.netlify/functions/processComponents', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        alert('Components processed successfully.');
        document.getElementById('errorMessage').style.display = 'none'; // Hide error message on success
    })
    .catch(error => {
        console.error('Error:', error);
        displayErrorMessage(error.message || 'An unexpected error occurred.');
    });
}

function displayErrorMessage(message) {
    const errorMessageDiv = document.getElementById('errorMessage');
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block'; // Show the error message
}
