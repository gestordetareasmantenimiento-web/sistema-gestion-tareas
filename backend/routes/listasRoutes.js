// backend/routes/listasRoutes.js
const express = require('express');
const router = express.Router();
const listasController = require('../controllers/listasController');
// ¡CAMBIO AQUÍ! Importamos específicamente la función que necesitamos
const { authenticateToken } = require('../middleware/authMiddleware');

// ¡CAMBIO AQUÍ! Usamos la función importada correctamente
router.use(authenticateToken);

router.get('/proveedores', listasController.getProveedoresActivos);
router.get('/inspectores-subordinados', listasController.getInspectoresPorSupervisor);
router.get('/mano-de-obra', listasController.getManoDeObra);
router.get('/materiales', listasController.getMateriales);

module.exports = router;