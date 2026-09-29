import React from "react";
import { Html5Audio, Sequence, staticFile } from "remotion";
import { CHAT, FPS, T, TEXT, VOLUME } from "../config";
import meta from "./meta.json";

/* Bande-son : chaque SFX est posé avec <Sequence> sur l'image exacte de l'événement visuel
   (mêmes timings que les scènes, lus dans config.ts). Les sons sont préparés par scripts/prepare-audio.mjs. */

type Ev = { at: number; src: string; vol: number; dur: number };

const dur = (name: string) => (meta.durations as Record<string, number>)[name] ?? 0.2;
// Un élément visuel apparaît à l'image ceil(t × fps) : le son part sur la même image.
const frameOf = (s: number) => Math.max(0, Math.ceil(s * FPS - 1e-6));

// Hachage déterministe (même vidéo à chaque rendu)
const hash = (n: number) => {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519) >>> 0;
  return (x ^ (x >>> 13)) >>> 0;
};

const ev = (at: number, name: string, vol: number): Ev => ({ at, src: `audio/${name}.wav`, vol, dur: dur(name) });

/** Une frappe différente par caractère affiché, hauteur légèrement variée. */
function typing(start: number, every: number, text: string, seed: number, vol = VOLUME.key): Ev[] {
  return Array.from(text).map((ch, i) => {
    const h = hash(seed * 1000 + i);
    const key = meta.keys[h % meta.keys.length];
    const rate = ch === " " ? 0 : (h >>> 8) % meta.keyRates.length;
    const v = vol * (ch === " " ? 0.7 : 0.85 + ((h >>> 16) % 16) / 100);
    return { at: start + i * every, src: `audio/key_${key}_${rate}.wav`, vol: v, dur: 0.1 };
  });
}

/** Swoosh dont le pic tombe sur `peakAt` (variante 0 = grave … 4 = aigu). */
function swoosh(peakAt: number, variant: number, vol = VOLUME.swoosh): Ev {
  const name = `swoosh_${variant}`;
  const peak = (meta.swooshPeak as Record<string, number>)[name];
  return ev(Math.max(0, peakAt - peak), name, vol);
}

/** Suite de pops dont la hauteur monte (demi-tons donnés). */
const pops = (times: number[], steps: number[], vol = VOLUME.pop) => times.map((t, i) => ev(t, `pop_${steps[i % steps.length]}`, vol));

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

