const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "admin"], default: "user" },

  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, default: null }, // null pour un compte créé via Google/GitHub
  // Identifiants chez les fournisseurs OAuth (absents tant que le compte n'est pas lié)
  googleId: { type: String, unique: true, sparse: true },
  githubId: { type: String, unique: true, sparse: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationCodeHash: { type: String, default: null },
  emailVerificationExpire: { type: Date, default: null },
  resetCodeHash: { type: String, default: null },
  resetCodeExpire: { type: Date, default: null },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorExpire: { type: Date, default: null },
  twoFactorCode: { type: String, default: null },


  // --- Infos de base ---
  firstName: { type: String, default: "" },
  lastName:  { type: String, default: "" },
  displayName: { type: String, default: "" },
  phone: { type: String, default: "" },

  // --- Adresse ---
  address: {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    country: { type: String, default: "" },
    postalCode: { type: String, default: "" }
  },

  // --- Profil ---
  bio: { type: String, default: "Nouvel utilisateur Hive !" },
  age: { type: Number, default: null },
  languages: { type: [String], default: [] },
  education: { type: [String], default: [] },
  skills: { type: [String], default: [] },
  avatarUrl: { type: String, default: "/avatars/default.png" },

  // --- Réputation ---
  reputation: {
    score: { type: Number, default: 0 },
    votes: { type: Number, default: 0 }
  },

  // --- Statut du profil ---
  profileCompleted: { type: Boolean, default: false },

  // --- Messagerie ---
  blockedUsers:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  archivedDMs:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // --- Sécurité — verrouillage du compte ---
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null }

}, { timestamps: true }); // ajoute createdAt & updatedAt auto

module.exports = mongoose.model('User', userSchema);
