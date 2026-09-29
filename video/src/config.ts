/* ─────────────────────────────────────────────────────────────────────────────
   Config partagée de la vidéo Hive : couleurs, textes, timings, sons.
   Les deux compositions (mobile 9:16 et desktop 16:9) lisent ce fichier.
   Les timings sont en SECONDES ; on les convertit en images avec `f()`.
   Le script de captures (scripts/capture.mjs) lit aussi les données de démo.
   ───────────────────────────────────────────────────────────────────────────── */

export const FPS = 30;
export const DURATION_S = 31;
export const f = (seconds: number) => Math.round(seconds * FPS);

export const COLORS = {
  bg: "#FBF6EE",
  surface: "#FFFDF9",
  card: "#F5ECDD",
  cardSoft: "#EFE3CF",
  border: "#E6D8C1",
  accent: "#E0892B",
  accentHover: "#C97620",
  accentSoft: "#F6D9B4",
  text: "#2B2016",
  muted: "#7A6A57",
  white: "#FFFFFF",
  // Ombres brunes, jamais noires (valeurs RGB pour rgba())
  shadow: "43, 32, 22",
  glow: "224, 137, 43",
};

export const FONT = "Satoshi";

// Easings (voir src/lib/easing.ts)
export const EASE = {
  enter: [0.19, 1, 0.22, 1] as const, // ease-out-expo
  camera: [0.77, 0, 0.175, 1] as const, // ease-in-out-quart
};

/* ── Storyboard (secondes) ───────────────────────────────────────────────── */
export const T = {
  hook: { start: 0, end: 2.8, typeStart: 0.35, charEvery: 0.055, morphAt: 2.3 },
  cluster: { start: 2.8, end: 4.9, line1At: 3.05, line2At: 3.55 },
  fill: { start: 4.9, end: 7.8, firstAt: 5.05, every: 0.35, textAt: 4.95, diveAt: 7.2 },
  create: { start: 7.8, end: 11.8, labelAt: 7.95, deviceAt: 8.0, zoomAt: 8.9, typeStart: 9.45, charEvery: 0.048, whipAt: 11.45 },
  team: { start: 11.8, end: 15.6, labelAt: 11.9, cardOutAt: 12.7, tapAt: 13.75, acceptedAt: 13.85, toastAt: 14.35 },
  chat: {
    start: 15.6, end: 22.4, labelAt: 15.7, deviceBackAt: 15.75, firstBubbleAt: 16.2, bubbleEvery: 0.75,
    composerAt: 19.9, typeStart: 20.1, charEvery: 0.04, sendAt: 21.45,
  },
  montage: { start: 22.4, end: 25.8, cardEvery: 0.62 },
  final: { start: 25.8, end: 27.6, line2At: 26.35 },
  logo: { start: 27.6, end: 31, hexEvery: 0.12, fillAt: 28.15, lettersAt: 28.3, letterEvery: 0.07, urlAt: 29.05, urlCharEvery: 0.04, clickAt: 29.8, fadeAt: 30.3 },
};

