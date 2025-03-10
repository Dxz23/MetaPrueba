// src/services/googleDriveService.js
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function authenticateDrive() {
  let auth;

  if (process.env.GOOGLE_DRIVE_CREDENTIALS) {
    const rawEnv = process.env.GOOGLE_DRIVE_CREDENTIALS;
    // Imprime la cadena *tal cual* la recibe tu app:
    console.log("RAW GOOGLE_DRIVE_CREDENTIALS:", rawEnv);
    
    // Reemplaza secuencias \\n por saltos de línea reales:
    const fixedString = rawEnv.replace(/\\n/g, '\n');
    console.log("Fixed String:", fixedString);

    // Luego parseas:
    const credentials = JSON.parse(fixedString);
    console.log("Usando credenciales de Google Drive desde la variable de entorno.");

    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
  } else {
    console.log("Usando credenciales de Google Drive desde el archivo local.");
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

  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id'
  });

  const fileId = response.data.id;

  // Otorga permisos públicos para que cualquiera pueda acceder
  await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  const fileUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
  return fileUrl;
}
