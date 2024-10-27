// google-scripts/Code.gs

function doPost(e) {
    try {
        const params = JSON.parse(e.postData.contents);
        const { name, email, phone } = params;

        if (!name || !email || !phone) {
            throw new Error('Faltan datos de lead');
        }

        const sheetId = 'TU_SPREADSHEET_ID'; // Reemplaza con tu ID de Spreadsheet
        const sheetName = 'Leads';

        const ss = SpreadsheetApp.openById(sheetId);
        const sheet = ss.getSheetByName(sheetName);

        sheet.appendRow([new Date(), name, email, phone]);

        return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
