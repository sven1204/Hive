/* Image de couverture d'un projet, stockée à part du document Project pour que les
   listes de projets restent légères. Deux tailles, déjà compressées par le navigateur :
   - full  : bannière de la page projet (~1600 px de large)
   - thumb : vignette des cartes (~640 px de large)
   Servies par GET /api/projects/:id/cover?size=full|thumb (voir projectCover.controller). */
const mongoose = require('mongoose');

const projectCoverSchema = new mongoose.Schema({
  projectId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
  full:        { type: Buffer, required: true },
  thumb:       { type: Buffer, required: true },
  contentType: { type: String, enum: ['image/webp', 'image/jpeg', 'image/png'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('ProjectCover', projectCoverSchema);
