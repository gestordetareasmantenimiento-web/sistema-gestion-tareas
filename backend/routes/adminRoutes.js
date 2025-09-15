const express = require('express');
const router = express.Router();
const { checkRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/roles');
const adminController = require('../controllers/adminController');

// Rutas para administración de mano de obra
router.get('/mano-de-obra', checkRole([ROLES.SUPERADMIN]), adminController.getManoDeObra);
router.put('/mano-de-obra/:id', checkRole([ROLES.SUPERADMIN]), adminController.updateManoDeObra);

// Rutas para administración de materiales
router.get('/materiales', checkRole([ROLES.SUPERADMIN]), adminController.getMateriales);
router.put('/materiales/:codigo', checkRole([ROLES.SUPERADMIN]), adminController.updateMaterial);

module.exports = router;
