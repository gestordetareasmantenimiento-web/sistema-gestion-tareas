// backend/routes/listasRoutes.js
const express = require('express');
const router = express.Router();
const listasController = require('../controllers/listasController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/proveedores', listasController.getProveedoresActivos);
router.get('/inspectores-subordinados', listasController.getInspectoresPorSupervisor);
router.get('/mano-de-obra', listasController.getManoDeObra);
router.get('/materiales', listasController.getMateriales);

module.exports = router;