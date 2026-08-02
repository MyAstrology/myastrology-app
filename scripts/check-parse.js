#!/usr/bin/env node
/**
 * অ্যাপের প্রতিটা JS ফাইল সত্যিই পার্স হয় কিনা — Metro যেভাবে পড়ে, ঠিক
 * সেভাবে (Babel দিয়ে)।
 *
 * কেন দরকার (২০২৬-০৮-০২-এর শিক্ষা, দ্বিতীয়বার): `node --check` যথেষ্ট নয়।
 * PrashnaScreen.js-এর APP_CSS টেমপ্লেট-স্ট্রিং-এর ভিতরে একটা CSS মন্তব্যে
 * backtick (`) লেখা হয়েছিল। ওই backtick স্ট্রিংটাকে মাঝপথে বন্ধ করে দেয়,
 * বাকি CSS-টা JS কোড হিসেবে পড়া হতে থাকে। **`node --check` এটা পাশ করিয়ে
 * দিয়েছিল** (V8-এর পার্সার ঘটনাচক্রে ওটাকে বৈধ ধরে নেয়), কিন্তু বিল্ড
 * সার্ভারে Metro/Babel ব্যর্থ হয় — ২০ মিনিট বিল্ডের পর।
 *
 * অর্থাৎ যাচাইটা **যে টুল আসলে কোড পড়বে সেই টুল দিয়েই** করতে হবে।
 *
 * চালান: node scripts/check-parse.js
 */

const fs    = require('fs');
const path  = require('path');
const babel = require('@babel/core');

const ROOT = path.join(__dirname, '..');

// বান্ডলগুলো (src/web-html/*.js) কয়েক-MB এক-লাইন স্ট্রিং — Babel-এ ধীর, আর
// ওগুলো শুধু একটা স্ট্রিং রপ্তানি করে, কোড নয়। ওদের জন্য হালকা যাচাই।
const HEAVY_DIR = path.join(ROOT, 'src', 'web-html');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.js') || name.endsWith('.jsx')) out.push(p);
  }
  return out;
}

const files = [path.join(ROOT, 'App.js'), ...walk(path.join(ROOT, 'src'))];
const problems = [];
let checked = 0, bundles = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, 'utf8');

  if (file.startsWith(HEAVY_DIR)) {
    // বান্ডল: `export default "…";` — স্ট্রিংটা JSON হিসেবে পড়া যায় কিনা।
    // এতে ভাঙা escape বা অসম্পূর্ণ স্ট্রিং সঙ্গে সঙ্গে ধরা পড়ে।
    bundles++;
    const i = src.indexOf('export default ');
    if (i < 0) { problems.push(`${rel}: "export default" পাওয়া গেল না`); continue; }
    const lit = src.slice(i + 'export default '.length).trim().replace(/;\s*$/, '');
    try { JSON.parse(lit); }
    catch (e) { problems.push(`${rel}: বান্ডলের স্ট্রিং ভাঙা — ${e.message.slice(0, 90)}`); }
    continue;
  }

  checked++;
  try {
    babel.parseSync(src, {
      filename: file,
      babelrc: false, configFile: false,
      presets: [require.resolve('babel-preset-expo')],
    });
  } catch (e) {
    const loc = e.loc ? ` (লাইন ${e.loc.line})` : '';
    problems.push(`${rel}${loc}: ${String(e.message).split('\n')[0].slice(0, 120)}`);
  }
}

if (problems.length) {
  console.error('❌ পার্স করা যায়নি — বিল্ড ব্যর্থ হবে:\n');
  problems.forEach(p => console.error('  · ' + p));
  console.error(`\nমোট ${problems.length}টি।`);
  console.error('টিপ: CSS টেমপ্লেট-স্ট্রিং-এর ভিতরে backtick (`) লিখবেন না —');
  console.error('     ওটা স্ট্রিংটাকে মাঝপথে বন্ধ করে দেয়।');
  process.exit(1);
}
console.log(`✅ পার্স যাচাই সম্পন্ন — ${checked}টা ফাইল ও ${bundles}টা বান্ডল, সব ঠিক`);
