document.addEventListener('DOMContentLoaded', function() {
    fetch('../sidebar.html')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
    })
    .then(data => {
        document.getElementById('sidebar-placeholder').innerHTML = data;
        attachBulkServiceFormListener();
        attachCSVUploadListener();
    })
    .catch(error => console.error('Error loading the sidebar:', error));
    const form = document.getElementById('componentForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const componentName = document.getElementById('componentName').value;
        const componentGroup = document.getElementById('componentGroup').value;
        const csvFile = document.getElementById('csvFileUpload').files[0];

        if (csvFile) {
            handleCSVUpload(csvFile);
        } else if (componentName && componentGroup) {
            handleManualInput(componentName, componentGroup);
        } else {
            alert('Please enter component details or upload a CSV file.');
        }
    });
});

function handleCSVUpload(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const csvContent = event.target.result;
        sendToBackend({ csv: csvContent });
    };
    reader.readAsText(file);
}

function handleManualInput(componentName, componentGroup) {
    sendToBackend({ componentName, componentGroup });
}

function sendToBackend(data) {
    fetch('/.netlify/functions/processComponents', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Components processed successfully.');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error processing components.');
    });
}
