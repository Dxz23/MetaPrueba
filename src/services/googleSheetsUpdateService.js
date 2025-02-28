import path from 'path';
import { google } from 'googleapis';

const sheets = google.sheets('v4');
const SPREADSHEET_ID = '1_XoahssK8yMJyexIw_kaUBNpY4rP2vSpavIYBPyl7kI';

async function updateSheetRow(phone, mensaje) {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'src/credentials', 'credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();

  const readRequest = {
    spreadsheetId: SPREADSHEET_ID,
    range: 'reservas!A:G',
    auth: authClient,
  };

  const readResponse = await sheets.spreadsheets.values.get(readRequest);
  const rows = readResponse.data.values;
  if (!rows || rows.length === 0) {
    throw new Error('No se encontraron datos en la hoja.');
  }

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === phone) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`No se encontró la fila con el teléfono: ${phone}`);
  }

  const updateRequest = {
    spreadsheetId: SPREADSHEET_ID,
    range: `reservas!G${rowIndex}`,
    valueInputOption: 'RAW',
    resource: { values: [[mensaje]] },
    auth: authClient,
  };

  const updateResponse = await sheets.spreadsheets.values.update(updateRequest);
  return updateResponse.data;
}

export default updateSheetRow;
