// backend/server.js
const express = require('express');
const cors = require('cors');
const db = require('./db/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // ¡Importamos el módulo 'fs' (File System)!
const { JWT_SECRET } = require('./config');

const app = express();
const PORT = 3000;

// --- ¡NUEVO! VERIFICACIÓN Y CREACIÓN DE LA CARPETA UPLOADS ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Carpeta "uploads/" creada exitosamente.');
}
// --- FIN DEL NUEVO BLOQUE ---

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

const listasRoutes = require('./routes/listasRoutes');
app.use('/api/listas', listasRoutes);

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
      rol: user.rol.toLowerCase(),
      id_proveedor: user.id_proveedor,
      region: user.region
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: "Login exitoso", token });
  });
});

const tareaRoutes = require('./routes/tareaRoutes')(upload);
app.use('/api/tareas', tareaRoutes);

app.get('/', (req, res) => { res.send('Servidor principal funcionando correctamente.'); });

app.listen(PORT, () => { console.log(`Servidor corriendo en http://localhost:${PORT}`); });