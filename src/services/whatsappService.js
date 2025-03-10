// whatsappService.js
import axios from 'axios';
import config from '../config/env.js';
import { sendToWhatsapp } from './httprequests/sendToWhatsApp.js';

class WhatsAppService {
  async sendMessage(to, body, messageId) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      text: { body }
    };
    console.log('Enviando mensaje:', JSON.stringify(data, null, 2));
    await sendToWhatsapp(data);
  }

  async markAsRead(messageId) {
    const data = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };
    console.log('Marcando mensaje como leído:', messageId);
    await sendToWhatsapp(data);
  }

  async sendInteractiveButtons(to, bodyText, buttons, header = null) {
    try {
      const url = `${config.BASE_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
      const headers = { Authorization: `Bearer ${config.API_TOKEN}` };
      const interactive = {
        type: 'button',
        body: { text: bodyText },
        action: { buttons }
      };
      if (header) {
        interactive.header = header;
      }
      const data = {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive
      };
      console.log('Payload enviado a WhatsApp (Interactive Buttons):', JSON.stringify(data, null, 2));
      const response = await axios.post(url, data, { headers });
      console.log('Respuesta interactive buttons:', response.data);
    } catch (error) {
      console.error('Error sending interactive buttons:',
        error.response ? error.response.data : error.message);
    }
  }

  async sendWelcomeInteractiveMessage(to, name, imageUrl) {
    const url = `${config.BASE_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
    const headers = { Authorization: `Bearer ${config.API_TOKEN}` };
    const bodyText = `
🎉 ¡Bienvenido a IZZI! 📡🌎 La mejor conexión para tu hogar u oficina.

📢 ¡Promos por tiempo limitado! 🔥 Contrata ahora y aprovecha descuentos exclusivos.

🔍 *Elige lo que necesitas*:
📦 Ver paquetes – Descubre nuestras ofertas imperdibles 💰💡
⚡ Contratar ahora – ¡Contrata tu servicio en minutos! 🚀
💬 Hablar con un asesor – Obtén ayuda personalizada 🤝

⏳ ¡No te quedes sin conexión! Internet rápido, seguro y estable te espera. 🎯`;
    const buttons = [
      { type: 'reply', reply: { id: 'ver_paquetes', title: 'Ver paquetes' } },
      { type: 'reply', reply: { id: 'asesor', title: 'Asesor' } }
    ];
    const data = {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        header: { type: "image", image: { link: imageUrl } },
        body: { text: bodyText },
        action: { buttons }
      }
    };
    try {
      console.log('Payload enviado a WhatsApp (Welcome Interactive):', JSON.stringify(data, null, 2));
      const response = await axios.post(url, data, { headers });
      console.log("Mensaje interactivo con header enviado:", response.data);
    } catch (error) {
      console.error("Error al enviar mensaje interactivo con header:",
        error.response ? error.response.data : error.message);
    }
  }

  async sendWelcomeMenuMessage(to, bodyText, buttons, header) {
    const url = `${config.BASE_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
    const headers = { Authorization: `Bearer ${config.API_TOKEN}` };
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header, // Se espera un objeto { type: 'image', image: { link: 'URL' } }
        body: { text: bodyText },
        action: { buttons }
      }
    };
    try {
      console.log('Payload enviado a WhatsApp (Welcome Menu):', JSON.stringify(data, null, 2));
      const response = await axios.post(url, data, { headers });
      console.log("Mensaje de menú enviado:", response.data);
    } catch (error) {
      console.error("Error al enviar mensaje de menú:",
        error.response ? error.response.data : error.message);
    }
  }

  async sendMediaMessage(to, type, mediaUrl, caption) {
    try {
      const mediaObject = {};
      switch (type) {
        case 'image':
          mediaObject.image = { link: mediaUrl, caption: caption };
          break;
        case 'audio':
          mediaObject.audio = { link: mediaUrl };
          break;
        case 'video':
          mediaObject.video = { link: mediaUrl, caption: caption };
          break;
        case 'document':
          mediaObject.document = { link: mediaUrl, caption: caption, filename: 'archivo.pdf' };
          break;
        default:
          throw new Error('Not Supported Media Type');
      }
      const url = `${config.BASE_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
      const headers = { Authorization: `Bearer ${config.API_TOKEN}` };
      const data = { messaging_product: 'whatsapp', to, type, ...mediaObject };
      console.log('Payload enviado a WhatsApp (Media Message):', JSON.stringify(data, null, 2));
      await axios.post(url, data, { headers });
    } catch (error) {
      console.error('Error sending media:',
        error.response ? error.response.data : error.message);
    }
  }

  async sendContactMessage(to, contact) {
    try {
      const url = `${config.BASE_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
      const headers = { Authorization: `Bearer ${config.API_TOKEN}` };
      const data = {
        messaging_product: 'whatsapp',
        to,
        type: 'contacts',
        contacts: [contact]
      };
      console.log('Payload enviado a WhatsApp (Contact Message):', JSON.stringify(data, null, 2));
      await axios.post(url, data, { headers });
    } catch (error) {
      console.error('Error sending contact message:',
        error.response ? error.response.data : error.message);
    }
  }

  async sendLocationMessage(to, latitude, longitude, name, address) {
    try {
      const url = `${config.BASE_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
      const headers = { Authorization: `Bearer ${config.API_TOKEN}` };
      const data = {
        messaging_product: 'whatsapp',
        to,
        type: 'location',
        location: { latitude, longitude, name, address }
      };
      console.log('Payload enviado a WhatsApp (Location Message):', JSON.stringify(data, null, 2));
      await axios.post(url, data, { headers });
    } catch (error) {
      console.error('Error sending location:',
        error.response ? error.response.data : error.message);
    }
  }

  // === Flujos para enviar imagen en header y luego mensaje interactivo ===

  // Triple Play
  async sendTriplePlayHeaderImage(to) {
    const url = `${config.BASE_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
    const headers = { Authorization: `Bearer ${config.API_TOKEN}` };
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: 'https://storage.googleapis.com/imagenes-izzi-2025/TriplePlayIzzi_1.png' }
    };
    console.log('Enviando imagen de Triple Play:', JSON.stringify(data, null, 2));
    try {
      const response = await axios.post(url, data, { headers });
      console.log('Imagen Triple Play enviada:', response.data);
    } catch (error) {
      console.error('Error al enviar imagen Triple Play:',
        error.response ? error.response.data : error.message);
    }
  }

  async sendTriplePlayInteractive(to) {
    const bodyText = `
🚀 ¡Disfruta el mejor paquete Triple Play con IZZI! 📡🎬📞

💰 Promoción exclusiva por 6 meses con el doble de megas y precios increíbles 🔥

📜 Contrato a 12 meses – Los primeros 6 meses con descuento y el doble de velocidad

✨ Elige la velocidad y beneficios que mejor se adapten a ti:
🔹 60 Megas por 6 Meses 💨 (Después 40 Megas)
💲 $499 MXN por 6 meses (Después $539 MXN fijo)
🔹 80 Megas por 6 Meses ⚡ (Después 60 Megas)
💲 $569 MXN por 6 meses (Después $660 MXN fijo)
🔹 100 Megas por 6 Meses 🚀 (Después 80 Megas)
💲 $589 MXN por 6 meses (Después $690 MXN fijo)
🔹 200 Megas por 6 Meses ⚡💨 (Después 150 Megas)
💲 $659 MXN por 6 meses (Después $760 MXN fijo)

📺 Incluye 200 canales de TV + ViX Premium + LaLiga EA Sports + Sky Sports con Bundesliga 🎥⚽🏆

📢 ¡Aprovecha esta promo antes de que termine!
✍️ Escribe "asesor" para recibir atención personalizada. 💬✅

¿Cuál te interesa?`;
    const buttons = [
      { type: 'reply', reply: { id: 'triple_40', title: 'Triple 40' } },
      { type: 'reply', reply: { id: 'triple_60', title: 'Triple 60' } },
      { type: 'reply', reply: { id: 'triple_80', title: 'Triple 80' } }
    ];
    await this.sendInteractiveButtons(to, bodyText, buttons);
  }

  async sendTriplePlayFlow(to) {
    await this.sendTriplePlayHeaderImage(to);
    // Espera 2 segundos para que la imagen se procese
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.sendTriplePlayInteractive(to);
  }

  // Double Play
  async sendDoublePlayHeaderImage(to) {
    const url = `${config.BASE_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
    const headers = { Authorization: `Bearer ${config.API_TOKEN}` };
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: 'https://storage.googleapis.com/imagenes-izzi-2025/Double-Play_1.png' }
    };
    console.log('Enviando imagen de Double Play:', JSON.stringify(data, null, 2));
    try {
      const response = await axios.post(url, data, { headers });
      console.log('Imagen Double Play enviada:', response.data);
    } catch (error) {
      console.error('Error al enviar imagen Double Play:',
        error.response ? error.response.data : error.message);
    }
  }

  async sendDoublePlayInteractive(to) {
    const bodyText = `
🚀 ¡Disfruta el mejor paquete Double Play con IZZI! 📡📞

💰 Promoción exclusiva por 3 meses con el doble de megas y precios increíbles 🔥

📜 Contrato a 12 meses – Los primeros 3 meses con descuento y el doble de velocidad

✨ Elige la velocidad y beneficios que mejor se adapten a ti:
🔹 60 Megas por 3 Meses 💨 (Después 40 Megas)
💲 $349 MXN por 3 meses (Después $389 MXN fijo)
🔹 80 Megas por 3 Meses ⚡ (Después 60 Megas)
💲 $419 MXN por 3 meses (Después $510 MXN fijo)
🔹 100 Megas por 3 Meses 🚀 (Después 80 Megas)
💲 $439 MXN por 3 meses (Después $540 MXN fijo)
🔹 200 Megas por 3 Meses ⚡💨 (Después 150 Megas)
💲 $509 MXN por 3 meses (Después $610 MXN fijo)

📺 Incluye ViX Premium + HBO Max por 12 meses 🎥🍿

📢 ¡Aprovecha esta promo antes de que termine!
✍️ Escribe "asesor" para recibir atención personalizada. 💬✅

💡 ¿Cuál te interesa?`;
    const buttons = [
      { type: 'reply', reply: { id: 'double_40', title: 'Double 40' } },
      { type: 'reply', reply: { id: 'double_60', title: 'Double 60' } },
      { type: 'reply', reply: { id: 'double_80', title: 'Double 80' } }
    ];
    // En este flujo se envía también el header en el mensaje interactivo
    const header = {
      type: 'image',
      image: { link: 'https://storage.googleapis.com/imagenes-izzi-2025/Double-Play_1.png' }
    };
    await this.sendInteractiveButtons(to, bodyText, buttons, header);
  }

  async sendDoublePlayFlow(to) {
    await this.sendDoublePlayHeaderImage(to);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.sendDoublePlayInteractive(to);
  }

  // Single Play
  async sendSinglePlayHeaderImage(to) {
    const url = `${config.BASE_URL}/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
    const headers = { Authorization: `Bearer ${config.API_TOKEN}` };
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: 'https://storage.googleapis.com/imagenes-izzi-2025/Singleplay_1.png' }
    };
    console.log('Enviando imagen de Single Play:', JSON.stringify(data, null, 2));
    try {
      const response = await axios.post(url, data, { headers });
      console.log('Imagen Single Play enviada:', response.data);
    } catch (error) {
      console.error('Error al enviar imagen Single Play:',
        error.response ? error.response.data : error.message);
    }
  }

  async sendSinglePlayInteractive(to) {
    const bodyText = `
📺 ¡Disfruta el mejor entretenimiento con izzi tv+! 🎬🔥

💰 Solo $299 al mes – ¡Sin importar tu compañía de internet!

📜 Contrato a 12 meses – Accede a 200 canales de TV desde cualquier dispositivo 📡📲

✨ Beneficios exclusivos de izzi tv+:
✔️ 200 canales de TV 📡
✔️ Android TV 📺
✔️ Hasta 1 extensión de TV 🎥 (Por solo $79 adicionales)
✔️ Acceso a izzi Go 📲
✔️ ViX Premium GRATIS por 12 meses 🎬🍿
✔️ Sky Sports + LaLiga EA Sports ⚽🏆

📢 ¡No necesitas cambiar de proveedor de internet!
✍️ Escribe "asesor" para recibir atención personalizada y contratar hoy mismo. 💬✅

💡 ¿Te interesa?
👉 Responde con "contratar" o "asesor" para recibir más información. 📲✅`;
    const buttons = [
      { type: 'reply', reply: { id: 'contratar', title: 'Contratar' } },
      { type: 'reply', reply: { id: 'asesor', title: 'Asesor' } }
    ];
    // Agregamos header para Single Play
    const header = {
      type: 'image',
      image: { link: 'https://storage.googleapis.com/imagenes-izzi-2025/Singleplay_1.png' }
    };
    await this.sendInteractiveButtons(to, bodyText, buttons, header);
  }

  async sendSinglePlayFlow(to) {
    await this.sendSinglePlayHeaderImage(to);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.sendSinglePlayInteractive(to);
  }

  async sendAsesorContact(to) {
    const advisors = [
      {
        first_name: "Monica",
        last_name: "",
        phone: "+526861716364",
        wa_id: "5216861716364",
        photo: "https://storage.googleapis.com/imagenes-izzi-2025/monica.png"
      },
      {
        first_name: "Lupita",
        last_name: "",
        phone: "+526625812173",
        wa_id: "5216625812173",
        photo: "https://storage.googleapis.com/imagenes-izzi-2025/lupita.png"
      },
      {
        first_name: "Ana",
        last_name: "SALAZAR",
        phone: "+526862729645",
        wa_id: "5216862729645",
        photo: "https://storage.googleapis.com/imagenes-izzi-2025/ana.png"
      },
      {
        first_name: "Berta",
        last_name: "",
        phone: "+526863486070",
        wa_id: "5216863486070",
        photo: "https://storage.googleapis.com/imagenes-izzi-2025/berta.png"
      }
    ];
    const randomIndex = Math.floor(Math.random() * advisors.length);
    const selectedAdvisor = advisors[randomIndex];
  
    await this.sendMediaMessage(to, "image", selectedAdvisor.photo, "");
    await new Promise(resolve => setTimeout(resolve, 1000));
  
    const contact = {
      name: {
        formatted_name: `Asesor ${selectedAdvisor.first_name} ${selectedAdvisor.last_name}`.trim(),
        first_name: selectedAdvisor.first_name,
        last_name: selectedAdvisor.last_name
      },
      phones: [
        { phone: selectedAdvisor.phone, wa_id: selectedAdvisor.wa_id, type: "WORK" }
      ]
    };
    await this.sendContactMessage(to, contact);
    await new Promise(resolve => setTimeout(resolve, 500));
  
    const menuMessage = "Para más opciones, selecciona:";
    const buttons = [
      { type: 'reply', reply: { id: 'menu', title: 'Menú' } }
    ];
    await this.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async sendStepMessage(to, prompt) {
    try {
      const buttons = [
        { type: 'reply', reply: { id: 'asesor', title: 'Asesor' } }
      ];
      await this.sendInteractiveButtons(to, prompt, buttons);
    } catch (error) {
      console.error("Error en sendStepMessage:", error);
    }
  }

  


}

export default new WhatsAppService();
