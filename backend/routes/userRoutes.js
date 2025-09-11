const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Obtener regiones del usuario
router.get('/regions', authenticateToken, userController.getUserRegions);

module.exports = router;
