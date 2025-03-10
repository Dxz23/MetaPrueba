// src/services/googleDriveService.js
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function authenticateDrive() {
  // Si tienes la variable GOOGLE_DRIVE_CREDENTIALS establecida en Railway:
  if (process.env.GOOGLE_DRIVE_CREDENTIALS) {
    // (A) Lee la variable cruda (sin hacer replace):
    const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
    console.log("RAW GOOGLE_DRIVE_CREDENTIALS:", raw);

    // (B) Parsear directamente la cadena JSON
    const credentials = JSON.parse(raw);

    // (C) Solo en 'private_key' convertimos '\\n' a saltos de línea reales
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

    console.log("Usando credenciales de Google Drive desde variable de entorno.");
    // (D) Creamos GoogleAuth con esas credenciales
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    return auth;
  } else {
    // Si no existe la variable, se asume un archivo local (fall-back)
    console.log("Usando credenciales de Google Drive desde archivo local (drive-credentials.json).");
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'src', 'credentials', 'drive-credentials.json'),
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    return auth;
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

  // Otorga permisos de lectura pública
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  // Retornamos la URL de descarga
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
}
