import axios from 'axios';
import config from '../config/env.js';

class WhatsAppService {
  async sendTemplateMessage(to, templateName, languageCode = 'es_MX', components = []) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components.length > 0 ? components : undefined
      }
    };

    const url = `${config.BASE_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
    const headers = {
      Authorization: `Bearer ${config.API_TOKEN}`,
      'Content-Type': 'application/json'
    };

    try {
      const response = await axios.post(url, data, { headers });
      return response.data;
    } catch (error) {
      console.error('Error al enviar plantilla:', error.response?.data || error);
      throw error;
    }
  }
}

export default new WhatsAppService();
