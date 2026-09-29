/* Captures réelles de l'app Hive (frontend lancé en local) avec Playwright.
   - L'API est mockée par interception réseau : aucun backend nécessaire.
   - Thème clair + palette miel injectée par-dessus le CSS de l'app.
   - Sortie : public/captures/{mobile,desktop}/*.png + src/captures.json (bounding boxes en px CSS).
   Usage : npm run captures   (frontend attendu sur FRONT_URL, par défaut http://localhost:3100) */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ME, PEOPLE, CHAT, REQUEST_MESSAGE } from "../src/config.ts";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const COVERS = path.resolve(ROOT, "../backend/scripts/demo-covers");
const FRONT_URL = process.env.FRONT_URL || "http://localhost:3100";
// Mode audit : palette réelle du site (pas de surcharge vidéo), dossier et pages dédiés
const AUDIT = !!process.env.AUDIT;
const OUT_DIR = process.env.CAPTURE_OUT || path.join(ROOT, "public/captures");

const FORMATS = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
};

const PALETTE_CSS = `
body.light{--bg-main:#FBF6EE;--bg-surface:#FFFDF9;--bg-card:#F5ECDD;--bg-card-soft:#EFE3CF;--border-soft:#E6D8C1;--accent:#E0892B;--accent-hover:#C97620;--accent-rgb:224,137,43;--text-main:#2B2016;--text-muted:#7A6A57}
body.light{--bubble-out-bg:#E0892B;--bubble-out-border:#E0892B;--bubble-out-text:#fff}
*{caret-color:transparent!important}
*::-webkit-scrollbar{display:none}
`;

/* ── Données de démo ─────────────────────────────────────────────────────── */
const now = Date.now();
const iso = (minAgo) => new Date(now - minAgo * 60000).toISOString();
const days = (d) => new Date(now + d * 86400000).toISOString();
const me = { ...ME, email: "leo@hive-app.ch", role: "user", address: { city: "Genève", country: "Suisse" }, reputation: { rating: 4.8, count: 12 } };
const P = Object.fromEntries(Object.entries(PEOPLE).map(([k, u]) => [k, { ...u, reputation: { rating: 4.6, count: 5 } }]));

const project = (id, o) => ({
  _id: id, status: "open", coverVersion: 1, createdAt: iso(60 * 24 * 3), participants: [], langues: ["Français"],
  location: { type: "Point", coordinates: o.coords }, cached: { avgRating: 0 }, ...o,
  projectMeta: { startDate: days(10), ...o.projectMeta },
});

const PROJECTS = [
  project("66a0000000000000000000c1", {
    title: "Night Owls — groupe de rock", cover: "musique-a", ownerId: me, coords: [6.1432, 46.2044],
    description: "On monte un groupe de rock indé à Genève : deux guitares, un clavier, il nous manque une batterie et une voix. Répètes le jeudi soir, premier concert visé au printemps.",
    tags: ["Musique", "Rock", "Concert"], requiredSkills: ["Batterie", "Chant", "Basse"], maxParticipants: 6,
    participants: [P.malik, P.chloe], minAge: 18, projectMeta: { city: "Genève", region: "Genève" },
  }),
  project("66a0000000000000000000c2", {
    title: "FC Plainpalais — foot du dimanche", cover: "sport-a", ownerId: P.noah, coords: [6.1415, 46.1983],
    description: "Match amical tous les dimanches matin à la plaine de Plainpalais. Tous niveaux, bonne ambiance garantie, on cherche encore un coach et deux joueurs.",
    tags: ["Sport", "Football", "Plein air"], requiredSkills: ["Coach", "Défense"], maxParticipants: 14,
    participants: [P.malik, P.sara, P.chloe], projectMeta: { city: "Genève", region: "Genève" },
  }),
  project("66a0000000000000000000c3", {
    title: "Kōfi — app de café de quartier", cover: "cuisine-a", ownerId: P.sara, coords: [6.6323, 46.5197],
    description: "Une app pour commander au café du coin et soutenir les torréfacteurs indépendants de Lausanne. Maquettes prêtes, on cherche un·e dev et un·e designer.",
    tags: ["Startup", "Tech", "Café"], requiredSkills: ["React Native", "Design UI", "Marketing"], maxParticipants: 5,
    participants: [P.noah], projectMeta: { city: "Lausanne", region: "Vaud", budget: 5000 },
  }),
  project("66a0000000000000000000c4", {
    title: "Potager partagé des Pâquis", cover: "ecologie-a", ownerId: P.chloe, coords: [6.1466, 46.2115],
    description: "Un potager en bacs dans une cour d'immeuble. On plante, on arrose à tour de rôle et on partage les récoltes.",
    tags: ["Écologie", "Jardin", "Quartier"], requiredSkills: ["Jardinage"], maxParticipants: 10,
    participants: [P.ines], projectMeta: { city: "Genève", region: "Genève" },
  }),
  project("66a0000000000000000000c5", {
    title: "Impro du mardi — troupe amateur", cover: "scene-a", ownerId: P.malik, coords: [6.6356, 46.5220],
    description: "Troupe d'improvisation théâtrale amateur. Ateliers le mardi soir, match d'impro une fois par mois.",
    tags: ["Théâtre", "Scène", "Impro"], requiredSkills: ["Jeu", "Musique live"], maxParticipants: 8,
    participants: [P.sara, P.noah], projectMeta: { city: "Lausanne", region: "Vaud" },
  }),
  project("66a0000000000000000000c6", {
    title: "Les Pédales du Léman — sortie vélo", cover: "endurance-a", ownerId: P.sara, coords: [6.5, 46.45],
    description: "Sorties vélo le samedi autour du lac, rythme tranquille, pause café obligatoire.",
    tags: ["Sport", "Vélo", "Nature"], requiredSkills: ["Mécanique vélo"], maxParticipants: 12,
    participants: [P.chloe, P.noah, P.ines], projectMeta: { city: "Nyon", region: "Vaud" },
  }),
];
const NIGHT_OWLS = PROJECTS[0];
const CONV_ID = "67a0000000000000000000d1";
const REQUEST = { _id: "68a0000000000000000000e1", projectId: NIGHT_OWLS._id, senderId: P.ines, status: "pending", message: REQUEST_MESSAGE, createdAt: iso(90), expiresAt: days(6) };

