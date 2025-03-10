// src/services/googleDriveService.js
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function authenticateDrive() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'src/credentials', 'drive-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });
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
