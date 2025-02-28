import path from 'path';
import { google } from 'googleapis';

const sheets = google.sheets('v4');

async function appendBatchToSheet(batchData) {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'src/credentials', 'credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();
  const spreadsheetID = '1_XoahssK8yMJyexIw_kaUBNpY4rP2vSpavIYBPyl7kI';

  const request = {
    spreadsheetId: spreadsheetID,// Usa la constante definida
    range: 'reservas!A:G',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: batchData },
    auth: authClient,
  };

  const response = await sheets.spreadsheets.values.append(request);
  return response.data;
}

export default appendBatchToSheet;
