document.addEventListener('DOMContentLoaded', () => {

        fetch('../sidebar.html') // Make sure the path to sidebar.html is correct
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
          })
          .then(data => {
            document.getElementById('sidebar-placeholder').innerHTML = data;
            // Ensure the form is present in the sidebar HTML
            // Then attach the event listener to the form
            attachFormSubmitListener();
          })
          .catch(error => console.error('Error loading the sidebar:', error));

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
