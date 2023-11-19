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
    loadingElement.textContent = 'Working on it...';
    loadingElement.style.display = 'block';
}

function showSuccessMessage() {
    const successElement = document.getElementById('successMessage');
    successElement.textContent = 'All incidents have been processed.';
    successElement.style.display = 'block';
    document.getElementById('loadingMessage').style.display = 'none'; // Hide loading message
}

function hideMessages() {
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
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
    hideMessages();
    fetch('/.netlify/functions/updateMilestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authToken, startingMilestone, targetMilestone })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
    })
    .then(data => {
        console.log(data.message);
        showSuccessMessage();
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('loadingMessage').textContent = ''; 
    });
}
