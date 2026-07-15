// backend/models/Project.js
const { Schema, model, Types } = require('mongoose');

const projectSchema = new Schema(
  {
    // --- Liens / métadonnées ---
    ownerId: { type: Types.ObjectId, ref: 'User', required: true, index: true },

    // --- Infos de base ---
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    tags: { type: [String], default: [] },
    requiredSkills: { type: [String], default: [] },

    // --- Participants ---
    minAge: { type: Number, default: null },
    maxAge: { type: Number, default: null },
    maxParticipants: { type: Number, default: null },
    participants: [{ type: Types.ObjectId, ref: 'User' }],

    // --- Statut / visibilité ---
    status: {
      type: String,
      enum: ['open', 'closed', 'draft', 'archived'],
      default: 'open',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'unlisted'],
      default: 'public',
      index: true,
    },

    // --- Géolocalisation (GeoJSON Point) ---
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
    },
      coordinates: {
        // [longitude, latitude]
        type: [Number],
        required: true,
        validate: {
          validator: (v) => Array.isArray(v) && v.length === 2,
          message: 'location.coordinates doit être [longitude, latitude]',
        },
      },
    },

    // --- Métadonnées projet ---
    projectMeta: {
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      repoUrl: { type: String, default: '' },
      budget: { type: Number, default: 0, min: 0 },
      region: { type: String, default: '' },
      city: { type: String, default: '' },
    },


    // --- Cache/agrégats (vu dans ta collection) ---
    cached: {
      avgRating: { type: Number, default: 0, min: 0 },
      ratingCount: { type: Number, default: 0, min: 0 },
    },

    // --- Langues (conforme à ta collection) ---
    langues: { type: [String], default: [] },
  },
  { timestamps: true }
);

// ---------- Indexes ----------
// 2dsphere pour requêtes géo
projectSchema.index({ location: '2dsphere' });

// Index text (recherche plein-texte) : uniquement des champs textuels
projectSchema.index({ title: 'text', description: 'text' });

// Index normal séparé pour tags (utile pour filtres exacts)
projectSchema.index({ tags: 1 });

// Contrainte pratique : ne pas dépasser maxParticipants
projectSchema.path('participants').validate(function (arr) {
  if (this.maxParticipants == null) return true;
  return arr.length <= this.maxParticipants;
}, 'Trop de participants (maxParticipants atteint).');

module.exports = model('Project', projectSchema);
