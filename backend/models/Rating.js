/* Notation attribuée entre participants après clôture d'un projet.
   targetType utilise refPath pour une référence polymorphique (user ou project).
   L'unicité rater/cible/projet est garantie applicativement dans le contrôleur. */
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  targetType: { type: String, enum: ['user', 'project'], required: true },
  targetId:   { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetType' },
  raterId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  score:      { type: Number, required: true, min: 1, max: 5 },
  comment:    { type: String, default: '' },
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('Rating', ratingSchema);