const conversation = { _id: CONV_ID, type: "project", projectId: { _id: NIGHT_OWLS._id, title: NIGHT_OWLS.title }, projectTitle: NIGHT_OWLS.title,
  participants: [me, P.ines, P.malik, P.chloe], createdAt: iso(600), updatedAt: iso(2) };
const who = (from) => (from === "me" ? me : P[from]);
const MESSAGES = [
  { _id: "69a0000000000000000000f0", conversationId: CONV_ID, isSystem: true, content: "Inès Rochat a rejoint le groupe", createdAt: iso(26) },
  ...CHAT.map((m, i) => ({ _id: `69a0000000000000000001${String(i).padStart(2, "0")}`, conversationId: CONV_ID, senderId: who(m.from), content: m.text, createdAt: iso(24 - i * 4) })),
];

const dmConvs = [
  { partner: P.noah, lastMessage: { content: "Tu viens dimanche ?", senderId: P.noah._id, createdAt: iso(180) }, unread: 1 },
  { partner: P.sara, lastMessage: { content: "Merci pour le retour sur les maquettes !", senderId: me._id, createdAt: iso(60 * 26) }, unread: 0 },
];
const otherGroup = { conversation: { _id: "67a0000000000000000000d2", type: "project", projectTitle: "FC Plainpalais — foot du dimanche", participants: [me, P.noah], createdAt: iso(4000) },
  lastMessage: { content: "Terrain réservé pour 10h", senderId: P.noah, createdAt: iso(300) } };

/* ── Mock de l'API ───────────────────────────────────────────────────────── */
function mockApi(url, method) {
  const u = new URL(url);
  const p = u.pathname.replace(/^\/api/, "");
  if (p === "/auth/me") return { user: me };
  if (p === "/auth/providers") return { providers: [] };
  if (p === "/messages/unread") return { count: 0 };
  if (p === "/messages/notifications") return [];
  if (p === "/messages/group/mine") return [{ conversation, lastMessage: MESSAGES.at(-1) }, otherGroup];
  if (p === "/messages/conversations") return dmConvs;
  if (p === `/messages/group/${CONV_ID}`) return MESSAGES;
  if (p === "/projects/recommended") return PROJECTS.slice(1, 4).map((project) => ({ project, score: 0.9 }));
  if (p === "/projects/tags") return u.searchParams.get("popular") ? ["Musique", "Sport", "Startup", "Écologie", "Théâtre"] : ["Musique", "Sport", "Startup"];
  if (p === "/projects/regions") return ["Genève", "Vaud"];
  if (p === "/projects/mine") return [NIGHT_OWLS];
  if (p === "/projects") return { items: PROJECTS, total: PROJECTS.length, hasMore: false };
  if (p === `/requests/${NIGHT_OWLS._id}/list`) return [REQUEST];
  if (/^\/requests\/[^/]+\/mine$/.test(p)) return { status: null };
  const proj = PROJECTS.find((x) => p === `/projects/${x._id}`);
  if (proj && method === "GET") return proj;
  if (method !== "GET") return { ok: true };
  return [];
}

