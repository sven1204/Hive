/* Préparation audio (déterministe) → public/audio/*.wav + src/audio/meta.json
   - Frappes clavier : détection des attaques dans les 2 fichiers iPhone, découpe en frappes
     individuelles, 5 variantes de hauteur chacune.
   - Pops : 12 variantes montantes (un demi-ton par pop).
   - Swooshes : 5 hauteurs ; on mesure l'instant du pic pour le caler sur la transition.
   - Tap, validation, envoi, label : convertis en WAV, silence de tête retiré (calage à l'image).
   - Impact grave doux + petite musique chaleureuse (marimba, kick doux, shaker) synthétisés.
   Usage : npm run audio */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DURATION_S, T } from "../src/config.ts";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(ROOT, "sounds");
const OUT = path.join(ROOT, "public/audio");
const SR = 44100;
const FFMPEG_DIR = path.join(ROOT, "node_modules/@remotion/compositor-darwin-arm64");
fs.mkdirSync(OUT, { recursive: true });

/* ── E/S ─────────────────────────────────────────────────────────────────── */
function decode(file) {
  // le ffmpeg de Remotion n'a pas de sortie brute : WAV 16 bits sur stdout, on lit le bloc « data »
  const buf = execFileSync(path.join(FFMPEG_DIR, "ffmpeg"), ["-v", "error", "-i", path.join(SRC, file), "-f", "wav", "-acodec", "pcm_s16le", "-ac", "2", "-ar", String(SR), "-"], {
    env: { ...process.env, DYLD_LIBRARY_PATH: FFMPEG_DIR },
    maxBuffer: 1 << 28,
  });
  let off = 12;
  while (off < buf.length - 8 && buf.toString("ascii", off, off + 4) !== "data") off += 8 + buf.readUInt32LE(off + 4);
  const start = off + 8;
  const n = Math.floor((buf.length - start) / 4);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    L[i] = buf.readInt16LE(start + i * 4) / 32768;
    R[i] = buf.readInt16LE(start + i * 4 + 2) / 32768;
  }
  return [L, R];
}

function writeWav(name, [L, R]) {
  const n = L.length;
  const b = Buffer.alloc(44 + n * 4);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n * 4, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 4, 28);
  b.writeUInt16LE(4, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(path.join(OUT, name), b);
  return n / SR;
}

/* ── DSP ─────────────────────────────────────────────────────────────────── */
const slice = ([L, R], a, b) => [L.slice(a, b), R.slice(a, b)];
const peakOf = ([L, R]) => L.reduce((m, v, i) => Math.max(m, Math.abs(v), Math.abs(R[i])), 0);

function normalize(st, target = 0.85) {
  const p = peakOf(st) || 1;
  return st.map((ch) => ch.map((v) => (v / p) * target));
}

function fadeOut(st, seconds) {
  const n = Math.min(st[0].length, Math.round(seconds * SR));
  return st.map((ch) => {
    const c = ch.slice();
    for (let i = 0; i < n; i++) c[c.length - n + i] *= Math.cos(((i / n) * Math.PI) / 2);
    return c;
  });
}

/** Changement de hauteur par rééchantillonnage (rate > 1 = plus aigu et plus court). */
function repitch(st, rate) {
  return st.map((ch) => {
    const n = Math.floor(ch.length / rate);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = i * rate;
      const i0 = Math.floor(x);
      const t = x - i0;
      out[i] = (ch[i0] || 0) * (1 - t) + (ch[i0 + 1] || 0) * t;
    }
    return out;
  });
}

/** Retire le silence de tête (le son démarre pile sur l'image). */
function trimHead(st, thr = 0.02) {
  const p = peakOf(st);
  let i = 0;
  while (i < st[0].length && Math.abs(st[0][i]) < p * thr && Math.abs(st[1][i]) < p * thr) i++;
  return slice(st, Math.max(0, i - Math.round(0.002 * SR)), st[0].length);
}

/** Instant (s) du maximum d'enveloppe (pour caler un swoosh sur sa transition). */
function peakTime(st) {
  let best = 0;
  let at = 0;
  const w = Math.round(0.01 * SR);
  for (let i = 0; i < st[0].length; i += w) {
    let e = 0;
    for (let j = i; j < Math.min(i + w, st[0].length); j++) e += st[0][j] ** 2 + st[1][j] ** 2;
    if (e > best) {
      best = e;
      at = i;
    }
  }
  return at / SR;
}

