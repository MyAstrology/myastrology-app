#!/usr/bin/env node
/* বিদেশি পাঠকের জন্য পাতার ₹ → Play-র দাম (src/utils/localPrices.js)।

   কেন (২০২৬-০৯-২৫, সহকর্মীর ১০ ও ১১): অ্যাপে বিদেশি পাঠক Play-র পর্দায়
   নিজের মুদ্রায় দাম দেখেন, অথচ পাতার বোতাম, পপআপ ও PDF-এর শেষ পাতায় "₹১০১"।

   অ্যাপ এখানে চলে না, তাই localPrices.js-এর কোড হুবহু (import ছেঁটে) চালানো হয়:
     ① buildMap — INR হলে null (ভারতীয় পাঠকের কিছুই বদলায় না), USD হলে মানচিত্র
     ② ওয়েবসাইটের আসল পাতা (bn কুণ্ডলী, en মিলন, bn বর্ষফল) + priceJS:
        পণ্যের ₹ অঙ্ক আর দৃশ্যমান নয়, Play-দাম আছে, কেটে-দেওয়া ₹৯৯৯ লুকোনো,
        JSON-LD অক্ষত, আর পরে আঁকা পপআপও বদলায়
     ③ ছাপার পাতার বান্ডল (kundali-print, numerology-print) — PDF-এর শেষ পাতা

   চালানো:  node scripts/verify-local-prices.js   (../services লাগে)            */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { spawn } = require('child_process');
const SVC = path.resolve(__dirname, '..', '..', 'services');
const { chromium } = require(path.join(SVC, 'node_modules', '@playwright', 'test'));
const PW_EXE = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const PORT = 8996, ORIGIN = 'http://127.0.0.1:' + PORT;

function esm(file, extra) {
  let src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  src = src.replace(/^import [\s\S]*?;$/mg, '').replace(/^export (const|function|async function|let) /mg, '$1 ');
  const ctx = Object.assign({ module: { exports: {} }, JSON, Object, String, require: () => ({}) }, extra || {});
  vm.runInNewContext(src + '\n' + (ctx.__tail || ''), ctx);
  return ctx;
}
const P = esm('src/config/products.js');
P.__tail = '';
const LP = (() => {
  let src = fs.readFileSync(path.join(__dirname, '..', 'src/utils/localPrices.js'), 'utf8');
  src = src.replace(/^import [\s\S]*?;$/mg, '').replace(/^export (const|function|async function|let) /mg, '$1 ');
  src += '\nmodule.exports={buildMap,priceJS};';
  const ctx = { module: { exports: {} }, JSON, Object, String, PRODUCTS: vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '..', 'src/config/products.js'), 'utf8').replace(/^export (const) /mg, '$1 ') + ';PRODUCTS') };
  vm.runInNewContext(src, ctx);
  return ctx.module.exports;
})();

let bad = 0;
const fail = m => { bad++; console.log('❌ ' + m); }, ok = m => console.log('✓ ' + m);

