#!/usr/bin/env node
/* অ্যাপ চালুর সময় কতটা JS পার্স হয় — রেখাচিহ্ন (ratchet)
 *
 * ⛔ কেন: HomeScreen initial route, তাই সে যা কিছু static import করে
 *    তার সবটাই প্রথম ফ্রেম আঁকার **আগে** পার্স হয়। মেপে দেখা গেছিল
 *    ১,৪২৬ KB — যার ৭৭০ KB একা panjika-ephemeris.js। ইঞ্জিনগুলো
 *    প্রথম ফ্রেমের পরে লোড করায় সেটা ৩৯০ KB-তে নেমেছে।
 *
 *    এটা চোখে পড়ে না — অ্যাপ ঠিকই চলে, শুধু ধীরে। তাই বেঁধে রাখা।
 *    সংখ্যাটা কমলে BUDGET-ও কমাতে হবে (স্ক্রিপ্ট নিজেই বলে দেয়)।
 */
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
const BUDGET = 500;   // KB

const seen = new Map();
const resolve = (base, spec) => {
  if (!spec.startsWith('.')) return null;
  const p = path.normalize(path.join(path.dirname(base), spec));
  for (const c of [p, p + '.js', path.join(p, 'index.js')]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return null;
};
const walk = (p) => {
  if (seen.has(p)) return;
  seen.set(p, fs.statSync(p).size);
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    /* lazy: BottomTabs-এর `() => require(...)` ম্যাপ ও HomeScreen-এর
       engines() — এগুলো চালুর সময় চলে না, তাই গোনা হয় না। */
    if (/=>\s*require\(/.test(line) || line.includes('getComponent')) continue;
    if (/^\s*(getPanchangForDate|getTodayRashifal|getFestivalsForMonth):\s*require/.test(line)) continue;
    for (const m of line.matchAll(/(?:^\s*import[^'"]*|require\()['"]([^'"]+)['"]/g)) {
      const r = resolve(p, m[1]); if (r) walk(r);
    }
  }
};
process.chdir(ROOT);
walk('App.js');

const js = [...seen].filter(([k]) => k.endsWith('.js'));
const kb = Math.round(js.reduce((a, [, v]) => a + v, 0) / 1024);
console.log(`চালুর সময় পার্স হওয়া JS: ${kb} KB (${js.length}টি ফাইল, সীমা ${BUDGET} KB)`);
js.sort((a, b) => b[1] - a[1]).slice(0, 5)
  .forEach(([k, v]) => console.log(`   ${String(Math.round(v / 1024)).padStart(5)} KB  ${k}`));

if (kb > BUDGET) {
  console.error(`\n✗ সীমা ছাড়িয়েছে। কোনো ভারী মডিউল কি HomeScreen বা App.js-এ static import হয়ে গেছে?`);
  process.exit(1);
}
if (kb < BUDGET - 120) console.log(`\n💡 অনেকটা কমেছে — BUDGET ${Math.ceil((kb + 60) / 10) * 10} করে দিন, নইলে পরের বৃদ্ধি ধরা পড়বে না।`);
console.log('\n✅ ঠিক আছে');
