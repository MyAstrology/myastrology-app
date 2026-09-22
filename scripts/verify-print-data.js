#!/usr/bin/env node
/*  পাঁচটা ছাপার বান্ডল — তথ্য সত্যিই পৌঁছয় কি না, **চালিয়ে** দেখা।
 *
 *  ⛔ কেন দরকার: অ্যাপের লুকোনো WebView-এ localStorage ফাঁকা, তাই ছাপার
 *  পাতায় তথ্য পৌঁছত একটামাত্র স্ট্রিং-প্রতিস্থাপনের হাত ধরে। সাইটে ওই
 *  লাইনের একটা অক্ষর বদলালেই `replace()` **নীরবে** কিছুই করত না, আর PDF-এ
 *  থাকত কেবল মলাট, সূচিপত্র ও বিজ্ঞাপন — মাত্র চার পাতা (মালিকের অভিযোগ
 *  খ৭, ২০২৬-০৯-২১)। কোনো পার্স-পরীক্ষা এটা ধরতে পারে না।
 *
 *  এখানে বান্ডলটা ব্রাউজারে **localStorage বন্ধ করে** খোলা হয় — অর্থাৎ
 *  ঠিক অ্যাপের অবস্থা — আর দেখা হয় পাতাটা সত্যিই আঁকা হলো কি না।
 */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const APP = path.resolve(__dirname, '..');
const PORT = 8173;
let checks = 0, fail = 0;
const ok  = m => { checks++; console.log('  \x1b[32m✓\x1b[0m ' + m); };
const bad = m => { checks++; fail++; console.log('  \x1b[31m✗\x1b[0m ' + m); };

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

/* অ্যাপ ঠিক যেভাবে বসায় (src/utils/webPrint.js → withPrintData) */
function withPrintData(html, rawJson) {
  const safe = JSON.stringify(rawJson).replace(/</g, '\\u003c');
  return html.replace('<head>', () => `<head><script>window.__myaPrintData=${safe};<\/script>`);
}

/* ⚠️ নমুনা তথ্য নয় — সাইটের আসল ছাপার-তথ্য, যা services-এর
   scripts/fixtures-print/*.json-এ রাখা। না থাকলে পরীক্ষা **বাদ যায় না**,
   লাল হয় — নইলে fixture হারিয়ে গেলে পাহারাটাও নীরবে উধাও হতো। */
const FIX = path.join(APP, 'scripts', '__fixtures__', 'print');
const PAGES = [
  ['kundali-print',      'kundali.json'],
  ['match-making-print', 'match.json'],
  ['numerology-print',   'numerology.json'],
  ['varshaphala-print',  'varshaphala.json'],
  ['namakaran-print',    'namakaran.json'],
];

