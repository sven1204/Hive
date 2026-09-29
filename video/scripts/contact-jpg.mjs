// Planche de JPG avec horodatage : node scripts/contact-jpg.mjs <dossier> <fps> <t0> <largeur>
import { chromium } from "playwright";
import fs from "fs";
const [dir, fps, t0, w] = [process.argv[2], Number(process.argv[3]), Number(process.argv[4] || 0), Number(process.argv[5] || 200)];
const files = fs.readdirSync(dir).filter((f) => /^f_\d+\.jpg$/.test(f)).sort();
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.setContent(`<body style="margin:0;background:#222;display:flex;flex-wrap:wrap;gap:4px;padding:4px;font:bold 13px sans-serif">` +
  files.map((f, i) => `<div style="position:relative"><img src="data:image/jpeg;base64,${fs.readFileSync(dir + "/" + f).toString("base64")}" style="width:${w}px;display:block"><span style="position:absolute;left:3px;top:3px;color:#ff0;background:#000a;padding:1px 4px">${(t0 + i / fps).toFixed(2)}s</span></div>`).join("") + `</body>`);
await p.screenshot({ path: dir + "/sheet.png", fullPage: true });
await b.close();
