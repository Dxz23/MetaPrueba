// src/services/googleSheetsService.js
import path from 'path';
import { google } from 'googleapis';

const sheets = google.sheets('v4');

async function addRowToSheet(auth, spreadsheetID, values) {
  const request = {
    spreadsheetId: spreadsheetID,
    range: 'reservas!A:F',  // Asegúrate de que este rango abarca las 6 columnas
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [values],
    },
    auth,
  };

  try {
    const response = (await sheets.spreadsheets.values.append(request)).data;
    return response;
  } catch (error) {
    console.error('Error adding row to sheet:', error);
  }
}

const appendToSheet = async (data) => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'src/credentials', 'credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const authClient = await auth.getClient();
    // ID de tu Google Sheets
    const spreadsheetID = '1lTaAUzXuQu6LK4DjsCKrkxwfQ6ZqOWZ6cnTJXMhqi6A';
    await addRowToSheet(authClient, spreadsheetID, data);
    return 'Datos correctamente agregados';
  } catch (error) {
    console.error('Error en appendToSheet:', error);
  }
};

export default appendToSheet;