let PAGE_HTML = Object.create(null);
function serve() {
  return new Promise(r => {
    const s = http.createServer((q, p) => {
      const u = q.url.split('?')[0].replace(/^\//, '');
      if (PAGE_HTML[u] != null) {
        p.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
        return p.end(PAGE_HTML[u]);
      }
      p.writeHead(404); p.end();
    });
    s.listen(PORT, '127.0.0.1', () => r(s));
  });
}

(async () => {
  const cr = chromium();
  if (!cr) { console.log('⚠️  playwright নেই — বাদ'); process.exit(0); }
  if (!fs.existsSync(FIX)) { bad('ছাপার নমুনা-তথ্যের ফোল্ডার নেই: ' + path.relative(APP, FIX)); console.log(`\n❌ ${checks}টি পরীক্ষা, ${fail}টি সমস্যা`); process.exit(1); }

  for (const [name, fixture] of PAGES) {
    const fp = path.join(FIX, fixture);
    if (!fs.existsSync(fp)) { bad(`${name} — নমুনা-তথ্য নেই (${fixture})`); continue; }
    PAGE_HTML[name + '.html'] = withPrintData(decode(path.join(APP, 'src/web-html', name + '.js')), fs.readFileSync(fp, 'utf8'));
  }

  /* ⛔ ছাপার পাতায় কোনো ছবি নেট থেকে আসতে পারে না। PDF তৈরি হয়
     একটা লুকোনো WebView-এ, আর ছবি নামার আগেই সে পাতাটা ধরে ফেলতে
     পারে — লোগোর জায়গায় ফাঁকা বাক্স, আর ছবি শূন্য হলে পাশের লেখা
     সরে এসে ওভারল্যাপ দেখায় (মালিকের অভিযোগ খ২)। নেট না থাকলে
     তো কখনোই আসত না। */
  for (const [name] of PAGES) {
    const html = PAGE_HTML[name + '.html'];
    if (!html) continue;
    /* ⚠️ যে পথ চালানোর সময়ে জোড়া হয় (`src="'+esc(d.deity)+'"`) সেটা এখানে
       গোনা যায় না — ওগুলো withPrintData()-এর IMG_FIX_JS সামলায়।
       তাই সেই রক্ষীটা আছে কি না, সেটাও দেখা হয়। */
    const imgs = html.match(/<img[^>]+src="[^"]*"/g) || [];
    const remote = imgs.filter(t => /src="https?:\/\//.test(t)).length;
    const rel = imgs.filter(t => !/src="(?:data:|https?:)/.test(t) && !/'\s*\+/.test(t)).length;
    if (remote || rel) bad(`${name} — ${remote}টি নেট-ছবি, ${rel}টি আপেক্ষিক ছবি (স্থির ছবি base64 হওয়া দরকার)`);
    else ok(`${name} — পাতার স্থির ছবিগুলো বান্ডলের ভিতরে`);
  }

  {
    const wp = fs.readFileSync(path.join(APP, 'src/utils/webPrint.js'), 'utf8');
    const okFix = /IMG_FIX_JS/.test(wp) && /MutationObserver/.test(wp) && /myastrology\.in/.test(wp);
    const okWait = /__myaImgWait/.test(wp);
    if (okFix) ok('চালানোর সময়ে বসা ছবির মূল-পথ লাইভ সাইটে বদলে দেওয়া হয়');
    else bad('withPrintData()-এ IMG_FIX_JS নেই — `/gallery/…` ছবি অ্যাপে ফাঁকা বাক্স হয়ে যাবে');
    if (okWait) ok('ছবি নামা শেষ না হলে PDF ধরা হয় না');
    else bad('makeCaptureJS ছবির জন্য অপেক্ষা করে না — অর্ধেক-আঁকা পাতা ছাপা পড়তে পারে');
  }

  /* ⛔ PDF-এর গোটা যন্ত্রপাতি তৈরি থাকা সত্ত্বেও নামকরণে একটাই CSS
     লাইন যে বোতামটা ওদের ডাকে সেটাই লুকিয়ে রেখেছিল — অর্থাৎ পাঠক
     কখনো PDF-এ পৌঁছতেই পারতেন না (মালিকের অভিযোগ খ৮)। কোনো পার্স
     বা রানটাইম পরীক্ষা এটা ধরতে পারত না। */
  {
    const dir = path.join(APP, 'src', 'screens');
    let checked = 0, hidden = 0;
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      if (!/onPrint=\{/.test(src)) continue;
      checked++;
      /* রুল-ধরে দেখা: যে রুল .prt বাছে আর display:none বসায় */
      for (const m of src.matchAll(/([^{}\n]*\.prt[^{}]*)\{([^}]*)\}/g)) {
        if (/display\s*:\s*none/.test(m[2])) {
          bad(`${f} — CSS প্রিন্ট-বোতাম লুকিয়ে রাখে (অথচ পর্দাটা onPrint দেয়): ${m[1].trim().slice(0, 60)}`);
          hidden++;
        }
      }
    }
    if (!checked) bad('onPrint দেয় এমন কোনো পর্দাই পাওয়া গেল না');
    else if (!hidden) ok(`${checked}টি ছাপার পর্দার কোনোটাতেই PDF-বোতাম লুকোনো নয়`);
  }

  const srv = await serve();
  const br = await cr.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  for (const [name] of PAGES) {
    if (!PAGE_HTML[name + '.html']) continue;
    const ctx = await br.newContext({ viewport: { width: 820, height: 1200 } });
    const page = await ctx.newPage();
    /* ⛔ localStorage বন্ধ — ঠিক অ্যাপের লুকোনো WebView-এর মতো।
       না করলে পরীক্ষা ব্রাউজারের নিজের খাতা থেকে পড়ে সবুজ দেখাত। */
    await page.addInitScript(() => {
      try {
        Object.defineProperty(window, 'localStorage', {
          configurable: true,
          get() { throw new Error('localStorage বন্ধ (অ্যাপের মতো)'); },
        });
      } catch (e) {}
    });
    const errs = [];
    page.on('pageerror', e => errs.push(String((e && e.message) || e)));
    await page.goto(`http://127.0.0.1:${PORT}/${name}.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4500);
    const got = await page.evaluate(() => {
      const root = document.getElementById('printRoot');
      return {
        root: root ? root.innerHTML.length : -1,
        h: document.body.scrollHeight,
        txt: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 90),
      };
    });
    /* ⚠️ "পাতা আঁকা হয়েছে" মাপতে উচ্চতা যথেষ্ট নয় — মলাট+সূচিপত্র+
       বিজ্ঞাপনের ফাঁকা PDF-ও লম্বা। তাই printRoot-এর ভিতরের আকারই মাপা। */
    if (got.root < 20000) bad(`${name} — তথ্য পৌঁছয়নি (printRoot ${got.root} অক্ষর) · ${got.txt}`);
    else ok(`${name} — localStorage ছাড়াই পুরো রিপোর্ট আঁকা হলো (${Math.round(got.root/1024)} KB)`);
    if (errs.length) bad(`${name} — JS ত্রুটি: ${errs[0].slice(0, 90)}`);
    await ctx.close();
  }
  await br.close(); srv.close();
  console.log(`\n${fail ? '❌' : '✅'} ${checks}টি পরীক্ষা, ${fail}টি সমস্যা`);
  process.exit(fail ? 1 : 0);
})();