function onsets([L, R], minGap = 0.1) {
  const p = peakOf([L, R]);
  const thr = p * 0.22;
  const out = [];
  let last = -1e9;
  for (let i = 0; i < L.length; i++) {
    const v = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    if (v > thr && i - last > minGap * SR) {
      out.push(i);
      last = i;
    }
  }
  return out;
}

const meta = { keys: [], keyRates: [0.93, 0.97, 1, 1.04, 1.08], pops: 12, swooshRates: [0.8, 0.9, 1, 1.1, 1.22], swooshPeak: {}, durations: {} };

/* ── Frappes clavier ─────────────────────────────────────────────────────── */
const KEY_FILES = ["son_duquotidient-son-clavier-iphone-478600.mp3", "u_a4gfvwagf1-iphone-keyboard-typing-sound-effect-336778.mp3"];
KEY_FILES.forEach((file, fi) => {
  const st = decode(file);
  const ons = onsets(st, 0.12).slice(0, 14);
  ons.forEach((o, k) => {
    let key = slice(st, Math.max(0, o - Math.round(0.003 * SR)), o + Math.round(0.085 * SR));
    key = fadeOut(normalize(key, 0.8), 0.045);
    const id = `k${fi}_${k}`;
    meta.keyRates.forEach((r, ri) => writeWav(`key_${id}_${ri}.wav`, repitch(key, r)));
    meta.keys.push(id);
  });
});

/* ── Pops (hauteur qui monte) ────────────────────────────────────────────── */
{
  const pop = normalize(trimHead(decode("arnav_geddada-ui-sound-374228.mp3")), 0.85);
  for (let n = 0; n < meta.pops; n++) meta.durations[`pop_${n}`] = writeWav(`pop_${n}.wav`, repitch(pop, 2 ** (n / 12)));
}

/* ── Swooshes ────────────────────────────────────────────────────────────── */
{
  const sw = normalize(trimHead(decode("universfield-swoosh-015-383769.mp3")), 0.85);
  meta.swooshRates.forEach((r, i) => {
    const v = repitch(sw, r);
    meta.durations[`swoosh_${i}`] = writeWav(`swoosh_${i}.wav`, v);
    meta.swooshPeak[`swoosh_${i}`] = peakTime(v);
  });
}

/* ── Sons simples ────────────────────────────────────────────────────────── */
for (const [name, file] of [
  ["tap", "matthewvakaliuk73627-mouse-click-290204.mp3"],
  ["success", "freesound_community-notification-sound-7062.mp3"],
  ["send", "universfield-new-notification-051-494246.mp3"],
  ["label", "universfield-interface-124464.mp3"],
]) {
  meta.durations[name] = writeWav(`${name}.wav`, normalize(trimHead(decode(file)), 0.85));
}

/* ── Synthèse ────────────────────────────────────────────────────────────── */
// Générateur pseudo-aléatoire déterministe
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function buffer(seconds) {
  const n = Math.round(seconds * SR);
  return [new Float32Array(n), new Float32Array(n)];
}

/* Impact grave doux : sous-basse qui descend + souffle étouffé */
{
  const st = buffer(2.2);
  let lp = 0;
  for (let i = 0; i < st[0].length; i++) {
    const t = i / SR;
    const phase = 2 * Math.PI * (38 * t + 44 * 0.12 * (1 - Math.exp(-t / 0.12)));
    const env = Math.min(1, t / 0.004) * Math.exp(-t / 0.55);
    const sub = Math.sin(phase) * env + 0.25 * Math.sin(2 * phase) * env * Math.exp(-t / 0.2);
    lp += 0.04 * (rnd() * 2 - 1 - lp);
    const thump = lp * 3.2 * Math.exp(-t / 0.07);
    const v = Math.tanh((sub + thump) * 1.3) * 0.9;
    st[0][i] = v;
    st[1][i] = v;
  }
  meta.durations.impact = writeWav("impact.wav", normalize(st, 0.9));
}

