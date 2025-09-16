// backend/server.js
const express = require('express');
const cors = require('cors');
const db = require('./db/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { JWT_SECRET, PORT, UPLOADS_DIR, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } = require('./config');

const app = express();

// Verificación y creación de la carpeta uploads
const uploadsDir = path.join(__dirname, UPLOADS_DIR);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Carpeta "${UPLOADS_DIR}/" creada exitosamente.`);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Configuración de multer con validaciones
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: function (req, file, cb) {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido. Tipos permitidos: ${ALLOWED_FILE_TYPES.join(', ')}`), false);
    }
  }
});

app.use(cors());
app.use(express.json());
// Configurar archivos estáticos con headers para forzar descarga
app.use('/uploads', (req, res, next) => {
  // Agregar header para forzar descarga
  res.setHeader('Content-Disposition', 'attachment');
  next();
}, express.static(uploadsDir));

const listasRoutes = require('./routes/listasRoutes');
const userRoutes = require('./routes/userRoutes');
app.use('/api/listas', listasRoutes);
app.use('/api/user', userRoutes);

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
  } catch (error) {
    console.error('Error al hashear la contraseña:', error);
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
      region: user.region,
      email: user.email
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: "Login exitoso", token });
  });
});

const tareaRoutes = require('./routes/tareaRoutes')(upload);
app.use('/api/tareas', tareaRoutes);

const superadminRoutes = require('./routes/superadminRoutes');
app.use('/api/superadmin', superadminRoutes);

const regionRoutes = require('./routes/regionRoutes');
app.use('/api/regiones', regionRoutes);

const costoMinimoRoutes = require('./routes/costoMinimoRoutes');
app.use('/api/costo-minimo', costoMinimoRoutes);

const cuadrillaModeloRoutes = require('./routes/cuadrillaModeloRoutes');
app.use('/api/cuadrilla-modelo', cuadrillaModeloRoutes);

const adminRoutes = require('./routes/adminRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');
app.use('/api/admin', authenticateToken, adminRoutes);


app.get('/', (req, res) => { res.send('Servidor principal funcionando correctamente.'); });

app.listen(PORT, () => { console.log(`Servidor corriendo en http://localhost:${PORT}`); });