async function setup(context) {
  await context.addInitScript(({ me, css }) => {
    localStorage.setItem("hive-theme", "light");
    localStorage.setItem("token", "demo-token");
    localStorage.setItem("user", JSON.stringify(me));
    localStorage.setItem("i18nextLng", "fr");
    if (css) document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.id = "hive-video-css";
      s.textContent = css;
      document.head.appendChild(s);
    });
  }, { me, css: AUDIT ? "" : PALETTE_CSS });

  await context.route(/localhost:5050\/socket\.io/, (r) => r.abort());
  await context.route(/localhost:5050\/api\//, async (route) => {
    const req = route.request();
    const url = req.url();
    const cover = url.match(/\/projects\/([^/]+)\/cover\?size=(\w+)/);
    if (cover) {
      const proj = PROJECTS.find((x) => x._id === cover[1]);
      const file = path.join(COVERS, `${proj?.cover || "ville-a"}-${cover[2] === "full" ? "full" : "thumb"}.webp`);
      return route.fulfill({ status: 200, contentType: "image/webp", body: fs.readFileSync(file) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockApi(url, req.method())) });
  });
}

/* Bounding boxes (px CSS, relatives au viewport). Plusieurs éléments → tableau. */
async function boxes(page, selectors) {
  const out = {};
  for (const [key, sel] of Object.entries(selectors)) {
    const loc = page.locator(sel);
    const n = await loc.count();
    if (!n) { out[key] = null; console.warn(`  ! ${key}: introuvable (${sel})`); continue; }
    const all = [];
    for (let i = 0; i < n; i++) {
      const b = await loc.nth(i).boundingBox();
      if (b) all.push({ x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) });
    }
    out[key] = n > 1 ? all : all[0];
  }
  return out;
}

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
}

const PAGES = [
  { name: "create", url: "/create-project", fullPage: true, boxes: { title: "#project-title", titleLabel: 'label[for="project-title"]' } },
  {
    name: "detail", url: `/projects/${NIGHT_OWLS._id}`,
    boxes: { request: '[class*="requestItem"]', accept: '[class*="acceptBtn"]', decline: '[class*="declineBtn"]', requestsPanel: '[class*="requestsPanel"]', title: "h1" },
  },
  {
    name: "chat", url: `/messages?group=${CONV_ID}`,
    boxes: { messages: '[class*="msgRow"]', input: '[class*="composerRow"] textarea', send: '[class*="sendBtn"]', composer: '[class*="composerRow"]' },
  },
  { name: "projects", url: "/projects", boxes: { cards: 'a[class*="projectCard"]' } },
  ...PROJECTS.slice(1).map((p, i) => ({ name: `project-${i + 2}`, url: `/projects/${p._id}`, boxes: { title: "h1" } })),
];
if (AUDIT) PAGES.push({ name: "home", url: "/", fullPage: true, boxes: {} }, { name: "profile", url: "/profile", boxes: {} }, { name: "messages", url: "/messages", boxes: {} });

const only = process.argv[2];
const browser = await chromium.launch();
const result = {};
for (const [fmt, opts] of Object.entries(FORMATS)) {
  if (only && only !== fmt) continue;
  const dir = path.join(OUT_DIR, fmt);
  fs.mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({ ...opts, locale: "fr-CH", timezoneId: "Europe/Zurich", reducedMotion: "reduce" });
  await setup(context);
  result[fmt] = { viewport: opts.viewport, scale: opts.deviceScaleFactor, pages: {} };
  for (const pg of PAGES) {
    const page = await context.newPage();
    page.on("pageerror", (e) => console.warn(`  [${fmt}/${pg.name}] pageerror:`, e.message));
    await page.goto(FRONT_URL + pg.url);
    await settle(page);
    if (pg.fullPage) {
      // la barre de navigation fixe est redessinée par la vidéo en bas de l'écran
      await page.addStyleTag({ content: 'nav[class*="BottomNav"], [class*="bottomNav"]{display:none!important}' });
      await page.waitForTimeout(200);
    }
    const file = path.join(dir, `${pg.name}.png`);
    await page.screenshot({ path: file, fullPage: !!pg.fullPage });
    result[fmt].pages[pg.name] = { file: `captures/${fmt}/${pg.name}.png`, boxes: await boxes(page, pg.boxes) };
    console.log(`✓ ${fmt}/${pg.name}`);
    await page.close();
  }
  await context.close();
}
await browser.close();

if (AUDIT) process.exit(0);
const out = path.join(ROOT, "src/captures.json");
const prev = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")) : {};
fs.writeFileSync(out, JSON.stringify({ ...prev, ...result }, null, 2));
console.log("→ src/captures.json");
