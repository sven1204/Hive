import { Easing, interpolate } from "remotion";
import { EASE, FPS } from "../config";

export const easeOut = Easing.bezier(...EASE.enter);
export const easeCam = Easing.bezier(...EASE.camera);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Progression 0→1 entre `startS` et `startS + durS` (secondes absolues). */
export function prog(frame: number, startS: number, durS: number, easing: (t: number) => number = easeOut) {
  const a = startS * FPS;
  return interpolate(frame, [a, a + Math.max(1, durS * FPS)], [0, 1], { ...clamp, easing });
}

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Interpolation clampée simple. */
export const lerp = (frame: number, input: number[], output: number[], easing?: (t: number) => number) =>
  interpolate(frame, input, output, { ...clamp, easing });

/** Nombre de caractères tapés à l'image `frame`. */
export function typedCount(frame: number, startS: number, charEvery: number, length: number) {
  const t = frame / FPS - startS;
  if (t < 0) return 0;
  return Math.min(length, Math.floor(t / charEvery) + 1);
}

/** Instants (s) de chaque caractère tapé : sert aussi au son de frappe. */
export function typingTimes(startS: number, charEvery: number, text: string) {
  return Array.from(text).map((_, i) => startS + i * charEvery);
}

/** Dérive de caméra permanente, très légère (px / degrés). */
export function drift(frame: number, amount = 1) {
  const t = frame / FPS;
  return {
    x: Math.sin(t * 0.45) * 10 * amount + Math.sin(t * 1.3) * 3 * amount,
    y: Math.cos(t * 0.38) * 8 * amount,
    rot: Math.sin(t * 0.3) * 0.35 * amount,
    rx: Math.sin(t * 0.5) * 1.2 * amount,
    ry: Math.cos(t * 0.42) * 1.6 * amount,
  };
}

/** Curseur qui clignote (plein pendant la frappe). */
export function cursorOn(frame: number, typing: boolean) {
  if (typing) return true;
  return Math.floor(frame / 15) % 2 === 0;
}
