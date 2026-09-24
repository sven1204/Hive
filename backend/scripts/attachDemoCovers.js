/* Attache une image de couverture aux projets de démo selon leur thème.
   Les images (générées, deux variantes par famille de thèmes) sont dans
   scripts/demo-covers/<famille>-<a|b>-{full,thumb}.webp.

   Usage : MONGO_URI=mongodb://localhost:27018/hive_local node scripts/attachDemoCovers.js
   Par sécurité, le script refuse une base distante (Atlas) sauf avec --allow-remote.
   Il est aussi appelé à la fin de seedDemoData.js. */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectCover = require('../models/ProjectCover');

const COVERS_DIR = path.join(__dirname, 'demo-covers');

// Thème (tag) -> famille d'images. Le premier tag reconnu du projet décide.
const FAMILIES = {
  cuisine: ['Cuisine', 'Pâtisserie', 'Gastronomie', 'Oenologie', 'Nutrition'],
  musique: ['Musique', 'Piano', 'Festival'],
  scene: ['Danse', 'Théâtre', 'Événementiel', 'Culture'],
  tech: ['Dev', 'Hackathon', 'Data', 'Python', 'IA', 'Web', 'Open source'],
  maker: ['Robotique', 'Arduino', 'STEM', 'Électronique', 'DIY', 'IoT'],
  design: ['Design', 'Illustration', 'Art', 'Peinture', 'Couture', 'Artisanat', 'Atelier', 'Création'],
  media: ['Médias', 'Podcast', 'Vidéo', 'Photo', 'Blog', 'Journalisme', 'Écriture', 'Communication'],
  jeux: ['Jeux', 'Échecs', 'E-sport', 'Jeux de rôle', 'Stratégie'],
  sport: ['Football', 'Volley', 'Basket', 'Sport'],
  endurance: ['Running', 'Trail', 'Cyclisme', 'Fitness'],
  montagne: ['Randonnée', 'Escalade', 'Alpinisme', 'Ski', 'Outdoor', 'Nature'],
  eau: ['Natation', 'Voile', 'Surf', 'Sport nautique'],
  bienetre: ['Yoga', 'Méditation', 'Pilates', 'Bien-être'],
  solidarite: ['Solidarité', 'Bénévolat', 'Social', 'Communauté'],
  ecologie: ['Écologie', 'Jardin', 'Biodiversité', 'Climat', 'Énergie'],
  ville: ['Architecture', 'Urbanisme', 'Patrimoine'],
};
const DEFAULT_FAMILY = 'solidarite';

const TAG_TO_FAMILY = new Map(
  Object.entries(FAMILIES).flatMap(([family, tags]) => tags.map((tag) => [tag.toLowerCase(), family]))
);

function familyFor(project) {
  for (const tag of project.tags || []) {
    const family = TAG_TO_FAMILY.get(String(tag).toLowerCase());
    if (family) return family;
  }
  return DEFAULT_FAMILY;
}

function loadCovers() {
  const covers = {};
  for (const family of Object.keys(FAMILIES)) {
    covers[family] = ['a', 'b'].map((variant) => ({
      full: fs.readFileSync(path.join(COVERS_DIR, `${family}-${variant}-full.webp`)),
      thumb: fs.readFileSync(path.join(COVERS_DIR, `${family}-${variant}-thumb.webp`)),
    }));
  }
  return covers;
}

function isRemoteUri(uri = '') {
  return uri.startsWith('mongodb+srv://') || /mongodb\.net/i.test(uri);
}

/* Attache les couvertures sur la connexion Mongoose déjà ouverte. */
async function attachDemoCovers() {
  const covers = loadCovers();
  const counters = {};
  const projects = await Project.find({}, { _id: 1, tags: 1 }).sort({ _id: 1 }).lean();

  for (const project of projects) {
    const family = familyFor(project);
    const index = counters[family] || 0;
    counters[family] = index + 1;
    const image = covers[family][index % 2]; // alterne les deux variantes

    await ProjectCover.findOneAndUpdate(
      { projectId: project._id },
      { full: image.full, thumb: image.thumb, contentType: 'image/webp' },
      { upsert: true, setDefaultsOnInsert: true }
    );
    await Project.updateOne({ _id: project._id }, { $set: { coverVersion: Date.now() } });
  }

  console.log(`${projects.length} projets avec image de couverture.`);
  console.log(Object.entries(counters).map(([family, count]) => `${family}: ${count}`).join(', '));
}

module.exports = { attachDemoCovers, familyFor };

if (require.main === module) {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI manquant.');
    process.exit(1);
  }
  if (isRemoteUri(uri) && !process.argv.includes('--allow-remote')) {
    console.error('Base distante détectée : relancez avec --allow-remote si c\'est vraiment voulu.');
    process.exit(1);
  }
  mongoose.connect(uri)
    .then(attachDemoCovers)
    .catch((err) => {
      console.error('Erreur :', err);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}
