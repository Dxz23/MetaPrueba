import 'dotenv/config';
import express from 'express';
import config from './config/env.js';
import webhookRoutes from './routes/webhookRoutes.js';

const app = express();
app.use(express.json());
app.use('/', webhookRoutes);

app.get('/', (req, res) => {
  res.send(`<pre>Servidor en ejecución. Revisa README.md para más información.</pre>`);
});

app.listen(config.PORT, () => {
  console.log(`Servidor escuchando en el puerto: ${config.PORT}`);
});
