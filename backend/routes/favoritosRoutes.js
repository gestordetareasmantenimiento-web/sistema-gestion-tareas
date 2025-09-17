const express = require('express');
const router = express.Router();
const FavoritosService = require('../services/favoritosService');
const { authenticateToken } = require('../middleware/authMiddleware');

// Obtener proveedores favoritos del usuario autenticado
router.get('/proveedores', authenticateToken, async (req, res) => {
  try {
    const favoritos = await FavoritosService.getFavoritosByUsuario(req.user.id);
    res.json(favoritos);
  } catch (error) {
    console.error('Error obteniendo favoritos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todos los proveedores con estado de favorito
router.get('/proveedores/todos', authenticateToken, async (req, res) => {
  try {
    const proveedores = await FavoritosService.getProveedoresConFavoritos(req.user.id);
    res.json(proveedores);
  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Agregar proveedor a favoritos
router.post('/proveedores/:idProveedor', authenticateToken, async (req, res) => {
  try {
    const { idProveedor } = req.params;
    const resultado = await FavoritosService.agregarFavorito(req.user.id, idProveedor);
    res.json({ 
      success: true, 
      message: 'Proveedor agregado a favoritos',
      data: resultado 
    });
  } catch (error) {
    console.error('Error agregando favorito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Remover proveedor de favoritos
router.delete('/proveedores/:idProveedor', authenticateToken, async (req, res) => {
  try {
    const { idProveedor } = req.params;
    const resultado = await FavoritosService.removerFavorito(req.user.id, idProveedor);
    res.json({ 
      success: true, 
      message: 'Proveedor removido de favoritos',
      data: resultado 
    });
  } catch (error) {
    console.error('Error removiendo favorito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar si un proveedor es favorito
router.get('/proveedores/:idProveedor/verificar', authenticateToken, async (req, res) => {
  try {
    const { idProveedor } = req.params;
    const esFavorito = await FavoritosService.esFavorito(req.user.id, idProveedor);
    res.json({ esFavorito });
  } catch (error) {
    console.error('Error verificando favorito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
