#!/usr/bin/env node
/* বাংলা অ্যাপের বর্ষফল PDF — পর্দা থেকে নয়, A4 ছাপার পাতা থেকে।

   কেন (২০২৬-০৯-২৫): বান্ডলের _vpPrint() ছিল কেবল window.print() — অর্থাৎ
   ক্যালকুলেটরের পর্দাটাই PDF হত (LocalWebView-এর PAGE_PRINT_JS): মলাট নেই,
   প্রতি পাতায় "JavaScript প্রয়োজন" লেখা, মাঝখানে ফাঁকা। সহকর্মী ₹৫১ দিয়ে
   ঠিক এটাই পেলেন। ওয়েবসাইট অনেক আগেই ছাপার পাতায় চলে গিয়েছিল; বান্ডলে
   পৌঁছয়নি (check:sync-এ _vpPrint "মেলে না" দেখাচ্ছিল)।

   যাচাই — বান্ডল হুবহু: গণনা → _vpPrint() → বান্ডলের window.open-সেতুর
   বার্তায় ছাপার তথ্য আছে (window.print ডাকা হয়নি) → সেই তথ্যে বাংলা ছাপার
   বান্ডল → makeCaptureJS → নেট ও JS ছাড়া আঁকলে মলাটসহ বহু পাতা, আর কোথাও
   "JavaScript প্রয়োজন" নেই। */
const fs = require('fs'), path = require('path'), vm = require('vm');
const SVC = path.resolve(__dirname, '..', '..', 'services');
const { chromium } = require(path.join(SVC, 'node_modules', '@playwright', 'test'));
const PW_EXE = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
function loadWP() {
  let src = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'webPrint.js'), 'utf8');
  src = src.replace(/^import .*;$/mg, '').replace(/^export (const|function|async function) /mg, '$1 ');
  src += '\nmodule.exports={withPrintData,makeCaptureJS};';
  const ctx = { module: { exports: {} }, JSON, Object, String, Promise, URL, setTimeout, clearTimeout, Set,
    getPriceMap: () => null, priceJS: () => '', FileSystem: {}, Print: {}, Sharing: {} };
  vm.runInNewContext(src, ctx); return ctx.module.exports;
}
function bundle(n) {
  const s = fs.readFileSync(path.join(__dirname, '..', 'src', 'web-html', n + '.js'), 'utf8');
  const i = s.indexOf('export default '); return JSON.parse(s.slice(i + 15).replace(/;\s*$/, ''));
}
(async () => {
  const W = loadWP(); let bad = 0; const fail = m => { bad++; console.log('❌ ' + m); };
  const br = await chromium.launch({ executablePath: PW_EXE });
  try {
    const pg = await br.newPage({ viewport: { width: 412, height: 900 } });
    pg.on('dialog', d => d.dismiss().catch(() => {}));
    await pg.route(u => /^https?:/.test(u.href), r => r.abort());
    await pg.setContent(bundle('varshaphala'), { waitUntil: 'domcontentloaded' });
    await pg.waitForFunction(() => typeof calculateVarshaphala === 'function', null, { timeout: 20000 }).catch(() => {});
    await pg.evaluate(() => {
      const S = (id, v) => { const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); } };
      S('userName', 'Test'); S('dobDay', '15'); S('dobMonth', '8'); S('dobYear', '1990'); S('tobHour', '10'); S('tobMin', '30');
      S('lat', '22.5726'); S('lon', '88.3639'); S('tzOffset', '5.5');
      const c = document.getElementById('citySearch'); if (c) c.value = 'Kolkata';
      calculateVarshaphala();
    });
    await pg.waitForFunction(() => { const r = document.getElementById('resultsArea'); return r && r.offsetParent !== null && (document.getElementById('lordPlanet') || {}).textContent; }, null, { timeout: 30000 }).catch(() => {});
    const r = await pg.evaluate(() => {
      window.__m = []; let printed = 0;
      window.ReactNativeWebView = { postMessage: m => window.__m.push(m) };
      window.print = () => { printed++; };
      _vpPrint();
      const open = window.__m.map(m => JSON.parse(m)).find(m => m.__rn === 'open');
      return { printed, open };
    });
    if (r.printed) fail('_vpPrint() এখনো পর্দাটাই ছাপে (window.print)');
    if (!r.open) { fail('window.open-সেতুর বার্তা আসেনি'); return; }
    let pay = null; try { pay = JSON.parse(r.open.raw); } catch (e) {}
    if (process.env.DBG) console.log(JSON.stringify(r.open).slice(0, 600));
    if (!/varshaphala-print/.test(r.open.url)) fail('ছাপার পাতা খোলা হয়নি: ' + r.open.url);
    if (!pay || !pay.person || !pay.lord || !pay.lord.planet || !pay.sections || !pay.sections.length) { fail('ছাপার তথ্য অসম্পূর্ণ'); return; }

    const html = W.withPrintData(bundle('varshaphala-print'), pay, 'bn');
    const pp = await br.newPage({ viewport: { width: 412, height: 900 } });
    await pp.route(u => /^https?:/.test(u.href), r => r.abort());
    await pp.setContent(html, { waitUntil: 'domcontentloaded' });
    await pp.evaluate(() => { window.__m = []; window.ReactNativeWebView = { postMessage: m => window.__m.push(m) }; });
    await pp.evaluate(W.makeCaptureJS('x', 8000));
    await pp.waitForFunction(() => { const ms = (window.__m || []).map(m => JSON.parse(m)).filter(m => m.__rn === 'x'); return ms.length && ms.length === ms[0].total; }, null, { timeout: 60000 }).catch(() => {});
    const out = await pp.evaluate(() => (window.__m || []).map(m => JSON.parse(m)).filter(m => m.__rn === 'x').sort((a, b) => a.i - b.i).map(m => m.chunk).join(''));
    if (!out) { fail('ছাপার পাতা capture হয়নি'); return; }
    /* expo-print-এর মতো: নেট নেই, JS নেই */
    const ctx = await br.newContext({ javaScriptEnabled: false });
    const o = await ctx.newPage(); await o.route(u => /^https?:/.test(u.href), r => r.abort());
    await o.setContent(out, { waitUntil: 'load' }); await o.emulateMedia({ media: 'print' });
    const txt = await o.evaluate(() => document.body.innerText);
    const pdf = await o.pdf({ width: '595px', height: '842px', printBackground: true });
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    if (/JavaScript প্রয়োজন/.test(txt)) fail('PDF-এ "JavaScript প্রয়োজন" লেখা');
    if (!/বর্ষফল কুণ্ডলী/.test(txt)) fail('মলাট নেই');
    if (pages < 6) fail(`মাত্র ${pages} পাতা`);
    if (process.argv[2]) fs.writeFileSync(process.argv[2], pdf);
    if (!bad) console.log(`✓ বাংলা বর্ষফল: _vpPrint → ছাপার পাতা (window.print নয়) · ${pay.sections.length}টি অধ্যায় · PDF ${pages} পাতা, মলাটসহ, "JavaScript প্রয়োজন" নেই`);
  } finally { await br.close(); }
  if (bad) { console.log(`\n✗ ${bad}টি সমস্যা`); process.exit(1); }
})();
