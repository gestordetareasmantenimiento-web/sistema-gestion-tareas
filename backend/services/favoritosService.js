const db = require('../db/database');

class FavoritosService {
  // Obtener proveedores favoritos de un usuario
  static async getFavoritosByUsuario(idUsuario) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, pf.fecha_agregado
        FROM proveedores_favoritos pf
        JOIN proveedores p ON pf.id_proveedor = p.id
        WHERE pf.id_usuario = ? AND pf.activo = 1
        ORDER BY pf.fecha_agregado DESC
      `;
      
      db.all(sql, [idUsuario], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Agregar proveedor a favoritos
  static async agregarFavorito(idUsuario, idProveedor) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO proveedores_favoritos (id_usuario, id_proveedor, activo)
        VALUES (?, ?, 1)
      `;
      
      db.run(sql, [idUsuario, idProveedor], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Remover proveedor de favoritos
  static async removerFavorito(idUsuario, idProveedor) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE proveedores_favoritos 
        SET activo = 0 
        WHERE id_usuario = ? AND id_proveedor = ?
      `;
      
      db.run(sql, [idUsuario, idProveedor], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Verificar si un proveedor es favorito
  static async esFavorito(idUsuario, idProveedor) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) as count
        FROM proveedores_favoritos
        WHERE id_usuario = ? AND id_proveedor = ? AND activo = 1
      `;
      
      db.get(sql, [idUsuario, idProveedor], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count > 0);
        }
      });
    });
  }

  // Obtener todos los proveedores con estado de favorito
  static async getProveedoresConFavoritos(idUsuario) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, 
               CASE WHEN pf.id IS NOT NULL AND pf.activo = 1 THEN 1 ELSE 0 END as es_favorito
        FROM proveedores p
        LEFT JOIN proveedores_favoritos pf ON p.id = pf.id_proveedor AND pf.id_usuario = ?
        WHERE p.activo = 1
        ORDER BY es_favorito DESC, p.nombre ASC
      `;
      
      db.all(sql, [idUsuario], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = FavoritosService;
