// api/leads.js

const fetch = require('node-fetch'); // Asegúrate de tener 'node-fetch' instalado

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Faltan datos de lead' });
    }

    try {
        const sheetUrl = 'https://script.google.com/macros/s/AKfycbzJzjMUfhTLQ5JakBmRq3j8SwgTrMFnCWdd1N4q03ihoZ6AgGHCIOjA00oAhwYnYYX5/exec'; // Reemplaza con tu URL de Web App

        const response = await fetch(sheetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, phone })
        });

        const data = await response.json();

        if (data.status === 'success') {
            res.status(200).json({ status: 'success' });
        } else {
            res.status(500).json({ status: 'error', message: data.message });
        }
    } catch (error) {
        console.error('Error al enviar a Google Sheets:', error);
        res.status(500).json({ status: 'error', message: 'Error al enviar datos a Google Sheets' });
    }
};
