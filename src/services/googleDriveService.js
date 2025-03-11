// src/services/googleDriveService.js
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function authenticateDrive() {
  if (process.env.GOOGLE_DRIVE_CREDENTIALS) {
    // (A) Lee la variable cruda sin hacer replace
    const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
    console.log('RAW GOOGLE_DRIVE_CREDENTIALS:', raw);

    // (B) Parsear directamente el JSON con comillas y saltos escapados
    const credentials = JSON.parse(raw);

    // (C) Convierte los '\\n' en '\n' solo en la private_key
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

    console.log('Usando credenciales de Google Drive desde variable de entorno.');

    // (D) Instanciamos GoogleAuth con las credenciales parseadas
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    return auth;
  } else {
    // Si no existe la variable de entorno, usar un archivo local a modo de fallback
    console.log("Usando credenciales de Google Drive desde un archivo local (drive-credentials.json).");
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

  // Metadatos del archivo
  const fileMetadata = { name: fileName };
  const media = {
    mimeType,
    body: fs.createReadStream(filePath)
  };

  // Sube el archivo a Google Drive
  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id'
  });

  const fileId = response.data.id;

  // Concede permiso de lectura pública a quien tenga el enlace
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  // Retorna la URL de descarga
  const fileUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
  return fileUrl;
}
