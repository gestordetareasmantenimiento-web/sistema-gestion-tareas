// backend/controllers/listasController.js (VERSIÓN COMPLETA Y CORRECTA)
const db = require('../db/database');

// Obtener una lista simple de todos los proveedores activos
exports.getProveedoresActivos = (req, res) => {
  const sql = "SELECT id, razon_social FROM proveedores WHERE activo = 1 ORDER BY razon_social";
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