const db = require('../db/database');
const { registrar } = require('./historialService');
const observacionService = require('./observacionService');

// Función auxiliar privada para este módulo
const cambiarEstadoTarea = (res, id_tarea, id_usuario, nuevoEstado, accionHistorial, detalleHistorial) => {
  const sql = "UPDATE tareas SET estado = ? WHERE id = ?";
  db.run(sql, [nuevoEstado, id_tarea], async function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Tarea no encontrada para actualizar estado." });
    try {
      await registrar(id_tarea, id_usuario, accionHistorial, detalleHistorial);
      res.json({ message: "Estado de la tarea actualizado exitosamente.", changes: this.changes });
    } catch (historialError) {
      console.error('Error al registrar en historial:', historialError);
      res.status(500).json({ error: 'El estado de la tarea se actualizó, pero falló el registro en el historial.' });
    }
  });
};

// --- Exportamos todas las funciones del ciclo de vida ---

exports.aprobarInspector = (req, res) => {
  cambiarEstadoTarea(res, req.params.id, req.user.id, 'Pendiente Aprobación Supervisor', 'Aprobado por Inspector', `La tarea pasa a estado: Pendiente Aprobación Supervisor.`);
};
exports.observarInspector = async (req, res) => {
  try {
    const { observacion } = req.body;
    const { id } = req.params;
    const { id: id_usuario, rol } = req.user;
    
    const resultado = await observacionService.crearObservacion(
      id, id_usuario, rol, observacion, 'Pendiente Certificación Inspector'
    );
    
    res.json({ message: resultado.mensaje, data: resultado });
  } catch (error) {
    console.error('Error al observar inspector:', error);
    res.status(500).json({ error: 'Error al procesar la observación' });
  }
};
exports.aprobarSupervisor = (req, res) => {
  cambiarEstadoTarea(res, req.params.id, req.user.id, 'Pendiente Aprobación Administración', 'Aprobado por Supervisor', `La tarea pasa a estado: Pendiente Aprobación Administración.`);
};
exports.rechazarSupervisor = (req, res) => {
  cambiarEstadoTarea(res, req.params.id, req.user.id, 'Pendiente Certificación Inspector', 'Observado por Supervisor', `La tarea vuelve al inspector. Observación: ${req.body.observacion}`);
};
exports.aprobarAdmin = (req, res) => {
  const nuevo_estado = 'Pendiente Aprobación Gerente';
  cambiarEstadoTarea(res, req.params.id, req.user.id, nuevo_estado, 'Aprobado por Administración', `La tarea pasa a estado: ${nuevo_estado}.`);
};
exports.observarAdmin = async (req, res) => {
  try {
    const { observacion } = req.body;
    const { id } = req.params;
    const { id: id_usuario, rol } = req.user;
    
    const resultado = await observacionService.crearObservacion(
      id, id_usuario, rol, observacion, 'Pendiente Aprobación Administración'
    );
    
    res.json({ message: resultado.mensaje, data: resultado });
  } catch (error) {
    console.error('Error al observar administración:', error);
    res.status(500).json({ error: 'Error al procesar la observación' });
  }
};
exports.aprobarGerente = (req, res) => {
  cambiarEstadoTarea(res, req.params.id, req.user.id, 'Pendiente Aprobación CERCO', 'Aprobado por Gerencia', `La tarea pasa a estado: Pendiente Aprobación CERCO.`);
};
exports.observarGerente = (req, res) => {
  cambiarEstadoTarea(res, req.params.id, req.user.id, 'Pendiente Aprobación Administración', 'Observado por Gerencia', `La tarea vuelve a Administración. Observación: ${req.body.observacion}`);
};
exports.aprobarCerco = (req, res) => {
  cambiarEstadoTarea(res, req.params.id, req.user.id, 'Finalizada - Aprobada', 'Aprobado por CERCO', `La tarea pasa a estado: Finalizada - Aprobada.`);
};
exports.observarCerco = async (req, res) => {
  try {
    const { observacion } = req.body;
    const { id } = req.params;
    const { id: id_usuario, rol } = req.user;
    
    const resultado = await observacionService.crearObservacion(
      id, id_usuario, rol, observacion, 'Pendiente Aprobación CERCO'
    );
    
    res.json({ message: resultado.mensaje, data: resultado });
  } catch (error) {
    console.error('Error al observar CERCO:', error);
    res.status(500).json({ error: 'Error al procesar la observación' });
  }
};

// --- Nuevas funciones para el sistema inteligente de observaciones ---

exports.pasarObservacion = async (req, res) => {
  try {
    const { observacion_adicional } = req.body;
    const { id } = req.params;
    const { id: id_usuario, rol } = req.user;
    
    const resultado = await observacionService.pasarObservacion(
      id, id_usuario, rol, observacion_adicional
    );
    
    res.json({ message: resultado.mensaje, data: resultado });
  } catch (error) {
    console.error('Error al pasar observación:', error);
    res.status(500).json({ error: 'Error al pasar la observación' });
  }
};

exports.finalizarObservacion = async (req, res) => {
  try {
    const { correccion } = req.body;
    const { id } = req.params;
    const { id: id_usuario, rol } = req.user;
    
    const resultado = await observacionService.finalizarObservacion(
      id, id_usuario, rol, correccion
    );
    
    res.json({ message: resultado.mensaje, data: resultado });
  } catch (error) {
    console.error('Error al finalizar observación:', error);
    res.status(500).json({ error: 'Error al finalizar la observación' });
  }
};

exports.getInfoObservacion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const info = await observacionService.getInfoObservacion(id);
    
    res.json({ message: 'success', data: info });
  } catch (error) {
    console.error('Error al obtener info de observación:', error);
    res.status(500).json({ error: 'Error al obtener información de la observación' });
  }
};
