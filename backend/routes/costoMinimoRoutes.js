const express = require('express');
const router = express.Router();
const costoMinimoService = require('../services/costoMinimoService');
const { authenticateToken } = require('../middleware/authMiddleware');

// Validar costo mínimo diario en tiempo real
router.post('/validar', authenticateToken, async (req, res) => {
  try {
    const { manoDeObraSeleccionada } = req.body;
    
    if (!manoDeObraSeleccionada || !Array.isArray(manoDeObraSeleccionada)) {
      return res.status(400).json({ error: 'Se requiere un array de mano de obra seleccionada' });
    }
    
    const validacion = await costoMinimoService.validarCostoMinimoDiario(manoDeObraSeleccionada);
    
    res.json({
      message: 'success',
      data: validacion
    });
  } catch (error) {
    console.error('Error validando costo mínimo diario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener el valor actual del costo mínimo diario
router.get('/valor', authenticateToken, async (req, res) => {
  try {
    const valor = await costoMinimoService.getCostoMinimoDiario();
    
    res.json({
      message: 'success',
      data: { valor }
    });
  } catch (error) {
    console.error('Error obteniendo costo mínimo diario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar el valor del costo mínimo diario (solo para administradores)
router.put('/valor', authenticateToken, async (req, res) => {
  try {
    const { valor } = req.body;
    
    console.log('Valor recibido:', valor, 'Tipo:', typeof valor);
    
    // Convertir a número si es string
    const valorNumerico = parseFloat(valor);
    
    if (!valor || isNaN(valorNumerico) || valorNumerico <= 0) {
      console.log('Validación falló - valor:', valor, 'valorNumerico:', valorNumerico);
      return res.status(400).json({ error: 'El valor debe ser un número positivo' });
    }
    
    console.log('Actualizando costo mínimo diario con valor:', valorNumerico);
    const nuevoId = await costoMinimoService.updateCostoMinimoDiario(valorNumerico);
    
    res.json({
      message: 'Costo mínimo diario actualizado exitosamente',
      data: { id: nuevoId, valor: valorNumerico }
    });
  } catch (error) {
    console.error('Error actualizando costo mínimo diario:', error);
    res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
});

module.exports = router;
