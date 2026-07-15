const Message      = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const User         = require('../models/User');

const POPULATE_FIELDS = 'displayName firstName lastName avatarUrl _id';

// ==============================
// CONVERSATIONS DIRECTES
// ==============================

// GET /messages/conversations — liste toutes les conversations DM avec le dernier message et le nombre de non-lus
exports.getConversations = async (req, res) => {
  const me = req.user.id;
  const meUser = await User.findById(me).select('blockedUsers archivedDMs');
  const blockedIds = meUser.blockedUsers.map(String);
  const archivedIds = meUser.archivedDMs.map(String);
  try {
    const messages = await Message.find({
      $or: [{ senderId: me }, { receiverId: me }],
      receiverId: { $exists: true, $ne: null },
      conversationId: null,
    })
      .populate('senderId', POPULATE_FIELDS)
      .populate('receiverId', POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    // Déduplique par interlocuteur et calcule les non-lus
    const seen = new Map();
    for (const msg of messages) {
      const partner = msg.senderId._id.toString() === me ? msg.receiverId : msg.senderId;
      const key = partner._id.toString();
      if (blockedIds.includes(key)) continue;
      if (archivedIds.includes(key)) continue;
      if (!seen.has(key)) {
        seen.set(key, { partner, lastMessage: msg, unread: 0 });
      }
      if (!msg.read && msg.receiverId._id.toString() === me) {
        seen.get(key).unread++;
      }
    }

    return res.json([...seen.values()]);
  } catch (err) {
    console.error('getConversations error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /messages/:userId — historique des messages directs avec un utilisateur (200 max)
exports.getMessages = async (req, res) => {
  const me = req.user.id;
  const { userId } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { senderId: me, receiverId: userId },
        { senderId: userId, receiverId: me },
      ],
    })
      .populate('senderId', POPULATE_FIELDS)
      .populate('receiverId', POPULATE_FIELDS)
      .sort({ createdAt: 1 })
      .limit(200);

    return res.json(messages);
  } catch (err) {
    console.error('getMessages error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /messages/:userId/read — marque tous les messages reçus d'un utilisateur comme lus
exports.markRead = async (req, res) => {
  const me = req.user.id;
  const { userId } = req.params;
  try {
    await Message.updateMany(
      { senderId: userId, receiverId: me, read: false },
      { read: true },
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('markRead error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /messages/dm/archived — liste des conversations DM archivées
exports.getArchivedDMs = async (req, res) => {
  const me = req.user.id;
  try {
    const meUser = await User.findById(me).select('archivedDMs');
    const archivedIds = meUser.archivedDMs.map(String);
    if (!archivedIds.length) return res.json([]);

    const messages = await Message.find({
      $or: [{ senderId: me }, { receiverId: me }],
      receiverId: { $exists: true, $ne: null },
      conversationId: null,
    })
      .populate('senderId', POPULATE_FIELDS)
      .populate('receiverId', POPULATE_FIELDS)
      .sort({ createdAt: -1 });

    const seen = new Map();
    for (const msg of messages) {
      const partner = msg.senderId._id.toString() === me ? msg.receiverId : msg.senderId;
      const key = partner._id.toString();
      if (!archivedIds.includes(key)) continue;
      if (!seen.has(key)) seen.set(key, { partner, lastMessage: msg });
    }
    return res.json([...seen.values()]);
  } catch (err) {
    console.error('getArchivedDMs error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /messages/dm/:userId/archive — archive la conversation DM avec cet utilisateur
exports.archiveDM = async (req, res) => {
  const me = req.user.id;
  const { userId } = req.params;
  try {
    await User.findByIdAndUpdate(me, { $addToSet: { archivedDMs: userId } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /messages/dm/:userId/unarchive — désarchive la conversation DM avec cet utilisateur
exports.unarchiveDM = async (req, res) => {
  const me = req.user.id;
  const { userId } = req.params;
  try {
    await User.findByIdAndUpdate(me, { $pull: { archivedDMs: userId } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /messages/unread — nombre total de messages directs non lus (badge header)
exports.getUnreadCount = async (req, res) => {
  const me = req.user.id;
  try {
    const count = await Message.countDocuments({ receiverId: me, read: false });
    return res.json({ count });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ==============================
// CONVERSATIONS DE GROUPE (PROJETS)
// ==============================

// GET /messages/group/mine — conversations actives (non archivées, non supprimées)
exports.getMyConversations = async (req, res) => {
  const me = req.user.id;
  try {
    const convs = await Conversation.find({ participants: me, archivedBy: { $ne: me }, deletedBy: { $ne: me } })
      .populate('participants', POPULATE_FIELDS)
      .populate('projectId', 'title _id ownerId status participants')
      .sort({ updatedAt: -1 });

    // Enrichit chaque conversation avec son dernier message
    const result = await Promise.all(convs.map(async (conv) => {
      const last = await Message.findOne({ conversationId: conv._id })
        .populate('senderId', POPULATE_FIELDS)
        .sort({ createdAt: -1 });
      return { conversation: conv, lastMessage: last };
    }));

    return res.json(result);
  } catch (err) {
    console.error('getMyConversations error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /messages/group/archived — conversations archivées
exports.getArchivedConversations = async (req, res) => {
  const me = req.user.id;
  try {
    const convs = await Conversation.find({ participants: me, archivedBy: me, deletedBy: { $ne: me } })
      .populate('participants', POPULATE_FIELDS)
      .populate('projectId', 'title _id ownerId status')
      .sort({ updatedAt: -1 });

    const result = await Promise.all(convs.map(async (conv) => {
      const last = await Message.findOne({ conversationId: conv._id })
        .populate('senderId', POPULATE_FIELDS)
        .sort({ createdAt: -1 });
      return { conversation: conv, lastMessage: last };
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /messages/group/:convId/archive — archiver une conversation
exports.archiveConversation = async (req, res) => {
  const me = req.user.id;
  try {
    const conv = await Conversation.findOne({ _id: req.params.convId, participants: me });
    if (!conv) return res.status(404).json({ message: 'Conversation introuvable' });
    await Conversation.findByIdAndUpdate(conv._id, { $addToSet: { archivedBy: me } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /messages/group/:convId/unarchive — désarchiver
exports.unarchiveConversation = async (req, res) => {
  const me = req.user.id;
  try {
    const conv = await Conversation.findOne({ _id: req.params.convId, participants: me });
    if (!conv) return res.status(404).json({ message: 'Conversation introuvable' });
    await Conversation.findByIdAndUpdate(conv._id, { $pull: { archivedBy: me } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /messages/group/:convId — suppression définitive (seulement si archivée)
exports.deleteConversation = async (req, res) => {
  const me = req.user.id;
  try {
    const conv = await Conversation.findOne({ _id: req.params.convId, participants: me, archivedBy: me });
    if (!conv) return res.status(404).json({ message: 'Conversation introuvable ou non archivée' });
    await Conversation.findByIdAndUpdate(conv._id, { $addToSet: { deletedBy: me } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /messages/group/:convId — messages d'une conversation de groupe (accès réservé aux participants)
exports.getConversationMessages = async (req, res) => {
  const me = req.user.id;
  const { convId } = req.params;
  try {
    const conv = await Conversation.findById(convId);
    if (!conv) return res.status(404).json({ message: 'Conversation introuvable' });
    if (!conv.participants.map(String).includes(me)) return res.status(403).json({ message: 'Non autorisé' });

    const messages = await Message.find({ conversationId: convId })
      .populate('senderId', POPULATE_FIELDS)
      .sort({ createdAt: 1 })
      .limit(200);
    return res.json(messages);
  } catch (err) {
    console.error('getConversationMessages error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ==============================
// ÉDITION ET SUPPRESSION DE MESSAGES
// ==============================

// PUT /messages/:msgId/edit — modifie le contenu d'un message (expéditeur uniquement), propage via Socket.io
exports.editMessage = async (req, res) => {
  const me = req.user.id;
  const { msgId } = req.params;
  const { content } = req.body;
  try {
    if (!content?.trim()) return res.status(400).json({ message: 'Contenu vide' });
    const msg = await Message.findById(msgId);
    if (!msg) return res.status(404).json({ message: 'Message introuvable' });
    if (msg.senderId.toString() !== me) return res.status(403).json({ message: 'Non autorisé' });
    if (msg.deleted) return res.status(400).json({ message: 'Message supprimé' });
    msg.content = content.trim();
    msg.edited = true;
    await msg.save();

    // Propager la modification en temps réel à tous les destinataires
    const io = req.app.get('io');
    if (io) {
      const payload = { msgId, content: msg.content };
      if (msg.conversationId) {
        const conv = await Conversation.findById(msg.conversationId);
        conv?.participants.forEach(uid => io.to(`user:${uid}`).emit('message_edited', payload));
      } else if (msg.receiverId) {
        io.to(`user:${msg.receiverId}`).emit('message_edited', payload);
        io.to(`user:${me}`).emit('message_edited', payload);
      }
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /messages/:msgId/delete — suppression logique (contenu remplacé, flag deleted=true), propage via Socket.io
exports.deleteMessage = async (req, res) => {
  const me = req.user.id;
  const { msgId } = req.params;
  try {
    const msg = await Message.findById(msgId);
    if (!msg) return res.status(404).json({ message: 'Message introuvable' });
    if (msg.senderId.toString() !== me) return res.status(403).json({ message: 'Non autorisé' });
    msg.deleted = true;
    msg.content = 'Message supprimé';
    await msg.save();

    // Propager la suppression en temps réel à tous les destinataires
    const io = req.app.get('io');
    if (io) {
      if (msg.conversationId) {
        const conv = await Conversation.findById(msg.conversationId);
        conv?.participants.forEach(uid => {
          io.to(`user:${uid}`).emit('message_deleted', { msgId, conversationId: msg.conversationId });
        });
      } else if (msg.receiverId) {
        io.to(`user:${msg.receiverId}`).emit('message_deleted', { msgId });
        io.to(`user:${me}`).emit('message_deleted', { msgId });
      }
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ==============================
// BLOCAGE D'UTILISATEURS
// ==============================

// POST /messages/block/:userId — ajoute l'utilisateur à la liste de blocage (addToSet évite les doublons)
exports.blockUser = async (req, res) => {
  const me = req.user.id;
  const { userId } = req.params;
  try {
    await User.findByIdAndUpdate(me, { $addToSet: { blockedUsers: userId } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /messages/block/:userId — retire l'utilisateur de la liste de blocage
exports.unblockUser = async (req, res) => {
  const me = req.user.id;
  const { userId } = req.params;
  try {
    await User.findByIdAndUpdate(me, { $pull: { blockedUsers: userId } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ==============================
// NOTIFICATIONS
// ==============================

// GET /messages/notifications — 30 dernières notifications de l'utilisateur connecté
exports.getNotifications = async (req, res) => {
  const me = req.user.id;
  try {
    const notifs = await Notification.find({ userId: me })
      .sort({ createdAt: -1 })
      .limit(30);
    return res.json(notifs);
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /messages/notifications/read — marque toutes les notifications comme lues
exports.markNotificationsRead = async (req, res) => {
  const me = req.user.id;
  try {
    await Notification.updateMany({ userId: me, read: false }, { read: true });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getBlockedUsers = async (req, res) => {
  const me = req.user.id; 
  try{
    const user = await User.findById(me).populate('blockedUsers', 'displayName firstName lastName avatarUrl _id');
    return res.json(user.blockedUsers || []);
  }
  catch(err){
    return res.status(500).json({message: 'Erreur serveur'});
  }
}