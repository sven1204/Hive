/* Routes d'administration — préfixe /api/admin
   Toutes les routes passent par requireAuth puis requireAdmin.
   Seul un utilisateur avec role: 'admin' dans son token JWT peut les appeler. */
const router = require('express').Router();
const requireAuth = require('../middlewares/requireAuth');
const requireAdmin = require('../middlewares/requireAdmin');
const adminController = require('../controllers/admin.controller');

router.use(requireAuth, requireAdmin);

router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/role', adminController.changeRole);

router.get('/projects', adminController.getProjects);
router.delete('/projects/:id', adminController.deleteProject);

module.exports = router;
