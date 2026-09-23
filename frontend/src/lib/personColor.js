/* Couleur stable par personne (même id → même couleur partout), pour les avatars
   et les noms dans les conversations de groupe. Les teintes sont définies par
   thème dans App.css (--person-1 à --person-5). */
const PERSON_COLOR_COUNT = 5;

export function getPersonColor(user) {
  const key = String(user?._id || user?.id || user?.email || "");
  if (!key) return "var(--text-muted)";
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return `var(--person-${(hash % PERSON_COLOR_COUNT) + 1})`;
}

export function personStyle(user) {
  return { "--person": getPersonColor(user) };
}
