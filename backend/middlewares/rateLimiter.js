/* Rate limiter sur la route POST /auth/login.
   Limite à 5 tentatives par IP par minute pour ralentir les attaques par force brute.
   La logique de verrouillage applicatif (5 tentatives → lockUntil) est dans auth.controller. */
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 1000 * 60, // fenêtre de 1 minute
  max: 5,              // 5 requêtes max par IP dans la fenêtre
  message: "Trop de tentatives de connexion. Réessayez dans une minute."
});

module.exports = { loginLimiter };
