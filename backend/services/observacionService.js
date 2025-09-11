const db = require('../db/database');
const historialService = require('./historialService');

/**
 * Servicio para manejar el sistema inteligente de observaciones
 */

/**
 * Determina el estado anterior inmediato, saltando gerente/supervisor si es necesario
 */
function getEstadoAnteriorInteligente(estadoActual) {
  const flujoNormal = {
    'Pendiente Aprobación CERCO': 'Pendiente Aprobación Gerente',
    'Pendiente Aprobación Gerente': 'Pendiente Aprobación Administración', 
    'Pendiente Aprobación Administración': 'Pendiente Aprobación Supervisor',
    'Pendiente Aprobación Supervisor': 'Pendiente Certificación Inspector',
    'Pendiente Certificación Inspector': 'Asignada'
  };

  const estadoAnterior = flujoNormal[estadoActual];
  
  // Si el estado anterior es Gerente o Supervisor, saltarlo
  if (estadoAnterior === 'Pendiente Aprobación Gerente') {
    return 'Pendiente Aprobación Administración';
  }
  
  if (estadoAnterior === 'Pendiente Aprobación Supervisor') {
    return 'Pendiente Certificación Inspector';
  }
  
  return estadoAnterior;
}

/**
 * Crea una observación y registra el origen para el retorno inteligente
 */
async function crearObservacion(id_tarea, id_usuario, rol_usuario, observacion, estado_actual) {
  try {
    // Determinar el estado de retorno inteligente
    const estado_retorno = getEstadoAnteriorInteligente(estado_actual);
    
    // Crear el estado de observación
    const estado_observacion = `Observada por ${rol_usuario}`;
    
    // Actualizar la tarea
    await new Promise((resolve, reject) => {
      const sql = `UPDATE tareas SET estado = ? WHERE id = ?`;
      db.run(sql, [estado_observacion, id_tarea], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    // Registrar en historial con información del origen
    await historialService.registrar(
      id_tarea, 
      id_usuario, 
      'Observación Creada', 
      `Observación por ${rol_usuario}: ${observacion}. Estado de retorno: ${estado_retorno}`,
      estado_actual,
      estado_observacion,
      {
        observador_original: rol_usuario,
        estado_retorno: estado_retorno,
        observacion: observacion,
        fecha_observacion: new Date().toISOString()
      }
    );
    
    return {
      success: true,
      estado_observacion,
      estado_retorno,
      mensaje: `Observación creada. La tarea volverá a: ${estado_retorno}`
    };
    
  } catch (error) {
    console.error('Error al crear observación:', error);
    throw error;
  }
}

/**
 * Pasa una observación al siguiente nivel (hacia el proveedor)
 */
async function pasarObservacion(id_tarea, id_usuario, rol_usuario, observacion_adicional = '') {
  try {
    // Obtener el historial de observaciones para encontrar el origen
    const historial = await historialService.obtenerHistorial(id_tarea);
    const observacionOriginal = historial
      .filter(h => h.accion === 'Observación Creada')
      .sort((a, b) => new Date(b.fecha_evento) - new Date(a.fecha_evento))[0];
    
    if (!observacionOriginal) {
      throw new Error('No se encontró la observación original');
    }
    
    const datosOriginales = observacionOriginal.datos_adicionales;
    const estadoActual = observacionOriginal.estado_nuevo;
    
    // Determinar el siguiente estado hacia el proveedor
    let siguienteEstado;
    if (estadoActual === 'Observada por CERCO') {
      siguienteEstado = 'Observada por Administración';
    } else if (estadoActual === 'Observada por Administración') {
      siguienteEstado = 'Observada por Inspector';
    } else if (estadoActual === 'Observada por Inspector') {
      siguienteEstado = 'Observada por Proveedor';
    } else {
      throw new Error('No se puede pasar esta observación');
    }
    
    // Actualizar la tarea
    await new Promise((resolve, reject) => {
      const sql = `UPDATE tareas SET estado = ? WHERE id = ?`;
      db.run(sql, [siguienteEstado, id_tarea], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    // Registrar el paso de observación
    await historialService.registrar(
      id_tarea,
      id_usuario,
      'Observación Pasada',
      `${rol_usuario} pasó la observación hacia el proveedor. ${observacion_adicional}`,
      estadoActual,
      siguienteEstado,
      {
        observador_original: datosOriginales.observador_original,
        estado_retorno: datosOriginales.estado_retorno,
        observacion_original: datosOriginales.observacion,
        observacion_adicional: observacion_adicional,
        fecha_paso: new Date().toISOString()
      }
    );
    
    return {
      success: true,
      estado_nuevo: siguienteEstado,
      mensaje: `Observación pasada a ${siguienteEstado}`
    };
    
  } catch (error) {
    console.error('Error al pasar observación:', error);
    throw error;
  }
}

/**
 * Finaliza una observación y retorna al observador original
 */
async function finalizarObservacion(id_tarea, id_usuario, rol_usuario, correccion = '') {
  try {
    // Obtener el historial para encontrar el origen de la observación
    const historial = await historialService.obtenerHistorial(id_tarea);
    const observacionOriginal = historial
      .filter(h => h.accion === 'Observación Creada')
      .sort((a, b) => new Date(b.fecha_evento) - new Date(a.fecha_evento))[0];
    
    if (!observacionOriginal) {
      throw new Error('No se encontró la observación original');
    }
    
    const datosOriginales = observacionOriginal.datos_adicionales;
    const estadoRetorno = datosOriginales.estado_retorno;
    
    // Actualizar la tarea al estado de retorno
    await new Promise((resolve, reject) => {
      const sql = `UPDATE tareas SET estado = ? WHERE id = ?`;
      db.run(sql, [estadoRetorno, id_tarea], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    // Registrar la finalización de observación
    await historialService.registrar(
      id_tarea,
      id_usuario,
      'Observación Finalizada',
      `${rol_usuario} finalizó la observación y corrigió el problema. ${correccion}`,
      observacionOriginal.estado_nuevo,
      estadoRetorno,
      {
        observador_original: datosOriginales.observador_original,
        correccion: correccion,
        fecha_correccion: new Date().toISOString()
      }
    );
    
    return {
      success: true,
      estado_retorno: estadoRetorno,
      mensaje: `Observación finalizada. Tarea retornada a: ${estadoRetorno}`
    };
    
  } catch (error) {
    console.error('Error al finalizar observación:', error);
    throw error;
  }
}

/**
 * Obtiene información sobre la observación actual de una tarea
 */
async function getInfoObservacion(id_tarea) {
  try {
    const historial = await historialService.obtenerHistorial(id_tarea);
    const observacionOriginal = historial
      .filter(h => h.accion === 'Observación Creada')
      .sort((a, b) => new Date(b.fecha_evento) - new Date(a.fecha_evento))[0];
    
    if (!observacionOriginal) {
      return null;
    }
    
    const datosOriginales = observacionOriginal.datos_adicionales;
    
    return {
      observador_original: datosOriginales.observador_original,
      estado_retorno: datosOriginales.estado_retorno,
      observacion: datosOriginales.observacion,
      fecha_observacion: datosOriginales.fecha_observacion,
      puede_pasar: ['Observada por CERCO', 'Observada por Administración', 'Observada por Inspector'].includes(observacionOriginal.estado_nuevo),
      puede_finalizar: true
    };
    
  } catch (error) {
    console.error('Error al obtener info de observación:', error);
    throw error;
  }
}

module.exports = {
  crearObservacion,
  pasarObservacion,
  finalizarObservacion,
  getInfoObservacion,
  getEstadoAnteriorInteligente
};
