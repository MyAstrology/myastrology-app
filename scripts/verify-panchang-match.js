#!/usr/bin/env node
/*  হোম কার্ডের পঞ্চাঙ্গ = পঞ্জিকা পাতার পঞ্চাঙ্গ।  npm run verify-panchang-match
 *  ═══════════════════════════════════════════════════════════════
 *  ⛔ ২০২৬-০৯-০৮ — সহকর্মী ধরিয়ে দেন হোম স্ক্রিন আর পঞ্জিকা স্ক্রিন একই
 *  দিনে আলাদা শেষ-সময় দেখাচ্ছে। নাম দুটোই এক ছিল, তাই চোখে পড়ত কেবল
 *  মিনিটে — কিন্তু জ্যোতিষীর কাছে এক অ্যাপের দুই পর্দায় দুই সময় ছোট
 *  ব্যাপার নয়।
 *
 *  এই পরীক্ষা হোমের ইঞ্জিনকে **ওয়েবসাইটের পঞ্জিকা পাতার নিজের কোডের**
 *  সঙ্গে মেলায় — panjika.html থেকে ফাংশনগুলো কেটে নিয়ে vm-এ চালিয়ে।
 *  নিজের লেখা কোনো "প্রত্যাশিত মান" নেই, তাই ভুল সূত্র লিখে সবুজ পাওয়ার
 *  সুযোগও নেই (প্রথম চেষ্টায় ঠিক সেটাই হয়েছিল: দুই দিকেই একই ভুল JD
 *  বসিয়ে "০ অমিল" দেখাচ্ছিল, অথচ গোটা হিসাব ১২ ঘণ্টা সরে ছিল)।
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
process.env.TZ = 'Asia/Kolkata';
const APP = path.resolve(__dirname, '..');
const SITE = process.env.SERVICES || '/home/user/services';
if (!fs.existsSync(SITE)) { console.log('ℹ️  ওয়েবসাইট রিপো নেই — যাচাই বাদ।'); process.exit(0); }

/* ── অ্যাপের ESM মডিউল CJS-এ চালানো ── */
const cache = {};
function loadApp(rel) {
  if (cache[rel]) return cache[rel];
  const file = path.join(APP, rel);
  let src = fs.readFileSync(file, 'utf8');
  const exp = [];
  src = src.replace(/^import\s+(\w+)\s+from\s+'([^']+)';?$/gm,
    (_, n, p) => `const ${n} = __req(${JSON.stringify(p)});`);
  src = src.replace(/^import\s+\{([^}]+)\}\s+from\s+'([^']+)';?$/gm,
    (_, names, p) => `const {${names}} = __req(${JSON.stringify(p)});`);
  src = src.replace(/^export\s+(function|const|let)\s+(\w+)/gm, (_, k, n) => { exp.push(n); return k + ' ' + n; });
  /* ⚠️ শুধু ESM-এ export থাকলেই বসানো — নইলে panjika-pd.js-এর নিজের
     `module.exports = PD` মুছে যেত আর PD খালি অবজেক্ট হতো। */
  if (exp.length) src += '\nmodule.exports={' + exp.join(',') + '};';
  const dir = path.dirname(file);
  const m = { exports: {} };
  const __req = (p) => {
    if (p.startsWith('.')) {
      let r = path.relative(APP, path.resolve(dir, p));
      if (!/\.js$/.test(r)) r += '.js';
      return loadApp(r);
    }
    return require(p);
  };
  new Function('module', 'exports', '__req', src)(m, m.exports, __req);
  cache[rel] = m.exports;
  return m.exports;
}

/* ── ওয়েবসাইটের পঞ্জিকা পাতার নিজের কোড ── */
const page = fs.readFileSync(path.join(SITE, 'panjika.html'), 'utf8');
const ctx = { console: { log() {}, warn() {}, error() {} }, Math, Date, JSON, isNaN, parseInt, parseFloat, String, Number, Array, Object };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(SITE, 'src/panjika-pd.js'), 'utf8'), ctx);
vm.runInContext('var TZ=5.5;' + page.match(/function JD\(y,m,d\)\{[^\n]*\}/)[0]
  + 'function fmtTSec(h){return h;}function _pj(k,c,f){return f();}'
  + 'function moonL(){return 0}function _vsopSunL(){return 0}function lahiriAY(){return 0}var KARANS=[];', ctx);
