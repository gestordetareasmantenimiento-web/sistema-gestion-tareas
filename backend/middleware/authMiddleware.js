// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { ROLES_TIPO_INSPECTOR } = require('../utils/roles');
const { JWT_SECRET } = require('../config');

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token mal formado o ausente.' });
    }
    const token = authHeader.split(' ')[1];
    const decodedUser = jwt.verify(token, JWT_SECRET);
    req.user = decodedUser;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
}

const checkRole = (rolesPermitidos) => {
  return (req, res, next) => {
    // ¡CORREGIDO AQUÍ!
    if (!req.user || !req.user.rol) {
      return res.status(403).json({ message: 'Acceso denegado. Rol de usuario no encontrado.' });
    }
    const rolUsuario = req.user.rol.toLowerCase();
    if (rolesPermitidos.map(r => r.toLowerCase()).includes(rolUsuario)) {
      next();
    } else {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
    }
  };
};

function isInspectorType(req, res, next) {
    // ¡CORREGIDO AQUÍ!
    if (!req.user || !req.user.rol) {
        return res.status(403).json({ message: 'Acceso denegado.' });
    }
    
    const rolUsuario = req.user.rol.toLowerCase();
    if (ROLES_TIPO_INSPECTOR.includes(rolUsuario)) {
        next();
    } else {
        return res.status(403).json({ message: 'Esta acción solo puede ser realizada por un Inspector o rol equivalente.' });
    }
}

module.exports = {
  authenticateToken,
  checkRole,
  isInspectorType
};