// backend/server.js (Versión Final y Limpia)
const express = require('express');
const cors = require('cors');
const db = require('./db/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// --- 1. CONFIGURACIÓN ---
const app = express();
const PORT = 3000;
const JWT_SECRET = 'este-es-un-secreto-muy-seguro-que-deberia-estar-en-un-archivo-de-configuracion';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- 2. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 3. RUTAS ---
const listasRoutes = require('./routes/listasRoutes'); // <-- AÑADE ESTA LÍNEA
app.use('/api/listas', listasRoutes); // <-- AÑADE ESTA LÍNEA

// Rutas de Autenticación
app.post('/api/register', async (req, res) => {
  const { nombre_completo, email, password, rol } = req.body;
  if (!email || !password || !nombre_completo || !rol) {
    return res.status(400).json({ error: "Faltan datos." });
  }
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, 1)`;
    db.run(sql, [nombre_completo, email, password_hash, rol], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Usuario creado", id: this.lastID });
    });
  } catch {
    res.status(500).json({ error: "Error al hashear la contraseña." });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM usuarios WHERE email = ?";
  db.get(sql, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const payload = { 
      id: user.id, 
      rol: user.rol.toLowerCase(), // <-- Convertimos el rol a minúsculas
      id_proveedor: user.id_proveedor,
      region: user.region // <-- AÑADE ESTA LÍNEA
    };

    // 2. Usamos el payload completo para firmar el token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: "Login exitoso", token });
  });
});

// Rutas de Tareas (protegidas)
const tareaRoutes = require('./routes/tareaRoutes')(upload);
app.use('/api/tareas', tareaRoutes);

// Ruta de prueba
app.get('/', (req, res) => { res.send('Servidor principal funcionando correctamente.'); });

// --- 4. INICIAR SERVIDOR ---
app.listen(PORT, () => { console.log(`Servidor corriendo en http://localhost:${PORT}`); });