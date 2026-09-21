#!/usr/bin/env node
/* উৎসবের তারিখ — অ্যাপ আর ওয়েবসাইট একই দিন বলছে তো?
 *
 * ⛔ কেন: অ্যাপের নিজের নিয়ম **সৌর** বাংলা মাস ধরত, অথচ দুর্গাপূজা
 * **চান্দ্র** আশ্বিনে। ফলে ২১ সেপ্টে ২০২৬-এ "বিজয়া দশমী" দেখাত আর
 * আসল দিনে (২১ অক্টো) কিছুই দেখাত না। এখন তারিখ আসে সাইটের ইঞ্জিন
 * থেকে তৈরি সারণি থেকে — এই পরীক্ষা দুটো মিলিয়ে দেখে। */
const fs = require('fs'), path = require('path');
const APP = path.join(__dirname, '..');
const SERVICES = process.env.SERVICES || '/home/user/services';
let bad = 0, n = 0;
const ok = m => console.log('  \u001b[32m✓\u001b[0m ' + m);
const no = m => { console.log('  \u001b[31m✗\u001b[0m ' + m); bad++; };

/* ① সারণিটা আছে ও তৈরি-ফাইল হিসেবে চিহ্নিত */
const tblPath = path.join(APP, 'src/engine/festival-dates.js');
n++;
if (!fs.existsSync(tblPath)) { no('festival-dates.js নেই — `npm run build-festival-dates` চালান'); process.exit(1); }
const raw = fs.readFileSync(tblPath, 'utf8');
if (/হাতে সম্পাদনা করবেন না/.test(raw)) ok('সারণি আছে, তৈরি-ফাইল বলে চিহ্নিত');
else no('সারণিতে "তৈরি ফাইল" মন্তব্য নেই');
const T = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));

/* ② মাস-নির্ভর নিয়ম আর কোডে চলে না */
n++;
const eng = fs.readFileSync(path.join(APP, 'src/engine/bengali_festivals.js'), 'utf8');
if (/if \(f\.bnMonthIdx !== -1\) continue;/.test(eng))
  ok('মাস-নির্ভর তিথি-নিয়ম আর চলে না (সারণিই ভিত্তি)');
else no('bnMonthIdx-নির্ভর নিয়ম আবার চালু হয়েছে — সৌর/চান্দ্র মাসের ভুল ফিরে আসবে');

/* ③ ছবির প্রতিটি চাবি সত্যিই অ্যাপে আছে */
n++;
const have = new Set();
for (const m of fs.readFileSync(path.join(APP, 'src/engine/panjika-images.js'), 'utf8')
       .matchAll(/'([A-Za-z0-9._-]+)':\s*require/g)) have.add(m[1]);
const badImg = Object.values(T.images).filter(v => !have.has(v));
if (!badImg.length) ok(Object.keys(T.images).length + 'টি ছবির চাবিই অ্যাপে আছে');
else badImg.forEach(v => no('ছবি নেই: ' + v));

/* ④ সাইটের ইঞ্জিনের সঙ্গে হুবহু — একটা নমুনা বছর */
n++;
if (!fs.existsSync(SERVICES)) ok('ওয়েবসাইট রিপো নেই — তুলনা বাদ');
else {
  const { festivalsForYear } = require(path.join(SERVICES, 'src/content/utsab/utsab-dates.js'));
  const Y = 2026, live = festivalsForYear(Y);
  const want = {};
  for (const nm of Object.keys(live)) for (const iso of live[nm]) (want[iso] = want[iso] || []).push(nm);
  let diff = 0;
  for (const iso of Object.keys(want)) {
    const a = (T.dates[iso] || []).slice().sort().join('|');
    const b = want[iso].slice().sort().join('|');
    if (a !== b) { diff++; if (diff <= 3) no(iso + ': সারণি "' + a + '" ≠ সাইট "' + b + '"'); }
  }
  if (!diff) ok(Y + ' সালের প্রতিটি দিন সাইটের ইঞ্জিনের সঙ্গে হুবহু (' + Object.keys(want).length + 'টি)');
  else no('মোট ' + diff + 'টি দিনে অমিল — `npm run build-festival-dates` চালান');
}

/* ⑤ যে ভুলটা এই কাজের কারণ — সেটাই আলাদা করে */
n++;
const sep = T.dates['2026-09-21'] || [], oct = T.dates['2026-10-21'] || [];
if (!sep.some(x => /দশমী/.test(x)) && oct.some(x => /দশমী/.test(x)))
  ok('২১ সেপ্টে-তে দশমী নেই, ২১ অক্টো-তে আছে');
else no('দুর্গাপূজার দিন আবার সরে গেছে — সেপ্টে: [' + sep + '] অক্টো: [' + oct + ']');

console.log('');
if (bad) { console.log('❌ ' + n + 'টি পরীক্ষা, ' + bad + 'টি সমস্যা'); process.exit(1); }
console.log('✅ ' + n + 'টি পরীক্ষা, 0টি সমস্যা');
