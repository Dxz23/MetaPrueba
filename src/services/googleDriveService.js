// src/services/googleDriveService.js
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function authenticateDrive() {
  let auth;

  // Si tienes la variable GOOGLE_DRIVE_CREDENTIALS en Railway:
  if (process.env.GOOGLE_DRIVE_CREDENTIALS) {
    // Observa lo que llega en crudo:
    console.log("RAW GOOGLE_DRIVE_CREDENTIALS:", process.env.GOOGLE_DRIVE_CREDENTIALS);

    // 1) Parseamos directamente la cadena, SIN replace()
    const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);

    // 2) Solo para la private_key, hacemos el replace de \\n -> \n
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

    console.log("Usando credenciales de Google Drive desde variable de entorno.");
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
  } else {
    // Si no hay variable de entorno, tomamos un archivo local (caso fallback)
    console.log("Usando credenciales de Google Drive desde archivo local.");
    auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'src/credentials', 'drive-credentials.json'),
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
  }

  return auth;
}

export async function uploadFileToDrive(filePath, fileName, mimeType) {
  const auth = await authenticateDrive();
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = { name: fileName };
  const media = {
    mimeType: mimeType,
    body: fs.createReadStream(filePath)
  };

  // Subimos el archivo a Google Drive
  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id'
  });

  const fileId = response.data.id;

  // Otorga permiso de "lector" para que cualquiera con el enlace pueda acceder
  await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  // Retorna la URL de descarga pública
  const fileUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
  return fileUrl;
}
