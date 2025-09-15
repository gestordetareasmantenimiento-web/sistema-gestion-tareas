// Script para limpiar registros duplicados de configuración
const db = require('./db/database');
const fs = require('fs');
const path = require('path');

async function cleanupDuplicateConfig() {
  try {
    console.log('🧹 Iniciando limpieza de registros duplicados...');
    
    // Leer el script SQL
    const sqlScript = fs.readFileSync(path.join(__dirname, 'cleanup_duplicate_config.sql'), 'utf8');
    
    // Ejecutar el script
    db.exec(sqlScript, (err) => {
      if (err) {
        console.error('❌ Error ejecutando limpieza:', err);
        return;
      }
      
      console.log('✅ Limpieza completada exitosamente');
      
      // Verificar el resultado
      db.get("SELECT COUNT(*) as count FROM costominimodiario", [], (err, row) => {
        if (err) {
          console.error('Error verificando costominimodiario:', err);
        } else {
          console.log(`📊 Registros en costominimodiario: ${row.count}`);
        }
      });
      
      db.get("SELECT COUNT(*) as count FROM cuadrilla_modelo", [], (err, row) => {
        if (err) {
          console.error('Error verificando cuadrilla_modelo:', err);
        } else {
          console.log(`📊 Registros en cuadrilla_modelo: ${row.count}`);
        }
        
        // Cerrar la conexión
        db.close((err) => {
          if (err) {
            console.error('Error cerrando base de datos:', err);
          } else {
            console.log('🔒 Conexión cerrada');
          }
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
  }
}

// Ejecutar la limpieza
cleanupDuplicateConfig();
