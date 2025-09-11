// backend/runMigrations.js
const fs = require('fs');
const path = require('path');
const db = require('./db/database');

async function runMigrations() {
  console.log('🚀 Iniciando migraciones de base de datos...');
  
  try {
    // Leer y ejecutar migración 001
    console.log('📋 Ejecutando migración 001: Corregir estructura de regiones...');
    const migration001 = fs.readFileSync(path.join(__dirname, 'migrations/001_fix_regions_structure.sql'), 'utf8');
    
    // Dividir el script en comandos individuales
    const commands = migration001
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          await new Promise((resolve, reject) => {
            db.run(command, (err) => {
              if (err) {
                // Ignorar errores de "column already exists" o "table already exists"
                if (err.message.includes('already exists') || err.message.includes('duplicate column')) {
                  console.log(`⚠️  Advertencia: ${err.message}`);
                  resolve();
                } else {
                  reject(err);
                }
              } else {
                resolve();
              }
            });
          });
        } catch (error) {
          console.error(`❌ Error ejecutando comando: ${command.substring(0, 50)}...`);
          console.error(`   Error: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Migración 001 completada');
    
    // Leer y ejecutar migración 002
    console.log('📋 Ejecutando migración 002: Migrar usuarios a regiones...');
    const migration002 = fs.readFileSync(path.join(__dirname, 'migrations/002_migrate_user_regions.sql'), 'utf8');
    
    const commands002 = migration002
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (const command of commands002) {
      if (command.trim()) {
        try {
          await new Promise((resolve, reject) => {
            db.run(command, (err) => {
              if (err) {
                if (err.message.includes('already exists') || err.message.includes('duplicate column')) {
                  console.log(`⚠️  Advertencia: ${err.message}`);
                  resolve();
                } else {
                  reject(err);
                }
              } else {
                resolve();
              }
            });
          });
        } catch (error) {
          console.error(`❌ Error ejecutando comando: ${command.substring(0, 50)}...`);
          console.error(`   Error: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Migración 002 completada');
    
    // Verificar el estado final
    console.log('🔍 Verificando estado de la base de datos...');
    
    // Verificar tablas creadas
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.name));
      });
    });
    
    console.log('📊 Tablas en la base de datos:', tables);
    
    // Verificar regiones
    const regiones = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM regiones", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('🌍 Regiones creadas:', regiones.length);
    regiones.forEach(region => {
      console.log(`   - ${region.nombre} (ID: ${region.id})`);
    });
    
    // Verificar asignaciones de usuarios
    const asignaciones = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          u.nombre_completo,
          u.rol,
          r.nombre as region,
          COUNT(*) as total
        FROM usuario_regiones ur
        JOIN usuarios u ON ur.id_usuario = u.id
        JOIN regiones r ON ur.id_region = r.id
        GROUP BY u.id, u.nombre_completo, u.rol, r.nombre
        ORDER BY u.rol, u.nombre_completo
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('👥 Asignaciones de usuarios a regiones:', asignaciones.length);
    asignaciones.forEach(asignacion => {
      console.log(`   - ${asignacion.nombre_completo} (${asignacion.rol}) → ${asignacion.region}`);
    });
    
    console.log('🎉 ¡Migraciones completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante las migraciones:', error);
    process.exit(1);
  }
}

// Ejecutar migraciones si se llama directamente
if (require.main === module) {
  runMigrations().then(() => {
    console.log('✅ Proceso de migración finalizado');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { runMigrations };
