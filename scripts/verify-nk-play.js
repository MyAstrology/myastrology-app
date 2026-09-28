#!/usr/bin/env node
/* নামকরণ PDF ₹৫১ — অ্যাপে Play দিয়ে কেনা (২০২৬-০৯-২৮)
   বাংলা বান্ডলটা ওয়েবসাইটের পুরনো কপি; সেখানে "প্রিন্ট" সরাসরি window.print()।
   NamakaranScreen-এর NK_GATE_JS ক্লিকটা আগে ধরে Play-র কেনা তোলে, আর কেনার পরে
   UNLOCK_JS.namakaranPdf ছাপায়। আসল বান্ডল আর আসল স্ক্রিপ্ট-লেখা চালিয়ে দেখা হয়:
     ① গণনার আগে বোতাম → কেনা নয় (পুরনো পথ "আগে বিশ্লেষণ করুন" বলে)
     ② গণনার পরে বোতাম → Play-র কেনা (namakaranPdf), ছাপা নয়
     ③ কেনা সফল (UNLOCK_JS) → ছাপা একবার
     ④ একই সেশনে আবার বোতাম → সরাসরি ছাপা, আবার টাকা নয়
     ⑤ ওয়েবসাইটের লাইভ পাতা (en): নতুন অ্যাপ (__myaReplaced) → টাকার পর্দা;
        পুরনো অ্যাপ → বিনামূল্যে ছাপা, Razorpay কখনো নয়
   চালানো:  node scripts/verify-nk-play.js   (../services লাগে ⑤-এর জন্য) */
const fs = require('fs'), path = require('path'), http = require('http');
let chromium;
try { ({ chromium } = require('@playwright/test')); }
catch (e) { ({ chromium } = require(path.join(__dirname, '..', '..', 'services', 'node_modules', '@playwright/test'))); }
const APP = path.join(__dirname, '..'), SITE = path.join(APP, '..', 'services');

function decodeBundle(f) {
  const s = fs.readFileSync(f, 'utf8');
  return JSON.parse(s.slice(s.indexOf('"'), s.lastIndexOf('"') + 1));
}
function tpl(file, name) {
  const s = fs.readFileSync(file, 'utf8');
  const m = new RegExp('const ' + name + ' = `([\\s\\S]*?)`;').exec(s);
  if (!m) throw new Error(name + ' পাওয়া গেল না — ' + file);
  return m[1];
}
function unlockJs() {
  const s = fs.readFileSync(path.join(APP, 'src/utils/billingUnlock.js'), 'utf8');
  const i = s.indexOf('\n  namakaranPdf: `');
  if (i < 0) throw new Error('UNLOCK_JS.namakaranPdf নেই');
  const body = s.slice(s.indexOf('`', i) + 1, s.indexOf('`,', i));
  const PID = "var _pid='PLAY:'+(window.__myaPlayOrder||'');";
  return body.replace('${PID}', PID);
}

