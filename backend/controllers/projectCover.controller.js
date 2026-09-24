const mongoose     = require('mongoose');
const Project      = require('../models/Project');
const ProjectCover = require('../models/ProjectCover');

// Limites après décodage (le navigateur envoie des images déjà réduites et compressées).
const MAX_FULL_BYTES  = 800 * 1024;
const MAX_THUMB_BYTES = 200 * 1024;

const DATA_URL = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/;

// Vérifie la signature binaire : le type annoncé doit correspondre au contenu réel.
function matchesSignature(buffer, contentType) {
  if (contentType === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (contentType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (contentType === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

function decodeImage(dataUrl, maxBytes) {
  if (typeof dataUrl !== 'string') return { error: 'Image manquante.' };
  const match = DATA_URL.exec(dataUrl);
  if (!match) return { error: 'Format d\'image non pris en charge (WebP, JPEG ou PNG).' };
  const [, contentType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0) return { error: 'Image vide.' };
  if (buffer.length > maxBytes) return { error: 'Image trop lourde.' };
  if (!matchesSignature(buffer, contentType)) return { error: 'Le fichier ne correspond pas au format annoncé.' };
  return { buffer, contentType };
}

async function findOwnedProject(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return null;
  }
  if (project.ownerId.toString() !== req.user.id) {
    res.status(403).json({ error: 'Not authorized' });
    return null;
  }
  return project;
}

// PUT /projects/:id/cover — body { full, thumb } en data URL ; réservé au propriétaire
exports.uploadCover = async (req, res) => {
  const project = await findOwnedProject(req, res);
  if (!project) return;

  const full = decodeImage(req.body?.full, MAX_FULL_BYTES);
  if (full.error) return res.status(400).json({ error: full.error });
  const thumb = decodeImage(req.body?.thumb, MAX_THUMB_BYTES);
  if (thumb.error) return res.status(400).json({ error: thumb.error });
  if (full.contentType !== thumb.contentType) {
    return res.status(400).json({ error: 'Les deux tailles doivent avoir le même format.' });
  }

  await ProjectCover.findOneAndUpdate(
    { projectId: project._id },
    { full: full.buffer, thumb: thumb.buffer, contentType: full.contentType },
    { upsert: true, setDefaultsOnInsert: true }
  );

  // La version change l'URL de l'image : les navigateurs chargent la nouvelle.
  project.coverVersion = Date.now();
  await project.save();

  res.json({ coverVersion: project.coverVersion });
};

// DELETE /projects/:id/cover — retire l'image ; réservé au propriétaire
exports.deleteCover = async (req, res) => {
  const project = await findOwnedProject(req, res);
  if (!project) return;

  await ProjectCover.deleteOne({ projectId: project._id });
  project.coverVersion = null;
  await project.save();

  res.json({ coverVersion: null });
};

// GET /projects/:id/cover?size=thumb|full — public, mis en cache (l'URL contient la version)
exports.getCover = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Cover not found' });
  const size = req.query.size === 'thumb' ? 'thumb' : 'full';
  const cover = await ProjectCover.findOne({ projectId: req.params.id }).select(`${size} contentType`).lean();
  if (!cover) return res.status(404).json({ error: 'Cover not found' });

  res.set({
    'Content-Type': cover.contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    // Le frontend peut être servi depuis une autre origine (dev : port 3100).
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });
  const data = cover[size];
  res.send(Buffer.isBuffer(data) ? data : Buffer.from(data.buffer));
};
