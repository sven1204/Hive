/* Rend des images fixes sans re-bundler à chaque fois.
   node scripts/stills.mjs <dossier> <mobile|desktop|both> <sec1> <sec2> ... */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const [outDir, which, ...secs] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const ids = which === "both" ? ["HiveMobile", "HiveDesktop"] : [which === "mobile" ? "HiveMobile" : "HiveDesktop"];
for (const id of ids) {
  const composition = await selectComposition({ serveUrl, id, chromiumOptions: { gl: "angle" } });
  for (const s of secs) {
    const frame = Math.round(Number(s) * 30);
    const output = path.join(outDir, `${id === "HiveMobile" ? "m" : "d"}_${String(s).replace(".", "_")}.png`);
    await renderStill({ serveUrl, composition, frame, output, chromiumOptions: { gl: "angle" }, imageFormat: "png" });
    console.log("✓", output);
  }
}
