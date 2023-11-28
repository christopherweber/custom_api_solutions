document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('componentForm');
    form.addEventListener('submit', function(e) {
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
    });
});

function handleCSVUpload(file, data) {
    const reader = new FileReader();
    reader.onload = function(event) {
        data.csv = event.target.result;
        sendDataToBackend(data);
    };
    reader.readAsText(file);
}

function sendDataToBackend(data) {
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
