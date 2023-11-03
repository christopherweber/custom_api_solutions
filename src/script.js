document.getElementById('bulkUpdateForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const authToken = document.getElementById('authToken').value;
    const autoAlert = document.getElementById('autoAlert').value === "true";
    const autoAdd = document.getElementById('autoAdd').value === "true";

    try {
        const response = await fetch('https://5775d63d1acd.ngrok.app/update-services', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ authToken, autoAlert, autoAdd })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            alert('Services updated successfully!');
        } else {
            alert('Error updating services: ' + result.error);
        }
    } catch (error) {
        console.error('Error while sending request to backend:', error);
        alert('Failed to update services. Check the console for more information.');
    }
});

function toggleExpandableFields() {
    const fields = document.querySelector('.expandable-fields');
    fields.style.display = fields.style.display === 'none' ? 'block' : 'none';
}
