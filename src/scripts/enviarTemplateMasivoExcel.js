import XLSX from 'xlsx';
import path from 'path';
import PQueue from 'p-queue';
import whatsappService from '../services/whatsappService.js';
import appendBatchToSheet from '../services/googleSheetsBatchService.js';

async function retryOperation(operation, retries = 3, delay = 1000) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw lastError;
}

async function enviarTemplateMasivoExcel() {
  try {
    // Lee el archivo Excel (asegúrate de tener "listado_numeros.xlsx" en la raíz del proyecto)
    const workbook = XLSX.readFile(path.join(process.cwd(), 'listado_numeros.xlsx'));
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    // Configuración de la plantilla
    const templateName = 'auto_pay_reminder_cobranza';
    const languageCode = 'es_MX';
    const validPhoneRegex = /^\+52\d{10}$/;
    const queue = new PQueue({ concurrency: 10 });
    let registrosBatch = [];

    async function processRow(row) {
      let telefono = row.TELEFONO?.toString().trim();
      if (!telefono) return;
      if (!telefono.startsWith('+52')) telefono = '+52' + telefono;

      let estadoEnvio = "";

      if (!validPhoneRegex.test(telefono)) {
        console.log(`El número ${telefono} no tiene el formato esperado.`);
        estadoEnvio = "Mensaje Invalido";
      } else {
        try {
          // En este ejemplo, se elimina el componente "header" ya que el template espera 0 parámetros en el header.
          // Se envía únicamente el componente "body" con dos parámetros de tipo texto.
          const components = [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: row.NOMBRE_CLIENTE || '' },
                { type: 'text', text: row.N_CUENTA || '' }
              ]
            }
          ];

          await retryOperation(() =>
            whatsappService.sendTemplateMessage(telefono, templateName, languageCode, components)
          );
          console.log(`Mensaje enviado a: ${telefono}`);
          estadoEnvio = "Mensaje enviado";
        } catch (error) {
          console.error(`Error enviando a ${telefono}:`, error.response?.data || error);
          estadoEnvio = "Mensaje Invalido";
        }
      }

      // Registro para Google Sheets: TELEFONO, NOMBRE_CLIENTE, N_CUENTA, SALDO_VENCIDO, RPT, CLAVE_VENDEDOR, MENSAJE
      return [
        telefono,
        row.NOMBRE_CLIENTE || '',
        row.N_CUENTA || '',
        row.SALDO_VENCIDO || '',
        row.RPT || '',
        row.CLAVE_VENDEDOR || '',
        estadoEnvio
      ];
    }

    const tasks = data.map(row => queue.add(() => processRow(row)));
    const results = await Promise.all(tasks);
    registrosBatch = results.filter(registro => registro);

    if (registrosBatch.length > 0) {
      try {
        const batchResponse = await appendBatchToSheet(registrosBatch);
        console.log('Batch actualizado en Google Sheets:', batchResponse);
      } catch (batchError) {
        console.error('Error actualizando el batch en Google Sheets:', batchError);
      }
    }

    console.log('Proceso de envío masivo de plantillas finalizado.');
  } catch (error) {
    console.error('Error general en el proceso:', error);
  }
}

enviarTemplateMasivoExcel();
