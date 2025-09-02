// backend/middleware/authMiddleware.js (Actualizado)
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'este-es-un-secreto-muy-seguro-que-deberia-estar-en-un-archivo-de-configuracion'; // En una app real, esto no estaría aquí.

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No se proveyó un token.' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token mal formado.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido.' });
    }
    req.user = user; // Guardamos los datos del usuario del token en la petición
    next();
  });
}

module.exports = authMiddleware;