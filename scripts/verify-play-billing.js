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

console.log(`\n${fail ? '❌' : '✅'} ${checks}টি পরীক্ষা, ${fail}টি সমস্যা`);
process.exit(fail ? 1 : 0);
