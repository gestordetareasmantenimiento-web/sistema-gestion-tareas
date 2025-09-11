// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
// Usamos la nueva estructura de roles
const { ROLES, SUPERVISOR_ROLES } = require('../utils/roles');
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

// Esta función genérica está perfecta, la conservamos como está.
const checkRole = (rolesPermitidos) => {
  return (req, res, next) => {
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

// NUEVO: Middleware para verificar si es cualquier tipo de supervisor.
const isSupervisor = (req, res, next) => {
  if (!req.user || !req.user.rol) {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }
  
  if (SUPERVISOR_ROLES.includes(req.user.rol)) {
    next();
  } else {
    return res.status(403).json({ message: 'Esta acción solo puede ser realizada por un Supervisor.' });
  }
};

// NUEVO: Middleware para verificar si es específicamente Supervisor de Mantenimiento.
const isMantenimientoSupervisor = (req, res, next) => {
  if (!req.user || !req.user.rol) {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }

  if (req.user.rol === ROLES.SUPERVISOR_MANTENIMIENTO) {
    next();
  } else {
    return res.status(403).json({ message: 'Esta acción solo puede ser realizada por un Supervisor de Mantenimiento.' });
  }
};

module.exports = {
  authenticateToken,
  checkRole,
  isSupervisor,
  isMantenimientoSupervisor
};