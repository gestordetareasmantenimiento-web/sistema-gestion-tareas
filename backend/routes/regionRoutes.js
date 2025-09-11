// backend/routes/regionRoutes.js
const express = require('express');
const router = express.Router();
const regionService = require('../services/regionService');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../utils/roles');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Obtener todas las regiones
router.get('/', async (req, res) => {
  try {
    const regiones = await regionService.getAllRegions();
    res.json({ success: true, data: regiones });
  } catch (error) {
    console.error('Error obteniendo regiones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener regiones del usuario autenticado
router.get('/usuario', async (req, res) => {
  try {
    const userId = req.user.id;
    const regiones = await regionService.getUserRegions(userId);
    res.json({ success: true, data: regiones });
  } catch (error) {
    console.error('Error obteniendo regiones del usuario:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener regiones disponibles para crear tareas
router.get('/disponibles-creacion', async (req, res) => {
  try {
    const userId = req.user.id;
    const rolUsuario = req.user.rol;
    const regiones = await regionService.getRegionesDisponiblesParaCreacion(userId, rolUsuario);
    res.json({ success: true, data: regiones });
  } catch (error) {
    console.error('Error obteniendo regiones disponibles:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener inspectores por región
router.get('/:regionId/inspectores', async (req, res) => {
  try {
    const { regionId } = req.params;
    const inspectores = await regionService.getInspectoresPorRegion(regionId);
    res.json({ success: true, data: inspectores });
  } catch (error) {
    console.error('Error obteniendo inspectores por región:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener proveedores por región
router.get('/:regionId/proveedores', async (req, res) => {
  try {
    const { regionId } = req.params;
    const proveedores = await regionService.getProveedoresPorRegion(regionId);
    res.json({ success: true, data: proveedores });
  } catch (error) {
    console.error('Error obteniendo proveedores por región:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Asignar usuario a región (solo superadmin)
router.post('/asignar', checkRole([ROLES.SUPERADMIN]), async (req, res) => {
  try {
    const { userId, regionId } = req.body;
    
    if (!userId || !regionId) {
      return res.status(400).json({ success: false, error: 'Faltan datos obligatorios' });
    }
    
    const resultado = await regionService.asignarUsuarioARegion(userId, regionId);
    res.json({ success: true, data: { id: resultado } });
  } catch (error) {
    console.error('Error asignando usuario a región:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Remover usuario de región (solo superadmin)
router.delete('/desasignar', checkRole([ROLES.SUPERADMIN]), async (req, res) => {
  try {
    const { userId, regionId } = req.body;
    
    if (!userId || !regionId) {
      return res.status(400).json({ success: false, error: 'Faltan datos obligatorios' });
    }
    
    const resultado = await regionService.removerUsuarioDeRegion(userId, regionId);
    res.json({ success: true, data: { changes: resultado } });
  } catch (error) {
    console.error('Error removiendo usuario de región:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

module.exports = router;
