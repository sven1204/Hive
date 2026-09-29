/* Rendez-vous de l'espace projet (répétition, match, réunion…) avec réponses des membres. */
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  title:          { type: String, required: true, trim: true, maxlength: 120 },
  startsAt:       { type: Date, required: true },
  location:       { type: String, trim: true, maxlength: 160, default: '' },
  notes:          { type: String, trim: true, maxlength: 500, default: '' },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rsvps:          [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['yes', 'maybe', 'no'], required: true },
    _id: false,
  }],
}, { timestamps: true });

module.exports = mongoose.model('ProjectEvent', eventSchema);
