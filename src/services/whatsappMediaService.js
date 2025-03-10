// src/services/whatsappMediaService.js
import axios from 'axios';

/**
 * Descarga el archivo de medios usando el mediaId proporcionado por WhatsApp.
 * Requiere variables de entorno:
 *   WHATSAPP_ACCESS_TOKEN, BASE_URL, API_VERSION
 * 
 * @param {string} mediaId - El ID del medio (WhatsApp) a descargar.
 * @returns {Buffer} - Contenido binario del archivo.
 */
export async function downloadMediaFile(mediaId) {
  try {
    // Lee el token y la URL base
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const baseUrl = process.env.BASE_URL || 'https://graph.facebook.com';
    const apiVersion = process.env.API_VERSION || 'v16.0';

    // 1) Pide a la Graph API la info del adjunto (para obtener la URL real)
    const mediaInfoUrl = `${baseUrl}/${apiVersion}/${mediaId}`;
    const mediaInfoResponse = await axios.get(mediaInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    // 2) Con esa info, saca la URL de descarga
    const mediaUrl = mediaInfoResponse.data.url;

    // 3) Descarga el binario
    const fileResponse = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return fileResponse.data; // Un Buffer
  } catch (error) {
    console.error('Error al descargar el archivo:', error.response ? error.response.data : error.message);
    throw error;
  }
}
