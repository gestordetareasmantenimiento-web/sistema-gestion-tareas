const db = require('./db/database');

console.log('=== PROBANDO CONSULTA SIMPLE PARA INSPECTOR ===');

// Consulta simple para ver usuarios de inspector por región
const simpleQuery = `
  SELECT 
    r.nombre,
    COUNT(DISTINCT u.id) as total_usuarios
  FROM regiones r
  LEFT JOIN usuarios u ON r.id = u.id_region AND u.rol = 'inspector' AND u.activo = 1
  GROUP BY r.id, r.nombre
  ORDER BY r.nombre
`;

db.all(simpleQuery, [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Regiones con inspectores:', JSON.stringify(rows, null, 2));
  }
  process.exit(0);
});
