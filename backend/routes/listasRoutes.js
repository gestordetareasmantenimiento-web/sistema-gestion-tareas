// backend/routes/listasRoutes.js
const express = require('express');
const router = express.Router();
const listasController = require('../controllers/listasController');
// Importamos todos los middlewares y roles necesarios
const { 
  authenticateToken, 
  checkRole, 
  isMantenimientoSupervisor 
} = require('../middleware/authMiddleware');
const { ROLES, SUPERVISOR_ROLES } = require('../utils/roles');


// Aplicamos autenticación a todo el grupo de rutas
router.use(authenticateToken);

// Solo roles que asignan tareas pueden ver la lista de proveedores
router.get('/proveedores', 
  checkRole([ROLES.INSPECTOR, ROLES.SUPERVISOR_MANTENIMIENTO, ROLES.ADMINISTRATIVO, ROLES.CERCO]), 
  listasController.getProveedoresActivos
);

// Solo el Supervisor de Mantenimiento puede ver a sus inspectores
router.get('/inspectores-subordinados', 
  isMantenimientoSupervisor, 
  listasController.getInspectoresPorSupervisor
);

// Los administrativos y CERCO pueden ver todos los inspectores
router.get('/inspectores', 
  checkRole([ROLES.ADMINISTRATIVO, ROLES.CERCO]), 
  listasController.getAllInspectores
);

// Roles que completan certificados pueden ver mano de obra y materiales
const rolesCertificado = [ROLES.INSPECTOR, ...SUPERVISOR_ROLES, ROLES.PROVEEDOR];
router.get('/mano-de-obra', checkRole(rolesCertificado), listasController.getManoDeObra);
router.get('/materiales', checkRole(rolesCertificado), listasController.getMateriales);

module.exports = router;