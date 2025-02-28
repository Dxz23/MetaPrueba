import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/env.js';
import webhookRoutes from './routes/webhookRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();
app.use(express.json());

// Para obtener __dirname en módulos ES:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sirve archivos estáticos desde la carpeta "public" que está en la raíz del proyecto
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas
app.use('/', webhookRoutes);
app.use('/', uploadRoutes);

// Ruta raíz: muestra el index.html desde la carpeta public en el nivel raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(config.PORT, () => {
  console.log(`Servidor escuchando en el puerto: ${config.PORT}`);
});
