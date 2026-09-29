/* Tâche de l'espace projet (liée à la conversation de groupe du projet).
   Assignée à un membre, avec une échéance facultative. */
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  title:          { type: String, required: true, trim: true, maxlength: 200 },
  assigneeId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  dueDate:        { type: Date, default: null },
  done:           { type: Boolean, default: false },
  doneAt:         { type: Date, default: null },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('ProjectTask', taskSchema);
