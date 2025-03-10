import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function authenticateDrive() {
  if (process.env.GOOGLE_DRIVE_CREDENTIALS) {
    // Muestra lo que llega tal cual
    console.log("RAW GOOGLE_DRIVE_CREDENTIALS:", process.env.GOOGLE_DRIVE_CREDENTIALS);

    // 1) Parseamos DIRECTAMENTE, sin replace previo
    const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);

    // 2) Solo en la private_key, reemplazamos los \\n por saltos de línea
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    return auth;
  } else {
    // Fallback si no hay variable de entorno
    console.log("Usando credenciales de Google Drive desde archivo local.");
    return new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'src/credentials', 'drive-credentials.json'),
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
  }
}

export async function uploadFileToDrive(filePath, fileName, mimeType) {
  const auth = await authenticateDrive();
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = { name: fileName };
  const media = {
    mimeType,
    body: fs.createReadStream(filePath)
  };

  // Subimos a Drive
  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id'
  });

  const fileId = response.data.id;

  // Le damos permiso público
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  return `https://drive.google.com/uc?id=${fileId}&export=download`;
}
