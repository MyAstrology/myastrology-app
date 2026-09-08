#!/usr/bin/env node
/*  বান্ডলের ভিতরের ইঞ্জিন-ফাইল ওয়েবসাইটের থেকে কতটা পিছিয়ে
 *  ═══════════════════════════════════════════════════════════════
 *  প্রতিটি `web-html/*.js` বান্ডলে ওয়েবসাইটের `src/*.js` ও `js/*.js`
 *  ফাইলগুলো `<script>/*src/x.js*​/ … </script>` আকারে ইনলাইন করা থাকে।
 *  ওয়েবসাইটে ইঞ্জিন বদলালে অ্যাপে আপনাআপনি যায় না — হাতে বসাতে হয়।
 *
 *  ⛔ ২০২৬-০৯-০৮-এ মেপে দেখা গেল বর্ষফলের বান্ডল এক মাস পিছিয়ে ছিল:
 *  পুরনো `calculatePanchavargiyaBala` (পঞ্চবর্গের একটিও বর্গ ছাড়া), আর
 *  `src/tajika-bala.js` তো ছিলই না। অর্থাৎ অ্যাপ ও ওয়েবসাইট একই
 *  জন্মবিবরণে **আলাদা বর্ষেশ** দিত — জ্যোতিষের দিক থেকে এটাই সবচেয়ে
 *  গুরুতর ধরনের ফারাক, আর কোনো পরীক্ষা সেটা দেখত না।
 *
 *  এই ফাইল দুটো কাজ করে:
 *   ১. SYNCED তালিকার ফাইলগুলো **হুবহু** মিলতেই হবে — না মিললে লাল।
 *   ২. বাকিগুলোর ফারাক গোনা হয় আর BASELINE-এর সঙ্গে মেলানো হয় —
 *      সংখ্যাটা বাড়লে লাল। কমলে বলা হয় baseline নামাতে।
 *
 *  ⚠️ BASELINE মানে "এতগুলো ঠিক আছে" নয়। মানে "আর পিছিয়ে যাওয়া চলবে না"।
 */
const fs = require('fs'), path = require('path');
const APP = path.resolve(__dirname, '..');
const SITE = process.env.SERVICES || '/home/user/services';
const WH = path.join(APP, 'src/web-html');

if (!fs.existsSync(SITE)) {
  console.log('ℹ️  ওয়েবসাইট রিপো নেই — যাচাই বাদ।');
  process.exit(0);
}

/* যেগুলো এইমাত্র মিলিয়ে দেওয়া হয়েছে — এগুলো আর সরে যাওয়া চলবে না */
const SYNCED = [
  ['varshaphala.js', 'src/varshaphala-engine.js'],
  ['varshaphala.js', 'src/tajika-bala.js'],
  ['varshaphala.js', 'src/ayanamsa.js'],
  ['varshaphala.js', 'src/vsop87-planets.js'],
];
const BASELINE = 43;   /* ২০২৬-০৯-০৮-এ মাপা */

let bad = 0, drift = [];
const fail = m => { bad++; console.log('❌ ' + m); };

for (const f of fs.readdirSync(WH).filter(x => x.endsWith('.js'))) {
  const mod = fs.readFileSync(path.join(WH, f), 'utf8');
  const m = mod.match(/export default ([\s\S]*);\s*$/);
  if (!m) continue;
  let html; try { html = JSON.parse(m[1]); } catch (e) { continue; }
  const re = /<script>\/\*((?:src|js)\/[a-z0-9.\/-]+)\*\/\n/g;
  let hit;
  while ((hit = re.exec(html))) {
    const name = hit[1];
    const s = hit.index + hit[0].length;
    const e = html.indexOf('\n</script>', s);
    if (e < 0) continue;
    const inApp = html.slice(s, e).trim();
    let onSite;
    try { onSite = fs.readFileSync(path.join(SITE, name), 'utf8').trim(); }
    catch (x) { drift.push([f, name, 'সাইটে নেই']); continue; }
    if (inApp !== onSite) drift.push([f, name, inApp.length + ' vs ' + onSite.length]);
  }
}

console.log('① যেগুলো মিলিয়ে দেওয়া হয়েছে — হুবহু থাকতেই হবে');
for (const [f, n] of SYNCED) {
  const d = drift.find(x => x[0] === f && x[1] === n);
  if (d) fail(f + ' → ' + n + ' আবার সরে গেছে (' + d[2] + ')');
}
if (!bad) console.log('   ✓ ' + SYNCED.length + '/' + SYNCED.length + ' — বর্ষফলের ইঞ্জিন ওয়েবসাইটের সঙ্গে এক');

console.log('② বাকি ফাইলগুলোর পিছিয়ে-পড়া (রেখাচিহ্ন ' + BASELINE + ')');
const rest = drift.filter(d => !SYNCED.some(s => s[0] === d[0] && s[1] === d[1]));
const byBundle = {};
for (const [f, n] of rest) (byBundle[f] = byBundle[f] || []).push(n);
for (const f of Object.keys(byBundle))
  console.log('   · ' + f.padEnd(20) + byBundle[f].length + 'টি — ' + byBundle[f].slice(0, 4).join(', ')
    + (byBundle[f].length > 4 ? ' …' : ''));
if (rest.length > BASELINE)
  fail('পিছিয়ে-পড়া ফাইল ' + rest.length + 'টি — রেখাচিহ্ন ' + BASELINE + '-এর বেশি');
else if (rest.length < BASELINE)
  console.log('   ✓ ' + rest.length + 'টি — রেখাচিহ্ন ' + BASELINE + ' থেকে ' + rest.length + '-এ নামান');
else console.log('   ✓ ' + rest.length + 'টি — রেখাচিহ্ন অক্ষত');

console.log(bad ? '\n❌ ' + bad + 'টি সমস্যা' : '\n✓ ইঞ্জিন-ড্রিফট রেখাচিহ্নের মধ্যেই');
process.exit(bad ? 1 : 0);
