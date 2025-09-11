const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/roles');
const superadminController = require('../controllers/superadminController');

// Middleware para verificar que el usuario es superadministrador
const isSuperAdmin = [authenticateToken, checkRole([ROLES.SUPERADMIN])];

// Dashboard principal del superadministrador
router.get('/dashboard', ...isSuperAdmin, superadminController.getDashboard);

// Obtener detalles de un rol específico
router.get('/dashboard/roles/:role', ...isSuperAdmin, superadminController.getRoleDetails);

// Obtener usuarios de un rol en una región específica
router.get('/dashboard/roles/:role/regions/:region', ...isSuperAdmin, superadminController.getRoleRegionUsers);

// Obtener dashboard específico de un usuario
router.get('/dashboard/roles/:role/regions/:region/users/:userId', ...isSuperAdmin, superadminController.getUserDashboard);

// Obtener todas las tareas
router.get('/tasks', ...isSuperAdmin, superadminController.getAllTasks);

// Obtener reportes
router.get('/reports', ...isSuperAdmin, superadminController.getReports);

// Generar reportes específicos
router.get('/reports/tareas', ...isSuperAdmin, superadminController.generateTaskReport);
router.get('/reports/usuarios', ...isSuperAdmin, superadminController.generateUserReport);
router.get('/reports/regiones', ...isSuperAdmin, superadminController.generateRegionReport);
router.get('/reports/roles', ...isSuperAdmin, superadminController.generateRoleReport);
router.get('/reports/rendimiento', ...isSuperAdmin, superadminController.generatePerformanceReport);
router.get('/reports/temporal', ...isSuperAdmin, superadminController.generateTemporalReport);

// Exportación de datos crudos
router.get('/raw-data/tareas', ...isSuperAdmin, superadminController.getRawTasksData);
router.get('/raw-data/historial', ...isSuperAdmin, superadminController.getRawHistorialData);
router.get('/raw-data/completa', ...isSuperAdmin, superadminController.getRawCompleteData);

// Obtener usuarios de un rol específico en una región
router.get('/dashboard/:region/:role', ...isSuperAdmin, superadminController.getRoleUsers);

// Obtener dashboard específico de un usuario
router.get('/dashboard/:region/:role/:userId', ...isSuperAdmin, superadminController.getUserDashboard);

// Obtener detalles de una región específica (DEBE IR AL FINAL para no interceptar /dashboard)
router.get('/dashboard/:region', ...isSuperAdmin, superadminController.getRegionDetails);

// Gestión de usuarios
router.get('/users', ...isSuperAdmin, superadminController.getAllUsers);

// Configuración del sistema
router.get('/settings', ...isSuperAdmin, superadminController.getSettings);

module.exports = router;
