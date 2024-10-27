// api/chat.js

const { Configuration, OpenAIApi } = require('openai');

// Configuración de OpenAI con la clave de API desde variables de entorno
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

// Instancia de OpenAIApi
const openai = new OpenAIApi(configuration);

// Función para limpiar y sanitizar el mensaje del usuario
function sanitizeMessage(message) {
    // Puedes agregar más reglas de sanitización según tus necesidades
    return message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Función para construir el historial de la conversación
function buildConversation(history, userMessage) {
    // Mensaje de sistema para establecer el contexto del bot
    const systemMessage = {
        role: 'system',
        content: `
            Eres Zentix, un chatbot de ventas y atención al cliente creado por minitienda express.
            - Ayudas a los usuarios a encontrar productos adecuados según sus necesidades.
            - Proporcionas información detallada sobre productos, precios y disponibilidad.
            - Respondes preguntas frecuentes de manera clara y concisa.
            - Recopilas información de leads de forma amigable y eficiente.
            - Mantienes una conversación fluida y profesional en todo momento.
            - Detectas oportunidades para generar leads y guiar al usuario a través del proceso de recopilación de datos.
            - Cuando un usuario proporciona su número de teléfono, generas un enlace de WhatsApp con un mensaje predefinido a +52 55 28 50 37 66.
            - Siempre proporcionas la información de contacto de minitienda.online cuando sea necesario.
        `
    };

    // Combinar el mensaje de sistema con el historial y el mensaje actual del usuario
    return [
        systemMessage,
        ...history,
        { role: 'user', content: userMessage }
    ];
}

// Función para detectar si un mensaje contiene un número de teléfono
function containsPhoneNumber(message) {
    // Expresión regular para detectar números de teléfono (ajusta según tus necesidades)
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\d{3}[-.\s]?){2}\d{4}/;
    return phoneRegex.test(message);
}

// Función para generar el enlace de WhatsApp
function generateWhatsAppLink(phoneNumber) {
    const prefilledMessage = encodeURIComponent('Hola, me gustaría obtener más información sobre sus productos.');
    return `https://wa.me/${phoneNumber}?text=${prefilledMessage}`;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { message, history } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Mensaje vacío' });
    }

    // Sanitizar el mensaje del usuario
    const sanitizedMessage = sanitizeMessage(message);

    try {
        // Construir la conversación completa
        const conversation = buildConversation(history || [], sanitizedMessage);

        // Llamada a la API de OpenAI
        const response = await openai.createChatCompletion({
            model: 'gpt-4',
            messages: conversation,
            temperature: 0.7, // Controla la creatividad de las respuestas
            max_tokens: 200,  // Aumenta el límite de tokens para respuestas más detalladas
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0.6,
            stop: ["\n", " Usuario:", " Zentix:"],
        });

        let reply = response.data.choices[0].message.content.trim();

        // Verificar si el mensaje del usuario contiene un número de teléfono
        if (containsPhoneNumber(sanitizedMessage)) {
            // Extraer el número de teléfono usando la expresión regular
            const phoneMatch = sanitizedMessage.match(/(\+?\d{1,3}[-.\s]?)?(\d{3}[-.\s]?){2}\d{4}/);
            if (phoneMatch) {
                const phoneNumber = phoneMatch[0].replace(/[-.\s]/g, ''); // Limpiar el número
                const whatsappLink = generateWhatsAppLink(phoneNumber);
                // Agregar el enlace de WhatsApp a la respuesta del bot
                reply += `\nPuedes contactarnos directamente a través de WhatsApp haciendo clic en el siguiente enlace: ${whatsappLink}`;
            }
        }

        res.status(200).json({ reply });
    } catch (error) {
        console.error('Error al comunicarse con OpenAI:', error);

        // Manejo de errores específicos de OpenAI
        if (error.response) {
            console.error('Error Response:', error.response.status, error.response.data);
            res.status(error.response.status).json({ error: error.response.data });
        } else {
            res.status(500).json({ error: 'Error al procesar la solicitud' });
        }
    }
};
