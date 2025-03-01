import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Para obtener __dirname en módulos ES:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Página de login
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'login.html'));
});

// Procesar login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Credenciales de prueba
  if (email === 'usario@chocamex.com' && password === 'prueba123') {
    req.session.loggedIn = true;
    return res.redirect('/');
  } else {
    return res.send(`
      <h2>Credenciales incorrectas</h2>
      <p><a href="/login">Volver a intentarlo</a></p>
    `);
  }
});

// Ruta para cerrar sesión (opcional)
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

export default router;