/* ── Textes à l'écran (max 5-6 mots) ─────────────────────────────────────── */
export const TEXT = {
  hook: "Il te manque des coéquipiers ?",
  cluster: { line1: "Une idée, c'est bien.", line2Pre: "Une ", line2Accent: "équipe", line2Post: ", c'est mieux." },
  fill: { pre: "Sur ", accent: "Hive", post: ", elle se complète." },
  roles: ["Batteuse", "Bassiste", "Coach", "Chanteuse", "Designer", "Dev"],
  steps: [
    { num: "01", label: "Crée ton projet" },
    { num: "02", label: "Choisis ton équipe" },
    { num: "03", label: "Lancez-vous" },
  ],
  typedTitle: "Night Owls — groupe de rock",
  accepted: "Accepté",
  joinedToast: "Inès a rejoint Night Owls",
  composer: "Let's go, on est au complet !",
  montage: [
    { pre: "Un ", accent: "club." },
    { pre: "Une ", accent: "startup." },
    { pre: "Une ", accent: "asso." },
    { pre: "Une ", accent: "troupe." },
    { pre: "Un ", accent: "groupe." },
  ],
  // Cartes projet du montage (même ordre que les mots ci-dessus)
  montageCards: [
    { title: "FC Plainpalais — foot du dimanche", by: "Noah Keller", cover: "covers/sport-a-full.webp", tags: ["Sport", "Football"], city: "Genève", people: "4 / 14 membres" },
    { title: "Kōfi — app de café de quartier", by: "Sara Monnier", cover: "covers/cuisine-a-full.webp", tags: ["Startup", "Tech"], city: "Lausanne", people: "2 / 5 membres" },
    { title: "Potager partagé des Pâquis", by: "Chloé Favre", cover: "covers/ecologie-a-full.webp", tags: ["Écologie", "Quartier"], city: "Genève", people: "2 / 10 membres" },
    { title: "Impro du mardi — troupe amateur", by: "Malik Benali", cover: "covers/scene-a-full.webp", tags: ["Théâtre", "Impro"], city: "Lausanne", people: "3 / 8 membres" },
    { title: "Night Owls — groupe de rock", by: "Léo Martin", cover: "covers/musique-a-full.webp", tags: ["Musique", "Rock"], city: "Genève", people: "4 / 6 membres" },
  ],
  final: { line1Pre: "Trouve ton ", line1Accent: "équipe", line1Post: ".", line2: "Lance ton projet." },
  brand: "Hive",
  url: "hive-app.ch",
};

/* ── Données de démo (captures + bulles 3D) ──────────────────────────────── */
export const ME = { _id: "65f0000000000000000000a1", firstName: "Léo", lastName: "Martin", displayName: "Léo Martin" };

export const PEOPLE = {
  ines: { _id: "65f0000000000000000000b1", firstName: "Inès", lastName: "Rochat", displayName: "Inès Rochat" },
  malik: { _id: "65f0000000000000000000b2", firstName: "Malik", lastName: "Benali", displayName: "Malik Benali" },
  chloe: { _id: "65f0000000000000000000b3", firstName: "Chloé", lastName: "Favre", displayName: "Chloé Favre" },
  noah: { _id: "65f0000000000000000000b4", firstName: "Noah", lastName: "Keller", displayName: "Noah Keller" },
  sara: { _id: "65f0000000000000000000b5", firstName: "Sara", lastName: "Monnier", displayName: "Sara Monnier" },
};

export type ChatMessage = { from: keyof typeof PEOPLE | "me"; text: string };

// Conversation de groupe Night Owls (capture + bulles 3D de la scène 6)
export const CHAT: ChatMessage[] = [
  { from: "ines", text: "Salut la team ! Trop hâte de jouer avec vous." },
  { from: "malik", text: "Bienvenue Inès ! Répète jeudi à 19h ?" },
  { from: "me", text: "Parfait, local de la rue des Bains." },
  { from: "chloe", text: "Je ramène le micro et des snacks." },
  { from: "ines", text: "Et moi ma caisse claire !" },
];

export const REQUEST_MESSAGE = "Batteuse depuis 8 ans, dispo le soir. Je vous suis sur Insta !";

/* Couleurs des noms d'expéditeur (reprend --person-* du thème clair de l'app) */
export const PERSON_COLORS: Record<string, string> = {
  ines: "#8e5410",
  malik: "#6e4e9e",
  chloe: "#a5452e",
  noah: "#2f5f9e",
  sara: "#3f7440",
};

/* ── Sons ────────────────────────────────────────────────────────────────── */
export const VOLUME = {
  key: 0.55,
  pop: 0.5,
  tap: 0.7,
  success: 0.55,
  send: 0.55,
  label: 0.45,
  swoosh: 0.4,
  impact: 0.75,
  music: 0.17,
};
