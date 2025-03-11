// src/services/googleSheetsService.js
import { google } from 'googleapis';

const sheets = google.sheets('v4');

/**
 * Retorna un authClient para Google Sheets,
 * usando la credencial de la variable de entorno (GOOGLE_DRIVE_CREDENTIALS).
 */
async function getSheetsAuthClient() {
  if (process.env.GOOGLE_DRIVE_CREDENTIALS) {
    // Lee la variable raw
    const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
    console.log("RAW GOOGLE_DRIVE_CREDENTIALS (Sheets):", raw);

    // Parseamos
    const credentials = JSON.parse(raw);

    // Convierte \\n en \n en private_key
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

    // Instancia GoogleAuth con scopes para Sheets
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    // Retorna el cliente listo
    const authClient = await auth.getClient();
    return authClient;
  } else {
    // Fallback a credencial local
    console.log("Usando credenciales locales (credentials.json) para Sheets");
    const auth = new google.auth.GoogleAuth({
      keyFile: 'src/credentials/credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return auth.getClient();
  }
}

async function addRowToSheet(auth, spreadsheetID, values) {
  try {
    const request = {
      spreadsheetId: spreadsheetID,
      range: 'reservas!A:F',  // Ajusta según tu hoja
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [values],
      },
      auth,
    };
    // Llamamos a la API de Sheets
    const response = (await sheets.spreadsheets.values.append(request)).data;
    return response;
  } catch (error) {
    console.error('Error adding row to sheet:', error);
    throw error;
  }
}

const appendToSheet = async (data) => {
  try {
    // 1) Obtenemos el cliente auth con la nueva credencial
    const authClient = await getSheetsAuthClient();

    // 2) Aquí pones tu Spreadsheet ID
    const spreadsheetID = '1lTaAUzXuQu6LK4DjsCKrkxwfQ6ZqOWZ6cnTJXMhqi6A';

    // 3) Agrega la fila
    await addRowToSheet(authClient, spreadsheetID, data);
    return 'Datos correctamente agregados';
  } catch (error) {
    console.error('Error en appendToSheet:', error);
  }
};

export default appendToSheet;
