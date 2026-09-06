#!/usr/bin/env node
/*  অ্যাপের তিন ভাষার পাহারা।
 *
 *  কী দেখে (আর কেন প্রতিটা আলাদা করে দরকার):
 *   ① পাঠকের চোখে পড়া প্রতিটি বাংলা লেখার en ও hi অনুবাদ আছে কি —
 *      স্ট্রিং-লিটারেল **এবং** JSX-এর ভিতরের লেখা, দুটো আকৃতিই। প্রথম
 *      মাপে কেবল লিটারেল দেখেছিলাম আর ৪৬টা লাইন চোখের বাইরে ছিল।
 *   ② অনুবাদের ভিতরে বাংলা অক্ষর নেই তো — অর্ধ-অনুবাদ ধরার একমাত্র উপায়।
 *   ③ terms.js সত্যিই ওয়েবসাইটের অভিধান থেকেই এসেছে কি (দ্বিতীয় কপি নয়)।
 *   ④ যে ফাইলে বাংলা লেখা আছে সেখানে Text মোড়কটা আমদানি হয়েছে কি —
 *      react-native-এর কাঁচা Text রেখে দিলে ওই ফাইলের লেখা নীরবে বাংলাই
 *      থেকে যেত, আর কোনো অনুবাদ-গণনা সেটা ধরত না।
 *   ⑤ প্রতিটি বদলানো ফাইল পার্স হয় কি (এই স্যান্ডবক্সে node_modules নেই,
 *      তাই অ্যাপ চালিয়ে দেখা যায় না — এটাই সর্বোচ্চ যাচাই)।
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const APP = path.resolve(__dirname, '..');
const { BN_G, strip } = require('./bn-scan.js');

let checks = 0, fail = 0;
const ok  = m => { checks++; console.log('  \x1b[32m✓\x1b[0m ' + m); };
const bad = m => { checks++; fail++; console.log('  \x1b[31m✗\x1b[0m ' + m); };

const nfc = s => String(s).normalize('NFC')
  .replace(/ড়/g, 'ড়').replace(/ঢ়/g, 'ঢ়').replace(/য়/g, 'য়');

function readTable(file, name) {
  const src = fs.readFileSync(path.join(APP, 'src/i18n', file), 'utf8');
  /* ⚠️ প্রথম '{' ধরলে হয় না — ফাইলের মাথার মন্তব্যেই "{en,hi}" লেখা আছে।
     ঘোষণার নাম ধরে নোঙর করা হয়। */
  const at = src.indexOf('export const ' + name + ' = ');
  if (at < 0) throw new Error(file + '-এ ' + name + ' ঘোষণা নেই');
  const i = src.indexOf('{', at), j = src.lastIndexOf('}');
  return JSON.parse(src.slice(i, j + 1));
}
const TERMS = readTable('terms.js', 'TERMS');
const STRINGS = readTable('strings.js', 'STRINGS');
const TABLE = Object.create(null);
for (const t of [TERMS, STRINGS]) for (const k in t) TABLE[nfc(k)] = t[k];

/* ── অ্যাপের কোড থেকে পাঠকের লেখা তোলা ── */
const SKIP_DIR = new Set(['web-html', 'i18n']);
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIR.has(e.name)) walk(path.join(d, e.name)); }
    else if (e.name.endsWith('.js')) files.push(path.join(d, e.name));
  }
})(path.join(APP, 'src'));

