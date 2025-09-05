// backend/routes/tareaRoutes.js

const express = require('express');
const router = express.Router();
const tareaController = require('../controllers/tareaController');
const { authenticateToken, isInspectorType } = require('../middleware/authMiddleware');

module.exports = function(upload) {
  router.use(authenticateToken); 
  
  // Rutas Principales de Tareas
  router.get('/', tareaController.getAllTareas);
  router.post('/', 
    upload.array('archivos', 10), 
    isInspectorType,
    tareaController.createTarea
  );
  
  // Rutas para una tarea específica
  router.get('/:id', tareaController.getTareaById);
  // ¡NUEVA RUTA PARA OBTENER EL CERTIFICADO COMPLETO!
  router.get('/:id/certificado', tareaController.getCertificadoByTareaId);
  
  router.put('/:id', tareaController.updateTarea);
  router.delete('/:id', tareaController.deleteTarea);
  
  // Rutas de Flujo de Trabajo
  router.post('/:id/emitir-certificado', upload.array('archivos', 10), tareaController.emitirCertificado);
  router.put('/:id/aprobar-inspector', isInspectorType, tareaController.aprobarInspector);
  router.put('/:id/observar-inspector', isInspectorType, tareaController.observarInspector);
  router.put('/:id/aprobar-supervisor', tareaController.aprobarSupervisor);
  router.put('/:id/rechazar-supervisor', tareaController.rechazarSupervisor);
  
  // Rutas para Adjuntos
  router.get('/:id/adjuntos', tareaController.getAdjuntos);

  return router;
};