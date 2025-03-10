// src/services/googleDriveService.js
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function authenticateDrive() {
  // Si existe la variable en el entorno:
  if (process.env.GOOGLE_DRIVE_CREDENTIALS) {
    // 1) Lee la cadena tal cual, NO hagas replace aún.
    const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
    console.log("RAW GOOGLE_DRIVE_CREDENTIALS:", raw);

    // 2) Parseamos directamente el JSON con los \\" y \\n escapados.
    const credentials = JSON.parse(raw);

    // 3) Solo en la private_key convertimos '\\n' a saltos de línea reales.
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

    console.log("Usando credenciales de Google Drive desde variable de entorno.");

    // 4) Instanciamos GoogleAuth con esas credenciales
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    return auth;
  } else {
    // Si NO existe la variable de entorno, usaremos un archivo local a modo fallback
    console.log("Usando credenciales de Google Drive desde archivo local (drive-credentials.json).");
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'src', 'credentials', 'drive-credentials.json'),
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    return auth;
  }
}

export async function uploadFileToDrive(filePath, fileName, mimeType) {
  // Obtenemos la autenticación de Drive
  const auth = await authenticateDrive();
  const drive = google.drive({ version: 'v3', auth });

  // Armamos el objeto con metadatos
  const fileMetadata = { name: fileName };
  const media = {
    mimeType,
    body: fs.createReadStream(filePath)
  };

  // Subimos el archivo a Google Drive
  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id'
  });

  const fileId = response.data.id;

  // Damos permiso de lectura pública para quien tenga el enlace
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  // Retornamos la URL de descarga directa
  const fileUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
  return fileUrl;
}
