#!/usr/bin/env node
/*  "ব্যবহার হচ্ছে, কিন্তু আমদানি করা হয়নি" — এই এক দোষ `check:parse`
 *  কখনো ধরে না, কারণ ফাইলটা নিখুঁতভাবে পার্স হয়; ভুলটা কেবল **চালানোর
 *  সময়** (ReferenceError), আর তখন পর্দাটাই সাদা।
 *
 *  ⛔ ২০২৬-০৯-২১ — পাঁচটা ছাপার পর্দাকে একটা শেয়ার্ড withPrintData()-তে
 *  আনার সময় KundaliScreen-এ আমদানির লাইনটা বসেনি। `npm run check:parse`
 *  সবুজ ছিল। PDF বানাতে গেলেই ক্র্যাশ করত।
 *
 *  যা দেখা হয়: src/utils/** আর src/components/** যা কিছু export করে,
 *  তার কোনোটা যদি কোনো ফাইলে **ডাকা** হয় অথচ ওই ফাইলে আমদানি বা স্থানীয়
 *  সংজ্ঞা না থাকে — লাল। নামের তালিকা গাছ-হাঁটা দিয়ে তৈরি, হাতে লেখা নয়। */
'use strict';
const fs = require('fs'), path = require('path');
const APP = path.resolve(__dirname, '..');
let checks = 0, fail = 0;
const ok  = m => { checks++; console.log('  \x1b[32m✓\x1b[0m ' + m); };
const bad = m => { checks++; fail++; console.log('  \x1b[31m✗\x1b[0m ' + m); };

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'web-html') walk(p, out); }
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const ALL = walk(path.join(APP, 'src'));

/* কে কী export করে — উৎস ফাইল ধরে */
const owner = Object.create(null);
for (const f of ALL) {
  const rel = path.relative(APP, f);
  if (!/^src\/(utils|components|context|i18n|navigation|theme)\//.test(rel)) continue;
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/^export\s+(?:async\s+)?function\s+(\w+)/gm)) owner[m[1]] = rel;
  for (const m of src.matchAll(/^export\s+const\s+(\w+)\s*=\s*(?:\(|async|function)/gm)) owner[m[1]] = rel;
}

const names = Object.keys(owner);

/* ⚠️ মন্তব্য ও স্ট্রিং বাদ না দিলে পরীক্ষাটা **মিথ্যে লাল** হয় — মেপে
   দেখা: "useLanguage() ডাকা যায় না" লেখা একটা ব্যাখ্যা-মন্তব্যকেই সে
   ডাক ধরে নিচ্ছিল (৬টার ৪টাই এমন ছিল)। */
const strip = s => s
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1')
  .replace(/`(?:\\.|[^`\\])*`/g, '``')
  .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
  .replace(/"(?:\\.|[^"\\\n])*"/g, '""');

/* আমদানির নামগুলো — বহু-লাইনের `import {\n a,\n b\n } from …`-ও ধরা হয় */
function importedNames(src) {
  const set = new Set();
  for (const m of src.matchAll(/import\s+([\s\S]*?)\s+from\s+['"][^'"]+['"]/g)) {
    for (const n of m[1].replace(/[{}]/g, ' ').split(/[\s,]+/)) if (n) set.add(n.replace(/^\*$/, ''));
  }
  return set;
}

let miss = 0, scanned = 0;
for (const f of ALL) {
  const rel = path.relative(APP, f);
  const raw = fs.readFileSync(f, 'utf8');
  const src = strip(raw);
  const imp = importedNames(raw);
  scanned++;
  for (const n of names) {
    if (owner[n] === rel) continue;                       /* নিজের ফাইল */
    if (!new RegExp('(?<![.\\w])' + n + '\\s*\\(').test(src)) continue;   /* ডাকাই হয়নি */
    if (new RegExp('^\\s*(?:export\\s+)?(?:const|let|var|function|async function)\\s+' + n + '\\b', 'm').test(src)) continue;
    if (imp.has(n)) continue;
    bad(`${rel} — ${n}() ডাকা হচ্ছে, আমদানি নেই (${owner[n]})`);
    miss++;
  }
}
if (!miss) ok(`${scanned}টি ফাইলে ${names.length}টি শেয়ার্ড ফাংশনের প্রতিটি ব্যবহারই আমদানি করা`);

console.log(`\n${fail ? '❌' : '✅'} ${checks}টি পরীক্ষা, ${fail}টি সমস্যা`);
process.exit(fail ? 1 : 0);
