// api/chat.js

const { Configuration, OpenAIApi } = require('openai');

// Configuración de OpenAI con la clave de API desde variables de entorno
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

// Instancia de OpenAIApi
const openai = new OpenAIApi(configuration);

/**
 * Función para limpiar y sanitizar el mensaje del usuario
 * @param {string} message - Mensaje del usuario
 * @returns {string} - Mensaje sanitizado
 */
function sanitizeMessage(message) {
    // Puedes agregar más reglas de sanitización según tus necesidades
    return message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Función para construir el historial de la conversación
 * @param {Array} history - Historial de la conversación
 * @param {string} userMessage - Mensaje actual del usuario
 * @returns {Array} - Conversación completa para enviar a OpenAI
 */
function buildConversation(history, userMessage) {
    // Mensaje de sistema para establecer el contexto del bot
    const systemMessage = {
        role: 'system',
        content: `
            Eres Zentix, un chatbot de ventas y atención al cliente creado por minitienda express.
            - Tu sitio web oficial es minitienda.online.
            - Tu nombre es Zentix.
            - Ayudas a los usuarios a encontrar productos adecuados según sus necesidades.
            - Proporcionas información detallada sobre productos, precios y disponibilidad.
            - Respondes preguntas frecuentes de manera clara y concisa.
            - Recopilas información de leads de forma amigable y eficiente.
            - Mantienes una conversación fluida y profesional en todo momento.
            - Detectas oportunidades para generar leads y guiar al usuario a través del proceso de recopilación de datos.
            - Cuando un usuario proporciona su número de teléfono, generas un enlace de WhatsApp con un mensaje predefinido a +52 55 28 50 37 66.
            - Siempre proporcionas la información de contacto de minitienda.online cuando sea necesario.
            - Informas que Zentix es un chatbot disponible para cualquier empresa que desee mejorar su atención al cliente y ventas.
            - Si un usuario pregunta por tu nombre, debes responder que te llamas Zentix.
            - Si un usuario pregunta por tu función, debes describir que eres un chatbot de atención al cliente y ventas.
        `
    };

    // Evitar agregar múltiples mensajes de sistema al historial
    if (history.length === 0) {
        return [systemMessage, { role: 'user', content: userMessage }];
    } else {
        return [...history, { role: 'user', content: userMessage }];
    }
}

/**
 * Función para detectar y extraer un número de teléfono de un mensaje
 * @param {string} message - Mensaje del usuario
 * @returns {string|null} - Número de teléfono limpio o null si no se encuentra
 */
function extractPhoneNumber(message) {
    // Expresión regular para detectar números de teléfono en diferentes formatos
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\d{3}[-.\s]?){2}\d{4}/;
    const match = message.match(phoneRegex);
    if (match) {
        // Retornar el número limpio (solo dígitos)
        return match[0].replace(/[-.\s]/g, '');
    }
    return null;
}

/**
 * Función para generar el enlace de WhatsApp con un mensaje predefinido
 * @param {string} phoneNumber - Número de teléfono limpio
 * @returns {string} - Enlace de WhatsApp
 */
function generateWhatsAppLink(phoneNumber) {
    const prefilledMessage = encodeURIComponent('Hola, me gustaría obtener más información sobre sus productos.');
    return `https://wa.me/${phoneNumber}?text=${prefilledMessage}`;
}

/**
 * Función para realizar la llamada a OpenAI con reintentos
 * @param {Array} conversation - Conversación completa
 * @param {number} retries - Número de reintentos
 * @returns {Object} - Respuesta de OpenAI
 */
async function callOpenAI(conversation, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await openai.createChatCompletion({
                model: 'gpt-4',
                messages: conversation,
                temperature: 0.7, // Controla la creatividad de las respuestas
                max_tokens: 300,   // Aumenta el límite de tokens para respuestas más detalladas
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0.6,
                stop: [" Usuario:", " Zentix:"], // Se eliminó "\n" para evitar detenciones prematuras
            });
            return response;
        } catch (error) {
            console.error(`Intento ${attempt} fallido:`, error);
            if (attempt === retries) {
                throw error;
            }
            // Esperar antes de reintentar (exponencial)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
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

        // Llamada a la API de OpenAI con reintentos
        const response = await callOpenAI(conversation);

        let reply = response.data.choices[0].message.content.trim();

        // Verificar si el mensaje del usuario contiene un número de teléfono
        const phoneNumber = extractPhoneNumber(sanitizedMessage);
        if (phoneNumber) {
            const whatsappLink = generateWhatsAppLink(phoneNumber);
            // Agregar el enlace de WhatsApp a la respuesta del bot como URL directa
            reply += `\n¡Por supuesto! Aquí tienes el enlace directo para contactarnos a través de WhatsApp: ${whatsappLink}`;
        }

        res.status(200).json({ reply });
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);

        res.status(500).json({ error: 'Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.' });
    }
};
