#!/usr/bin/env node
/*  Play Billing-এর পাহারা।
 *
 *  এখানে আসল পেমেন্ট চালানো যায় না (ডিভাইস, Play অ্যাকাউন্ট, লাইসেন্স-
 *  টেস্টার কিছুই নেই), তাই যা যাচাই করা **যায়** সেটাই করা হয় — আর
 *  ঠিক সেগুলোই যেগুলো ভুল হলে টাকা বা নিরাপত্তা যায়:
 *
 *   ① প্রোডাক্ট আইডি অ্যাপে ও সার্ভারে হুবহু এক — দুটো সরে গেলে পাঠক
 *      টাকা দিতেন আর সার্ভার বলত "অচেনা প্রোডাক্ট"।
 *   ② চাবিগুলো ওয়েবসাইটের pricing/config-এর চাবির সঙ্গে মেলে — নইলে
 *      একই জিনিস অ্যাপে ও সাইটে দুই দামে বিক্রি হতো।
 *   ③ Firestore-এ পাঠক নিজের অধিকার **লিখতে পারেন না** — পারলে যাচাইয়ের
 *      গোটা ব্যবস্থাটাই অর্থহীন।
 *   ④ সার্ভার যাচাইয়ের **পরে** অধিকার লেখে, আর consume করে (নইলে ৩ দিনে
 *      Google টাকা ফেরত দিয়ে দেয়)।
 *   ⑤ ক্লায়েন্ট লাইব্রেরিটা অলসভাবে লোড করে — static import দিলে
 *      লাইব্রেরিহীন বিল্ডে অ্যাপই চালু হতো না।
 *   ⑥ যাচাই ছাড়া কোথাও "কেনা হয়েছে" ধরা হয় না।
 *   ⑦ কেনার পরে জিনিসটা সত্যিই ডেলিভারি হয় — প্রতিটি প্রোডাক্টের
 *      আনলক-স্ক্রিপ্ট আছে, আর যেটার নেই তার জন্য টাকাই নেওয়া হয় না।
 *   ⑧ টাকা কাটার পরে ডেলিভারি আটকে গেলে সেটা মনে রাখা হয় — নইলে
 *      টাকা যেত আর জিনিসটা চিরতরে হারাত।
 */
const fs = require('fs');
const path = require('path');
const APP = path.resolve(__dirname, '..');

let checks = 0, fail = 0;
const ok  = m => { checks++; console.log('  \x1b[32m✓\x1b[0m ' + m); };
const bad = m => { checks++; fail++; console.log('  \x1b[31m✗\x1b[0m ' + m); };

const client = fs.readFileSync(path.join(APP, 'src/config/products.js'), 'utf8');
const server = fs.readFileSync(path.join(APP, 'functions/index.js'), 'utf8');
const rules  = fs.readFileSync(path.join(APP, 'firestore.rules'), 'utf8');
const bill   = fs.readFileSync(path.join(APP, 'src/utils/billing.js'), 'utf8');
const unlock = fs.readFileSync(path.join(APP, 'src/utils/billingUnlock.js'), 'utf8');
const bridge = fs.readFileSync(path.join(APP, 'src/utils/buyOnWebBridge.js'), 'utf8');
const pend   = fs.readFileSync(path.join(APP, 'src/utils/billingPending.js'), 'utf8');
const SITE   = '/home/user/services';

