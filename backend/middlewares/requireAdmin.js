/* Middleware de contrôle d'accès administrateur. Doit être chaîné après requireAuth,
   qui popule req.user depuis le token JWT. Retourne 403 si le rôle n'est pas 'admin'. */
module.exports = (req, res, next) => {
  if (req.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Accès refusé. Droits administrateur requis.' });
  }
};
