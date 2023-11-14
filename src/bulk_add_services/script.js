document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bulkServiceForm');
    const addButton = document.getElementById('addServiceButton');
    const container = document.getElementById('serviceFieldsContainer');

    addButton.addEventListener('click', () => {
        const newFieldSet = container.firstElementChild.cloneNode(true);
        newFieldSet.querySelectorAll('input').forEach(input => input.value = '');
        container.appendChild(newFieldSet);
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const services = [];
        for (let i = 0; i < container.children.length; i++) {
            services.push({
                authToken: formData.get(`authToken[${i}]`),
                remoteId: formData.get(`remoteId[${i}]`),
                connectionType: formData.get(`connectionType[${i}]`)
            });
        }

        try {
            const response = await fetch('/.netlify/functions/bulkAddServices', {
                method: 'POST',
                body: JSON.stringify({ services }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Network response was not ok.');
            const result = await response.json();
            console.log(result);
        } catch (error) {
            console.error('Error:', error);
        }
    });
});
