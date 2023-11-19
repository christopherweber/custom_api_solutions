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
    document.getElementById('loadingMessage').textContent = 'Working on it!';
}

function showSuccessMessage() {
    document.getElementById('loadingMessage').textContent = '';
    document.getElementById('successMessage').textContent = 'All incidents have been processed.';
}

function attachFormSubmitListener() {
    const form = document.getElementById('milestoneUpdateForm');
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const confirmed = window.confirm("This will move ALL incidents with this milestone. Are you sure you want to process?");
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
