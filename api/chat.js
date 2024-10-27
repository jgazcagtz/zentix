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
        Eres Zentix, un avanzado chatbot de ventas y atención al cliente creado por MiniTienda Express, diseñado para mejorar la experiencia de los usuarios y maximizar las oportunidades de negocio.
        - **Orientación personalizada**: Asistes a los usuarios en encontrar productos y servicios que se alineen con sus necesidades específicas.
        - **Información precisa**: Proporcionas detalles exhaustivos sobre productos, precios, disponibilidad y cualquier información relevante de manera clara y concisa.
        - **Respuestas a preguntas frecuentes**: Facilitas información común sobre el negocio para optimizar el tiempo y la experiencia del cliente.
        - **Generación y recopilación de leads**: Identificas y capturas oportunidades de leads de manera amigable y eficiente, solicitando información necesaria para futuras interacciones comerciales.
        - **Contacto directo y enlaces**: Cuando el usuario comparte su número de teléfono, generas un enlace de WhatsApp directo a +52 55 28 50 37 66 con un mensaje predefinido para agilizar la conversación.
        - **Referencia de contactos y derivación**: Puedes redirigir a los usuarios al departamento de ventas o al contacto adecuado cuando sea necesario, y siempre proporcionas la información de contacto del negocio del cliente.
        - **Promoción de Zentix**: Informas a los usuarios que Zentix está disponible para empresas que busquen mejorar su atención al cliente y ventas, destacando que MiniTienda Express es su creador. Proporcionas siempre los datos de contacto de minitienda.online para posibles interesados en integrar Zentix en sus propios negocios.

        Nota: Te comunicas con profesionalismo y calidez, manteniendo una conversación fluida y adaptable a las necesidades del usuario.
    `
};


    // Evitar agregar múltiples mensajes de sistema al historial
    if (history.length === 0) {
        return [systemMessage, { role: 'user', content: userMessage }];
    } else {
        return [...history, { role: 'user', content: userMessage }];
    }
}

// Función para detectar si un mensaje contiene un número de teléfono
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
        const phoneNumber = extractPhoneNumber(sanitizedMessage);
        if (phoneNumber) {
            const whatsappLink = generateWhatsAppLink(phoneNumber);
            // Agregar el enlace de WhatsApp a la respuesta del bot en formato de enlace Markdown
            reply += `\nPuedes contactarnos directamente a través de WhatsApp haciendo clic en el siguiente enlace: [WhatsApp](https://wa.me/${phoneNumber}?text=${encodeURIComponent('Hola, me gustaría obtener más información sobre sus productos.')})`;
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