console.log('① প্রোডাক্ট আইডি — অ্যাপ ↔ সার্ভার');
{
  const cli = {};
  for (const m of client.matchAll(/(\w+):\s*\{\s*id:\s*'([^']+)'/g)) cli[m[2]] = m[1];
  const srv = {};
  const blk = server.slice(server.indexOf('const PLAY_PRODUCTS'), server.indexOf('exports.verifyPlayPurchase'));
  for (const m of blk.matchAll(/(\w+):\s*'(\w+)'/g)) srv[m[1]] = m[2];

  const cn = Object.keys(cli).length, sn = Object.keys(srv).length;
  if (!cn) bad('অ্যাপে কোনো প্রোডাক্ট আইডি পাওয়া গেল না');
  else if (cn !== sn) bad(`অ্যাপে ${cn}টি, সার্ভারে ${sn}টি প্রোডাক্ট — মিলছে না`);
  else {
    const diff = Object.keys(cli).filter(id => srv[id] !== cli[id]);
    if (!diff.length) ok(`${cn}টি প্রোডাক্ট আইডি ও চাবি দু'দিকে হুবহু এক`);
    else diff.forEach(id => bad(`${id} — অ্যাপে "${cli[id]}", সার্ভারে "${srv[id] || 'নেই'}"`));
  }
}

console.log('② চাবি ↔ ওয়েবসাইটের pricing/config');
{
  const SERVICES = process.env.SERVICES || '/home/user/services';
  if (!fs.existsSync(SERVICES)) ok('ওয়েবসাইট রিপো নেই — এই অংশ বাদ');
  else {
    const keys = new Set();
    const walk = d => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.isDirectory()) { if (!/^(node_modules|\.git|blog|utsab|rashifal|en|hi|news)$/.test(e.name)) walk(path.join(d, e.name)); }
        else if (/\.(html|js)$/.test(e.name)) {
          const s = fs.readFileSync(path.join(d, e.name), 'utf8');
          for (const m of s.matchAll(/MyaPricing\.get\('(\w+)'/g)) keys.add(m[1]);
        }
      }
    };
    walk(SERVICES);
    const ours = [...client.matchAll(/(\w+):\s*\{\s*id:/g)].map(m => m[1]);
    const missing = ours.filter(k => !keys.has(k));
    if (!keys.size) bad('ওয়েবসাইটে কোনো pricing চাবি পাওয়া গেল না — নিয়মটা বদলেছে?');
    else if (!missing.length) ok(`${ours.length}টি চাবিই ওয়েবসাইটের pricing/config-এ আছে`);
    else missing.forEach(k => bad(`"${k}" ওয়েবসাইটের pricing/config-এ নেই — দাম মিলবে না`));
  }
}

console.log('③ Firestore — পাঠক নিজের অধিকার লিখতে পারেন না');
{
  const m = rules.match(/match \/entitlements\/\{uid\}\/items\/\{orderId\} \{([\s\S]*?)\}/);
  if (!m) bad('entitlements-এর কোনো নিয়ম নেই — ডিফল্টে সব বন্ধ, কিন্তু ঘোষিত থাকা উচিত');
  else if (/allow write:\s*if false/.test(m[1])) ok('অধিকার লেখা ক্লায়েন্টের জন্য বন্ধ (কেবল সার্ভার লেখে)');
  else bad('ক্লায়েন্ট entitlements-এ লিখতে পারে — যাচাইয়ের ব্যবস্থাটাই অর্থহীন হয়ে যায়');
}

console.log('④ সার্ভারের যাচাই');
{
  const fn = server.slice(server.indexOf('exports.verifyPlayPurchase'));
  const need = [
    [/request\.auth/, 'সাইন-ইন না থাকলে ফিরিয়ে দেওয়া'],
    [/purchases\.products\.get/, 'Google-এর কাছে টোকেন যাচাই'],
    [/purchaseState !== 0/, 'purchaseState পরীক্ষা'],
    [/purchases\.products\.consume/, 'consume/acknowledge (নইলে ৩ দিনে টাকা ফেরত)'],
    [/collection\('entitlements'\)/, 'অধিকার Firestore-এ লেখা'],
    [/doc\(orderId\)/, 'orderId-ই ডকুমেন্টের নাম (একই ক্রয় দু\'বার গোনা যায় না)'],
  ];
  let n = 0;
  for (const [re, what] of need) { if (re.test(fn)) n++; else bad(`সার্ভারে নেই — ${what}`); }
  if (n === need.length) ok(`যাচাইয়ের ${n}টি ধাপই আছে`);

  const pkg = JSON.parse(fs.readFileSync(path.join(APP, 'functions/package.json'), 'utf8'));
  if (pkg.dependencies && pkg.dependencies.googleapis) ok('functions-এ googleapis নির্ভরতা বসানো');
  else bad('functions/package.json-এ googleapis নেই — ফাংশন চলবেই না');

  if (/PLAY_SA_KEY/.test(server) && /failed-precondition/.test(fn))
    ok('service-account কী না থাকলে স্পষ্ট ত্রুটি (নীরবে "কেনা হয়েছে" নয়)');
  else bad('কী না থাকলে কী হবে তা ঠিক করা নেই — যাচাই বন্ধ থাকলেও সব কেনা সফল দেখাতে পারে');
}

console.log('⑤ ক্লায়েন্ট — লাইব্রেরি অলসভাবে');
{
  if (/^import .*react-native-iap/m.test(bill))
    bad('react-native-iap static import — লাইব্রেরিহীন বিল্ডে অ্যাপ চালুই হবে না');
  else if (/require\('react-native-iap'\)/.test(bill) && /catch/.test(bill))
    ok('লাইব্রেরি try/catch-এ অলসভাবে লোড হয় (না থাকলে ওয়েবসাইটে পাঠানো চলবে)');
  else bad('লাইব্রেরি লোড করার নিরাপদ পথ পাওয়া গেল না');

  if (/isAvailable/.test(bill)) ok('isAvailable() আছে — ডাকা জায়গা আগে দেখে নিতে পারে');
  else bad('isAvailable() নেই — লাইব্রেরি না থাকলে কী হবে তা ডাকা জায়গা জানবে না');
}

