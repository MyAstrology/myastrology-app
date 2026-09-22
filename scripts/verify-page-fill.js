#!/usr/bin/env node
/*  ছাপা পাতা কতটা ভরে — মেপে।
 *
 *  ⛔ মালিকের অভিযোগ খ৩: "কার্ডের মাঝে বড় ফাঁকা, পাতা অর্ধেক খালি"।
 *  চোখে দেখে এটা তর্কের বিষয় ছিল, তাই সংখ্যায় মাপা হয়: প্রতিটি A4
 *  পাতার `.bd`-র ভিতরে সবচেয়ে নিচের উপাদানটি কোথায় শেষ হয়।
 *
 *  মাপা (২০২৬-০৯-২২, softNew বসানোর আগে): সংখ্যা জ্যোতিষের ৪ নং পাতা
 *  **২৬%**, ২ নং ৪৪%, ৩ নং ৫৩% — পাঁচ পাতায় ছড়ানো যা চার পাতাতেই ধরত।
 *
 *  ⚠️ মলাট ও বিজ্ঞাপনের পাতা প্যাকারের বাইরে, ওদের `.bd` নেই — তাই
 *  এখানে আপনাআপনি বাদ পড়ে।
 */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const APP = path.resolve(__dirname, '..');
const PORT = 8195;
let checks = 0, fail = 0;
const ok  = m => { checks++; console.log('  \x1b[32m✓\x1b[0m ' + m); };
const bad = m => { checks++; fail++; console.log('  \x1b[31m✗\x1b[0m ' + m); };

/* সবচেয়ে কম ভরা পাতাটাও এর নিচে নামতে পারবে না। ১০০% নয় — কার্ড
   গোটা গোটা বসে বলে কিছু ফাঁক থাকবেই; কিন্তু অর্ধেকের নিচে মানে
   পাঠক একটা প্রায়-ফাঁকা কাগজ পাচ্ছেন। */
const FLOOR = 0.55;

function chromium() {
  for (const m of ['@playwright/test', 'playwright', '/opt/node22/lib/node_modules/playwright']) {
    try { return require(m).chromium; } catch (e) {}
  }
  return null;
}
function decode(p) {
  const s = fs.readFileSync(p, 'utf8');
  return JSON.parse(s.slice(s.indexOf('"'), s.lastIndexOf('"') + 1));
}
function withPrintData(html, rawJson) {
  const safe = JSON.stringify(rawJson).replace(/</g, '\\u003c');
  return html.replace('<head>', () => `<head><script>window.__myaPrintData=${safe};<\/script>`);
}

const FIX = path.join(APP, 'scripts', '__fixtures__', 'print');
/* ⚠️ তালিকাটা .pg ব্যবহার করা পাতাগুলোর — কুণ্ডলী ও মিলনের ছাপার পাতা
   নিজের কাঠামোয় চলে, ওদের এই প্যাকার নেই। */
const PAGES = [
  ['numerology-print',  'numerology.json'],
  ['varshaphala-print', 'varshaphala.json'],
  ['namakaran-print',   'namakaran.json'],
];

let PAGE_HTML = Object.create(null);
function serve() {
  return new Promise(r => {
    const s = http.createServer((q, p) => {
      const u = q.url.split('?')[0].replace(/^\//, '');
      if (PAGE_HTML[u] != null) { p.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' }); return p.end(PAGE_HTML[u]); }
      p.writeHead(404); p.end();
    });
    s.listen(PORT, '127.0.0.1', () => r(s));
  });
}

(async () => {
  const cr = chromium();
  if (!cr) { console.log('⚠️  playwright নেই — বাদ'); process.exit(0); }
  for (const [name, fx] of PAGES) {
    const fp = path.join(FIX, fx);
    if (!fs.existsSync(fp)) { bad(`${name} — নমুনা-তথ্য নেই (${fx})`); continue; }
    PAGE_HTML[name + '.html'] = withPrintData(decode(path.join(APP, 'src/web-html', name + '.js')), fs.readFileSync(fp, 'utf8'));
  }
  const srv = await serve();
  const br = await cr.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  for (const [name] of PAGES) {
    if (!PAGE_HTML[name + '.html']) continue;
    const ctx = await br.newContext({ viewport: { width: 820, height: 1200 } });
    const pg = await ctx.newPage();
    await pg.goto(`http://127.0.0.1:${PORT}/${name}.html`, { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(5000);
    const fills = await pg.evaluate(() => {
      const out = [];
      document.querySelectorAll('.pg').forEach(p => {
        const bd = p.querySelector('.bd');
        if (!bd) return;                       /* মলাট / বিজ্ঞাপন — প্যাকারের বাইরে */
        const box = bd.getBoundingClientRect();
        if (box.height < 10) return;
        let low = box.top;
        bd.querySelectorAll('*').forEach(e => {
          const r = e.getBoundingClientRect();
          if (r.height > 0 && r.bottom > low) low = r.bottom;
        });
        out.push((low - box.top) / box.height);
      });
      return out;
    });
    await ctx.close();
    if (!fills.length) { bad(`${name} — একটাও সাজানো পাতা পাওয়া গেল না`); continue; }
    const worst = Math.min.apply(null, fills);
    const avg = fills.reduce((a, b) => a + b, 0) / fills.length;
    const pct = x => Math.round(x * 100) + '%';
    if (worst < FLOOR) bad(`${name} — ${fills.length}টি পাতা, সবচেয়ে খালিটা ${pct(worst)} ভরা (সীমা ${pct(FLOOR)}) · গড় ${pct(avg)}`);
    else ok(`${name} — ${fills.length}টি পাতা, সবচেয়ে খালিটা ${pct(worst)}, গড় ${pct(avg)}`);
  }
  await br.close(); srv.close();
  console.log(`\n${fail ? '❌' : '✅'} ${checks}টি পরীক্ষা, ${fail}টি সমস্যা`);
  process.exit(fail ? 1 : 0);
})();
