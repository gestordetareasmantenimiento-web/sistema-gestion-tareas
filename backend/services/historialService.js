const db = require('../db/database');

/**
 * Registra un nuevo evento en el historial de una tarea.
 * @param {number} id_tarea ID de la tarea a la que se asocia el evento.
 * @param {number} id_usuario ID del usuario que realiza la acción.
 * @param {string} accion Descripción breve de la acción (ej: "Creación", "Aprobado por Supervisor").
 * @param {string} detalle Información adicional sobre el evento.
 * @param {string} estado_anterior Estado anterior de la tarea (opcional).
 * @param {string} estado_nuevo Estado nuevo de la tarea (opcional).
 * @param {object} datos_adicionales Datos adicionales en formato JSON (opcional).
 * @returns {Promise<number>} El ID del nuevo registro de historial.
 */
const registrar = (id_tarea, id_usuario, accion, detalle, estado_anterior = null, estado_nuevo = null, datos_adicionales = null) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO historial_tareas 
      (id_tarea, id_usuario, accion, detalle, estado_anterior, estado_nuevo, datos_adicionales) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    const datosJson = datos_adicionales ? JSON.stringify(datos_adicionales) : null;
    
    db.run(sql, [id_tarea, id_usuario, accion, detalle, estado_anterior, estado_nuevo, datosJson], function(err) {
      if (err) {
        console.error('Error al registrar en historial:', err.message);
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
};

/**
 * Obtiene el historial completo de una tarea con información de usuarios.
 * @param {number} id_tarea ID de la tarea.
 * @returns {Promise<Array>} Array con el historial completo.
 */
const obtenerHistorial = (id_tarea) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        h.*,
        u.nombre_completo as usuario_nombre,
        u.rol as usuario_rol
      FROM historial_tareas h
      LEFT JOIN usuarios u ON h.id_usuario = u.id
      WHERE h.id_tarea = ?
      ORDER BY h.fecha_evento ASC
    `;
    
    db.all(sql, [id_tarea], (err, rows) => {
      if (err) {
        console.error('Error al obtener historial:', err.message);
        reject(err);
      } else {
        // Parsear datos_adicionales si existe
        const historial = rows.map(row => ({
          ...row,
          datos_adicionales: row.datos_adicionales ? JSON.parse(row.datos_adicionales) : null
        }));
        resolve(historial);
      }
    });
  });
};

module.exports = {
  registrar,
  obtenerHistorial
};

