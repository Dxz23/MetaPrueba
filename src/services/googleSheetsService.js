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

  // El rango ahora abarca 7 columnas: TELEFONO, NOMBRE_CLIENTE, N_CUENTA, SALDO_VENCIDO, RPT, CLAVE_VENDEDOR, MENSAJE
  const request = {
    spreadsheetId,
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
