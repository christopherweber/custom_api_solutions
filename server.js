const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/update-services', async (req, res) => {
    const { authToken, autoAlert, autoAdd } = req.body;

    try {
        const servicesResponse = await axios.get('https://api.firehydrant.io/v1/services', {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const updatePromises = servicesResponse.data.map(service => {
            return axios.patch(`https://api.firehydrant.io/v1/services/${service.id}`, {
                alert_on_add: autoAlert,
                auto_add_responding_team: autoAdd
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
        });

        await Promise.all(updatePromises);

        res.json({ success: true });
    } catch (error) {
        console.error('Error during process:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Generic error handler
app.use((error, req, res, next) => {
    console.error('An error occurred:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
