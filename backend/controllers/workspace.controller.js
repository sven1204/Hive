/* Espace projet d'un groupe : tâches et rendez-vous (agenda).
   Accès réservé aux participants de la conversation. Chaque modification est diffusée
   aux membres (événement « workspace_updated ») pour un rafraîchissement en temps réel. */
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Project = require('../models/Project');
const ProjectTask = require('../models/ProjectTask');
const ProjectEvent = require('../models/ProjectEvent');
const { POPULATE_FIELDS } = require('../utils/messagePopulate');

const isId = (v) => mongoose.Types.ObjectId.isValid(v);

/* Charge la conversation et vérifie l'accès ; renvoie null après avoir répondu en cas de refus. */
async function loadConversation(req, res) {
  const { convId } = req.params;
  if (!isId(convId)) { res.status(404).json({ message: 'Conversation introuvable' }); return null; }
  const conv = await Conversation.findById(convId).select('participants projectId projectTitle');
  if (!conv) { res.status(404).json({ message: 'Conversation introuvable' }); return null; }
  if (!conv.participants.map(String).includes(req.user.id)) { res.status(403).json({ message: 'Non autorisé' }); return null; }
  return conv;
}

function broadcast(req, conv, kind) {
  const io = req.app.get('io');
  if (!io) return;
  conv.participants.forEach((uid) => io.to(`user:${uid}`).emit('workspace_updated', { conversationId: String(conv._id), kind }));
}

/* Message système dans le fil du groupe (ex. nouveau rendez-vous) */
async function postSystemMessage(req, conv, content) {
  const msg = await Message.create({ conversationId: conv._id, senderId: req.user.id, content, isSystem: true, readBy: [req.user.id] });
  const io = req.app.get('io');
  if (io) conv.participants.forEach((uid) => io.to(`user:${uid}`).emit('new_group_message', { conversationId: String(conv._id), message: msg }));
}

const parseDate = (value) => {
  if (value === null || value === '' || value === undefined) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const cleanText = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const formatWhen = (date) => new Intl.DateTimeFormat('fr-CH', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich',
}).format(date);

const populateTask = (q) => q.populate('assigneeId', POPULATE_FIELDS).populate('createdBy', POPULATE_FIELDS);
const populateEvent = (q) => q.populate('createdBy', POPULATE_FIELDS).populate('rsvps.userId', POPULATE_FIELDS);

