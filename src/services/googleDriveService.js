// src/services/googleDriveService.js
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function authenticateDrive() {
  // 1) Verificamos si existe la variable en el entorno
  if (process.env.GOOGLE_DRIVE_CREDENTIALS) {
    // Observa la cadena tal cual
    console.log("RAW GOOGLE_DRIVE_CREDENTIALS:", process.env.GOOGLE_DRIVE_CREDENTIALS);

    // 2) Parseamos directamente la cadena con JSON.parse()
    //    (NO hacemos replace todavía)
    const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);

    // 3) Ahora que ya es un objeto, convertimos sólo la private_key
    //    de "\\n" a saltos de línea reales
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

    console.log("Usando credenciales de Google Drive desde la variable de entorno.");

    // 4) Instanciamos la auth con esas credenciales
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    return auth;
  } else {
    // Si la variable no existe, usamos un archivo local a modo de fallback
    console.log("Usando credenciales de Google Drive desde un archivo local.");
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

  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id'
  });

  const fileId = response.data.id;

  // Otorga permiso de 'reader' a 'anyone'
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  // Regresamos la URL de descarga
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
}
