/* Abonnement Hive+ et boosts — préfixe /api/billing.
   Le webhook Stripe est monté à part dans server.js (corps brut requis pour la signature). */
const router = require('express').Router();
const requireAuth = require('../middlewares/requireAuth');
const ctrl = require('../controllers/billing.controller');

router.get('/plans', ctrl.getPlans);
router.get('/me', requireAuth, ctrl.getMine);
router.post('/checkout', requireAuth, ctrl.createCheckout);
router.post('/portal', requireAuth, ctrl.createPortal);
router.post('/boost/:projectId', requireAuth, ctrl.useBoostCredit);

module.exports = router;
