#!/usr/bin/env node
/*  src/i18n/terms.js তৈরি করে — হাতে লেখা হয় না।
 *
 *  কেন: জ্যোতিষের নাম (তিথি, নক্ষত্র, যোগ, করণ, রাশি, রত্ন, দিক) ওয়েবসাইটের
 *  অভিধানে আগে থেকেই আছে ও যাচাই করা। এখানে আবার টাইপ করলে সেটা দ্বিতীয় কপি —
 *  একদিন অ্যাপে এক বানান আর সাইটে অন্য বানান দেখাত। তাই নামগুলো
 *  services/i18n/{en,hi}/*.json থেকেই পড়া হয়।
 *
 *  চালানো:  SERVICES=/path/to/services node scripts/build-app-terms.js
 */
const fs = require('fs');
const path = require('path');

const SERVICES = process.env.SERVICES || '/home/user/services';
const APP = path.resolve(__dirname, '..');
const { BN_G, strip } = require('./bn-scan.js');

if (!fs.existsSync(path.join(SERVICES, 'i18n', 'en', 'terms.json'))) {
  console.error('✗ ওয়েবসাইট রিপো পাওয়া যায়নি: ' + SERVICES +
    '\n  SERVICES=/path/to/services দিয়ে আবার চালান।');
  process.exit(1);
}

/* NFC ড়/ঢ়/য় জোড়া লাগায় না (composition exclusion) — হাতে জুড়তে হয়,
   আর তালিকাটা কোডপয়েন্টে, নইলে ফাইলেই ভাঙা রূপ বসে গিয়ে নীরবে কিছুই হয় না। */
const norm = s => s.normalize('NFC')
  .replace(/ড়/g, 'ড়')
  .replace(/ঢ়/g, 'ঢ়')
  .replace(/য়/g, 'য়');

/* ওয়েবসাইটের সব অভিধান এক সূচিতে। _unused-ও পড়া হয় — i18n-extract ওখানে
   নামিয়ে রাখে যেসব লেখা এখন পাতায় নেই, কিন্তু অনুবাদটা ঠিকই আছে। */
function loadIndex(lang) {
  const dir = path.join(SERVICES, 'i18n', lang);
  const map = Object.create(null);
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    let o;
    try { o = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { continue; }
    for (const bag of [o.strings, o._unused]) {
      if (!bag || typeof bag !== 'object') continue;
      for (const k in bag) {
        const v = bag[k];
        if (typeof v === 'string' && v && !map[norm(k)]) map[norm(k)] = v;
      }
    }
  }
  return map;
}

/* এক বানান সাইটে, অন্য বানান অ্যাপে — জোড়াগুলো নাম ধরে লেখা, যাতে কেউ
   পরে "ঠিক" করতে গিয়ে দুটোকে আলাদা অনুবাদ না দিয়ে বসেন। */
const ALIAS = {
  'প্রতিপদা': 'প্রতিপদ',      // একই তিথি, দুই বানান
  'বিষ্কম্ভ': 'বিষ্কুম্ভ',    // একই যোগ
  'মুক্তো'  : 'মুক্তা',       // একই রত্ন
};

const en = loadIndex('en');
const hi = loadIndex('hi');

/* বানানের ছোট ফারাক (ফাঁকা জায়গা, বন্ধনী, স্ল্যাশ) — যেমন অ্যাপে
   "কালী পূজা", সাইটে "কালীপূজা"। ঢিলে চাবি **একটিমাত্র** সাইট-চাবিতে মিললে
   তবেই নেওয়া হয়; একাধিকে মিললে ছেড়ে দেওয়া হয়, নইলে ভুল অনুবাদ বসে যেত। */
const looseKey = s => norm(s).replace(/[\s\/()\u00b7\u2014\-,.\u0964]/g, '');
const looseIdx = Object.create(null);
for (const k in en) {
  const lk = looseKey(k);
  (looseIdx[lk] = looseIdx[lk] || []).push(k);
}
function lookup(s) {
  const k = ALIAS[s] ? norm(ALIAS[s]) : norm(s);
  if (en[k] && hi[k]) return { en: en[k], hi: hi[k] };
  const c = looseIdx[looseKey(s)];
  if (c && c.length === 1 && en[c[0]] && hi[c[0]]) return { en: en[c[0]], hi: hi[c[0]] };
  return null;
}

/* অ্যাপের কোডে থাকা প্রতিটি বাংলা স্ট্রিং-লিটারেল */
/* i18n/ নিজেই অনুবাদের যন্ত্রপাতি — ওর ভিতরের বাংলা (ড়/ঢ়/য়
   জোড়ার তালিকা, মন্তব্য) পাঠকের লেখা নয়। */
