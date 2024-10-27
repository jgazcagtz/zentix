// api/chat.js

const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Mensaje vacío' });
    }

    try {
        const response = await openai.createChatCompletion({
            model: 'gpt-4',
            messages: [{ role: 'user', content: message }],
            temperature: 0.7,
            max_tokens: 150,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0.6,
            stop: ["\n", " Usuario:", " Zentix:"],
        });

        const reply = response.data.choices[0].message.content.trim();

        res.status(200).json({ reply });
    } catch (error) {
        console.error('Error al comunicarse con OpenAI:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
};
