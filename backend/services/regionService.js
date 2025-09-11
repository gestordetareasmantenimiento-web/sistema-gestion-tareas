// backend/services/regionService.js
const db = require('../db/database');

// Función para obtener todas las regiones
const getAllRegions = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, nombre, descripcion, activo, fecha_creacion
      FROM regiones 
      WHERE activo = 1
      ORDER BY nombre
    `;
    db.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Función para obtener regiones de un usuario
const getUserRegions = (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT r.id, r.nombre, r.descripcion
      FROM regiones r
      JOIN usuario_regiones ur ON r.id = ur.id_region
      WHERE ur.id_usuario = ? AND r.activo = 1
      ORDER BY r.nombre
    `;
    db.all(query, [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Función para validar permisos de creación de tareas por región
const validarPermisoCreacionTarea = async (userId, idRegion, rolUsuario) => {
  try {
    // Obtener regiones del usuario
    const regionesUsuario = await getUserRegions(userId);
    const regionesIds = regionesUsuario.map(r => r.id);
    
    // Verificar si el usuario tiene acceso a la región
    if (!regionesIds.includes(parseInt(idRegion))) {
      return false;
    }
    
    // Validar según el rol
    switch (rolUsuario.toLowerCase()) {
      case 'inspector':
        // Inspectores pueden crear tareas en sus regiones asignadas
        return true;
        
      case 'supervisor de mantenimiento':
        // Supervisores de mantenimiento pueden crear tareas en sus regiones
        // En CABA pueden crear en ambas regiones (CABA Sur y Norte)
        return true;
        
      case 'superadministrador':
        // Superadmin puede crear tareas en cualquier región
        return true;
        
      default:
        // Otros roles no pueden crear tareas
        return false;
    }
  } catch (error) {
    console.error('Error validando permisos de creación:', error);
    return false;
  }
};

// Función para obtener regiones disponibles para crear tareas
const getRegionesDisponiblesParaCreacion = async (userId, rolUsuario) => {
  try {
    const regionesUsuario = await getUserRegions(userId);
    
    // Filtrar según el rol
    switch (rolUsuario.toLowerCase()) {
      case 'inspector':
        // Inspectores pueden crear en sus regiones asignadas
        return regionesUsuario;
        
      case 'supervisor de mantenimiento':
        // Supervisores de mantenimiento pueden crear en sus regiones
        return regionesUsuario;
        
      case 'superadministrador':
        // Superadmin puede crear en todas las regiones
        return await getAllRegions();
        
      default:
        // Otros roles no pueden crear tareas
        return [];
    }
  } catch (error) {
    console.error('Error obteniendo regiones disponibles:', error);
    return [];
  }
};

// Función para asignar usuario a región
const asignarUsuarioARegion = (userId, regionId) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT OR IGNORE INTO usuario_regiones (id_usuario, id_region)
      VALUES (?, ?)
    `;
    db.run(query, [userId, regionId], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

// Función para remover usuario de región
const removerUsuarioDeRegion = (userId, regionId) => {
  return new Promise((resolve, reject) => {
    const query = `
      DELETE FROM usuario_regiones 
      WHERE id_usuario = ? AND id_region = ?
    `;
    db.run(query, [userId, regionId], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};

// Función para obtener inspectores disponibles para una región
const getInspectoresPorRegion = (regionId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT u.id, u.nombre_completo, u.email
      FROM usuarios u
      JOIN usuario_regiones ur ON u.id = ur.id_usuario
      WHERE ur.id_region = ? AND u.rol = 'inspector' AND u.activo = 1
      ORDER BY u.nombre_completo
    `;
    db.all(query, [regionId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Función para obtener proveedores disponibles para una región
const getProveedoresPorRegion = (regionId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT p.id, p.razon_social, p.cuit, p.centro, p.almacen
      FROM proveedores p
      WHERE p.activo = 1
      ORDER BY p.razon_social
    `;
    db.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  getAllRegions,
  getUserRegions,
  validarPermisoCreacionTarea,
  getRegionesDisponiblesParaCreacion,
  asignarUsuarioARegion,
  removerUsuarioDeRegion,
  getInspectoresPorRegion,
  getProveedoresPorRegion
};
