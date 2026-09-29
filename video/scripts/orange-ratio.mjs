// Part de pixels « orange saturé » par capture : node scripts/orange-ratio.mjs <dossier>
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
const dir = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage();
for (const fmt of ["desktop", "mobile"]) {
  for (const f of fs.readdirSync(path.join(dir, fmt)).filter((x) => x.endsWith(".png")).sort()) {
    const data = fs.readFileSync(path.join(dir, fmt, f)).toString("base64");
    const r = await p.evaluate(async (src) => {
      const img = new Image(); img.src = src; await img.decode();
      const w = Math.round(img.width / 4), h = Math.round(img.height / 4);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
      const d = x.getImageData(0, 0, w, h).data;
      let sat = 0, soft = 0; const n = d.length / 4;
      for (let i = 0; i < d.length; i += 4) {
        const R = d[i] / 255, G = d[i + 1] / 255, B = d[i + 2] / 255;
        const mx = Math.max(R, G, B), mn = Math.min(R, G, B), v = mx, s = mx ? (mx - mn) / mx : 0;
        let hue = 0; if (mx !== mn) { if (mx === R) hue = ((G - B) / (mx - mn)) % 6; else if (mx === G) hue = (B - R) / (mx - mn) + 2; else hue = (R - G) / (mx - mn) + 4; hue *= 60; if (hue < 0) hue += 360; }
        const orange = hue >= 15 && hue <= 50;
        if (orange && s > 0.45 && v > 0.35) sat++;
        else if (orange && s > 0.12 && v > 0.8) soft++;
      }
      return { sat: (100 * sat / n).toFixed(1), soft: (100 * soft / n).toFixed(1) };
    }, "data:image/png;base64," + data);
    console.log(`${fmt.padEnd(8)} ${f.padEnd(16)} orange saturé ${r.sat.padStart(5)} %   beige/pêche ${r.soft.padStart(5)} %`);
  }
}
await b.close();
