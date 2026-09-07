#!/usr/bin/env node
/**
 * ছাপার বান্ডলটা সাইটের বর্তমান পাতা থেকেই তৈরি কিনা — প্রতিবার।
 *
 * ⛔ কেন দরকার: এই বান্ডল একবার হাতে কপি হয়ে **মাসের পর মাস** পিছিয়ে
 *    ছিল, আর কোনো পরীক্ষা সেটা দেখেনি। ফল ছিল তিনটে আলাদা অভিযোগ —
 *    ইংরেজি PDF বাংলায়, পাতা কম, আর জন্মসময়/জন্মস্থান/সূর্যোদয়/
 *    সূর্যাস্ত/বর্ণ "—"। তিনটেরই কারণ ছিল একটাই: পুরনো কপি।
 *
 * এটি বান্ডল **নতুন করে বানায় না** — কেবল মিলিয়ে দেখে। না মিললে
 * `node scripts/build-kundali-print.js` চালাতে বলে।
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT = path.resolve(__dirname, '..', 'src', 'web-html', 'kundali-print.js');
const BUILDER = path.resolve(__dirname, 'build-kundali-print.js');
let bad = [], ok = 0;
const good = m => { ok++; console.log('  \x1b[32m✓\x1b[0m ' + m); };
const err  = m => { bad.push(m); console.log('  \x1b[31m✗\x1b[0m ' + m); };

const current = fs.readFileSync(OUT, 'utf8');
const tmp = OUT + '.check';
fs.copyFileSync(OUT, tmp);
let rebuilt;
try {
  execFileSync(process.execPath, [BUILDER], { stdio: 'pipe' });
  rebuilt = fs.readFileSync(OUT, 'utf8');
} finally {
  fs.copyFileSync(tmp, OUT);          // যা ছিল তাই ফিরিয়ে দেওয়া
  fs.unlinkSync(tmp);
}

if (current === rebuilt) good('বান্ডলটা সাইটের বর্তমান kundali-print.html থেকেই তৈরি');
else err('বান্ডল পিছিয়ে আছে — `node scripts/build-kundali-print.js` চালান'
        + ' (' + current.length + ' বনাম ' + rebuilt.length + ' বাইট)');

/* KundaliScreen দুটো নোঙরে ডেটা বসায়, আর String.replace নোঙর না পেলে
   **নীরবে কিছুই করে না** — তাই দুটোই ঠিক একবার থাকা চাই। */
const html = JSON.parse(current.slice(current.indexOf('export default ') + 15).trim().replace(/;$/, ''));
const cnt = (s) => html.split(s).length - 1;
for (const [a, label] of [
  ['<head>', '<head> নোঙর'],
  ["try{raw=localStorage.getItem('kundali_print_data');}catch(e){}", 'ডেটা-নোঙর'],
]) (cnt(a) === 1 ? good(label + ' ঠিক একবার আছে') : err(label + ' ' + cnt(a) + ' বার — KundaliScreen নীরবে ব্যর্থ হবে'));

/* ২০২৬-০৮-৩০-এর সংশোধনটা সত্যিই পৌঁছেছে কিনা: কাঁচা মান তিনটে আলাদা
   ক্ষেত্রে আসে, পর্দার অনূদিত লেখা থেকে regex দিয়ে নয়। */
for (const k of ['dobRaw', 'tobRaw', 'placeRaw'])
  (cnt(k) ? good(k + ' — জন্মবিবরণ কাঁচা মান থেকেই') : err(k + ' নেই — অনূদিত PDF-এ "—" বসবে'));

/* প্রিমিয়ামের গভীর দশা ও প্রতিকার — "পাতা কম" অভিযোগের আসল জায়গা */
for (const [k, l] of [['allAntardashas', 'প্রিমিয়ামের সবকটি অন্তর্দশা'],
                      ['pratyantar', 'প্রত্যন্তর্দশা'],
                      ['data.yv', 'যোনি-বর্ণ প্রতিকার']])
  (cnt(k) ? good(l + ' আছে') : err(l + ' নেই'));

/* অ্যাপের নিজের প্যাচগুলো — একটাও হারালে অ্যাপে PDF ভাঙে */
for (const [k, l, want] of [
  ['#printRoot{display:block!important}', 'printRoot পর্দায় দৃশ্যমান (expo-print ধরে ছাপে)', true],
  ['https://myastrology.in/css/noto-sans-font.css', 'ফন্টের নিরঙ্কুশ ঠিকানা', true],
  ['Google Tag Manager', 'GTM বাদ', false],
  ['src="gallery/', 'আপেক্ষিক ছবি-পথ বাদ', false],
]) {
  const has = cnt(k) > 0;
  (has === want) ? good(l) : err(l + ' — ' + (want ? 'নেই' : 'রয়ে গেছে'));
}

console.log(bad.length ? `\n❌ ${ok + bad.length}টি পরীক্ষা, ${bad.length}টি সমস্যা`
                       : `\n✅ ${ok}টি পরীক্ষা, 0টি সমস্যা`);
process.exit(bad.length ? 1 : 0);
