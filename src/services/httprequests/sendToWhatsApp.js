import axios from 'axios';
import config from '../../config/env.js';

export const sendToWhatsapp = async (data) => {
  const url = `${config.BASE_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
  const headers = {
    Authorization: `Bearer ${config.API_TOKEN}`
  };

  try {
    const response = await axios.post(url, data, { headers });
    console.log('Respuesta de WhatsApp:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error en sendToWhatsapp:', error.response ? error.response.data : error.message);
  }
};
