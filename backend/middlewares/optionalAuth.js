/* Middleware d'authentification optionnelle. Tente de décoder le token JWT s'il est présent,
   mais laisse toujours passer la requête. Utilisé sur les routes publiques qui personnalisent
   leur réponse selon que l'utilisateur est connecté ou non (ex : liste de projets). */
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {}
  }
  next();
};
