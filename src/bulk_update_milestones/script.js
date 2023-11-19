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

    const startingMilestoneSelect = document.getElementById('startingMilestone');
    const targetMilestoneSelect = document.getElementById('targetMilestone');

    milestonesSequence.forEach(milestone => {
        startingMilestoneSelect.options.add(new Option(milestone, milestone));
        targetMilestoneSelect.options.add(new Option(milestone, milestone));
    });
}

function attachFormSubmitListener() {
    const form = document.getElementById('milestoneUpdateForm');
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const authToken = document.getElementById('authToken').value;
        const startingMilestone = document.getElementById('startingMilestone').value;
        const targetMilestone = document.getElementById('targetMilestone').value;

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
        // Handle successful response
    })
    .catch(error => {
        console.error('Error:', error);
        // Handle error response
    });
}