function events(): Ev[] {
  const e: Ev[] = [];
  const { hook, cluster, fill, create, team, chat, montage, final, logo } = T;

  // 1. Hook
  e.push(swoosh(0.3, 4, VOLUME.swoosh * 0.45));
  e.push(...typing(hook.typeStart, hook.charEvery, TEXT.hook, 1));
  e.push(swoosh(hook.morphAt + 0.2, 3, VOLUME.swoosh * 0.7));
  e.push(ev(hook.morphAt + 0.3, "pop_0", VOLUME.pop * 0.9));

  // 2. Grappe + textes
  e.push(swoosh(cluster.start + 0.35, 2, VOLUME.swoosh * 0.5));
  e.push(...pops([0, 1, 2, 3, 4, 5].map((k) => cluster.start + 0.1 + k * 0.06), [0, 2, 4, 5, 7, 9], VOLUME.pop * 0.35));
  e.push(swoosh(cluster.line1At + 0.15, 4, VOLUME.swoosh * 0.3));
  e.push(swoosh(cluster.line2At + 0.15, 4, VOLUME.swoosh * 0.3));

  // 3. Remplissage des 6 alvéoles + pastilles de rôle (hauteur qui monte)
  e.push(swoosh(fill.textAt + 0.3, 3, VOLUME.swoosh * 0.35));
  e.push(...pops([0, 1, 2, 3, 4, 5].map((k) => fill.firstAt + k * fill.every), [2, 4, 5, 7, 9, 11]));
  e.push(swoosh(fill.diveAt + 0.45, 0, VOLUME.swoosh * 1.2));
  e.push(ev(create.start, "impact", VOLUME.impact));

  // 4. 01 Crée ton projet
  e.push(ev(create.labelAt, "label", VOLUME.label));
  e.push(swoosh(create.deviceAt + 0.25, 1, VOLUME.swoosh * 0.8));
  e.push(swoosh(create.zoomAt + 0.45, 2, VOLUME.swoosh * 0.55));
  e.push(...typing(create.typeStart, create.charEvery, TEXT.typedTitle, 2));
  e.push(swoosh(create.whipAt + 0.17, 3, VOLUME.swoosh * 1.3));

  // 5. 02 Choisis ton équipe
  e.push(ev(team.labelAt, "label", VOLUME.label));
  e.push(swoosh(team.cardOutAt + 0.3, 4, VOLUME.swoosh * 0.8));
  e.push(ev(team.tapAt, "tap", VOLUME.tap));
  e.push(ev(team.acceptedAt, "success", VOLUME.success));
  e.push(ev(team.toastAt, "pop_7", VOLUME.pop * 0.9));
  e.push(swoosh(team.end - 0.2, 2, VOLUME.swoosh * 0.5));

  // 6. 03 Lancez-vous : bulles 3D
  e.push(swoosh(chat.start + 0.2, 3, VOLUME.swoosh * 0.6));
  e.push(ev(chat.labelAt, "label", VOLUME.label));
  e.push(...pops(CHAT.map((_, i) => chat.firstBubbleAt + i * chat.bubbleEvery), [0, 2, 4, 5, 7]));
  e.push(ev(chat.composerAt, "pop_9", VOLUME.pop * 0.6));
  e.push(...typing(chat.typeStart, chat.charEvery, TEXT.composer, 3));
  e.push(ev(chat.sendAt, "tap", VOLUME.tap));
  e.push(ev(chat.sendAt + 0.04, "send", VOLUME.send));
  e.push(swoosh(chat.end + 0.1, 2, VOLUME.swoosh * 1.1));

  // 7. Montage : trois cartes
  TEXT.montage.forEach((_, i) => {
    const at = montage.start + 0.05 + i * montage.cardEvery;
    e.push(swoosh(at + 0.15, [1, 2, 3, 2, 4][i % 5], VOLUME.swoosh * 0.85));
    e.push(ev(at + 0.12, `pop_${[0, 2, 4, 7, 9, 11][i % 6]}`, VOLUME.pop * 0.6));
  });

  // 8. Grappe pleine
  e.push(ev(final.start, "impact", VOLUME.impact));
  e.push(swoosh(final.start + 0.02, 0, VOLUME.swoosh * 0.6));
  e.push(...pops(MAJOR.map((_, i) => final.start + 0.05 + i * 0.07), MAJOR, VOLUME.pop * 0.4));
  e.push(swoosh(final.line2At + 0.15, 4, VOLUME.swoosh * 0.3));

  // 9. Logo
  e.push(swoosh(logo.start + 0.3, 1, VOLUME.swoosh * 0.7));
  e.push(ev(logo.fillAt, "send", VOLUME.send));
  e.push(...typing(logo.lettersAt, logo.letterEvery, TEXT.brand, 4, VOLUME.key * 0.55));
  e.push(ev(logo.urlAt, "pop_5", VOLUME.pop * 0.5));
  e.push(...typing(logo.urlAt + 0.2, logo.urlCharEvery, TEXT.url, 5));
  e.push(ev(logo.clickAt, "tap", VOLUME.tap));
  e.push(swoosh(logo.fadeAt + 0.3, 0, VOLUME.swoosh * 0.4));
  return e;
}

export const SOUND_EVENTS = events();

export const Soundtrack: React.FC = () => (
  <>
    <Html5Audio src={staticFile("audio/music.wav")} volume={VOLUME.music} />
    {SOUND_EVENTS.map((s, i) => (
      <Sequence key={i} from={frameOf(s.at)} durationInFrames={Math.ceil(s.dur * FPS) + 2} layout="none">
        <Html5Audio src={staticFile(s.src)} volume={s.vol} />
      </Sequence>
    ))}
  </>
);
