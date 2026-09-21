#!/usr/bin/env node
/* উৎসবের তারিখের সারণি — ওয়েবসাইটের নিজের পঞ্জিকা-ইঞ্জিন থেকে।
 *
 * ⛔ কেন দরকার (মেপে ধরা, ২০২৬-০৯-২১): অ্যাপের `bengali_festivals.js`
 * মাস-নির্ভর উৎসবগুলো **সৌর** বাংলা মাস ধরে বাছত (আশ্বিন = ১৭ সেপ্টে–
 * ১৬ অক্টো ২০২৬), অথচ দুর্গাপূজা হয় **চান্দ্র** আশ্বিনে। ফলে ২১
 * সেপ্টেম্বরে "বিজয়া দশমী" দেখাত, আর আসল দিনে (২১ অক্টোবর) কিছুই
 * দেখাত না — গোটা ব্লকটাই এক মাস সরে ছিল।
 *
 * এখানে নতুন কোনো তিথি-গণনা লেখা হয়নি। ওয়েবসাইটের
 * `src/content/utsab/utsab-dates.js` — যেটি ছাপা পঞ্জিকার বিরুদ্ধে
 * যাচাই করা — সেটিই চালিয়ে তারিখগুলো তুলে আনা হয়। দুই জায়গায় দু'রকম
 * নিয়ম রাখলে অ্যাপ আর সাইট আলাদা দিন দেখাত।
 */
const fs = require('fs');
const path = require('path');

const SERVICES = process.env.SERVICES || '/home/user/services';
const FROM = 2025, TO = 2032;   // PD সারণির মতোই সীমা

const { festivalsForYear } = require(
  path.join(SERVICES, 'src/content/utsab/utsab-dates.js'));

const byDate = {};
for (let y = FROM; y <= TO; y++) {
  const list = festivalsForYear(y);
  for (const name of Object.keys(list))
    for (const iso of list[name]) (byDate[iso] = byDate[iso] || []).push(name);
  process.stderr.write('  ' + y + ' ✓\n');
}

/* ছবির নকশাও ওয়েবসাইট থেকেই — নামগুলো এখন ওয়েবসাইটের,
   তাই অ্যাপের পুরনো NAME_IMAGE ওগুলো চিনত না। অ্যাপে যে ছবিগুলো
   সত্যি আছে (panjika-images.js) কেবল সেগুলোই রাখা হয় — নইলে require() ভাঙত। */
const pj = fs.readFileSync(path.join(SERVICES, 'panjika.html'), 'utf8');
const have = new Set();
for (const m of fs.readFileSync(path.join(__dirname, '..', 'src', 'engine', 'panjika-images.js'), 'utf8')
       .matchAll(/'([A-Za-z0-9._-]+)':\s*require/g)) have.add(m[1]);
const images = {};
for (const m of pj.matchAll(/"([^"]+)":\s*"panjika\/([A-Za-z0-9._-]+)\.webp"/g))
  if (have.has(m[2])) images[m[1]] = m[2];
/* ওয়েবসাইটের নকশায় যে ছবিগুলো অ্যাপে নেই, অথচ অ্যাপের নিজের একটা
   ছবি ওই উৎসবের জন্যে আগে থেকেই ছিল — সেগুলো নাম বদলে যেন হারিয়ে না যায়।
   হাতে লেখা, কিন্তু প্রতিটি চাবি নিচে যাচাই করা হয় — না থাকলে বিল্ড থামে। */
const EXTRA = {
  'মহাষষ্ঠী': 'Durga-Puja', 'মহাসপ্তমী': 'Durga-Puja',
  'মহাঅষ্টমী': 'Durga-Puja', 'মহানবমী': 'Durga-Puja',
  'বিজয়াদশমী': 'Durga-Puja', 'মহালয়া': 'Mahalaya',
  'কালীপূজা / দীপাবলি': 'Kali-Puja',
  'রাসপূর্ণিমা': 'Rash-Purnima',
  'সরস্বতী পূজা': 'Saraswati-Puja',
  'মহাশিবরাত্রি': 'shiva-ratri',
  'দোল পূর্ণিমা / হোলি': 'Dol-Purnima',
  'রামনবমী': 'Ramnavami',
  'রাখী পূর্ণিমা': 'Rakhi-Purnima',
  'কোজাগরী লক্ষ্মীপূজা': 'Lokkhi-Puja',
  'অক্ষয় তৃতীয়া': 'Akshy-tritiya',
  'রথযাত্রা': 'Rath-Yatra',
  'গণেশ চতুর্থী': 'Ganesh-Chaturthi',
  'মাঘী পূর্ণিমা': 'Maghi-Purnima',
};
for (const k of Object.keys(EXTRA)) {
  if (!have.has(EXTRA[k])) throw new Error('EXTRA-এর ছবি অ্যাপে নেই: ' + EXTRA[k]);
  if (!images[k]) images[k] = EXTRA[k];
}
process.stderr.write('  ছবি ' + Object.keys(images).length + 'টি' + String.fromCharCode(10));

const out = {
  _source: 'services/src/content/utsab/utsab-dates.js',
  _years: [FROM, TO],
  images,
  dates: Object.fromEntries(Object.keys(byDate).sort().map(k => [k, byDate[k]])),
};
const outPath = path.join(__dirname, '..', 'src', 'engine', 'festival-dates.js');
/* ⚠️ .json নয়, .js — Metro এবং Node দুটোতেই একইভাবে চলে। Node ESM-এ JSON আমদানিতে
   `with { type: 'json' }` লাগে, আর সেটা লিখলে Metro-তে ভাঙতে পারে। */
fs.writeFileSync(outPath,
  '/* তৈরি ফাইল — হাতে সম্পাদনা করবেন না। `npm run build-festival-dates` চালান। */' + String.fromCharCode(10)
  + 'export default ' + JSON.stringify(out) + ';' + String.fromCharCode(10), 'utf8');
console.log('✓ ' + path.relative(process.cwd(), outPath) + '  ('
  + Object.keys(out.dates).length + 'টি তারিখ, ' + Object.keys(images).length + 'টি ছবি, ' + FROM + '–' + TO + ')');