(async () => {
  let bad = 0, n = 0;
  const ok = (c, m) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + m); };
  const GATE = tpl(path.join(APP, 'src/screens/NamakaranScreen.js'), 'NK_GATE_JS');
  /* লেখা থাকা আর চলা এক নয় — পর্দার INJECTED_JS-এ জোড়া আছে কি না */
  ok(/const INJECTED_JS = [^\n]*\+ NK_GATE_JS;/.test(fs.readFileSync(path.join(APP, 'src/screens/NamakaranScreen.js'), 'utf8')),
     'NK_GATE_JS পর্দার INJECTED_JS-এ জোড়া');
  const UNLOCK = unlockJs();
  const html = decodeBundle(path.join(APP, 'src/web-html/namakaran.js'));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  try {
    console.log('বাংলা বান্ডল (অ্যাপ)');
    const pg = await b.newPage({ viewport: { width: 390, height: 800 } });
    await pg.route('**/*', r => r.request().url().startsWith('data:') ? r.continue() : r.abort());
    /* setContent-এ addInitScript চলে না — তাই নকল সেতুটা পাতার একেবারে শুরুতে বসানো */
    const STUB = '<script>window.__msgs=[];window.__printed=0;'
      + 'window.ReactNativeWebView={postMessage:function(m){window.__msgs.push(JSON.parse(m));}};'
      + 'window.print=function(){window.__printed++;};'
      /* buyOnWebBridge-এর openRzp → ask(''): চিহ্নটা (__myaProduct) পড়ে বার্তা পাঠায় */
      + "window.openRzp=function(){window.ReactNativeWebView.postMessage(JSON.stringify({__rn:'buyOnWeb',product:window.__myaProduct||''}));window.__myaProduct='';};"
      + '</script>';
    await pg.setContent(html.replace(/<head[^>]*>/i, m => m + STUB), { waitUntil: 'domcontentloaded' });
    await pg.evaluate(() => { window.print = function () { window.__printed++; }; });   /* পাতা নিজে বদলে থাকলে */
    /* পাতার নিজের openRzp আছে — অ্যাপে buyOnWebBridge লোডের পরে আবার বসায়, এখানেও তাই */
    await pg.evaluate(() => { window.openRzp = function () { window.ReactNativeWebView.postMessage(JSON.stringify({ __rn: 'buyOnWeb', product: window.__myaProduct || '' })); window.__myaProduct = ''; }; });
    await pg.evaluate(GATE);
    await pg.evaluate(GATE);   /* LocalWebView দু'বার ইনজেক্ট করে — দুবার ধরা চলবে না */
    const click = () => pg.evaluate(() => { const b = document.querySelector('.btn-share.prt'); b.click(); });
    const st = () => pg.evaluate(() => ({ m: window.__msgs.slice(), p: window.__printed }));

    let s0 = await st(); await click(); let s1 = await st();
    ok(s1.m.length === s0.m.length, '① গণনার আগে বোতাম → কেনা তোলা হয় না');

    await pg.evaluate(() => {
      const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
      set('childName', 'পরীক্ষা'); set('dobDay', '15'); set('dobMonth', '5'); set('dobYear', '2024');
      set('tobHour', '10'); set('tobMin', '30'); set('lat', '22.5726'); set('lon', '88.3639'); set('tzOffset', '5.5');
      if (typeof calculateNamakaran === 'function') calculateNamakaran();
    });
    await pg.waitForFunction(() => { const r = document.getElementById('resultSection'); return r && r.offsetParent !== null; }, null, { timeout: 30000 })
      .catch(() => {});
    const shown = await pg.evaluate(() => { const r = document.getElementById('resultSection'); return !!(r && r.offsetParent !== null); });
    ok(shown, 'বান্ডলে গণনা হলো (resultSection দেখা যায়)');

    s0 = await st(); await click(); s1 = await st();
    const last = s1.m[s1.m.length - 1];
    ok(s1.m.length === s0.m.length + 1 && last && last.product === 'namakaranPdf', '② গণনার পরে বোতাম → Play-র কেনা (namakaranPdf)');
    ok(s1.p === s0.p, '② কেনার আগে ছাপা হয় না');

    s0 = await st(); await pg.evaluate(UNLOCK); s1 = await st();
    ok(s1.p === s0.p + 1, '③ কেনা সফল → ছাপা একবার');

    s0 = await st(); await click(); s1 = await st();
    ok(s1.m.length === s0.m.length && s1.p === s0.p + 1, '④ একই সেশনে আবার → সরাসরি ছাপা, আবার টাকা নয়');
    await pg.close();

    /* ⑤ ওয়েবসাইটের লাইভ ইংরেজি পাতা, অ্যাপের ভিতরে */
    if (fs.existsSync(path.join(SITE, 'en', 'namakaran.html'))) {
      console.log('লাইভ পাতা (en) অ্যাপের ভিতরে');
      const srv = http.createServer((q, r) => {
        let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/index.html';
        let f = path.join(SITE, u); if (!path.extname(f) && fs.existsSync(f + '.html')) f += '.html';
        fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); }
          r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.js') ? 'application/javascript' : f.endsWith('.css') ? 'text/css' : 'application/octet-stream' }); r.end(d); });
      });
      await new Promise(res => srv.listen(8991, '127.0.0.1', res));
      for (const newApp of [true, false]) {
        const p2 = await b.newPage({ viewport: { width: 390, height: 800 } });
        await p2.route(r => !/^http:\/\/127\.0\.0\.1/.test(r.href), r => r.abort());
        await p2.addInitScript(() => {
          window.__opened = 0; window.__rzp = 0;
          window.ReactNativeWebView = { postMessage: function () {} };
          window.open = function () { window.__opened++; return null; };
          window.print = function () { window.__opened++; };
          window.Razorpay = function () { window.__rzp++; }; window.Razorpay.prototype.open = function () {};
        });
        await p2.goto('http://127.0.0.1:8991/en/namakaran?' + new URLSearchParams({ name: 'Test', dob: '2024-05-15', tob: '10:30', lat: '22.5726', lon: '88.3639', tz: '5.5', gender: 'male', auto: '1' }), { waitUntil: 'domcontentloaded' });
        await p2.waitForFunction(() => typeof _nkPrintPayload === 'function' && !!_nkPrintPayload(), null, { timeout: 60000 });
        if (newApp) await p2.evaluate(() => { const o = window.nkPayAndPrint; const w = function () {}; w.__myaReplaced = 1; window.nkPayAndPrint = w; });
        const r = await p2.evaluate(() => { nkOpenPdfPay();
          return { ov: document.getElementById('nkPayOverlay').classList.contains('open'), opened: window.__opened, rzp: window.__rzp }; });
        if (newApp) ok(r.ov && r.opened === 0, '⑤ নতুন অ্যাপ → টাকার পর্দা (Play), বিনামূল্যে ছাপা নয়');
        else ok(!r.ov && r.opened === 1 && r.rzp === 0, '⑤ পুরনো অ্যাপ → বিনামূল্যে ছাপা, Razorpay নয়');
        await p2.close();
      }
      srv.close();
    } else console.log('  ⚠️ ../services নেই — ⑤ বাদ');
  } finally { await b.close(); }
  console.log('');
  if (bad) { console.log(`❌ ${n}টি পরীক্ষা, ${bad}টি সমস্যা`); process.exit(1); }
  console.log(`✅ ${n}টি পরীক্ষা, 0টি সমস্যা`); process.exit(0);
})().catch(e => { console.log('✗ ' + (e && e.stack || e)); process.exit(1); });
