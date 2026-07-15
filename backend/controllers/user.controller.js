const User = require("../models/User");
const Project = require("../models/Project");
const Rating = require("../models/Rating");
const bcrypt = require("bcrypt");
const { containsProfanity } = require('../utils/profanityFilter');

/* Retire les champs sensibles (passwordHash, codes de reset…) avant d'exposer un profil public */
function sanitizePublicProfile(user) {
  if (!user) return null;

  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    bio: user.bio,
    age: user.age,
    avatarUrl: user.avatarUrl,
    languages: user.languages,
    education: user.education,
    skills: user.skills,
    address: user.address,
    reputation: user.reputation,
    createdAt: user.createdAt,
  };
}

/* ==============================
   PROFIL UTILISATEUR
   ============================== */

// GET /user/:id — profil public d'un utilisateur (sans données sensibles)
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    return res.status(200).json(sanitizePublicProfile(user));
  } catch (err) {
    console.error("Get public profile error:", err);
    return res.status(500).json({ message: "Erreur lors du chargement du profil" });
  }
};

// GET /user/:id/projects — projets publics d'un utilisateur
exports.getPublicProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      ownerId: req.params.id,
      visibility: "public",
    }).sort({ createdAt: -1 });

    return res.status(200).json(projects);
  } catch (err) {
    console.error("Get public projects error:", err);
    return res.status(500).json({ message: "Erreur lors du chargement des projets" });
  }
};

// PUT /user/profile — mise à jour des infos de l'utilisateur connecté (ignore les champs undefined)
exports.updateInfos = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const {
      firstName,
      lastName,
      displayName,
      age,
      phone,
      bio,

      skills,
      languages,
      education,
      avatarUrl,
      address,
    } = req.body;

    const updateData = {
      firstName,
      lastName,
      displayName,
      age,
      phone,
      bio,
      skills,
      languages,
      education,
      avatarUrl,
      address,
    };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    if (containsProfanity(displayName, bio)) {
      return res.status(400).json({ message: 'Le contenu contient des termes inappropriés.' });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Erreur lors de la mise à jour du profil" });
  }
};

// ==============================
// CHANGEMENT DE MOT DE PASSE
// ==============================

// PUT /user/password — vérifie l'ancien mot de passe avant d'en hasher et sauvegarder un nouveau
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({ message: "Mot de passe mis à jour avec succès" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Erreur lors du changement de mot de passe" });
  }
};

// GET /user/ratings — historique des notes reçues par l'utilisateur connecté
exports.getUserRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ targetType: 'user', targetId: req.user.id })
      .populate('raterId', 'displayName firstName lastName avatarUrl')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 });
    return res.json(ratings);
  } catch (err) {
    console.error('getUserRatings error:', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};
