// src/services/googleDriveService.js
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function authenticateDrive() {
  if (process.env.GOOGLE_DRIVE_CREDENTIALS) {
    // 1) Lee la variable tal cual (no hagas replace aún)
    const rawJson = process.env.GOOGLE_DRIVE_CREDENTIALS;
    console.log("RAW GOOGLE_DRIVE_CREDENTIALS:", rawJson);

    // 2) Parseas directamente el string, que aún tiene \\n
    const credentials = JSON.parse(rawJson);

    // 3) Solo en la private_key, conviertes \\n en saltos de línea reales
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

    // 4) Crea la instancia de autenticación
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    return auth;
  } else {
    // Fallback si no tienes la variable de entorno
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

  // Sube a Drive
  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id'
  });

  const fileId = response.data.id;

  // Otorga permisos de lectura pública
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  // Regresa la URL descargable
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
}
