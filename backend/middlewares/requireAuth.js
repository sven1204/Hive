const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token)
    return res.status(401).json({ error: 'Accès refusé. Token manquant.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // on ajoute l'utilisateur au req
    next(); // on passe à la suite
  } catch (err) {
    res.status(401).json({ error: 'Token invalide.' });
  }
};
