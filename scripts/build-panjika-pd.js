#!/usr/bin/env node
/*  src/engine/panjika-pd.js — ওয়েবসাইটের src/panjika-pd.js থেকে তৈরি।
 *  ═══════════════════════════════════════════════════════════════
 *  ⛔ ২০২৬-০৯-০৮ — হোম স্ক্রিনের পঞ্চাঙ্গ আর পঞ্জিকা স্ক্রিনের পঞ্চাঙ্গে
 *  তিথি/নক্ষত্র/যোগের শেষ-সময় ১–২ মিনিট আলাদা দেখাত। কারণ দুটো আলাদা
 *  পথ: হোম গণনা করত vsop87 দিয়ে, আর পঞ্জিকা পাতা ছাপা-পঞ্জিকা-যাচাই করা
 *  PD সারণী দিয়ে। একই অ্যাপের দুই পর্দায় দুই সময় — জ্যোতিষীর কাছে এটা
 *  ছোট ব্যাপার নয়।
 *
 *  এখন হোমও PD-ই পড়ে, তাই ফাইলটা অ্যাপে দরকার। হাতে কপি নয় — এই
 *  স্ক্রিপ্ট চালালেই ওয়েবসাইটের বর্তমান ফাইলটা বসে, আর
 *  check-engine-drift প্রতিবার মিলিয়ে দেখে।
 *
 *  চালানো:  node scripts/build-panjika-pd.js
 */
const fs = require('fs'), path = require('path');
const SITE = path.resolve(__dirname, '..', '..', 'services', 'src', 'panjika-pd.js');
const OUT  = path.resolve(__dirname, '..', 'src', 'engine', 'panjika-pd.js');
if (!fs.existsSync(SITE)) { console.error('✗ ওয়েবসাইটের src/panjika-pd.js নেই'); process.exit(1); }
const src = fs.readFileSync(SITE, 'utf8');
if (src.indexOf('var PD=') < 0) { console.error('✗ PD পাওয়া গেল না — ফাইলের আকার বদলেছে'); process.exit(1); }
/* Metro CJS — ওয়েবসাইটের ফাইলে module.exports নেই, তাই এক লাইন জোড়া */
fs.writeFileSync(OUT,
  '// AUTO-GENERATED — হাতে সম্পাদনা করবেন না।\n' +
  '// Run: node scripts/build-panjika-pd.js\n' +
  src.replace(/\s+$/, '') + '\nmodule.exports = PD;\n', 'utf8');
console.log('✓ src/engine/panjika-pd.js  (' + src.length + ' অক্ষর)');
