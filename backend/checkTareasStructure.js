const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'development.db');
const db = new sqlite3.Database(dbPath);

console.log('=== VERIFICANDO ESTRUCTURA DE LA TABLA TAREAS ===');

// Obtener la estructura de la tabla tareas
db.all("PRAGMA table_info(tareas)", [], (err, rows) => {
  if (err) {
    console.error('❌ Error obteniendo estructura de tareas:', err.message);
  } else {
    console.log('✅ Columnas de la tabla tareas:');
    rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });
  }
  
  // Cerrar conexión
  db.close();
  console.log('\n=== VERIFICACIÓN COMPLETADA ===');
});
