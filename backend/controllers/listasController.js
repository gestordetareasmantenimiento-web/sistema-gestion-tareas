// backend/controllers/listasController.js (VERSIÓN COMPLETA Y CORRECTA)
const db = require('../db/database');

// Obtener una lista simple de todos los proveedores activos
exports.getProveedoresActivos = (req, res) => {
  const sql = "SELECT id, nombre, razon_social FROM proveedores WHERE activo = 1 ORDER BY nombre";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: rows });
  });
};

// Obtener una lista de los inspectores a cargo de un supervisor
exports.getInspectoresPorSupervisor = (req, res) => {
  const supervisorId = req.user.id;
  const sql = "SELECT id, nombre_completo FROM usuarios WHERE id_supervisor = ? AND activo = 1 ORDER BY nombre_completo";
  db.all(sql, [supervisorId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: rows });
  });
};

// Obtener todos los inspectores y supervisores (para administrativos)
exports.getAllInspectores = (req, res) => {
  const sql = `
    SELECT 
      u.id, 
      u.nombre_completo as nombre,
      u.rol,
      CASE 
        WHEN u.rol = 'inspector' AND u.id_supervisor IS NOT NULL THEN 
          (SELECT nombre_completo FROM usuarios WHERE id = u.id_supervisor)
        ELSE NULL 
      END as supervisor_nombre
    FROM usuarios u 
    WHERE u.rol IN ('inspector', 'supervisor de mantenimiento') 
    AND u.activo = 1 
    ORDER BY u.rol, u.nombre_completo
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: rows });
  });
};

// Obtener el catálogo de mano de obra
exports.getManoDeObra = (req, res) => {
  const sql = "SELECT * FROM mano_de_obra ORDER BY descripcion";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: rows });
  });
};

// Obtener el catálogo de materiales
exports.getMateriales = (req, res) => {
  const sql = "SELECT * FROM materiales ORDER BY descripcion";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: rows });
  });
};

// ========== FAVORITOS MANO DE OBRA ==========
exports.getFavoritosManoDeObra = (req, res) => {
  const usuarioId = req.user.id;
  console.log('🔍 getFavoritosManoDeObra - usuarioId:', usuarioId);
  const sql = `
    SELECT codigo_mano_obra as codigo, descripcion, unidad_medida, precio, id
    FROM favoritos_mano_obra 
    WHERE usuario_id = ? 
    ORDER BY fecha_agregado DESC
  `;
  db.all(sql, [usuarioId], (err, rows) => {
    if (err) {
      console.error('❌ Error en getFavoritosManoDeObra:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('⭐ Favoritos encontrados para usuario', usuarioId, ':', rows.length, 'items');
    res.json({ message: "success", data: rows });
  });
};

exports.agregarFavoritoManoDeObra = (req, res) => {
  const usuarioId = req.user.id;
  const { codigo, descripcion, unidad_medida, precio } = req.body;
  
  const sql = `
    INSERT OR REPLACE INTO favoritos_mano_obra 
    (usuario_id, codigo_mano_obra, descripcion, unidad_medida, precio)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [usuarioId, codigo, descripcion, unidad_medida, precio], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Favorito agregado exitosamente", id: this.lastID });
  });
};

exports.quitarFavoritoManoDeObra = (req, res) => {
  const usuarioId = req.user.id;
  const { codigo } = req.params;
  
  const sql = "DELETE FROM favoritos_mano_obra WHERE usuario_id = ? AND codigo_mano_obra = ?";
  db.run(sql, [usuarioId, codigo], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Favorito eliminado exitosamente" });
  });
};

// ========== FAVORITOS MATERIALES UTILIZADOS ==========
exports.getFavoritosMaterialesUtilizados = (req, res) => {
  const usuarioId = req.user.id;
  const sql = `
    SELECT codigo_material as codigo, descripcion, unidad_medida, id
    FROM favoritos_materiales_utilizados 
    WHERE usuario_id = ? 
    ORDER BY fecha_agregado DESC
  `;
  db.all(sql, [usuarioId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: rows });
  });
};

exports.agregarFavoritoMaterialUtilizado = (req, res) => {
  const usuarioId = req.user.id;
  const { codigo, descripcion, unidad_medida } = req.body;
  
  const sql = `
    INSERT OR REPLACE INTO favoritos_materiales_utilizados 
    (usuario_id, codigo_material, descripcion, unidad_medida)
    VALUES (?, ?, ?, ?)
  `;
  
  db.run(sql, [usuarioId, codigo, descripcion, unidad_medida], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Favorito agregado exitosamente", id: this.lastID });
  });
};

exports.quitarFavoritoMaterialUtilizado = (req, res) => {
  const usuarioId = req.user.id;
  const { codigo } = req.params;
  
  const sql = "DELETE FROM favoritos_materiales_utilizados WHERE usuario_id = ? AND codigo_material = ?";
  db.run(sql, [usuarioId, codigo], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Favorito eliminado exitosamente" });
  });
};

// ========== FAVORITOS MATERIALES RECUPERADOS ==========
exports.getFavoritosMaterialesRecuperados = (req, res) => {
  const usuarioId = req.user.id;
  const sql = `
    SELECT codigo_material as codigo, descripcion, unidad_medida, id
    FROM favoritos_materiales_recuperados 
    WHERE usuario_id = ? 
    ORDER BY fecha_agregado DESC
  `;
  db.all(sql, [usuarioId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "success", data: rows });
  });
};

exports.agregarFavoritoMaterialRecuperado = (req, res) => {
  const usuarioId = req.user.id;
  const { codigo, descripcion, unidad_medida } = req.body;
  
  const sql = `
    INSERT OR REPLACE INTO favoritos_materiales_recuperados 
    (usuario_id, codigo_material, descripcion, unidad_medida)
    VALUES (?, ?, ?, ?)
  `;
  
  db.run(sql, [usuarioId, codigo, descripcion, unidad_medida], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Favorito agregado exitosamente", id: this.lastID });
  });
};

exports.quitarFavoritoMaterialRecuperado = (req, res) => {
  const usuarioId = req.user.id;
  const { codigo } = req.params;
  
  const sql = "DELETE FROM favoritos_materiales_recuperados WHERE usuario_id = ? AND codigo_material = ?";
  db.run(sql, [usuarioId, codigo], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Favorito eliminado exitosamente" });
  });
};