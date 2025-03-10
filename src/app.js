// src/app.js
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import config from './config/env.js';  // Lee las variables de entorno
import webhookRoutes from './routes/webhookRoutes.js';

// Verifica que las variables de entorno se hayan aplicado correctamente
console.log("NODE_OPTIONS:", process.env.NODE_OPTIONS);
console.log("Node version:", process.version);

// Verifica y crea la carpeta "temp" en la raíz del proyecto
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
  console.log('Directorio "temp" creado en:', tempDir);
}

const app = express();
app.use(express.json());

// Middleware para loguear cada petición (opcional)
app.use((req, res, next) => {
  console.log(`Request ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

app.use('/', webhookRoutes);

app.get('/', (req, res) => {
  res.send(`<pre>Servidor IZZI corriendo. Usa /webhook.</pre>`);
});

// Imprime la hora del servidor en formato UTC
console.log("Hora del servidor:", new Date().toISOString());

// Inicia el servidor
app.listen(config.PORT, () => {
  console.log(`Server is listening on port: ${config.PORT}`);
});
