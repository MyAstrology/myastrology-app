#!/usr/bin/env node
/* অ্যাপের বাংলা কুণ্ডলী বান্ডলে ওয়েবসাইটের তিনটে জিনিস সত্যিই চলে কি না।

   কেন (২০২৬-০৯-২৫): check:sync দেখাল ওয়েবসাইটের কয়েকটা ফাংশন বান্ডলে নেই।
   তার তিনটে পাঠকের কাছে পৌঁছয়:
   ① _yvCompute — "বিশেষ প্রতিকার" (যোনি-বর্ণ)। বাংলা ছাপার বান্ডল ওটা আঁকে,
      কিন্তু কুণ্ডলী বান্ডল কখনো হিসাব করত না — অ্যাপে ₹১০১/₹৫০১ কেনা বাংলা
      ক্রেতার PDF-এ প্রতিকারের পাতাই থাকত না।
   ② _kHaveCalc — গণনা ছাড়া ₹৫০১/₹১৫০১ চাপলে সোজা Play-কেনায় যেত।
   ③ _tzNearCity — দেশের কোড না এলে পশ্চিমবঙ্গে বাংলাদেশ/নেপালের সময় বসত
      (applyPlace-এর ভিতরে, বাইরে থেকে ডাকা যায় না — তাই কেবল উপস্থিতি)।

   বান্ডল চালানো হয় ঠিক KundaliScreen-এর মতো (fixKundaliHtml সহ, নেট বন্ধ),
   আর ফল মেলানো হয় ../services-এর kundali.html-এর সঙ্গে, একই জন্মতথ্যে। */
const fs = require('fs'), path = require('path');
const { spawn } = require('child_process');
const SVC = path.resolve(__dirname, '..', '..', 'services');
const { chromium } = require(path.join(SVC, 'node_modules', '@playwright', 'test'));
const PW_EXE = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const PORT = 8983;

function bundleHtml() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'screens', 'KundaliScreen.js'), 'utf8');
  const a = src.indexOf('function fixKundaliHtml'), b = src.indexOf('\nasync function getKUri');
  const fix = new Function(src.slice(a, b) + ';return fixKundaliHtml;')();
  const s = fs.readFileSync(path.join(__dirname, '..', 'src', 'web-html', 'kundali.js'), 'utf8');
  const i = s.indexOf('export default ');
  return fix(JSON.parse(s.slice(i + 15).replace(/;\s*$/, '')));
}
async function calc(pg) {
  await pg.waitForFunction(() => typeof calculateFullKundali === 'function', null, { timeout: 20000 }).catch(() => {});
  await pg.evaluate(() => {
    const S = (id, v) => { const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); } };
    S('userName', 'Test'); S('dobDay', '15'); S('dobMonth', '8'); S('dobYear', '1990'); S('tobHour', '10'); S('tobMin', '30'); S('tobSec', '0');
    S('lat', '22.5726'); S('lon', '88.3639'); S('tzOffset', '5.5');
    const c = document.getElementById('citySearch'); if (c) c.value = 'Kolkata';
    calculateFullKundali();
  });
  await pg.waitForFunction(() => window._kResult && window._kResult.planets && window._yvResult !== undefined, null, { timeout: 30000 }).catch(() => {});
  return pg.evaluate(() => { try { _preparePayload(false); } catch (e) {} return { yv: window._yvResult, pl: (window._kundaliPrintData || {}).yv }; });
}

(async () => {
  let bad = 0; const fail = m => { bad++; console.log('❌ ' + m); };
  const html = bundleHtml();
  if (!/function _tzNearCity\(la,lo\)/.test(html) || !/target=_tzNearCity\(/.test(html)) fail('③ _tzNearCity বান্ডলে নেই বা applyPlace ডাকে না');
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: SVC, stdio: 'ignore' });
  process.on('exit', () => { try { srv.kill(); } catch (e) {} });
  await new Promise(r => setTimeout(r, 1200));
  const br = await chromium.launch({ executablePath: PW_EXE });
  try {
    const sp = await br.newPage();
    sp.on('dialog', d => d.dismiss().catch(() => {}));
    await sp.goto(`http://127.0.0.1:${PORT}/kundali.html`, { waitUntil: 'domcontentloaded' });
    await sp.waitForTimeout(3000);
    const site = await calc(sp);

    const ap = await br.newPage();
    const errs = []; ap.on('pageerror', e => errs.push(e.message));
    ap.on('dialog', d => d.dismiss().catch(() => {}));
    await ap.route(u => /^https?:/.test(u.href), r => r.abort());
    await ap.setContent(html, { waitUntil: 'domcontentloaded' });
    await ap.waitForTimeout(3000);
    /* ② আগে — গণনার আগেই কেনার বোতাম */
    const g = await ap.evaluate(() => {
      window.__m = []; window.ReactNativeWebView = { postMessage: m => window.__m.push(m) };
      try { localStorage.removeItem('_kLastCalc'); } catch (e) {}
      const t = []; const o = window.showToast; window.showToast = m => t.push(String(m));
      try { _prmStartPayment(); _cspStartPayment(); } catch (e) { t.push('ERR ' + e.message); }
      window.showToast = o; delete window.ReactNativeWebView;
      return t;
    });
    if (g.length !== 2 || g.some(m => /myastrology\.in|ERR/.test(m))) fail('② গণনা ছাড়া ₹৫০১/₹১৫০১ কেনায় পৌঁছয়: ' + JSON.stringify(g).slice(0, 160));
    const app = await calc(ap);
    if (!site.yv || !site.yv.items || !site.yv.items.length) fail('ওয়েবসাইটে প্রতিকার আসেনি — পরীক্ষাটাই ভাঙা');
    else if (JSON.stringify(site.yv) !== JSON.stringify(app.yv)) fail('① অ্যাপের প্রতিকার ওয়েবসাইটের সঙ্গে মেলে না');
    if (!app.pl || !app.pl.items) fail('① PDF-এর তথ্যে (payload.yv) প্রতিকার নেই');
    if (!/yv:\(window\._yvResult\|\|null\)[\s\S]*yv:\(window\._yvResult\|\|null\)/.test(html)) fail('① প্রিমিয়াম PDF-এর দুই snapshot-এ yv নেই');
    if (errs.length) fail('বান্ডলে ত্রুটি: ' + errs[0]);
    if (!bad) console.log(`✓ ① প্রতিকার অ্যাপ = ওয়েবসাইট (${app.yv.items.length}টি), PDF-এ যায় · ② গণনা ছাড়া কেনা আটকায় · ③ _tzNearCity বসানো`);
  } finally { await br.close(); }
  if (bad) { console.log(`\n✗ ${bad}টি সমস্যা`); process.exit(1); }
})();