const SKIP_DIR = new Set(['web-html', 'i18n']);
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIR.has(e.name)) walk(path.join(d, e.name)); }
    /* terms.js নিজেই এই স্ক্রিপ্টের আউটপুট — পড়লে নিজের লেখা চাবিই
       আবার "উৎস" হিসেবে গোনা হতো (আর সংখ্যাটা প্রতিবার বাড়ত)। */
    else if (e.name.endsWith('.js')) files.push(path.join(d, e.name));
  }
})(path.join(APP, 'src'));

const LIT = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
/* ⚠️ স্ট্রিং-লিটারেল একাই যথেষ্ট নয় — JSX-এর ভিতরের লেখা
   (<Text>অ্যাকাউন্ট</Text>) কোনো কোট ছাড়াই বসে, তাই প্রথম মাপে ৪৬টা
   লাইন চোখের বাইরে ছিল। দুটো আকৃতিই পড়া হয়। */
const JSXTXT = /}?>([^<>{}\n]*)</g;
const seen = new Set();
for (const f of files) {
  const src = strip(fs.readFileSync(f, 'utf8'));
  let m;
  /* ⛔ পুরো ফাইল একবারে স্ক্যান করলে একটামাত্র বেজোড় উদ্ধৃতি-চিহ্ন
     (বাংলা লেখার ভিতরের অ্যাপোস্ট্রফি) বাকি ফাইলের পার্সিং সরিয়ে দেয় —
     verify-app-i18n-এ মেপে ধরা পড়েছে। লাইন ধরে স্ক্যান করলে ক্ষতি ওই
     লাইনটুকুতেই থামে। দুটো পাসের মিলন নেওয়া হয়, যাতে আগে যা ধরা পড়ত
     তার একটাও না হারায়। */
  const chunks = [src].concat(src.split('\n'));
  for (const chunk of chunks) {
  LIT.lastIndex = 0;
  while ((m = LIT.exec(chunk))) {
    const s = m[2];
    /* বড় CSS/JS ব্লব বা মার্কআপ বাদ — ওগুলো পাঠকের লেখা নয় */
    if (s.length > 140 || /[\n{<]/.test(s)) continue;
    BN_G.lastIndex = 0;
    if (BN_G.test(s)) seen.add(s.trim());
  }
  }

  while ((m = JSXTXT.exec(src))) {
    const s = m[1].trim();
    if (!s || s.length > 140) continue;
    BN_G.lastIndex = 0;
    if (BN_G.test(s)) seen.add(s);
  }

  /*  ⛔ বহু-লাইনে লেখা JSX টেক্সট — `<Text …>` আর লেখাটা আলাদা লাইনে।
      উপরের JSXTXT-এ `\n` বাদ দেওয়া আছে, তাই এই আকৃতিটা সে **দেখতেই
      পেত না**। মেপে: চারটি এমন লেখা আছে, আর নতুন একটা যোগ করার পরেও
      পরীক্ষা সবুজ থাকছিল — অর্থাৎ নতুন লেখা নীরবে অনূদিত না-হয়ে যেত। */
  const JSXML = />\s*\n\s*([^<>{}]+?)\s*\n\s*</g;
  JSXML.lastIndex = 0;
  while ((m = JSXML.exec(src))) {
    const v = m[1].trim();
    if (!v || v.length > 140 || /[\n]/.test(v)) continue;
    BN_G.lastIndex = 0;
    if (BN_G.test(v)) seen.add(v);
  }
}

const found = {}, missing = [];
for (const s of [...seen].sort()) {
  if (!s) continue;
  const hit = lookup(s);
  if (hit) found[s] = hit;
  else missing.push(s);
}

const header = `/*  স্বয়ংক্রিয়ভাবে তৈরি — হাতে সম্পাদনা করবেন না।
 *  উৎস: myastrology/services → i18n/{en,hi}/*.json
 *  আবার তৈরি করতে:  node scripts/build-app-terms.js
 *
 *  এখানে কেবল সেই নামগুলো আছে যেগুলোর অনুবাদ ওয়েবসাইটের অভিধানে
 *  ইতিমধ্যেই আছে ও যাচাই করা — একটিও নতুন করে লেখা হয়নি।
 *  চাবি বাংলা লেখাটাই, তাই চাবি না মিললে বাংলাটাই দেখা যায় — কখনো ফাঁকা নয়।
 */
`;
const body = 'export const TERMS = ' + JSON.stringify(found, null, 2) + ';\n';
fs.writeFileSync(path.join(APP, 'src', 'i18n', 'terms.js'), header + body);

console.log('terms.js লেখা হলো — অভিধান থেকে পাওয়া: ' + Object.keys(found).length +
  ' · হাতে অনুবাদ লাগবে: ' + missing.length);
fs.writeFileSync('/tmp/app-i18n-missing.json', JSON.stringify(missing, null, 1));
console.log('বাকিগুলোর তালিকা: /tmp/app-i18n-missing.json');