// GET /workspace/:convId — tâches (à faire d'abord) et rendez-vous (chronologiques)
exports.getWorkspace = async (req, res) => {
  try {
    const conv = await loadConversation(req, res);
    if (!conv) return;
    const [tasks, events] = await Promise.all([
      populateTask(ProjectTask.find({ conversationId: conv._id })).sort({ done: 1, dueDate: 1, createdAt: -1 }),
      populateEvent(ProjectEvent.find({ conversationId: conv._id })).sort({ startsAt: 1 }),
    ]);
    return res.json({ tasks, events });
  } catch (err) {
    console.error('getWorkspace error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

/* Vérifie qu'un membre assigné fait bien partie du groupe */
const validAssignee = (conv, assigneeId) =>
  assigneeId === null || assigneeId === '' || assigneeId === undefined || conv.participants.map(String).includes(String(assigneeId));

// POST /workspace/:convId/tasks { title, assigneeId?, dueDate? }
exports.createTask = async (req, res) => {
  try {
    const conv = await loadConversation(req, res);
    if (!conv) return;
    const title = cleanText(req.body?.title, 200);
    if (!title) return res.status(400).json({ message: 'Titre requis' });
    const dueDate = parseDate(req.body?.dueDate);
    if (dueDate === undefined) return res.status(400).json({ message: 'Date invalide' });
    if (!validAssignee(conv, req.body?.assigneeId)) return res.status(400).json({ message: 'Ce membre ne fait pas partie du projet' });

    const task = await ProjectTask.create({
      conversationId: conv._id,
      title,
      assigneeId: req.body?.assigneeId || null,
      dueDate,
      createdBy: req.user.id,
    });
    broadcast(req, conv, 'tasks');
    return res.status(201).json(await populateTask(ProjectTask.findById(task._id)));
  } catch (err) {
    console.error('createTask error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PATCH /workspace/:convId/tasks/:taskId { title?, assigneeId?, dueDate?, done? }
exports.updateTask = async (req, res) => {
  try {
    const conv = await loadConversation(req, res);
    if (!conv) return;
    if (!isId(req.params.taskId)) return res.status(404).json({ message: 'Tâche introuvable' });
    const task = await ProjectTask.findOne({ _id: req.params.taskId, conversationId: conv._id });
    if (!task) return res.status(404).json({ message: 'Tâche introuvable' });

    const body = req.body || {};
    if ('title' in body) {
      const title = cleanText(body.title, 200);
      if (!title) return res.status(400).json({ message: 'Titre requis' });
      task.title = title;
    }
    if ('assigneeId' in body) {
      if (!validAssignee(conv, body.assigneeId)) return res.status(400).json({ message: 'Ce membre ne fait pas partie du projet' });
      task.assigneeId = body.assigneeId || null;
    }
    if ('dueDate' in body) {
      const dueDate = parseDate(body.dueDate);
      if (dueDate === undefined) return res.status(400).json({ message: 'Date invalide' });
      task.dueDate = dueDate;
    }
    if ('done' in body) {
      task.done = !!body.done;
      task.doneAt = task.done ? new Date() : null;
    }
    await task.save();
    broadcast(req, conv, 'tasks');
    return res.json(await populateTask(ProjectTask.findById(task._id)));
  } catch (err) {
    console.error('updateTask error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /workspace/:convId/tasks/:taskId — auteur de la tâche ou propriétaire du projet
exports.deleteTask = async (req, res) => {
  try {
    const conv = await loadConversation(req, res);
    if (!conv) return;
    if (!isId(req.params.taskId)) return res.status(404).json({ message: 'Tâche introuvable' });
    const task = await ProjectTask.findOne({ _id: req.params.taskId, conversationId: conv._id });
    if (!task) return res.status(404).json({ message: 'Tâche introuvable' });
    if (!(await canManage(req, conv, task.createdBy))) return res.status(403).json({ message: 'Non autorisé' });
    await task.deleteOne();
    broadcast(req, conv, 'tasks');
    return res.json({ ok: true });
  } catch (err) {
    console.error('deleteTask error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

/* Auteur de l'élément ou propriétaire du projet */
async function canManage(req, conv, authorId) {
  if (String(authorId) === req.user.id) return true;
  if (!conv.projectId) return false;
  const project = await Project.findById(conv.projectId).select('ownerId');
  return !!project && String(project.ownerId) === req.user.id;
}

// POST /workspace/:convId/events { title, startsAt, location?, notes? }
exports.createEvent = async (req, res) => {
  try {
    const conv = await loadConversation(req, res);
    if (!conv) return;
    const title = cleanText(req.body?.title, 120);
    const startsAt = parseDate(req.body?.startsAt);
    if (!title) return res.status(400).json({ message: 'Titre requis' });
    if (!startsAt) return res.status(400).json({ message: 'Date et heure requises' });

    const event = await ProjectEvent.create({
      conversationId: conv._id,
      title,
      startsAt,
      location: cleanText(req.body?.location, 160),
      notes: cleanText(req.body?.notes, 500),
      createdBy: req.user.id,
      rsvps: [{ userId: req.user.id, status: 'yes' }], // l'organisateur est présent par défaut
    });
    broadcast(req, conv, 'events');
    await postSystemMessage(req, conv, `Nouveau rendez-vous : ${title} — ${formatWhen(startsAt)}${event.location ? `, ${event.location}` : ''}`);
    return res.status(201).json(await populateEvent(ProjectEvent.findById(event._id)));
  } catch (err) {
    console.error('createEvent error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PATCH /workspace/:convId/events/:eventId { title?, startsAt?, location?, notes? } — auteur ou propriétaire
exports.updateEvent = async (req, res) => {
  try {
    const conv = await loadConversation(req, res);
    if (!conv) return;
    if (!isId(req.params.eventId)) return res.status(404).json({ message: 'Rendez-vous introuvable' });
    const event = await ProjectEvent.findOne({ _id: req.params.eventId, conversationId: conv._id });
    if (!event) return res.status(404).json({ message: 'Rendez-vous introuvable' });
    if (!(await canManage(req, conv, event.createdBy))) return res.status(403).json({ message: 'Non autorisé' });

    const body = req.body || {};
    if ('title' in body) {
      const title = cleanText(body.title, 120);
      if (!title) return res.status(400).json({ message: 'Titre requis' });
      event.title = title;
    }
    if ('startsAt' in body) {
      const startsAt = parseDate(body.startsAt);
      if (!startsAt) return res.status(400).json({ message: 'Date et heure requises' });
      event.startsAt = startsAt;
    }
    if ('location' in body) event.location = cleanText(body.location, 160);
    if ('notes' in body) event.notes = cleanText(body.notes, 500);
    await event.save();
    broadcast(req, conv, 'events');
    return res.json(await populateEvent(ProjectEvent.findById(event._id)));
  } catch (err) {
    console.error('updateEvent error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /workspace/:convId/events/:eventId — auteur ou propriétaire
exports.deleteEvent = async (req, res) => {
  try {
    const conv = await loadConversation(req, res);
    if (!conv) return;
    if (!isId(req.params.eventId)) return res.status(404).json({ message: 'Rendez-vous introuvable' });
    const event = await ProjectEvent.findOne({ _id: req.params.eventId, conversationId: conv._id });
    if (!event) return res.status(404).json({ message: 'Rendez-vous introuvable' });
    if (!(await canManage(req, conv, event.createdBy))) return res.status(403).json({ message: 'Non autorisé' });
    await event.deleteOne();
    broadcast(req, conv, 'events');
    return res.json({ ok: true });
  } catch (err) {
    console.error('deleteEvent error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /workspace/:convId/events/:eventId/rsvp { status: yes | maybe | no }
exports.rsvpEvent = async (req, res) => {
  const { status } = req.body || {};
  if (!['yes', 'maybe', 'no'].includes(status)) return res.status(400).json({ message: 'Réponse invalide' });
  try {
    const conv = await loadConversation(req, res);
    if (!conv) return;
    if (!isId(req.params.eventId)) return res.status(404).json({ message: 'Rendez-vous introuvable' });
    const event = await ProjectEvent.findOne({ _id: req.params.eventId, conversationId: conv._id });
    if (!event) return res.status(404).json({ message: 'Rendez-vous introuvable' });

    const existing = event.rsvps.find((r) => String(r.userId) === req.user.id);
    if (existing) existing.status = status;
    else event.rsvps.push({ userId: req.user.id, status });
    await event.save();
    broadcast(req, conv, 'events');
    return res.json(await populateEvent(ProjectEvent.findById(event._id)));
  } catch (err) {
    console.error('rsvpEvent error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};