vm.runInContext(page.slice(page.indexOf('function _pdInRange(jd){'), page.indexOf('function _buildList(')), ctx);
const JDsite = vm.runInContext('JD', ctx);
const findTrans = vm.runInContext('_findTrans', ctx);
const SITE_IDX = {
  tithi: vm.runInContext('_getTithiIdx', ctx), nakshatra: vm.runInContext('_getNakIdx', ctx),
  yoga: vm.runInContext('_getYogaIdx', ctx), karana: vm.runInContext('_getKaranNum', ctx),
};

/* ⚠️ হোমের পঞ্চাঙ্গ এখন এই সারণীর উপর দাঁড়িয়ে — ওয়েবসাইটের ফাইল থেকে
   সরে গেলে দুই পর্দায় আবার দুই সময় ফিরবে, আর কেউ টেরও পাবে না। */
{
  const a = fs.readFileSync(path.join(APP, 'src/engine/panjika-pd.js'), 'utf8')
    .replace(/^\/\/[^\n]*\n/gm, '').replace(/module\.exports\s*=\s*PD;\s*$/, '').trim();
  const w = fs.readFileSync(path.join(SITE, 'src/panjika-pd.js'), 'utf8').trim();
  if (a !== w) {
    console.log('❌ src/engine/panjika-pd.js ওয়েবসাইটের থেকে সরে গেছে ('
      + a.length + ' বনাম ' + w.length + ') — `npm run build-panjika-pd` চালান');
    process.exit(1);
  }
  console.log('① PD সারণী ওয়েবসাইটের সঙ্গে হুবহু');
}
const PD = loadApp('src/engine/panjika-pd.js');
const { getPanchangForDate } = loadApp('src/engine/panchang_full.js');
const NAMES = loadApp('src/engine/panjika_trans.js');

const pad = n => String(n).padStart(2, '0');
const hm = h => h == null ? null
  : pad(Math.floor(((h % 24) + 24) % 24)) + ':' + pad(Math.floor(((((h % 24) + 24) % 24) % 1) * 60));

let n = 0, bad = 0, shown = 0;
for (let k = 0; k < 90; k++) {
  const dt = new Date(Date.UTC(2026, 8, 8) + k * 86400000);
  const y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
  const nd = new Date(dt.getTime() + 86400000);
  const st = PD.sunTimes(y, m, d), sn = PD.sunTimes(nd.getUTCFullYear(), nd.getUTCMonth() + 1, nd.getUTCDate());
  if (!st || !sn) continue;
  const iso = `${y}-${pad(m)}-${pad(d)}`;
  const app = getPanchangForDate(iso);
  if (!app) continue;
  const jdRise = JDsite(y, m, d) + (st.rise - 5.5) / 24;
  const jdNext = JDsite(nd.getUTCFullYear(), nd.getUTCMonth() + 1, nd.getUTCDate()) + (sn.rise - 5.5) / 24;
  for (const [key, appEnd] of [['tithi', app.tithiEnd], ['nakshatra', app.nakshatraEnd],
                               ['yoga', app.yogaEnd], ['karana', app.karanaEnd]]) {
    const f = SITE_IDX[key];
    const tr = findTrans(jdRise, jdNext, f, y, m, d);
    const want = tr.length ? hm(tr[0].localH) : null;
    n++;
    if (want && appEnd !== want) {
      bad++;
      if (shown++ < 8) console.log(`❌ ${iso} ${key}: হোম ${appEnd} · পঞ্জিকা ${want}`);
    }
  }
}
console.log(bad ? `\n❌ ${n}টি তুলনায় ${bad}টি অমিল` : `\n✓ ${n}টি তুলনা (৯০ দিন × ৪) — হোম ও পঞ্জিকা হুবহু এক`);
process.exit(bad ? 1 : 0);
