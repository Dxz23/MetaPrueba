import updateSheetRow from '../services/googleSheetsUpdateService.js';

class WebhookController {
  async handleIncoming(req, res) {
    const entry = req.body.entry?.[0];
    if (entry && entry.changes) {
      for (const change of entry.changes) {
        if (change.field === 'messages' && change.value.statuses) {
          const statuses = change.value.statuses;
          for (const status of statuses) {
            if (status.status === 'failed') {
              const phone = status.recipient_id;
              console.log(`Error en entrega para el número: ${phone}`);
              try {
                await updateSheetRow(phone, "Mensaje Invalido");
                console.log(`Registro actualizado para ${phone} en Google Sheets.`);
              } catch (updateError) {
                console.error(`Error actualizando Google Sheets para ${phone}:`, updateError);
              }
            }
          }
        }
      }
    }
    res.sendStatus(200);
  }

  verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
      console.log('Webhook verificado correctamente.');
    } else {
      res.sendStatus(403);
    }
  }
}

export default new WebhookController();
