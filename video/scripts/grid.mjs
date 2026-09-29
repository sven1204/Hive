// Planche d'aperçu : node scripts/grid.mjs out.png largeurCol img1 img2 ...
import { chromium } from 'playwright';
import fs from 'fs';
const [out, w, ...imgs] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1600,height:900}});
await p.setContent(`<body style="margin:0;background:#333;display:flex;flex-wrap:wrap;gap:8px;padding:8px;font:14px sans-serif;color:#fff">`+
 imgs.map(f=>`<div><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}" style="width:${w}px;display:block"><div>${f.split('/').slice(-2).join('/')}</div></div>`).join('')+`</body>`);
await p.screenshot({path:out, fullPage:true}); await b.close();
