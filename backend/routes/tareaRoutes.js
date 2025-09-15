const express = require('express');
const router = express.Router();
const tareaController = require('../controllers/tareaController');
const { 
  authenticateToken, 
  checkRole, 
  isSupervisor,
  isMantenimientoSupervisor 
} = require('../middleware/authMiddleware');
// Importamos SUPERVISOR_ROLES para las rutas
const { ROLES, SUPERVISOR_ROLES } = require('../utils/roles');

module.exports = function(upload) {
  // Aplica autenticación a todas las rutas de tareas
  router.use(authenticateToken); 
  
  // --- Rutas Principales de Tareas ---
  router.get('/', tareaController.getAllTareas);
  
  // Solo los inspectores pueden crear tareas
  router.post('/', 
    upload.array('archivos', 10), 
    checkRole([ROLES.INSPECTOR]),
    tareaController.createTarea
  );
  
  // --- Rutas para una tarea específica ---
  router.get('/:id', tareaController.getTareaById);
  router.get('/:id/certificado', tareaController.getCertificadoByTareaId);
  router.get('/:id/historial', tareaController.getHistorialTarea);
  
  // Roles que pueden realizar una actualización general (como añadir ICD)
  router.put('/:id', checkRole([ROLES.INSPECTOR, ROLES.SUPERVISOR_MANTENIMIENTO, ROLES.ADMINISTRATIVO]), tareaController.updateTarea);
  
  // Solo el inspector o su supervisor de mantenimiento pueden cancelar la tarea
  router.delete('/:id', checkRole([ROLES.INSPECTOR, ROLES.SUPERVISOR_MANTENIMIENTO]), tareaController.deleteTarea);
  
  // --- Rutas de Flujo de Trabajo (Ciclo de Vida Completo) ---
  router.post('/:id/emitir-certificado', upload.array('archivos', 10), checkRole([ROLES.PROVEEDOR]), tareaController.emitirCertificado);
  router.put('/:id/editar-certificado', upload.array('archivos', 10), checkRole([ROLES.PROVEEDOR, ROLES.INSPECTOR, ...SUPERVISOR_ROLES]), tareaController.editarCertificado);
  
  router.put('/:id/aprobar-inspector', checkRole([ROLES.INSPECTOR]), tareaController.aprobarInspector);
  router.put('/:id/observar-inspector', checkRole([ROLES.INSPECTOR]), tareaController.observarInspector);
  
  router.put('/:id/aprobar-supervisor', isSupervisor, tareaController.aprobarSupervisor);
  router.put('/:id/rechazar-supervisor', isSupervisor, tareaController.rechazarSupervisor);

  // Rutas para Administrativo (Aprobación)
  router.put('/:id/aprobar-admin', checkRole([ROLES.ADMINISTRATIVO]), tareaController.aprobarAdmin);
  router.put('/:id/observar-admin', checkRole([ROLES.ADMINISTRATIVO]), tareaController.observarAdmin);

  // Rutas para Gerente
  router.put('/:id/aprobar-gerente', checkRole([ROLES.GERENTE]), tareaController.aprobarGerente);
  router.put('/:id/observar-gerente', checkRole([ROLES.GERENTE]), tareaController.observarGerente);

  // Rutas para CERCO
  router.put('/:id/aprobar-cerco', checkRole([ROLES.CERCO]), tareaController.aprobarCerco);
  router.put('/:id/observar-cerco', checkRole([ROLES.CERCO]), tareaController.observarCerco);

  // --- Rutas del Sistema Inteligente de Observaciones ---
  router.get('/:id/info-observacion', tareaController.getInfoObservacion);
  router.put('/:id/pasar-observacion', checkRole([ROLES.ADMINISTRATIVO, ROLES.INSPECTOR, ...SUPERVISOR_ROLES]), tareaController.pasarObservacion);
  router.put('/:id/finalizar-observacion', checkRole([ROLES.ADMINISTRATIVO, ROLES.INSPECTOR, ...SUPERVISOR_ROLES, ROLES.PROVEEDOR]), tareaController.finalizarObservacion);

  // --- Ruta de Exportación ---
  router.post('/:id/exportar-materiales', checkRole([ROLES.ADMINISTRATIVO]), tareaController.exportarMateriales);
  
  // --- Rutas para Adjuntos ---
  router.get('/:id/adjuntos', tareaController.getAdjuntos);
  // Ruta para agregar adjuntos, permitiendo a varios roles hacerlo
  router.post('/:id/add-adjunto', 
    upload.array('archivos', 10), 
    checkRole([ROLES.PROVEEDOR, ROLES.INSPECTOR, ...SUPERVISOR_ROLES]), 
    tareaController.addAdjunto
  );

  return router;
};
