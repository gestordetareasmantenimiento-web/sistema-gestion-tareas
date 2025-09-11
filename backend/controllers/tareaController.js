// Importamos los servicios que contienen toda la lógica de negocio.
const tareaService = require('../services/tareaService');
const workflowService = require('../services/workflowService');

// Unimos y exportamos todas las funciones de los servicios.
// De esta manera, el controlador solo actúa como un punto de entrada
// para que las rutas puedan acceder a la lógica de negocio.
module.exports = {
  // Funciones del servicio de tareas (getAll, getById, create, update, etc.)
  ...tareaService,

  // Funciones del servicio de flujo de trabajo (aprobar, observar, rechazar, etc.)
  ...workflowService,
};

