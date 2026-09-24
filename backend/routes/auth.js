/* Routes d'authentification — préfixe /api/auth
   loginLimiter : max 5 requêtes/min par IP sur POST /login (brute-force protection).
   Les routes de vérification OTP ne sont pas rate-limitées car elles nécessitent déjà un code valide. */
const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const requireAuth = require('../middlewares/requireAuth');
const { loginLimiter } = require('../middlewares/rateLimiter');

router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification-email', authController.resendVerificationEmail);
router.post('/login', loginLimiter, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post("/verify-reset-code", authController.verifyResetCode);
router.get('/me', requireAuth, authController.getMe);

// Connexion via Google / GitHub (voir utils/oauthProviders.js)
router.get('/providers', authController.oauthProviders);
router.get('/oauth/:provider', authController.oauthStart);
router.get('/oauth/:provider/callback', authController.oauthCallback);

module.exports = router;
