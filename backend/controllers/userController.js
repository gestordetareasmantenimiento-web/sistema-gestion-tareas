const db = require('../db/database');

// Obtener las regiones asignadas a un usuario
exports.getUserRegions = (req, res) => {
  const userId = req.user.id;
  
  console.log('🔍 getUserRegions - Usuario ID:', userId);
  console.log('🔍 getUserRegions - Usuario completo:', req.user);
  
  const sql = `
    SELECT r.id, r.nombre, r.descripcion
    FROM regiones r
    INNER JOIN usuario_regiones ur ON r.id = ur.id_region
    WHERE ur.id_usuario = ? AND ur.activo = 1 AND r.activo = 1
    ORDER BY r.nombre
  `;
  
  console.log('🔍 Ejecutando SQL:', sql);
  console.log('🔍 Con parámetros:', [userId]);
  
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error('❌ Error obteniendo regiones del usuario:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('✅ Regiones encontradas:', rows);
    res.json({ message: "success", data: rows });
  });
};