/* ① */
const INR = {}, USD = {};
const usd = { 101: '$1.99', 51: '$0.79', 21: '$0.35', 501: '$7.49', 1501: '$21.99' };
const prodSrc = fs.readFileSync(path.join(__dirname, '..', 'src/config/products.js'), 'utf8');
for (const m of prodSrc.matchAll(/(\w+):\s*\{\s*id:[^}]*inr:\s*(\d+)/g)) {
  INR[m[1]] = { price: '₹' + m[2] + '.00', currency: 'INR' };
  USD[m[1]] = { price: usd[m[2]], currency: 'USD' };
}
if (LP.buildMap(INR) !== null) fail('INR-এ মানচিত্র তৈরি হলো — ভারতীয় পাঠকের পাতা অকারণে বদলাত');
else ok('ভারতীয় পাঠক (INR): কোনো বদল নেই');
const MAP = LP.buildMap(USD);
if (!MAP || MAP['101'] !== '$1.99' || MAP['1501'] !== '$21.99') fail('USD মানচিত্র ভুল: ' + JSON.stringify(MAP));
else ok('বিদেশি পাঠক: ' + JSON.stringify(MAP));
const JS = LP.priceJS(MAP);

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: SVC, stdio: 'ignore' });
  process.on('exit', () => { try { srv.kill(); } catch (e) {} });
  await new Promise(r => setTimeout(r, 1500));
  const br = await chromium.launch({ executablePath: PW_EXE });
  try {
    /* ② */
    for (const pg0 of ['kundali.html', 'en/match-making.html', 'varshaphala.html']) {
      const ctx = await br.newContext({ viewport: { width: 412, height: 900 } });
      await ctx.route(u => !u.href.startsWith(ORIGIN), r => r.abort());
      const pg = await ctx.newPage();
      await pg.goto(ORIGIN + '/' + pg0, { waitUntil: 'domcontentloaded' });
      await pg.waitForTimeout(2500);
      const before = await pg.evaluate(() => (document.body.textContent.match(/₹\s?[০-৯0-9]/g) || []).length);
      await pg.evaluate(JS);
      /* পরে আঁকা পপআপ */
      await pg.evaluate(() => { const d = document.createElement('div'); d.id = '__late'; d.textContent = 'এখনই কিনুন ₹১০১'; document.body.appendChild(d); });
      await pg.waitForTimeout(300);
      const r = await pg.evaluate((map) => {
        const vis = el => { for (let a = el; a && a.nodeType === 1; a = a.parentElement) if (getComputedStyle(a).display === 'none') return false; return true; };
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; const left = [];
        const num = s => parseInt(s.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/[,\s]/g, ''), 10);
        while ((n = w.nextNode())) {
          const t = n.parentNode.nodeName; if (t === 'SCRIPT' || t === 'STYLE') continue;
          for (const m of n.nodeValue.matchAll(/₹\s?([০-৯0-9][০-৯0-9,]*)/g))
            if (map[String(num(m[1]))] && vis(n.parentNode)) left.push(m[0]);
        }
        const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent).join('');
        return { left, late: document.getElementById('__late').textContent,
                 dollars: (document.body.textContent.match(/\$\d/g) || []).length, ldRupee: /₹/.test(ld) || !ld };
      }, MAP);
      if (r.left.length) fail(`${pg0} — পণ্যের ₹ এখনো দেখা যায়: ${r.left.slice(0, 4).join(' · ')}`);
      else if (!/\$1\.99/.test(r.late)) fail(`${pg0} — পরে আঁকা পপআপ বদলায়নি: ${r.late}`);
      else if (!r.ldRupee) fail(`${pg0} — JSON-LD-এর ₹ বদলে গেল`);
      else ok(`${pg0} — ${before}টি ₹-এর জায়গায় Play-দাম (${r.dollars}টি $) · পরে আঁকা পপআপও · JSON-LD অক্ষত`);
      await ctx.close();
    }
    /* কেটে-দেওয়া ₹৯৯৯ — কুণ্ডলীর পপআপে */
    {
      const ctx = await br.newContext(); const pg = await ctx.newPage();
      await pg.setContent('<div id="c"><span id="s" style="text-decoration:line-through">₹৯৯৯</span> <b id="p">₹৫০১</b><p id="q">দাম ₹৯৯৯ থেকে কমে এখন আরও কম হয়েছে সবার জন্য।</p></div>');
      await pg.evaluate(JS);
      const r = await pg.evaluate(() => ({ s: getComputedStyle(document.getElementById('s')).display, p: document.getElementById('p').textContent, q: getComputedStyle(document.getElementById('q')).display }));
      if (r.s !== 'none' || r.p !== '$7.49' || r.q === 'none') fail('কেটে-দেওয়া দাম: ' + JSON.stringify(r));
      else ok('কেটে-দেওয়া ₹৯৯৯ লুকোনো, ₹৫০১ → $7.49, বাক্যের ভিতরের ₹ অক্ষত');
      await ctx.close();
    }
    /* ③ ছাপার বান্ডল — PDF-এর শেষ পাতা */
    for (const [b, fx] of [['numerology-print', 'numerology'], ['kundali-print', 'kundali']]) {
      const s = fs.readFileSync(path.join(__dirname, '..', 'src/web-html', b + '.js'), 'utf8');
      let html = JSON.parse(s.slice(s.indexOf('"'), s.lastIndexOf('"') + 1));
      const raw = fs.readFileSync(path.join(__dirname, '__fixtures__/print', fx + '.json'), 'utf8');
      /* ⚠️ প্রথম রূপ কেবল "₹" খুঁজত, আর শেষ পাতায় দাম লেখা "দক্ষিণা: ৫০১/-" —
         তাই "দাম নেই" বলে সবুজ দিত (মিথ্যে সবুজ)। এখন আগে দেখা হয় দাম
         সত্যিই দৃশ্যমান ছিল, তারপর যে সেটা বদলেছে। */
      const count = async (withJs) => {
        const h = html.replace('<head>', () => `<head><script>window.__myaPrintData=${JSON.stringify(raw)};${withJs ? JS : ''}<\/script>`);
        const ctx = await br.newContext(); const pg = await ctx.newPage();
        await pg.setContent(h); await pg.waitForTimeout(6000);
        const r = await pg.evaluate((map) => {
          const num = s => parseInt(s.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/[,\s]/g, ''), 10);
          const t = document.body.innerText;
          const hits = [...t.matchAll(/₹\s?([০-৯0-9][০-৯0-9,]*)|([০-৯0-9][০-৯0-9,]*)\s?\/-/g)].filter(m => map[String(num(m[1] || m[2]))]).map(m => m[0]);
          return { hits, dollars: (t.match(/\$\d[\d.]*/g) || []) };
        }, MAP);
        await ctx.close(); return r;
      };
      const pre = await count(false), post = await count(true);
      if (!pre.hits.length) fail(`${b} — পরীক্ষা অর্থহীন: JS ছাড়াও কোনো দাম দেখা গেল না`);
      else if (post.hits.length) fail(`${b} — PDF-এ পণ্যের দাম রয়ে গেল: ${post.hits.join(' · ')}`);
      else ok(`${b} — আগে ${pre.hits.join(', ')} · এখন Play-দাম ${[...new Set(post.dollars)].join(', ')}`);
    }
  } finally { await br.close(); try { srv.kill(); } catch (e) {} }
  if (bad) { console.log(`\n✗ ${bad}টি সমস্যা`); process.exit(1); }
  console.log('\n✓ বিদেশি পাঠক পাতায় ও PDF-এ Play-র দামই দেখেন; ভারতীয় পাঠকের কিছু বদলায় না');
  process.exit(0);
})();
