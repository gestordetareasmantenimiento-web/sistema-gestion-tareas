const db = require('../db/database');

// Obtener las regiones asignadas a un usuario
exports.getUserRegions = (req, res) => {
  const userId = req.user.id;
  
  const sql = `
    SELECT r.id, r.nombre, r.descripcion
    FROM regiones r
    INNER JOIN usuario_region ur ON r.id = ur.region_id
    WHERE ur.usuario_id = ? AND r.activo = 1
    ORDER BY r.nombre
  `;
  
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error('Error obteniendo regiones del usuario:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ message: "success", data: rows });
  });
};
