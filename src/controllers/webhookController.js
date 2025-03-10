import config from '../config/env.js';
import messageHandler from '../services/messageHandler.js';

class WebhookController {
  async handleIncoming(req, res) {
    console.log('--- Payload recibido ---');
    console.log(JSON.stringify(req.body, null, 2));

    // Se extrae el arreglo de mensajes (si hay más de uno, se itera sobre ellos)
    const messages = req.body.entry?.[0]?.changes?.[0]?.value?.messages || [];
    const contacts = req.body.entry?.[0]?.changes?.[0]?.value?.contacts || [];

    if (messages.length > 0) {
      console.log('Se detectaron', messages.length, 'mensajes en la carga');
      for (const message of messages) {
        // Se asume que la información del remitente (contact) es la misma para todos los mensajes
        await messageHandler.handleIncomingMessage(message, contacts[0]);
      }
    } else {
      console.log('No se encontró mensaje en la carga');
    }
    res.sendStatus(200);
  }

  verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.WEBHOOK_VERIFY_TOKEN) {
      console.log('Webhook verified successfully!');
      res.status(200).send(challenge);
    } else {
      console.warn('Fallo verificación del webhook');
      res.sendStatus(403);
    }
  }
}

export default new WebhookController();
