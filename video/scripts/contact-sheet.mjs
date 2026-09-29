import { chromium } from 'playwright';
import fs from 'fs';
const dir = process.argv[2], fpsx = Number(process.argv[3]||4), per = 18;
const files = fs.readdirSync(dir).filter(f=>/^f_\d+\.jpg$/.test(f)).sort();
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1500,height:900}});
for (let s=0; s*per<files.length; s++){
  const chunk = files.slice(s*per,(s+1)*per);
  const html = `<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(3,480px);gap:6px;padding:6px;font:bold 18px sans-serif">`+
   chunk.map((f,i)=>{const idx=s*per+i; return `<div style="position:relative"><img src="data:image/jpeg;base64,${fs.readFileSync(dir+'/'+f).toString('base64')}" style="width:480px;display:block"><span style="position:absolute;left:6px;top:4px;color:#ff0;background:#000a;padding:2px 6px">${(idx/fpsx).toFixed(2)}s</span></div>`}).join('')+`</body>`;
  await p.setContent(html); await p.screenshot({path:`${dir}/sheet_${s}.png`, fullPage:true});
}
await b.close();
