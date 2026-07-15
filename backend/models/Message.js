/* Modèle de message. Couvre les deux types d'échanges :
   - DM (direct) : senderId + receiverId, conversationId = null
   - Groupe : conversationId renseigné, receiverId = null
   Le champ readBy sert pour les groupes ; read sert pour les DM. */
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content:         { type: String, required: true, trim: true, maxlength: 2000 },
  read:            { type: Boolean, default: false },
  conversationId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
  readBy:          [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isSystem:        { type: Boolean, default: false },
  deleted:         { type: Boolean, default: false },
  edited:          { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, read: 1 });

module.exports = mongoose.model('Message', messageSchema);