/* Musique : 100 BPM, Fmaj7 – Dm7 – B♭maj7 – Csus4, marimba + kick doux + shaker */
{
  const DUR = DURATION_S;
  const st = buffer(DUR);
  const BEAT = 60 / 100;
  const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
  const add = (t0, fn, len, pan = 0, gain = 1) => {
    const a = Math.round(t0 * SR);
    const n = Math.round(len * SR);
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < n && a + i < st[0].length; i++) {
      const v = fn(i / SR);
      st[0][a + i] += v * gl;
      st[1][a + i] += v * gr;
    }
  };
  const marimba = (f, vel) => (t) =>
    vel *
    Math.min(1, t / 0.003) *
    (Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.42) +
      0.22 * Math.sin(2 * Math.PI * f * 3.99 * t) * Math.exp(-t / 0.07) +
      0.06 * Math.sin(2 * Math.PI * f * 9.7 * t) * Math.exp(-t / 0.018));
  const kick = (t) => Math.min(1, t / 0.002) * Math.sin(2 * Math.PI * (46 * t + 70 * 0.035 * (1 - Math.exp(-t / 0.035)))) * Math.exp(-t / 0.2);
  const shaker = (vel) => {
    let hp = 0;
    let prev = 0;
    return (t) => {
      const x = rnd() * 2 - 1;
      hp = 0.85 * (hp + x - prev);
      prev = x;
      return hp * Math.min(1, t / 0.006) * Math.exp(-t / 0.028) * vel;
    };
  };

  // accords (notes MIDI) : une mesure = 4 temps
  const CHORDS = [
    [53, 57, 60, 64], // Fmaj7
    [50, 53, 57, 60], // Dm7
    [46, 50, 53, 57], // B♭maj7
    [48, 53, 55, 60], // Csus4
  ];
  const ARP = [0, 2, 1, 3, 2, 1, 3, 2];
  const bars = Math.ceil(DUR / (BEAT * 4));
  for (let b = 0; b < bars; b++) {
    const chord = CHORDS[b % 4];
    const t0 = b * BEAT * 4;
    // marimba en croches (plus clairsemée pendant le hook), s'arrête sur le logo
    ARP.forEach((ci, s) => {
      const t = t0 + s * (BEAT / 2);
      if (t >= T.logo.start - 0.05) return;
      if (t < T.cluster.start && s % 2 === 1) return;
      add(t, marimba(hz(chord[ci] + 12), 0.32 + 0.1 * (s % 4 === 0) + 0.06 * rnd()), 1.2, s % 2 ? 0.35 : -0.35);
    });
    // basse de marimba : fondamentale sur le 1 et le « et » du 3
    if (t0 < T.logo.start - 0.05) {
      add(t0, marimba(hz(chord[0] - 12), 0.42), 1.4, 0);
      add(t0 + BEAT * 2.5, marimba(hz(chord[0] - 12), 0.28), 1.2, 0);
    }
    for (let q = 0; q < 16; q++) {
      const t = t0 + q * (BEAT / 4);
      // shaker en doubles croches après le hook, accent sur les contretemps
      if (t >= T.cluster.start && t < T.logo.start) add(t, shaker(q % 2 ? 0.22 : 0.1), 0.12, 0.25);
      // kick doux sur 1 et 3, entre l'impact de 7,8 s et le logo
      if (q % 8 === 0 && t >= T.create.start - 0.01 && t < T.logo.start) add(t, kick, 0.6, 0, 0.85);
    }
  }
  // accord final en arpège doux sur le logo
  [53, 57, 60, 64, 67].forEach((n, i) => add(T.logo.start + i * 0.07, marimba(hz(n + 12), 0.34), 2.8, i % 2 ? 0.4 : -0.4));

  // petite réverbe (délais croisés)
  const wet = buffer(DUR);
  for (const [d, g] of [
    [0.083, 0.28],
    [0.127, 0.22],
    [0.191, 0.18],
    [0.263, 0.12],
  ]) {
    const o = Math.round(d * SR);
    for (let i = o; i < st[0].length; i++) {
      wet[0][i] += st[1][i - o] * g;
      wet[1][i] += st[0][i - o] * g;
    }
  }
  for (let i = 0; i < st[0].length; i++) {
    const t = i / SR;
    const fade = Math.min(1, t / 0.25) * Math.min(1, Math.max(0, (DUR - t) / (DUR - T.logo.fadeAt)));
    st[0][i] = (st[0][i] + wet[0][i]) * fade;
    st[1][i] = (st[1][i] + wet[1][i]) * fade;
  }
  meta.durations.music = writeWav("music.wav", normalize(st, 0.8));
}

fs.mkdirSync(path.join(ROOT, "src/audio"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "src/audio/meta.json"), JSON.stringify(meta, null, 2));
console.log(`✓ ${fs.readdirSync(OUT).length} fichiers dans public/audio, ${meta.keys.length} frappes`);