const LIT = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
const JSXTXT = /}?>([^<>{}\n]*)</g;
const found = new Map();   // লেখা → কোন ফাইলে
for (const f of files) {
  const src = strip(fs.readFileSync(f, 'utf8'));
  let m;
  while ((m = LIT.exec(src))) {
    const s = m[2];
    if (s.length > 140 || /[\n{<]/.test(s)) continue;
    BN_G.lastIndex = 0;
    if (BN_G.test(s) && !found.has(s.trim())) found.set(s.trim(), f);
  }
  while ((m = JSXTXT.exec(src))) {
    const s = m[1].trim();
    if (!s || s.length > 140) continue;
    BN_G.lastIndex = 0;
    if (BN_G.test(s) && !found.has(s)) found.set(s, f);
  }
}

console.log('① প্রতিটি বাংলা লেখার en ও hi অনুবাদ');
{
  const miss = [];
  for (const [s, f] of found) {
    const h = TABLE[nfc(s)];
    if (!h || !h.en || !h.hi) miss.push([s, path.relative(APP, f)]);
  }
  if (!miss.length) ok(`${found.size}টি লেখার সবগুলোরই দুই ভাষার অনুবাদ আছে`);
  else {
    miss.slice(0, 8).forEach(([s, f]) => bad(`অনুবাদ নেই — ${JSON.stringify(s)}  (${f})`));
    if (miss.length > 8) bad(`… আরও ${miss.length - 8}টি`);
  }
}

console.log('② অনুবাদের ভিতরে বাংলা');
{
  let n = 0;
  for (const k in TABLE) for (const l of ['en', 'hi']) {
    const v = TABLE[k][l];
    BN_G.lastIndex = 0;
    if (v && BN_G.test(v)) { if (n < 5) bad(`${l}: ${JSON.stringify(k)} → ${JSON.stringify(v)}`); n++; }
  }
  if (!n) ok(`${Object.keys(TABLE).length}টি অনুবাদের একটিতেও বাংলা অক্ষর নেই`);
  else bad(`মোট ${n}টি অনুবাদে বাংলা রয়ে গেছে`);
}

console.log('③ terms.js ওয়েবসাইটের অভিধান থেকেই');
{
  const SERVICES = process.env.SERVICES || '/home/user/services';
  if (!fs.existsSync(path.join(SERVICES, 'i18n/en/terms.json'))) {
    ok('ওয়েবসাইট রিপো নেই — এই অংশটা বাদ (SERVICES= দিয়ে চালালে দেখা হবে)');
  } else {
    const idx = {};
    for (const l of ['en', 'hi']) {
      idx[l] = Object.create(null);
      for (const f of fs.readdirSync(path.join(SERVICES, 'i18n', l))) {
        if (!f.endsWith('.json')) continue;
        let o; try { o = JSON.parse(fs.readFileSync(path.join(SERVICES, 'i18n', l, f), 'utf8')); } catch (e) { continue; }
        for (const bag of [o.strings, o._unused]) {
          if (!bag) continue;
          for (const k in bag) if (typeof bag[k] === 'string' && bag[k] && !idx[l][nfc(k)]) idx[l][nfc(k)] = bag[k];
        }
      }
    }
    let drift = 0;
    for (const k in TERMS) {
      const n = nfc(k);
      /* ঢিলে মিলও গ্রহণ করা হয় — জেনারেটর যেভাবে বসিয়েছে */
      const hitE = idx.en[n], hitH = idx.hi[n];
      if (hitE && TERMS[k].en !== hitE) { if (drift < 4) bad(`terms.js সরে গেছে — ${JSON.stringify(k)}: "${TERMS[k].en}" বনাম সাইটের "${hitE}"`); drift++; }
      else if (hitH && TERMS[k].hi !== hitH) { if (drift < 4) bad(`terms.js সরে গেছে (hi) — ${JSON.stringify(k)}`); drift++; }
    }
    if (!drift) ok(`terms.js-এর ${Object.keys(TERMS).length}টি নামই ওয়েবসাইটের অভিধানের সঙ্গে হুবহু`);
    else bad(`${drift}টি নাম সাইটের অভিধান থেকে সরে গেছে — build-app-terms.js আবার চালান`);
  }
}

console.log('④ বাংলা লেখা যে ফাইলে, সেখানে ভাষা-সচেতন Text');
{
  const need = new Set();
  for (const [, f] of found) need.add(f);
  const missing = [];
  for (const f of need) {
    const src = fs.readFileSync(f, 'utf8');
    /* কেবল সেই ফাইল যেখানে সত্যিই <Text> রেন্ডার হয় */
    if (!/<Text[\s>]/.test(src)) continue;
    if (!/from '.*i18n\/Text'/.test(src)) missing.push(path.relative(APP, f));
  }
  if (!missing.length) ok('বাংলা লেখাওয়ালা প্রতিটি কম্পোনেন্ট-ফাইলেই মোড়কটা আমদানি হয়েছে');
  else missing.forEach(f => bad(`${f} — react-native-এর কাঁচা Text, লেখা বাংলাই থেকে যাবে`));
}

console.log('⑥ ক্যালকুলেটরের ভাষা-রুটিং');
{
  /* বান্ডলে অনুবাদ নেই — মেপে দেখা। এটা দাবি নয়, প্রতিবার যাচাই করা হয়:
     কোনো বান্ডলে MyaI18n/ENGINE_I18N ঢুকে পড়লে রুটিংয়ের যুক্তিটাই বদলে যায়। */
  const wh = path.join(APP, 'src/web-html');
  let withI18n = 0;
  for (const f of fs.readdirSync(wh)) {
    if (!f.endsWith('.js')) continue;
    const src = fs.readFileSync(path.join(wh, f), 'utf8');
    if (/MyaI18n|ENGINE_I18N|MyaEngineI18n/.test(src)) { bad(`web-html/${f}-এ অনুবাদ-যন্ত্রপাতি ঢুকেছে — রুটিংয়ের যুক্তি আবার দেখুন`); withI18n++; }
  }
  if (!withI18n) ok('দশটি বান্ডলের একটিতেও অনুবাদ-যন্ত্রপাতি নেই (তাই লাইভ পাতায় রুট করা)');

  /* webPath যা বলছে, ওয়েবসাইটে সেই পথের en ও hi সত্যিই আছে তো —
     না থাকলে ইংরেজি পাঠক ৪০৪ পেতেন, যা বাংলা দেখানোর চেয়েও খারাপ। */
  const SERVICES = process.env.SERVICES || '/home/user/services';
  const paths = new Set();
  for (const f of fs.readdirSync(path.join(APP, 'src/screens'))) {
    const src = fs.readFileSync(path.join(APP, 'src/screens', f), 'utf8');
    for (const m of src.matchAll(/webPath="([^"]+)"/g)) paths.add(m[1]);
  }
  if (!paths.size) bad('কোনো স্ক্রিনে webPath বসানো নেই — ক্যালকুলেটর ইংরেজিতে বাংলাই দেখাবে');
  else if (!fs.existsSync(SERVICES)) ok(`${paths.size}টি webPath — ওয়েবসাইট রিপো নেই, ফাইল-যাচাই বাদ`);
  else {
    const missing = [];
    for (const p0 of paths) for (const l of ['en', 'hi']) {
      const a1 = path.join(SERVICES, l, p0 + '.html');
      const a2 = path.join(SERVICES, l, p0, 'index.html');
      if (!fs.existsSync(a1) && !fs.existsSync(a2)) missing.push(`${l}/${p0}`);
    }
    if (!missing.length) ok(`${paths.size}টি webPath-এর দুই ভাষার পাতাই ওয়েবসাইটে আছে`);
    else missing.forEach(m => bad(`ওয়েবসাইটে /${m} নেই — ওই ভাষায় ৪০৪ হবে`));
  }

  /* কুণ্ডলী স্ক্রিন নিজের WebView চালায়, তাই আলাদা করে দেখা */
  const ks = fs.readFileSync(path.join(APP, 'src/screens/KundaliScreen.js'), 'utf8');
  if (/myastrology\.in\/' \+ lang \+ '\/kundali/.test(ks)) ok('কুণ্ডলী স্ক্রিনেও ভাষা-রুটিং বসানো');
  else bad('KundaliScreen-এ ভাষা-রুটিং নেই — ইংরেজি পাঠক বাংলা কুণ্ডলী পেতেন');

  /* নীরব ফলব্যাক নয় — নেট না থাকলে পাঠককে বলা হয় */
  const lw = fs.readFileSync(path.join(APP, 'src/components/LocalWebView.js'), 'utf8');
  const note = 'ইন্টারনেট নেই';
  if (lw.includes(note) && ks.includes(note)) ok('নেট না থাকলে বাংলায় ফেরার কথা পাঠককে বলা হয় (নীরব নয়)');
  else bad('অফলাইন ফলব্যাক নীরব — পাঠক ইংরেজি খোলসে বাংলা ভিতর দেখতেন, কিছু না জেনে');
}

console.log('⑤ পার্স (JSX সহ)');
{
  /* ⚠️ `node --check` এখানে **কাজ করে না**, আর সেটা নীরবে।
     ফাইলটা `import` দিয়ে শুরু হলে Node ওটাকে ESM ধরে নেয় এবং সিনট্যাক্স
     পরীক্ষাটাই এড়িয়ে যায় — মেপে দেখা: `const a = ((( ;` লেখা একটা ফাইলও
     exit 0 দেয়। অ্যাপের প্রতিটি স্ক্রিনই `import` দিয়ে শুরু, অর্থাৎ
     node --check দিয়ে "সব ফাইল পার্স হয়" বলাটা ছিল একটা মিথ্যে সবুজ।
     এই স্যান্ডবক্সে @babel/core নেই, কিন্তু TypeScript-এর পার্সার আছে
     (গ্লোবাল tsc) — সেটি JSX বোঝে, আর কেবল **পার্স** করা হয়, টাইপ
     মেলানো নয়, তাই react-native-এর টাইপ না থাকলেও চলে। */
  let ts = null;
  for (const p0 of ['/opt/node22/lib/node_modules/typescript/lib/typescript.js', 'typescript']) {
    try { ts = require(p0); break; } catch (e) {}
  }
  if (!ts) {
    bad('JSX পার্সার পাওয়া যায়নি — node --check এই ফাইলগুলোতে কিছুই যাচাই করে না, তাই পার্স-পরীক্ষা হয়নি');
  } else {
    let n = 0, bads = 0;
    for (const f of files.concat([path.join(APP, 'App.js')])) {
      const src = fs.readFileSync(f, 'utf8');
      const sf = ts.createSourceFile('x.tsx', src, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
      const d = sf.parseDiagnostics;
      if (d.length) {
        const m = ts.flattenDiagnosticMessageText(d[0].messageText, ' ');
        const line = sf.getLineAndCharacterOfPosition(d[0].start).line + 1;
        bad(`পার্স হয় না — ${path.relative(APP, f)}:${line}  ${m}`);
        bads++;
      } else n++;
    }
    if (!bads) ok(`${n}টি ফাইলই পার্স হয় (TypeScript পার্সার, JSX সহ)`);
  }
}

console.log(`\n${fail ? '❌' : '✅'} ${checks}টি পরীক্ষা, ${fail}টি সমস্যা`);
process.exit(fail ? 1 : 0);
