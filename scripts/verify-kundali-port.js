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
  return pg.evaluate(() => { try { _preparePayload(false); } catch (e) {}
    /* গুলিক, তার ফল, মান্দি ও প্রাণপদ — চারটিই (২০২৬-০৯-২৭) */
    const gr = ['gulika', 'gulikaPhal', 'mandi', 'pranapada'].map(c => { const t = document.querySelector('#panchangDetail tr[data-pg="' + c + '"] td:last-child'); return t ? t.textContent.trim() : null; });
    /* পঞ্চধা মৈত্রী চক্র (২০২৬-০৯-২৯) — পর্দায় আঁকা ছকটাই */
    const pd = document.querySelector('#panchadhaDiv table');
    return { yv: window._yvResult, pl: (window._kundaliPrintData || {}).yv, gul: gr.every(Boolean) ? gr.join(' | ') : null,
             pd: pd ? [...pd.querySelectorAll('tbody tr')].map(r => r.textContent.trim()).join(' / ') : null }; });
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
    /* ④ গুলিক লগ্ন (২০২৬-০৯-২৭) — বান্ডলে src/gulika.js ইনলাইন ও পাতার সারি, মান ওয়েবসাইটের সঙ্গে এক */
    if (!site.gul) fail('④ ওয়েবসাইটে গুলিকের সারি নেই — পরীক্ষাটাই ভাঙা');
    else if (site.gul !== app.gul) fail(`④ গুলিক: অ্যাপ "${app.gul}", ওয়েবসাইট "${site.gul}"`);
    /* ⑤ সাফল্যের পর্দা (২০২৬-০৯-২৯) — সহকর্মীর রায় ২০২৬-০৯-২০: ₹১৫০১-এ সফটওয়্যার-রিপোর্টের
       তাৎক্ষণিক বোতাম নয়, ₹৫০১-এ আছে। দুই দিকেই আসল ফাংশন চালিয়ে মেলানো হয়। */
    const succ = p => p.evaluate(() => {
      const r = {}; for (const [k, fn, id] of [['prm', '_prmShowSuccess', '_prmBody'], ['csp', '_cspShowSuccess', '_cspBody']]) {
        let el = document.getElementById(id); if (!el) { el = document.createElement('div'); el.id = id; document.body.appendChild(el); }
        try { window[fn]('t@example.com', 'https://wa.me/0'); r[k] = /_doPrint\(/.test(el.innerHTML); } catch (e) { r[k] = 'ERR ' + e.message; }
      } return r; });
    const ss = await succ(sp), as = await succ(ap);
    if (ss.prm !== true || ss.csp !== false) fail('⑤ ওয়েবসাইটের সাফল্য-পর্দা প্রত্যাশামতো নয় — পরীক্ষাটাই ভাঙা: ' + JSON.stringify(ss));
    else if (JSON.stringify(as) !== JSON.stringify(ss)) fail('⑤ সাফল্য-পর্দার বোতাম: অ্যাপ ' + JSON.stringify(as) + ', ওয়েবসাইট ' + JSON.stringify(ss) + ' (₹১৫০১-এ বোতাম থাকার কথা নয়)');
    /* ⑥ যোগের গ্রহবল (২০২৬-০৯-২৯) — সহকর্মীর রায় ২০২৬-০৮-১৭: "মাঙ্গলিক যোগের কারক মঙ্গল একাই"।
       বান্ডল বিবরণের লেখা ঘেঁটে গ্রহ খুঁজত, তাই মাঙ্গলিকে মঙ্গল+চন্দ্রের গড় হত। এখন যোগ নিজেই
       pls দেয়। ৫০০টি বীজ-বাঁধা এলোমেলো ছক ও ষড়বল, দুই পাতার নিজের ফাংশনে — নাম ও গ্রেড হুবহু এক। */
    const sweep = p => p.evaluate(() => {
      let x = 20260929; const rnd = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
      const N = ['সূর্য', 'চন্দ্র', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি', 'রাহু', 'কেতু'];
      const out = [];
      for (let t = 0; t < 500; t++) {
        const pl = N.map(n => ({ name: n, lon: rnd() * 360, speed: rnd() - 0.2 }));
        pl[8].lon = (pl[7].lon + 180) % 360;
        const sb = {}; N.slice(0, 7).forEach(n => { sb[n] = { totalRupa: (1 + rnd() * 3).toFixed(2) }; });
        try { out.push(detectAllYogas(pl, Math.floor(rnd() * 12)).map(y => { const g = _gradeYogaByShadbala(y, sb); return y.name + ':' + (g ? g.t + g.avg.toFixed(3) : '—'); }).join('|')); }
        catch (e) { out.push('ERR ' + e.message); }
      } return out; });
    const sw = await sweep(sp), aw = await sweep(ap);
    const diff = sw.map((v, i) => v === aw[i] ? -1 : i).filter(i => i >= 0);
    const manglik = sw.filter(v => /মাঙ্গলিক/.test(v)).length;
    if (sw.some(v => /^ERR/.test(v)) || manglik < 50) fail('⑥ ওয়েবসাইটের ঝাড়ু চলেনি বা মাঙ্গলিক খুব কম (' + manglik + ') — পরীক্ষাটাই ভাঙা');
    else if (diff.length) fail(`⑥ যোগের গ্রহবল ${diff.length}/৫০০ ছকে আলাদা — প্রথম: অ্যাপ "${aw[diff[0]].slice(0, 160)}" · সাইট "${sw[diff[0]].slice(0, 160)}"`);
    /* ⑦ পঞ্চধা মৈত্রী চক্র — পর্দার ৭×৭ ছক ওয়েবসাইটের সঙ্গে হুবহু */
    if (!site.pd || (site.pd.match(/ \/ /g) || []).length !== 6) fail('⑦ ওয়েবসাইটে পঞ্চধা চক্র নেই — পরীক্ষাটাই ভাঙা');
    else if (site.pd !== app.pd) fail(`⑦ পঞ্চধা চক্র: অ্যাপ "${String(app.pd).slice(0, 90)}", ওয়েবসাইট "${site.pd.slice(0, 90)}"`);
    if (errs.length) fail('বান্ডলে ত্রুটি: ' + errs[0]);
    if (!bad) console.log(`✓ ① প্রতিকার অ্যাপ = ওয়েবসাইট (${app.yv.items.length}টি), PDF-এ যায় · ② গণনা ছাড়া কেনা আটকায় · ③ _tzNearCity বসানো · ④ গুলিক "${app.gul}" = ওয়েবসাইট · ⑤ ₹১৫০১-এর সাফল্য-পর্দায় তাৎক্ষণিক বোতাম নেই · ⑥ ৫০০ ছকে যোগের গ্রহবল = ওয়েবসাইট · ⑦ পঞ্চধা চক্র = ওয়েবসাইট`);
  } finally { await br.close(); try { srv.kill(); } catch (e) {} }
  if (bad) { console.log(`\n✗ ${bad}টি সমস্যা`); process.exit(1); }
})();
