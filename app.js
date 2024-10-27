// frontend/app.js

document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');

    // URL del Backend para enviar Leads
    const GOOGLE_SHEETS_URL = '/api/leads'; // Cambio aquí

    // Historial de la conversación
    let conversationHistory = [];

    // Estado de la conversación
    let conversationState = 'normal'; // Puede ser 'normal', 'collecting_name', 'collecting_email', 'collecting_phone'
    let leadData = {
        name: '',
        email: '',
        phone: ''
    };

    // Función para agregar mensajes al chat
    function addMessage(content, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.innerText = content;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Función para mostrar un mensaje de carga
    function showLoading() {
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('message', 'bot', 'loading');
        loadingElement.innerHTML = `
            <span>...</span>
            <style>
                .loading span {
                    display: inline-block;
                    animation: dots 1s steps(5, end) infinite;
                }

                @keyframes dots {
                    0%, 20% {
                        color: rgba(0,0,0,0.0);
                        text-shadow:
                            .25em 0 0 rgba(0,0,0,0.2),
                            .5em 0 0 rgba(0,0,0,0.2);
                    }
                    40% {
                        color: black;
                        text-shadow:
                            .25em 0 0 rgba(0,0,0,0.2),
                            .5em 0 0 rgba(0,0,0,0.2);
                    }
                    60% {
                        text-shadow:
                            .25em 0 0 rgba(0,0,0,0.2),
                            .5em 0 0 rgba(0,0,0,0.2);
                    }
                    80%, 100% {
                        text-shadow:
                            .25em 0 0 rgba(0,0,0,0.2),
                            .5em 0 0 rgba(0,0,0,0.2);
                    }
                }
            </style>
        `;
        chatMessages.appendChild(loadingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return loadingElement;
    }

    // Función para enviar datos de lead a Google Sheets a través del backend
    async function sendLeadToGoogleSheets(lead) {
        try {
            const response = await fetch(GOOGLE_SHEETS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(lead)
            });

            const data = await response.json();
            if (data.status === 'success') {
                addMessage('¡Gracias por proporcionar tu información! Nos pondremos en contacto contigo pronto.', 'bot');
            } else {
                addMessage('Hubo un problema al guardar tu información. Por favor, inténtalo de nuevo más tarde.', 'bot');
                console.error('Error al guardar en Google Sheets:', data.message);
            }
        } catch (error) {
            addMessage('Hubo un error al conectar con nuestros servicios. Por favor, inténtalo de nuevo más tarde.', 'bot');
            console.error('Error en sendLeadToGoogleSheets:', error);
        }
    }

    // Función para manejar la recolección de información de leads
    async function handleLeadCollection(message) {
        if (conversationState === 'collecting_name') {
            leadData.name = message;
            conversationState = 'collecting_email';
            addMessage('Gracias, ¿cuál es tu correo electrónico?', 'bot');
        } else if (conversationState === 'collecting_email') {
            // Validar correo electrónico
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(message)) {
                addMessage('Por favor, ingresa un correo electrónico válido.', 'bot');
                return;
            }
            leadData.email = message;
            conversationState = 'collecting_phone';
            addMessage('Perfecto, ¿cuál es tu número de teléfono?', 'bot');
        } else if (conversationState === 'collecting_phone') {
            // Validar teléfono (simplemente verificar que no esté vacío)
            if (message.length < 7) {
                addMessage('Por favor, ingresa un número de teléfono válido.', 'bot');
                return;
            }
            leadData.phone = message;
            conversationState = 'normal';
            addMessage('¡Gracias por proporcionar tu información! Un representante se pondrá en contacto contigo pronto.', 'bot');
            // Enviar los datos a Google Sheets a través del backend
            await sendLeadToGoogleSheets(leadData);
            // Resetear los datos de lead
            leadData = { name: '', email: '', phone: '' };
        }
    }

    // Manejar el envío del formulario
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        userInput.value = '';
        userInput.focus();

        if (conversationState !== 'normal') {
            // Si estamos en el proceso de recolectar información de lead
            await handleLeadCollection(message);
            return;
        }

        // Mostrar mensaje de cargando
        const loadingMessage = showLoading();

        try {
            const response = await fetch('https://zentix.vercel.app/api/chat', { // Asegúrate de que esta URL sea correcta
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message, history: conversationHistory })
            });

            const data = await response.json();
            chatMessages.removeChild(loadingMessage);
            addMessage(data.reply, 'bot');

            // Añadir la respuesta del bot al historial
            conversationHistory.push({ role: 'assistant', content: data.reply });

            // Detectar si el bot quiere recolectar información de lead
            const botIntent = data.reply.toLowerCase();

            // Personalizar las condiciones de detección según tus necesidades
            if (botIntent.includes('para ayudarte mejor') || botIntent.includes('necesitamos algunos datos')) {
                conversationState = 'collecting_name';
                addMessage('¡Genial! Para ayudarte mejor, por favor proporciona tu nombre.', 'bot');
            }

            // Añadir al historial la interacción del usuario
            conversationHistory.push({ role: 'user', content: message });

        } catch (error) {
            chatMessages.removeChild(loadingMessage);
            addMessage('Lo siento, hubo un error. Inténtalo de nuevo.', 'bot');
            console.error(error);
        }
    });
});
