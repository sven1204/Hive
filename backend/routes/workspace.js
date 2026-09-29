/* Espace projet (tâches + agenda) d'une conversation de groupe. Toutes les routes exigent d'être connecté. */
const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const ctrl = require('../controllers/workspace.controller');

const router = express.Router();
router.use(requireAuth);

router.get('/:convId', ctrl.getWorkspace);
router.post('/:convId/tasks', ctrl.createTask);
router.patch('/:convId/tasks/:taskId', ctrl.updateTask);
router.delete('/:convId/tasks/:taskId', ctrl.deleteTask);
router.post('/:convId/events', ctrl.createEvent);
router.patch('/:convId/events/:eventId', ctrl.updateEvent);
router.delete('/:convId/events/:eventId', ctrl.deleteEvent);
router.put('/:convId/events/:eventId/rsvp', ctrl.rsvpEvent);

module.exports = router;
