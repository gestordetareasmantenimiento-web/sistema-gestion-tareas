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

// Rutas para mano de obra y materiales
router.get('/mano-de-obra',
  checkRole([ROLES.PROVEEDOR, ROLES.INSPECTOR, ...SUPERVISOR_ROLES, ROLES.ADMINISTRATIVO, ROLES.GERENTE, ROLES.CERCO]),
  listasController.getManoDeObra
);

router.get('/materiales',
  checkRole([ROLES.PROVEEDOR, ROLES.INSPECTOR, ...SUPERVISOR_ROLES, ROLES.ADMINISTRATIVO, ROLES.GERENTE, ROLES.CERCO]),
  listasController.getMateriales
);

// Rutas para favoritos de mano de obra
router.get('/favoritos/mano-de-obra',
  checkRole([ROLES.PROVEEDOR, ROLES.INSPECTOR, ...SUPERVISOR_ROLES, ROLES.ADMINISTRATIVO, ROLES.GERENTE, ROLES.CERCO]),
  listasController.getFavoritosManoDeObra
);

router.post('/favoritos/mano-de-obra',
  checkRole([ROLES.PROVEEDOR, ROLES.INSPECTOR, ...SUPERVISOR_ROLES, ROLES.ADMINISTRATIVO, ROLES.GERENTE, ROLES.CERCO]),
  listasController.agregarFavoritoManoDeObra
);

router.delete('/favoritos/mano-de-obra/:codigo',
  checkRole([ROLES.PROVEEDOR, ROLES.INSPECTOR, ...SUPERVISOR_ROLES, ROLES.ADMINISTRATIVO, ROLES.GERENTE, ROLES.CERCO]),
  listasController.quitarFavoritoManoDeObra
);

// Rutas para favoritos de materiales utilizados
router.get('/favoritos/materiales-utilizados',
  checkRole([ROLES.PROVEEDOR, ROLES.INSPECTOR, ...SUPERVISOR_ROLES, ROLES.ADMINISTRATIVO, ROLES.GERENTE, ROLES.CERCO]),
  listasController.getFavoritosMaterialesUtilizados
);

router.post('/favoritos/materiales-utilizados',
  checkRole([ROLES.PROVEEDOR, ROLES.INSPECTOR, ...SUPERVISOR_ROLES, ROLES.ADMINISTRATIVO, ROLES.GERENTE, ROLES.CERCO]),
  listasController.agregarFavoritoMaterialUtilizado
);

router.delete('/favoritos/materiales-utilizados/:codigo',
  checkRole([ROLES.PROVEEDOR, ROLES.INSPECTOR, ...SUPERVISOR_ROLES, ROLES.ADMINISTRATIVO, ROLES.GERENTE, ROLES.CERCO]),
  listasController.quitarFavoritoMaterialUtilizado
);

// Rutas para favoritos de materiales recuperados
router.get('/favoritos/materiales-recuperados',
  checkRole([ROLES.PROVEEDOR, ROLES.INSPECTOR, ...SUPERVISOR_ROLES, ROLES.ADMINISTRATIVO, ROLES.GERENTE, ROLES.CERCO]),
  listasController.getFavoritosMaterialesRecuperados
);

router.post('/favoritos/materiales-recuperados',
  checkRole([ROLES.PROVEEDOR, ROLES.INSPECTOR, ...SUPERVISOR_ROLES, ROLES.ADMINISTRATIVO, ROLES.GERENTE, ROLES.CERCO]),
  listasController.agregarFavoritoMaterialRecuperado
);

router.delete('/favoritos/materiales-recuperados/:codigo',
  checkRole([ROLES.PROVEEDOR, ROLES.INSPECTOR, ...SUPERVISOR_ROLES, ROLES.ADMINISTRATIVO, ROLES.GERENTE, ROLES.CERCO]),
  listasController.quitarFavoritoMaterialRecuperado
);

module.exports = router;