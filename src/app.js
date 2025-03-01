import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/env.js';
import loginRoutes from './routes/loginRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session({
  secret: 'mi_clave_secreta', // Usa una clave robusta en producción
  resave: false,
  saveUninitialized: true
}));

// Obtener __dirname en módulos ES:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir solo recursos estáticos públicos (por ejemplo, CSS)
app.use('/css', express.static(path.join(__dirname, '..', 'public', 'css')));

// Rutas públicas: Login
app.use('/', loginRoutes);

// Middleware para proteger las rutas
function isAuthenticated(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return next();
  }
  res.redirect('/login');
}

// Ruta raíz protegida: muestra index.html (donde se envían los mensajes)
app.get('/', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Rutas protegidas adicionales (upload, webhook, etc.)
app.use('/', isAuthenticated, uploadRoutes);
app.use('/', isAuthenticated, webhookRoutes);

// Servir archivos estáticos para CSS e imágenes
app.use('/css', express.static(path.join(__dirname, '..', 'public', 'css')));
app.use('/img', express.static(path.join(__dirname, '..', 'public', 'img')));


app.listen(config.PORT, () => {
  console.log(`Servidor escuchando en el puerto: ${config.PORT}`);
});
