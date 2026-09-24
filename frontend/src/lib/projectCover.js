import { BASE_URL } from "./api";

/* Image de couverture des projets.
   - L'image est réduite et compressée dans le navigateur avant l'envoi : une version
     « full » pour la bannière de la page projet, une « thumb » pour les cartes.
   - Elle est servie par GET /projects/:id/cover ; la version dans l'URL permet au
     navigateur de la garder en cache jusqu'au prochain changement. */

export const COVER_ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

// Limites alignées sur le backend (projectCover.controller.js).
const SIZES = {
  full: { maxWidth: 1600, maxHeight: 1200, maxBytes: 780 * 1024 },
  thumb: { maxWidth: 640, maxHeight: 480, maxBytes: 190 * 1024 },
};

export function coverUrl(project, size = "thumb") {
  if (!project?._id || !project.coverVersion) return null;
  return `${BASE_URL}/projects/${project._id}/cover?size=${size}&v=${project.coverVersion}`;
}

/* Palette d'accents par projet (déterministe, basée sur le premier tag) : bordure et
   tags des cartes, et couverture générée quand le projet n'a pas d'image. */
export const PROJECT_ACCENTS = [
  { text: "#2FA372", bg: "rgba(47, 163, 114, 0.12)", border: "rgba(47, 163, 114, 0.35)" },   // émeraude
  { text: "#C79A4A", bg: "rgba(199, 154, 74, 0.12)", border: "rgba(199, 154, 74, 0.35)" },   // sable
  { text: "#5B8DB8", bg: "rgba(91, 141, 184, 0.12)", border: "rgba(91, 141, 184, 0.35)" },   // ardoise
  { text: "#C9705A", bg: "rgba(201, 112, 90, 0.12)", border: "rgba(201, 112, 90, 0.35)" },   // argile
  { text: "#9B7BB8", bg: "rgba(155, 123, 184, 0.12)", border: "rgba(155, 123, 184, 0.35)" }, // prune
];

export function getProjectAccent(project) {
  const key = project?.tags?.[0] || project?.title || "";
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PROJECT_ACCENTS[hash % PROJECT_ACCENTS.length];
}

export function getProjectInitials(title = "") {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function encode(canvas, type, quality) {
  const dataUrl = canvas.toDataURL(type, quality);
  // Navigateur sans encodeur WebP : toDataURL renvoie du PNG, on passe au JPEG.
  if (type === "image/webp" && !dataUrl.startsWith("data:image/webp")) return null;
  return dataUrl;
}

function approxBytes(dataUrl) {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.floor((base64.length * 3) / 4);
}

function renderSize(bitmap, { maxWidth, maxHeight, maxBytes }, type) {
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.84, 0.74, 0.62, 0.5]) {
    const dataUrl = encode(canvas, type, quality);
    if (!dataUrl) return null;
    if (approxBytes(dataUrl) <= maxBytes) return dataUrl;
  }
  throw new Error("tooLarge");
}

/* Fichier choisi par l'utilisateur -> { full, thumb } en data URL (WebP, ou JPEG en repli).
   Les erreurs portent un code traduit par l'appelant : invalidType, tooLarge, unreadable. */
export async function prepareCover(file) {
  if (!file || !COVER_ACCEPT.split(",").includes(file.type)) throw new Error("invalidType");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("tooLarge");

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("unreadable");
  }

  try {
    for (const type of ["image/webp", "image/jpeg"]) {
      const full = renderSize(bitmap, SIZES.full, type);
      if (!full) continue;
      const thumb = renderSize(bitmap, SIZES.thumb, type);
      return { full, thumb };
    }
    throw new Error("unreadable");
  } finally {
    bitmap.close?.();
  }
}
