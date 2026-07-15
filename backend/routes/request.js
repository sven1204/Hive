/* Routes de demandes de participation — préfixe /api/requests
   L'acceptation/refus notifient le demandeur via Socket.io (émis dans le contrôleur via req.app.get('io')). */
const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/requireAuth');
const {
  sendRequest,
  getMyRequest,
  getProjectRequests,
  acceptRequest,
  declineRequest,
} = require('../controllers/request.controller');

router.post('/:projectId',       requireAuth, sendRequest);
router.get('/:projectId/mine',   requireAuth, getMyRequest);
router.get('/:projectId/list',   requireAuth, getProjectRequests);
router.put('/:reqId/accept',     requireAuth, acceptRequest);
router.put('/:reqId/decline',    requireAuth, declineRequest);

module.exports = router;
