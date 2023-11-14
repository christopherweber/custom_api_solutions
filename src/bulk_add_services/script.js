document.addEventListener('DOMContentLoaded', () => {
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
});

function attachBulkServiceFormListener() {
    const form = document.getElementById('bulkServiceForm');
    const serviceFieldsContainer = document.getElementById('serviceFieldsContainer');
    const authTokenInput = document.getElementById('authToken');

    if (!form) {
        console.error('Bulk service form not found.');
        return;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const confirmation = confirm("Are you sure you want to submit the services?");
        if (!confirmation) {
            return;
        }

        const authToken = authTokenInput.value;
        let services = [];
        const csvFile = document.getElementById('csvFileUpload').files[0];

        if (csvFile) {
            parseCSV(csvFile, parsedServices => {
                services = parsedServices;
                submitServices(authToken, services);
            });
        } else {
            services = Array.from(serviceFieldsContainer.querySelectorAll('.serviceFields')).map(fields => ({
                name: fields.querySelector('[name="serviceName"]').value,
                remoteId: fields.querySelector('[name="remoteId"]').value,
                connectionType: fields.querySelector('[name="connectionType"]').value
            }));
            submitServices(authToken, services);
        }

        // Clear form fields after submission
        form.reset();
        setFieldsRequired(true);
        serviceFieldsContainer.style.display = '';
    });

    document.getElementById('addServiceButton').addEventListener('click', function() {
        const newFieldSet = serviceFieldsContainer.firstElementChild.cloneNode(true);
        newFieldSet.querySelectorAll('input').forEach(input => input.value = '');
        serviceFieldsContainer.appendChild(newFieldSet);
    });
}

function attachCSVUploadListener() {
    const csvUploadInput = document.getElementById('csvFileUpload');
    const serviceFieldsContainer = document.getElementById('serviceFieldsContainer');
    const csvUploadMessage = document.getElementById('csvUploadMessage'); // Add this element in your HTML for the message

    csvUploadInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            setFieldsRequired(false);
            serviceFieldsContainer.style.display = 'none';
            csvUploadMessage.textContent = 'CSV file uploaded successfully.'; // Display message
        } else {
            setFieldsRequired(true);
            serviceFieldsContainer.style.display = '';
            csvUploadMessage.textContent = ''; // Clear message
        }
    });
}

function setFieldsRequired(isRequired) {
    const serviceFields = document.querySelectorAll('.serviceFields input');
    serviceFields.forEach(field => {
        field.required = isRequired;
    });
}

function parseCSV(file, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const data = text.split('\n').slice(1).filter(row => row).map(row => {
            const [name, remoteId, connectionType] = row.split(',');
            return { name, remoteId, connectionType };
        });
        callback(data);
    };
    reader.readAsText(file);
}

function submitServices(authToken, services) {
    fetch('/.netlify/functions/bulkAddServices', {
        method: 'POST',
        body: JSON.stringify({ authToken, services }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok. Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert('Services added successfully');
    })
    .catch(error => {
        alert(`An error occurred: ${error.message}`);
        console.error('Service addition failed:', error);
    });
}
