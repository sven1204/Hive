// Niveaux audio d'un rendu : crête et RMS par fenêtre de 0,5 s. node scripts/audio-levels.mjs fichier.mp4
import { execFileSync } from "node:child_process";
import path from "node:path";
const dir = path.resolve("node_modules/@remotion/compositor-darwin-arm64");
const buf = execFileSync(path.join(dir, "ffmpeg"), ["-v", "error", "-i", process.argv[2], "-f", "wav", "-acodec", "pcm_s16le", "-ac", "1", "-ar", "22050", "-"], { env: { ...process.env, DYLD_LIBRARY_PATH: dir }, maxBuffer: 1 << 28 });
let off = 12;
while (buf.toString("ascii", off, off + 4) !== "data") off += 8 + buf.readUInt32LE(off + 4);
const n = (buf.length - off - 8) / 2;
const W = 11025;
const db = (x) => (20 * Math.log10(Math.max(x, 1e-6))).toFixed(1);
let gp = 0;
const rows = [];
for (let w = 0; w * W < n; w++) {
  let p = 0, s = 0, c = 0;
  for (let i = w * W; i < Math.min(n, (w + 1) * W); i++) { const v = buf.readInt16LE(off + 8 + i * 2) / 32768; p = Math.max(p, Math.abs(v)); s += v * v; c++; }
  gp = Math.max(gp, p);
  rows.push(`${(w * 0.5).toFixed(1)}s crête ${db(p)} dB  rms ${db(Math.sqrt(s / c))} dB`);
}
console.log(rows.join("\n"));
console.log("crête globale", db(gp), "dB");