console.log('⑥ যাচাই ছাড়া কিছু খোলা হয় না');
{
  const buyFn = bill.slice(bill.indexOf('export async function buy'), bill.indexOf('export async function flushPending'));
  const vAt = buyFn.indexOf('await verify(');
  const rAt = buyFn.indexOf('return res.data');
  if (vAt > 0 && rAt > vAt) ok('সার্ভার-যাচাইয়ের পরেই কেবল সফল বলা হয়');
  else bad('যাচাইয়ের আগেই সফল ধরা হচ্ছে — নকল ক্রয়ে রিপোর্ট খুলে যেত');

  if (/finishTransaction/.test(buyFn)) ok('ফোনের দিকের লেনদেনও শেষ করা হয়');
  else bad('finishTransaction নেই — একই ক্রয় বারবার ফিরে আসত');

  if (/flushPending/.test(bill)) ok('আটকে থাকা ক্রয় পরে শেষ করার ব্যবস্থা আছে');
  else bad('অ্যাপ বন্ধ হয়ে গেলে আটকে থাকা ক্রয় আর শেষ হতো না — টাকা ফেরত চলে যেত');
}

console.log('⑦ কেনার পরে ডেলিভারি');
{
  const keys = Object.keys(
    (() => { const o = {}; for (const m of client.matchAll(/(\w+):\s*\{\s*id:\s*'/g)) o[m[1]] = 1; return o; })()
  );
  const unl = [];
  for (const m of unlock.matchAll(/^  (\w+):\s*`/gm)) unl.push(m[1]);

  /* প্রতিটি আনলক-স্ক্রিপ্ট একটা সত্যিকারের প্রোডাক্টের হতে হবে — নইলে
     ওই এন্ট্রিটা কখনো চলত না, অথচ দেখে মনে হতো ডেলিভারি বসানো আছে। */
  const orphan = unl.filter(k => keys.indexOf(k) < 0);
  if (orphan.length) bad('আনলক আছে কিন্তু প্রোডাক্ট নেই: ' + orphan.join(', '));
  else ok(`${unl.length}টি আনলক-স্ক্রিপ্টের প্রতিটিই একটা সত্যিকারের প্রোডাক্টের`);

  const miss = keys.filter(k => unl.indexOf(k) < 0);
  if (miss.length) bad('প্রোডাক্ট আছে কিন্তু আনলক নেই: ' + miss.join(', ') + ' — টাকা নিয়ে ডেলিভারি করা যেত না');
  else ok(`${keys.length}টি প্রোডাক্টেরই আনলক-স্ক্রিপ্ট আছে`);

  /* ⛔ এটাই আসল শর্ত: আনলক না জানলে টাকা নেওয়াই হয় না। */
  if (/UNLOCK_JS\[product\]\s*&&\s*billing\.isAvailable\(\)/.test(bridge))
    ok('আনলক জানা না থাকলে Play Billing চালানোই হয় না — ব্রাউজারে যায়');
  else bad('আনলক না জেনেও টাকা নেওয়া হতে পারে — টাকা নিয়ে কিছু না দেওয়ার পথ খোলা');

  if (/openOnWeb\(msg\)/.test(bridge) && /export function handleBuyOnWeb/.test(bridge))
    ok('চেনা না গেলে আগের ব্রাউজার-পথটাই থাকে (বোতামটা মরা হয় না)');
  else bad('ফলব্যাক পথ নেই — অচেনা অবস্থায় বোতামটা কিছুই করত না');

  /* আনলকের ফাংশন-নামগুলো ওয়েবসাইটে সত্যিই আছে কি না। না থাকলে স্ক্রিপ্ট
     নীরবে কিছুই করত — টাকা কাটা হতো, পাতা চুপ থাকত। */
  const FN = {
    'kundali.html':      ['_showPdfBtn', 'myastro_kundali_paid', '_prmPid', '_prmOv', '_cspPid', '_cspOv'],
    'match-making.html': ['_doMatchPrint', 'myastro_match_paid'],
    'varshaphala.html':  ['vpClosePdfPay', '_vpPrint'],
    'result.html':       ['nuClosePdfPay', '_nuPrint'],
    'panjika.html':      ['closePdfPromo', '_doPrint'],
  };
  let gone = [];
  for (const f of Object.keys(FN)) {
    let src = '';
    try { src = fs.readFileSync(path.join(SITE, f), 'utf8'); } catch (e) { continue; }
    for (const n of FN[f]) if (src.indexOf(n) < 0) gone.push(f + ' → ' + n);
  }
  if (gone.length) bad('ওয়েবসাইটে আর নেই: ' + gone.join(', ') + ' — আনলক নীরবে কিছুই করত');
  else ok('আনলকের প্রতিটি নাম ওয়েবসাইটের পাতায় সত্যিই আছে');

  /* ⚠️ ওয়েবসাইটে থাকা মানেই অ্যাপে থাকা নয়। বাংলা পাঠক বান্ডল দেখেন
     (`web-html/*.js`), en/hi পাঠক লাইভ পাতা। বান্ডলগুলো হাতে-প্যাচ করা
     ও ওয়েবসাইটের চেয়ে পিছিয়ে — তাই দু'দিকেই আলাদা করে দেখা হয়।
     ⛔ নিচের দুটো **জানা ফাঁক**: বান্ডলে PDF কেনার যন্ত্রপাতিটাই নেই,
     তাই বাংলা অ্যাপে ওই দুটো বোতাম কখনো ওঠেই না (টাকা নেওয়ার ঝুঁকি
     নেই — জিনিসটা কেবল পাওয়া যায় না)। বান্ডল পোর্ট হলে এখান থেকে
     নাম দুটো তুলে দিতে হবে। */
  const OPEN_BUNDLE = { 'varshaphala.js': 1, 'result.js': 1 };
  const BFN = {
    'kundali.js':      FN['kundali.html'],
    'match-making.js': FN['match-making.html'],
    'varshaphala.js':  FN['varshaphala.html'],
    'result.js':       FN['result.html'],
    'panjika.js':      FN['panjika.html'],
  };
  let bmiss = [], bopen = [];
  for (const f of Object.keys(BFN)) {
    let src = '';
    try { src = fs.readFileSync(path.join(APP, 'src/web-html', f), 'utf8'); } catch (e) { continue; }
    const m = BFN[f].filter(n => src.indexOf(n) < 0);
    if (!m.length) continue;
    (OPEN_BUNDLE[f] ? bopen : bmiss).push(f + ' → ' + m.join(', '));
  }
  if (bmiss.length) bad('বান্ডলে নেই: ' + bmiss.join(' · ') + ' — বাংলা অ্যাপে টাকা নিয়ে কিছুই খুলত না');
  else ok('বান্ডলে যেগুলোর আনলক দরকার, তার প্রতিটি নামই আছে');
  for (const b of bopen) console.log('  \x1b[33m…\x1b[0m খোলা (জানা): ' + b + ' — বাংলা অ্যাপে ওই PDF কেনার পথ নেই');

  /* ওভারলে দুটোর CSS-এ opacity:0 — কেবল display বদলালে ক্রেতা ফাঁকা
     পর্দা দেখতেন। ওয়েবসাইটের handler দুটো ধাপই করে। */
  if (/style\.opacity\s*=\s*'1'/.test(unlock))
    ok('₹৫০১/₹১৫০১ ওভারলে display **ও** opacity — দুটোই তোলা হয়');
  else bad("ওভারলে কেবল display='flex' — opacity:0 থাকায় পর্দায় কিছুই দেখা যেত না");
}

console.log('⑧ টাকা কাটার পরে ডেলিভারি আটকালে');
{
  /* ⚠️ import লাইনেও `addPending` লেখা থাকে, তাই গোটা ফাইলে খোঁজা
     মিথ্যে সবুজ দেয় — উল্টো দিকে চালিয়ে সেটা ধরা পড়েছে। ডাকটা
     flushPending()-এর **ভিতরে** আছে কি না, সেটাই আসল প্রশ্ন। */
  const fp = bill.slice(bill.indexOf('export async function flushPending'),
                        bill.indexOf('export async function disconnect'));
  if (/await addPending\(/.test(fp))
    ok('উদ্ধার-করা ক্রয় "ডেলিভারি বাকি" হিসেবে জমা থাকে');
  else bad('উদ্ধার-করা ক্রয় consume হয়ে যেত অথচ পাঠক কিছুই পেতেন না');

  /* ⚠️ মন্তব্যগুলো বাদ — এই ফাইলের মন্তব্য বাংলায় লেখা এবং তাতে
     ফাংশনের নামই উদ্ধৃত থাকে, ফলে ক্রম-পরীক্ষা মন্তব্য পড়েই সবুজ
     দেখাত। উল্টো দিকে চালিয়ে ধরা পড়েছে। */
  const strip = x => x.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  const pb = strip(bridge.slice(bridge.indexOf('async function playBuy')));
  const eAt = pb.indexOf('ensureReady');
  const tAt = pb.indexOf('takePending');
  const bAt = pb.indexOf('billing.buy(');
  if (eAt > 0 && tAt > eAt && bAt > tAt)
    ok('ক্রম ঠিক: ensureReady → পাওনা মেটানো → তবেই নতুন করে টাকা');
  else bad('ক্রম ভুল — আগের আটকে থাকা ক্রয় উদ্ধারের আগেই টাকা কাটা হতো (দ্বিতীয় বার)');

  if (/\bpaid\b/.test(pb) && /addPending\(product\)/.test(pb))
    ok('টাকা কাটার পরে ডেলিভারি আটকালে পাওনা লেখা হয়, "আবার কিনুন" বলা হয় না');
  else bad('ডেলিভারি ব্যর্থ হলে পাঠককে আবার কিনতে বলা হতো — দু\'বার টাকা');

  if (/auth\.currentUser/.test(pb) && pb.indexOf('auth.currentUser') < bAt)
    ok('সাইন-ইন না থাকলে টাকা কাটার **আগেই** বলা হয়');
  else bad('সাইন-ইন ছাড়াই টাকা কাটা হতো, আর সার্ভার যাচাই করতে পারত না');

  if (/AsyncStorage/.test(pend) && /takePending/.test(pend))
    ok('পাওনার চিহ্ন ফোনে জমা থাকে (অ্যাপ বন্ধ হলেও হারায় না)');
  else bad('পাওনার চিহ্ন কেবল মেমরিতে — অ্যাপ বন্ধ হলেই টাকাটা হারাত');
}

/* ─── ⑨ কোন জিনিসটা কেনা হচ্ছে, সেই চিহ্নটা আটকে থাকে না তো ───
   একই পাতায় ₹১০১ · ₹৫০১ · ₹১৫০১ — তিনটে আলাদা দামের জিনিস। চিহ্নটা
   না মুছলে আগেরটাই রয়ে যায়, আর পরের বোতামে ভুল দামে টাকা কাটা হয়। */
{
  console.log('\n⑨ কোন জিনিস কেনা হচ্ছে — চিহ্নটা আটকে থাকে কি না');
  const noC = x => x.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  const ask = noC(bridge.slice(bridge.indexOf('function ask('),
                               bridge.indexOf("var MAIN=")));
  if (/__myaProduct\s*=\s*''/.test(ask))
    ok("ask() চিহ্নটা পড়ার পরেই মুছে দেয়");
  else bad("চিহ্নটা মোছা হয় না — ₹৫০১ বাতিল করে ₹১০১ চাপলে ₹৫০১ কাটা যেত");

  const tags = noC(bridge);
  for (const [fn, prod] of [['downloadPDF','kundaliPdf'], ['downloadMatchPDF','mmPdf'],
                            ['_prmStartPayment','premiumKundali'], ['_cspStartPayment','solutionKundali']]) {
    if (tags.includes("tag('" + fn + "','" + prod + "')"))
      ok(fn + ' → ' + prod + ' চিহ্নিত');
    else bad(fn + ' চিহ্নিত নয় — ask() অনুমানে চলত');
  }

  /* ⚠️ ওয়েবসাইটের দিকটাও দেখা: প্রোমো-যাচাইয়ের আগে _inApp() ফিরে গেলে
     অ্যাপে কোড লেখার ঘরটাই খোলে না। */
  for (const [f, promoMark] of [['kundali.html', '===_PROMO){_preparePayload()'],
                                ['match-making.html', '===_MM_PROMO){_doMatchPrint()']]) {
    const src = fs.readFileSync(path.join(SITE, f), 'utf8');
    const pAt = src.indexOf(promoMark);
    const gAt = src.indexOf('_inApp()){showToast(') >= 0
              ? src.indexOf('_inApp()){showToast(') : src.indexOf('if(_inApp()){\n');
    if (pAt > 0 && gAt > pAt) ok(f + ' — প্রোমো যাচাই অ্যাপ-পাহারার আগে');
    else bad(f + ' — অ্যাপে প্রোমো কোড লেখার ঘরই খোলে না');
  }
}

console.log(`\n${fail ? '❌' : '✅'} ${checks}টি পরীক্ষা, ${fail}টি সমস্যা`);
process.exit(fail ? 1 : 0);
