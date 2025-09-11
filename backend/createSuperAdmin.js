const bcrypt = require('bcrypt');
const db = require('./db/database');

async function createSuperAdmin() {
  try {
    console.log('Creando usuario superadministrador...');
    
    // Verificar si ya existe un superadministrador
    const existingSuperAdmin = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM usuarios WHERE rol = ?', ['superadministrador'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingSuperAdmin) {
      console.log('Ya existe un usuario superadministrador:', existingSuperAdmin.email);
      return;
    }

    // Crear el superadministrador
    const email = 'superadmin@sistema.com';
    const password = 'superadmin123';
    const nombre_completo = 'Super Administrador';
    const rol = 'superadministrador';
    
    const password_hash = await bcrypt.hash(password, 10);
    
    const sql = `INSERT INTO usuarios (nombre_completo, email, password_hash, rol, activo, region) VALUES (?, ?, ?, ?, 1, 'Norte')`;
    
    await new Promise((resolve, reject) => {
      db.run(sql, [nombre_completo, email, password_hash, rol], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    console.log('✅ Usuario superadministrador creado exitosamente!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    
  } catch (error) {
    console.error('❌ Error creando superadministrador:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createSuperAdmin().then(() => {
    process.exit(0);
  });
}

module.exports = createSuperAdmin;
