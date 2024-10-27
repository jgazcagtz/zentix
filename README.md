# Zentix Chatbot

Zentix es un chatbot de ventas y atención al cliente optimizado para dispositivos móviles, construido con las últimas tendencias de diseño en 2024. Utiliza la API de OpenAI para respuestas inteligentes y almacena los datos de leads en Google Sheets.

## Características

- **Interfaz Moderna**: Diseño limpio y profesional con animaciones y transiciones fluidas.
- **Optimizado para Móviles**: Adaptado para ofrecer una excelente experiencia en dispositivos móviles.
- **Respuestas Inteligentes**: Utiliza la API de OpenAI para generar respuestas contextuales.
- **Almacenamiento de Leads**: Integra con Google Sheets para almacenar información de clientes potenciales.
- **Modular y Escalable**: Estructura de código que facilita futuras expansiones y mantenimientos.

## Tecnologías

- **Frontend**: HTML, CSS (Grid, Flexbox, Animaciones), JavaScript.
- **Backend**: Serverless en Vercel con Node.js.
- **Integración**: Google Apps Script y Google Sheets.

## Instalación

### Prerrequisitos

- **Cuenta en Vercel**: [Registrarse en Vercel](https://vercel.com/signup)
- **Clave de API de OpenAI**: [Obtener API Key](https://platform.openai.com/account/api-keys)
- **Cuenta de Google**: Para Google Sheets y Apps Script.

### Frontend

1. **Clonar el Repositorio:**

    ```bash
    git clone https://github.com/tu-usuario/zentix-chatbot.git
    cd zentix-chatbot/frontend
    ```

2. **Personalizar el Frontend:**

    - **Logo y Favicon**: Reemplaza `logo.png` y `favicon.ico` con tus propios archivos.
    - **Personalizar Estilos**: Modifica `styles.css` según tus preferencias de diseño.

3. **Servir el Frontend Localmente:**

    Puedes abrir `index.html` directamente en tu navegador o usar una extensión como **Live Server** en VSCode.

### Backend

1. **Configurar Variables de Entorno en Vercel:**

    - Accede al [Panel de Vercel](https://vercel.com/dashboard).
    - Selecciona tu proyecto y ve a `Settings` > `Environment Variables`.
    - Agrega una nueva variable:
        - **Name:** `OPENAI_API_KEY`
        - **Value:** `TU_CLAVE_API_DE_OPENAI`

2. **Instalar Dependencias del Backend:**

    Navega a la carpeta `api/` y ejecuta:

    ```bash
    npm install
    ```

3. **Desplegar el Backend en Vercel:**

    Desde la raíz del proyecto, ejecuta:

    ```bash
    vercel deploy
    ```

    Sigue las instrucciones para completar el despliegue.

### Google Sheets

1. **Configurar el Google Sheet y el Apps Script:**

    Sigue las instrucciones en [Integración con Google Sheets](#integración-con-google-sheets).

2. **Actualizar la Web App URL:**

    Reemplaza la URL de la Web App en `frontend/app.js` con la tuya.

## Despliegue

Sigue las instrucciones en [Instrucciones para Implementar en Vercel](#instrucciones-de-deploy-en-vercel).

## Uso

1. **Acceder al Chatbot:**

    Abre la aplicación en tu dispositivo móvil accediendo a la URL desplegada por Vercel.

2. **Interacción:**

    - Escribe tus consultas o solicita información de productos.
    - Recepción de respuestas inteligentes de Zentix.
    - Los leads se almacenarán automáticamente en Google Sheets cuando se identifiquen.

## Contribución

¡Las contribuciones son bienvenidas! Por favor, abre un issue o un pull request para mejorar este proyecto.

## Licencia

[MIT](LICENSE)
