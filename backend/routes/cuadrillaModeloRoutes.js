const express = require('express');
const router = express.Router();
const cuadrillaModeloService = require('../services/cuadrillaModeloService');
const { authenticateToken } = require('../middleware/authMiddleware');

// Calcular cuadrilla modelo en tiempo real
router.post('/calcular', authenticateToken, async (req, res) => {
  try {
    const { manoDeObraSeleccionada } = req.body;
    
    if (!manoDeObraSeleccionada || !Array.isArray(manoDeObraSeleccionada)) {
      return res.status(400).json({ error: 'Se requiere un array de mano de obra seleccionada' });
    }
    
    const calculo = await cuadrillaModeloService.calcularCuadrillaModelo(manoDeObraSeleccionada);
    
    res.json({
      message: 'success',
      data: calculo
    });
  } catch (error) {
    console.error('Error calculando cuadrilla modelo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener el porcentaje actual de cuadrilla modelo
router.get('/porcentaje', authenticateToken, async (req, res) => {
  try {
    const porcentaje = await cuadrillaModeloService.getPorcentajeCuadrillaModelo();
    
    res.json({
      message: 'success',
      data: { porcentaje }
    });
  } catch (error) {
    console.error('Error obteniendo porcentaje de cuadrilla modelo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar el porcentaje de cuadrilla modelo (solo para administradores)
router.put('/porcentaje', authenticateToken, async (req, res) => {
  try {
    const { porcentaje } = req.body;
    
    if (!porcentaje || isNaN(porcentaje) || porcentaje <= 0) {
      return res.status(400).json({ error: 'El porcentaje debe ser un número positivo' });
    }
    
    const nuevoId = await cuadrillaModeloService.updatePorcentajeCuadrillaModelo(porcentaje);
    
    res.json({
      message: 'Porcentaje de cuadrilla modelo actualizado exitosamente',
      data: { id: nuevoId, porcentaje }
    });
  } catch (error) {
    console.error('Error actualizando porcentaje de cuadrilla modelo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
