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
            populateMilestoneOptions();
            attachFormSubmitListener();
        })
        .catch(error => console.error('Error loading the sidebar:', error));
});

function populateMilestoneOptions() {
    const milestonesSequence = [
        "started",
        "detected",
        "acknowledged",
        "investigating",
        "identified",
        "mitigated",
        "resolved",
        "postmortem_started",
        "postmortem_completed"
    ];
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    const startingMilestoneSelect = document.getElementById('startingMilestone');
    const targetMilestoneSelect = document.getElementById('targetMilestone');

    milestonesSequence.forEach(milestone => {
        startingMilestoneSelect.options.add(new Option(capitalize(milestone), milestone));
        targetMilestoneSelect.options.add(new Option(capitalize(milestone), milestone));
    });
}

function showLoadingMessage() {
    const loadingElement = document.getElementById('loadingMessage');
    loadingElement.textContent = 'Loading... Please wait.';
    loadingElement.style.display = 'block'; // Show the loading message
}


function showSuccessMessage() {
    const successElement = document.getElementById('successMessage');
    successElement.textContent = 'All incidents have been processed.';
    successElement.style.display = 'block';

    // Hide the loading message
    hideLoadingMessage();

    setTimeout(() => {
        successElement.style.display = 'none';
    }, 3000);
}

function hideLoadingMessage() {
    document.getElementById('loadingMessage').style.display = 'none'; // Hide the loading message
}



function attachFormSubmitListener() {
    const form = document.getElementById('milestoneUpdateForm');
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const confirmed = window.confirm("This will move ALL incidents with this milestone. Are you sure you want to proceed?");
        if (!confirmed) {
            return; // Stop the function if the user does not confirm
        }

        const authToken = document.getElementById('authToken').value;
        const startingMilestone = document.getElementById('startingMilestone').value;
        const targetMilestone = document.getElementById('targetMilestone').value;

        showLoadingMessage();
        updateMilestones(authToken, startingMilestone, targetMilestone);
    });
}

function updateMilestones(authToken, startingMilestone, targetMilestone) {
    // Show the loading message
    showLoadingMessage();

    // Make a POST request to the Netlify function
    fetch('/.netlify/functions/updateMilestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken, startingMilestone, targetMilestone })
    })
    .then(response => {
        // If the response is not OK, throw an error
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        // Parse the JSON response
        return response.json();
    })
    .then(data => {
        // Handle successful response
        // Show the success message
        showSuccessMessage();
        console.log(data.message);
        document.getElementById('milestoneUpdateForm').reset();
    })
    .catch(error => {
        // Handle any errors
        console.error('Error:', error);
    })
    .finally(() => {
        // Hide the loading message whether the request succeeded or failed
        hideLoadingMessage();
    });
}

