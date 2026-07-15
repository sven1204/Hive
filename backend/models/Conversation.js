/* Conversation de groupe liée à un projet. Créée automatiquement quand une demande d'adhésion est acceptée.
   archivedBy et deletedBy permettent un archivage/suppression par-utilisateur sans affecter les autres membres. */
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  type: { type: String, enum: ['project'], required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  projectTitle: { type: String, default: '' },
  archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });
module.exports = mongoose.model('Conversation', schema);
