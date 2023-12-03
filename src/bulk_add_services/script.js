function getSelectedFunctionalities() {
    const selectedOptions = document.getElementById('functionalities').selectedOptions;
    return Array.from(selectedOptions).map(opt => ({ id: opt.value }));
}

    document.getElementById('csv-instructions-link').addEventListener('click', function() {
        var instructions = document.querySelector('.instructions-container');
        instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
    });


function fetchFunctionalities() {
    const authToken = document.getElementById('authToken').value;
    console.log("Fetching functionalities with authToken:", authToken);

    fetch(`/.netlify/functions/fetchFunctionalities?authToken=${encodeURIComponent(authToken)}`)
    .then(response => {
        console.log("Response received:", response);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(responseObject => {
        console.log("Data received:", responseObject);

        // Access the functionalities array nested under 'data'
        const functionalitiesArray = responseObject.data;

        const functionalitiesDropdown = document.getElementById('functionalities');
        functionalitiesDropdown.innerHTML = ''; // Clear existing options

        functionalitiesArray.forEach(func => {
            const option = document.createElement('option');
            option.value = func.id;
            option.textContent = func.name;
            functionalitiesDropdown.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error fetching functionalities:', error);
    });
}


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

    document.getElementById('functionalities').addEventListener('click', function() {
        const authToken = document.getElementById('authToken').value;
        console.log("Functionalites clicked, authtoken: " + authToken)
        if (authToken && this.options.length === 0) { // Check if authToken exists and dropdown is empty
            fetchFunctionalities(authToken);
            console.log("Succeeded")
        }
    });
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
                connectionType: fields.querySelector('[name="connectionType"]').value,
                alertOnAdd: document.getElementById('alertOnAdd').checked,
                autoAddRespondingTeam: document.getElementById('autoAddRespondingTeam').checked,
                ownerId: document.getElementById('ownerId').value,
                description: document.getElementById('description').value,
                teamsId: document.getElementById('teamsId').value,
                functionalities: getSelectedFunctionalities()
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
    const csvUploadMessage = document.getElementById('csvUploadMessage');

    csvUploadInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            setFieldsRequired(false);
            serviceFieldsContainer.style.display = 'none';
            csvUploadMessage.textContent = 'CSV file uploaded successfully.';
            csvUploadMessage.style.display = 'block'; // Show the message
        } else {
            setFieldsRequired(true);
            serviceFieldsContainer.style.display = '';
            csvUploadMessage.style.display = 'none'; // Hide the message
        }
    });
}



function setFieldsRequired(isRequired) {
    const requiredFields = document.querySelectorAll('.serviceFields input[required], .serviceFields select[required]');
    requiredFields.forEach(field => {
        field.required = isRequired;
    });
}


const columnMapping = {
    'name': 'name',
    'description': 'description',
    'remoteId': 'remoteId',
    'connectionType': 'connectionType',
    'alertOnAdd': 'alertOnAdd',
    'autoAddRespondingTeam': 'autoAddRespondingTeam',
    'ownerId': 'ownerId',
    'teamsId': 'teamsId',
    'functionalitiesId': 'functionalitiesId'
};


function parseCSV(file, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());

        const data = lines.slice(1).filter(line => line).map(line => {
            const values = line.split(',').map(value => value.trim());
            let serviceObject = {};

            headers.forEach((header, index) => {
                const key = columnMapping[header];
                if (key) {
                    if (key === 'alertOnAdd' || key === 'autoAddRespondingTeam') {
                        serviceObject[key] = values[index].toLowerCase() === 'true';
                    } else if (key === 'functionalitiesId') {
                        serviceObject['functionalities'] = values[index] ? [{ id: values[index] }] : [];
                    } else if (key === 'teamsId') {
                        serviceObject['teams'] = values[index] ? [{ id: values[index] }] : [];
                    } else {
                        serviceObject[key] = values[index] || null;
                    }
                }
            });

            console.log("Parsed Service Object:", serviceObject);
            return serviceObject;
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
