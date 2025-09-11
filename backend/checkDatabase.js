const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'development.db');
console.log('Ruta de la base de datos:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos SQLite');
});

console.log('=== VERIFICANDO BASE DE DATOS ===');

// Verificar si la base de datos existe y tiene datos
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
  if (err) {
    console.error('❌ Error obteniendo tablas:', err.message);
  } else {
    console.log('✅ Tablas encontradas:', rows.length);
    if (rows.length === 0) {
      console.log('⚠️  No hay tablas en la base de datos');
    } else {
      rows.forEach(row => {
        console.log(`  - ${row.name}`);
      });
    }
  }
  
  // Verificar si existe la tabla tareas específicamente
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='tareas'", [], (err, row) => {
    if (err) {
      console.error('❌ Error verificando tabla tareas:', err.message);
    } else if (row) {
      console.log('✅ Tabla "tareas" existe');
      
      // Contar registros en tareas
      db.get("SELECT COUNT(*) as count FROM tareas", [], (err, result) => {
        if (err) {
          console.error('❌ Error contando tareas:', err.message);
        } else {
          console.log(`✅ Tareas en la base de datos: ${result.count}`);
        }
        
        // Cerrar conexión
        db.close();
        console.log('\n=== VERIFICACIÓN COMPLETADA ===');
      });
    } else {
      console.log('❌ Tabla "tareas" NO existe');
      
      // Cerrar conexión
      db.close();
      console.log('\n=== VERIFICACIÓN COMPLETADA ===');
    }
  });
});
