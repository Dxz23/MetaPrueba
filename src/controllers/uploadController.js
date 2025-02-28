import path from 'path';
import multer from 'multer';
import XLSX from 'xlsx';
import PQueue from 'p-queue';
import whatsappService from '../services/whatsappService.js';
import appendBatchToSheet from '../services/googleSheetsBatchService.js';

// Configuración de multer para guardar los archivos subidos en la carpeta "uploads"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Función para procesar el Excel y enviar la plantilla
async function processExcelAndSendTemplate(filePath) {
  try {
    // Lee el archivo Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

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
          // Se define el componente "body" con parámetros
          const components = [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: row.NOMBRE_CLIENTE || '' },
                { type: 'text', text: row.N_CUENTA || '' }
              ]
            }
          ];
          await whatsappService.sendTemplateMessage(telefono, templateName, languageCode, components);
          console.log(`Mensaje enviado a: ${telefono}`);
          estadoEnvio = "Mensaje enviado";
        } catch (error) {
          console.error(`Error enviando a ${telefono}:`, error.response?.data || error);
          estadoEnvio = "Mensaje Invalido";
        }
      }
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
      const batchResponse = await appendBatchToSheet(registrosBatch);
      console.log('Batch actualizado en Google Sheets:', batchResponse);
    }
    console.log('Proceso de envío masivo de plantillas finalizado.');
    return { message: "✔Mensaje enviado con exito" };
  } catch (error) {
    console.error('Error en processExcelAndSendTemplate:', error);
    return { error: error.message };
  }
}

// Middleware para subir el archivo y procesarlo
export const uploadExcelAndSend = [
  upload.single('excelFile'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
    }
    const filePath = req.file.path;
    const result = await processExcelAndSendTemplate(filePath);
    res.json(result); // Se envía respuesta en formato JSON
  }
];
