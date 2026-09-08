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

/* ── ইচ্ছাকৃত ব্যতিক্রম ──
   LanguageGate প্রথম চালুর ভাষা-পর্দা। পাঠক তখনো ভাষাই বাছেননি, তাই
   ওখানে কোনো লেখা অনুবাদ করা হয় না — তিন ভাষার লাইনই পাশাপাশি দেখানো
   হয়, যাতে যিনি যেটা পড়তে পারেন সেটাই পড়েন। ব্যতিক্রমটা নাম ধরে লেখা,
   আর নিচে ⑦-এ যাচাই করা হয় যে ফাইলটা সত্যিই তিন ভাষা বহন করে — নইলে
   "ব্যতিক্রম" মানে দাঁড়াত "যা খুশি অনূদিত না রাখার ছাড়পত্র"। */
const NO_TRANSLATE = new Set(['src/components/LanguageGate.js']);

/*  একক লেখার ছাড় — ফাইল ধরে ছাড় দিলে ওই ফাইলের ভবিষ্যতের সব লেখাও
    নীরবে ছাড় পেয়ে যেত। তাই ঠিক এই লেখাগুলোই, আর প্রতিটির কারণ লেখা।
    ছাড়টা নিজেও পরীক্ষা করা হয় — "কারণ"টা সত্যিই কোডে আছে কি না দেখা হয়,
    নইলে ছাড় মানে দাঁড়াত যা খুশি বাংলায় রেখে দেওয়ার ছাড়পত্র। */
const NO_TRANSLATE_TEXT = {
  /* CSS সিলেক্টরের ভিতরের লেখা — পাতার নিজের aria-label ধরে মেলানো হয়।
     অনুবাদ করলে সিলেক্টরটাই আর কিছু ধরত না। */
  '\u09aa\u09c7\u099c\u09c7 \u09af\u09be\u09a8': { file: 'src/screens/KundaliScreen.js', within: 'aria-label*=' },
};

const SERVICES2 = process.env.SERVICES || '/home/user/services';

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

/*  ⛔ তৃতীয় অন্ধ দিক: `{city}` জাতীয় প্লেসহোল্ডার-ওয়ালা লেখা।
    নিচের শর্তে `{` মানেই বাদ ছিল — অথচ CLAUDE.md-এর নিয়মই বলে,
    যে বাক্যে রানটাইম মান বসে সেটা টুকরো না করে প্লেসহোল্ডার দিয়ে
    একটাই চাবি রাখতে হবে। ফলে ঠিক নিয়ম মেনে লেখা বাক্যগুলোই
    পরীক্ষার বাইরে পড়ত (সেটিংসের শহরের লাইনটা এভাবেই বাংলা ছিল)।
    এখন `{নাম}` আকৃতির প্লেসহোল্ডার সরিয়ে তবে দেখা হয়। */
const PH = /(?<!\$)\{[A-Za-z_$][\w$]*\}/g;   /* ${...} নয় — ওটা টেমপ্লেট-লিটারাল, চাবি হতে পারে না */
const LIT = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
const JSXTXT = /}?>([^<>{}\n]*)</g;
const found = new Map();   // লেখা → কোন ফাইলে
for (const f of files) {
  const src = strip(fs.readFileSync(f, 'utf8'));
  let m;
  /* ⛔ আগে পুরো ফাইলটা একবারে স্ক্যান করা হতো, আর তাতে **একটা**
     বেজোড় উদ্ধৃতি-চিহ্ন (বাংলা লেখার ভিতরের অ্যাপোস্ট্রফি, যেমন
     `দু'বার`) গোটা ফাইলের বাকি অংশের পার্সিং সরিয়ে দিত। মেপে দেখা:
     PanchangScreen.js-এ ডজনখানেক বাংলা লেখার মধ্যে মাত্র ৫টা ধরা পড়ত,
     আর নতুন লেখা যোগ করলেও পরীক্ষা **সবুজই থাকত** — মিথ্যে সবুজ।
     লাইন ধরে স্ক্যান করলে একটা বেজোড় চিহ্ন কেবল ওই লাইনটাই নষ্ট করে।
     পুরো-ফাইল পাসটাও রাখা হয়েছে (দুটোর মিলন), যাতে আগে যা ধরা পড়ত
     তার একটাও হারিয়ে না যায়। */
  const scan = (text) => {
    LIT.lastIndex = 0;
    let x;
    while ((x = LIT.exec(text))) {
      const v = x[2];
      if (v.length > 140 || /[\n{<]/.test(v.replace(PH, 'X'))) continue;
      BN_G.lastIndex = 0;
      if (BN_G.test(v) && !found.has(v.trim())) found.set(v.trim(), f);
    }
  };
  scan(src);
  for (const line of src.split('\n')) scan(line);
  while ((m = JSXTXT.exec(src))) {
    const s = m[1].trim();
    if (!s || s.length > 140) continue;
    BN_G.lastIndex = 0;
    if (BN_G.test(s) && !found.has(s)) found.set(s, f);
  }

  /*  ⛔ বহু-লাইনে লেখা JSX টেক্সট — `<Text …>` আর লেখাটা আলাদা লাইনে।
      উপরের JSXTXT-এ `\n` বাদ দেওয়া আছে, তাই এই আকৃতিটা সে **দেখতেই
      পেত না**। মেপে: চারটি এমন লেখা আছে, আর নতুন একটা যোগ করার পরেও
      পরীক্ষা সবুজ থাকছিল — অর্থাৎ নতুন লেখা নীরবে অনূদিত না-হয়ে যেত। */
  /* ⛔ তৃতীয় অন্ধ দিক: **দুই বা তার বেশি লাইনে** লেখা JSX টেক্সট।
     নিচের প্যাটার্নটা ঠিক এক লাইনই ধরত, তাই
       <Text>
         প্রথম লাইন
         দ্বিতীয় লাইন
       </Text>
     ধরা পড়ত না — আর ওটাই AboutAstrologerScreen-এর পরিচিতি অনুচ্ছেদ,
     যা হিন্দি পাতাতেও বাংলাই থাকত। ফাঁক এক করে চাবি বানানো হয়
     (src/i18n/index.js-ও একই নিয়মে খোঁজে)। */
  const JSXML = />\s*\n((?:\s*[^<>{}\n]+\n)+)\s*</g;
  JSXML.lastIndex = 0;
  while ((m = JSXML.exec(src))) {
    const v = m[1].replace(/\s+/g, ' ').trim();
    if (!v || v.length > 300) continue;
    BN_G.lastIndex = 0;
    if (BN_G.test(v) && !found.has(v)) found.set(v, f);
  }
}

console.log('① প্রতিটি বাংলা লেখার en ও hi অনুবাদ');
{
  const miss = [];
  for (const [s, f] of found) {
    if (NO_TRANSLATE.has(path.relative(APP, f))) continue;
    if (NO_TRANSLATE_TEXT[s]) continue;
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

/*  ছাড়গুলো সত্যিই ন্যায্য কি না */
{
  const badEx = [];
  for (const k in NO_TRANSLATE_TEXT) {
    const e = NO_TRANSLATE_TEXT[k];
    let src = '';
    try { src = fs.readFileSync(path.join(APP, e.file), 'utf8'); }
    catch (x) { badEx.push(k + ' \u2014 file missing'); continue; }
    const at = src.indexOf(k);
    if (at < 0) { badEx.push(k + ' \u2014 no longer in that file'); continue; }
    const line = src.slice(src.lastIndexOf('\n', at) + 1, src.indexOf('\n', at));
    if (line.indexOf(e.within) < 0) badEx.push(k + ' \u2014 not inside ' + e.within + ' any more');
  }
  if (badEx.length) badEx.forEach(m => bad('\u099b\u09be\u09dc \u0986\u09b0 \u09a8\u09cd\u09af\u09be\u09af\u09cd\u09af \u09a8\u09df \u2014 ' + m));
  else ok(Object.keys(NO_TRANSLATE_TEXT).length + '\u099f\u09bf \u0985\u09a8\u09c1\u09ac\u09be\u09a6-\u099b\u09be\u09dc\u09c7\u09b0 \u0995\u09be\u09b0\u09a3 \u0995\u09cb\u09a1\u09c7 \u098f\u0996\u09a8\u09cb \u09b8\u09a4\u09cd\u09af');
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
    if (NO_TRANSLATE.has(path.relative(APP, f))) continue;
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
  /* ⚠️ একটাই ব্যতিক্রম, আর সেটা উল্টো দিক থেকেও যাচাই করা হয়:
     kundali-print.js কোনো ক্যালকুলেটর নয় — পাঠক ওটায় যানই না। ওটা
     পর্দার বাইরে এঁকে expo-print দিয়ে PDF বানানো হয়, তাই ওখানে
     MyaI18n **থাকতেই হবে**; না থাকলে ইংরেজি/হিন্দি ক্রেতা টাকা দিয়ে
     বাংলা PDF পেতেন (২০২৬-০৯-০৭-এ ঠিক সেটাই হচ্ছিল)। */
  const PRINT_NEEDS_I18N = 'kundali-print.js';
  for (const f of fs.readdirSync(wh)) {
    if (!f.endsWith('.js')) continue;
    const src = fs.readFileSync(path.join(wh, f), 'utf8');
    /* ⚠️ ২০২৬-০৯-০৮: নিয়মটা এখন **লোডার** খোঁজে, নিছক নামটা নয়।
       ওয়েবসাইটের পাতাগুলো নিজেরাই পাহারা-দেওয়া ডাক লেখে
       (`window.MyaI18n && MyaI18n.t(...)`, `if(!window.MyaEngineI18n) return`),
       তাই নাম ধরে খুঁজলে সৎ বান্ডলও লাল হতো। আসল প্রশ্ন হলো অনুবাদের
       যন্ত্রটা — js/i18n.js বা js/engine-i18n.js — বান্ডলে ইনলাইন হয়েছে
       কি না; হলে বান্ডল ভারী হয় আর file://-এ অভিধান খুঁজতে গিয়ে ব্যর্থ
       হয়। bundle-web-assets.js-এর REMOVE_SRC ওই দুটো বাদ দেয়। */
    const has = /\/\*js\/(?:engine-)?i18n\.js\*\//.test(src);
    if (f === PRINT_NEEDS_I18N) {
      /* এখানে প্রশ্নটা উল্টো — লোডার নয়, অনুবাদের **ক্ষমতা** আছে কি না */
      const canT = /MyaI18n|MyaEngineI18n/.test(src);
      canT ? ok('kundali-print.js-এ MyaI18n আছে — অনূদিত PDF সম্ভব')
           : bad('kundali-print.js-এ MyaI18n নেই — en/hi ক্রেতা বাংলা PDF পাবেন');
      continue;
    }
    if (has) { bad(`web-html/${f}-এ অনুবাদ-যন্ত্রপাতি ঢুকেছে — রুটিংয়ের যুক্তি আবার দেখুন`); withI18n++; }
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
  const pjs = fs.readFileSync(path.join(APP, 'src/screens/PanchangScreen.js'), 'utf8');
  if (lw.includes(note) && ks.includes(note) && pjs.includes(note))
    ok('নেট না থাকলে বাংলায় ফেরার কথা পাঠককে বলা হয় (নীরব নয়)');
  else bad('অফলাইন ফলব্যাক নীরব — পাঠক ইংরেজি খোলসে বাংলা ভিতর দেখতেন, কিছু না জেনে');

  /*  পঞ্জিকা ও রাশিফল — দুটোই নিজের WebView/remoteUrl চালায়, তাই
      webPath-এর তালিকায় পড়ে না এবং অনেক দিন ভাষা নির্বিশেষে বাংলাই
      দেখাত। দুটোই সাইটের সবচেয়ে বেশি-পড়া অংশ, তাই আলাদা করে পাহারা। */
  if (/myastrology\.in\/\$\{lang\}\/panjika/.test(pjs)) ok('পঞ্জিকা স্ক্রিনেও ভাষা-রুটিং বসানো');
  else bad('PanchangScreen-এ ভাষা-রুটিং নেই — ইংরেজি পাঠক বাংলা পঞ্জিকা পেতেন');

  const rs = fs.readFileSync(path.join(APP, 'src/data/rashifalSigns.js'), 'utf8');
  const rd = fs.readFileSync(path.join(APP, 'src/screens/RashifalDetailScreen.js'), 'utf8');
  if (/rashifalUrl\(rashiIndex, mode, lang\)/.test(rd) && /\$\{pre\}rashifal/.test(rs))
    ok('রাশিফলের ঠিকানাও পাঠকের ভাষায়');
  else bad('রাশিফল সবসময় বাংলা ঠিকানা খুলত — সাইটের সবচেয়ে বড় অংশ');

  {
    const need = ['panjika.html', 'rashifal/tula.html', 'rashifal/saptahik/libra.html'];
    const gone = [];
    for (const rel of need) for (const l of ['en', 'hi'])
      if (!fs.existsSync(path.join(SERVICES2, l, rel))) gone.push(l + '/' + rel);
    if (gone.length) bad('ওয়েবসাইটে নেই: ' + gone.join(', ') + ' — ওই ভাষায় ৪০৪ হতো');
    else ok('পঞ্জিকা ও রাশিফলের দুই ভাষার পাতাই ওয়েবসাইটে আছে');
  }
}

console.log('⑦ প্রথম চালুর ভাষা-পর্দা');
{
  const gate = path.join(APP, 'src/components/LanguageGate.js');
  if (!fs.existsSync(gate)) bad('LanguageGate.js নেই — হিন্দি/ইংরেজি পাঠক বাংলা পর্দায় আটকে যাবেন');
  else {
    const g = fs.readFileSync(gate, 'utf8');
    /* ব্যতিক্রমটা তখনই বৈধ যখন ফাইলটা সত্যিই তিন ভাষা বহন করে */
    const three = ['ভাষা বেছে নিন', 'भाषा चुनें', 'Choose your language'];
    const has = three.filter(t => g.includes(t));
    if (has.length === 3) ok('ভাষা-পর্দায় তিন ভাষার লেখাই আছে (তাই অনুবাদ-ছাড়টা বৈধ)');
    else bad(`ভাষা-পর্দায় ${3 - has.length}টি ভাষার লেখা নেই — ওই ভাষার পাঠক কিছু বুঝতেন না`);

    /* বোতামের লেবেল নিজের লিপিতেই থাকতে হবে */
    const labels = ['বাংলা', 'हिन्दी', 'English'];
    if (labels.every(l => g.includes(l))) ok('তিনটি বোতামের লেবেলই নিজের লিপিতে');
    else bad('ভাষা-বোতামের লেবেল নিজের লিপিতে নেই — পাঠক নিজের ভাষা চিনতে পারতেন না');

    /* App.js-এ সত্যিই বসানো আছে তো */
    const app = fs.readFileSync(path.join(APP, 'App.js'), 'utf8');
    if (/<LanguageGate\s*\/>/.test(app) && /LanguageGate/.test(app.split('\n')[0] + app))
      ok('App.js-এ পর্দাটা বসানো আছে');
    else bad('LanguageGate তৈরি হয়েছে কিন্তু App.js-এ বসানো হয়নি — কেউ দেখতেই পেত না');
  }

  /* ফোনের ভাষা নিজে থেকে **বসে যায় না**, কেবল আগে থেকে বাছা থাকে */
  const ctx = fs.readFileSync(path.join(APP, 'src/context/LanguageContext.js'), 'utf8');
  if (/CHOSEN_KEY/.test(ctx) && /deviceLang\(\)/.test(ctx)) ok('ফোনের ভাষা কেবল প্রি-সিলেক্ট, "বেছেছেন" আলাদা চাবিতে রাখা');
  else bad('প্রথম চালুর অবস্থা আলাদা করে রাখা নেই — পর্দাটা বারবার আসত, বা কখনোই আসত না');
}

console.log('⑧ ভাষা-উপসর্গওয়ালা লিংক');
{
  /* ওয়েবসাইটে একই পাতার তিনটে ঠিকানা। /en/kundali অ্যাপে এলে ওটা
     ক্যালকুলেটরেই খুলতে হবে, সাধারণ WebPage-এ নয়। */
  const lk = fs.readFileSync(path.join(APP, 'src/navigation/linking.js'), 'utf8');
  const strip = /\(en\|hi\)/.test(lk);
  if (strip) ok('deep link থেকে ভাষা-উপসর্গ ছাঁটা হয়');
  else bad('/en/… বা /hi/… লিংক কোনো পর্দার সঙ্গে মিলবে না — পাঠক সাধারণ WebPage-এ পড়বেন');

  /* ⚠️ ছাঁটার পর সাধারণ ম্যাচারকেও **ছাঁটা** ঠিকানাটাই দিতে হবে —
     আসলটা দিলে গোটা ছাঁটাই বৃথা যেত, আর সেটা নীরবে। */
  if (/getStateFromPath\(clean/.test(lk)) ok('ছাঁটা ঠিকানাটাই সাধারণ ম্যাচারে যায়');
  else bad('ম্যাচার আসল path পাচ্ছে, clean নয় — উপসর্গ ছাঁটাই কাজ করবে না');

  /* উপসর্গ দেখে ভাষা বদলে দেওয়া হয় না — একটা লিংকে চাপ দিয়ে কারো
     গোটা অ্যাপের ভাষা পাল্টে যাওয়া উচিত নয়। */
  if (!/setLang|setCurrentLang/.test(lk)) ok('লিংক দেখে অ্যাপের ভাষা বদলানো হয় না');
  else bad('linking.js ভাষা বদলাচ্ছে — শেয়ার করা লিংকে পাঠকের পছন্দ মুছে যেত');
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

/* ─── ⑨ t() যেখানে ডাকা হচ্ছে, সেখানে t সত্যিই আছে তো ───
   ⚠️ ২০২৬-০৯-০৭: HomeScreen-এর `RashiHeroRow` একটা **আলাদা** কম্পোনেন্ট,
   অথচ তাতে `t('রাশি পরিবর্তন করুন')` বসানো হয়েছিল — `t` ওখানে ছিলই না।
   ফল: পাঠক রাশি বাছার সঙ্গে সঙ্গে **অ্যাপ ভেঙে যেত** (ওই সারিটা কেবল
   রাশি বাছা থাকলেই আঁকা হয়)। পার্স-পরীক্ষা এটা ধরে না — সিনট্যাক্স
   নিখুঁত; ভুলটা কেবল চালানোর সময়ে। */
{
  console.log('\n⑨ t() ব্যবহারের জায়গায় t আছে কি না');
  const START = /^(?:export\s+)?(?:function\s+\w+|const\s+\w+\s*=\s*(?:\([^)]*\)|\w+)\s*=>)/gm;
  const bad2 = [];
  for (const f of files) {
    /* ⚠️ মন্তব্য বাদ — এই রিপোর মন্তব্য বাংলায় আর তাতে `t()` উদ্ধৃত থাকে
       (LanguageContext-এর "কেবল t() লাগলে"), তাই মন্তব্য না ছাঁটলে
       মিথ্যে লাল আসে। */
    const src = fs.readFileSync(f, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
    /* মডিউল-স্তরে `tGlobal as t` আনা থাকলে গোটা ফাইলেই t আছে */
    if (/import\s*\{[^}]*\btGlobal\s+as\s+t\b/.test(src)) continue;
    const starts = [...src.matchAll(START)].map(m => ({ i: m.index, head: m[0] }));
    if (!starts.length) continue;
    for (const m of src.matchAll(/[^\w.]t\(/g)) {
      const i = m.index;
      const before = starts.filter(x => x.i < i);
      if (!before.length) continue;
      const fnStart = before[before.length - 1];
      const nextI = (starts.find(x => x.i > i) || { i: src.length }).i;
      const body = src.slice(fnStart.i, nextI);
      /* t এসেছে হুক থেকে, নাকি প্যারামিটার হিসেবে? */
      /* WebView-এ ইনজেক্ট করা স্ক্রিপ্ট নিজের `function t(){}` বানায় —
         ওটাও বৈধ। */
      if (/const\s*\{[^}]*\bt\b[^}]*\}\s*=\s*use|const\s+t\s*=\s*use|\bt\s*=>|function\s+t\s*\(/.test(body)) continue;
      if (/\(\s*t\s*[,)]|,\s*t\s*[,)]/.test(fnStart.head)) continue;
      bad2.push(path.relative(APP, f) + ':' + (src.slice(0, i).split('\n').length)
                + '  (' + fnStart.head.trim().slice(0, 40) + ')');
    }
  }
  if (!bad2.length) ok('প্রতিটি t() ডাকার জায়গাতেই t সংজ্ঞায়িত');
  else bad('t নেই এমন জায়গায় t() ডাকা হচ্ছে — চালালেই অ্যাপ ভাঙবে:\n      ' + bad2.join('\n      '));
}

/* ─── ⑩ ভাষা-বদলের সারি অ্যাপে ঢাকা কি না ───
   অ্যাপে ভাষা ঠিক হয় Settings থেকে। পাতার নিজের সারিটা **সেটাকে না
   জানিয়েই** ঠিকানা বদলে দেয়, ফলে অ্যাপ ভাবে বাংলা আর পাতা দেখায়
   ইংরেজি। ⚠️ ওয়েবসাইটে সারিটা থাকতেই হবে (আসল <a href>, আর verify-seo
   গোনে) — তাই মোছা নয়, কেবল অ্যাপে CSS দিয়ে ঢাকা। */
{
  console.log('\n⑩ ভাষা-বদলের সারি অ্যাপে ঢাকা');
  const hp = path.join(APP, 'src/utils/hideWebChrome.js');
  if (!fs.existsSync(hp)) { bad('hideWebChrome.js নেই'); }
  else {
    const h = fs.readFileSync(hp, 'utf8');
    if (/\[class\*="mya-lang"\]/.test(h) && /display:none/.test(h))
      ok('সব রকম mya-lang সুইচার এক নিয়মে ঢাকা');
    else bad('সুইচারের নিয়মটা নেই — সারিটা অ্যাপে দেখা যাবে');

    /* ⚠️ অ্যাপের ভিতরে "অ্যাপ ডাউনলোড করুন" বিজ্ঞাপন অর্থহীন —
       পাঠক তো অ্যাপেই আছেন। ওয়েবসাইটে ওটা থাকতেই হবে। */
    if (/rf-app-card/.test(h) && /play\.google\.com/.test(h))
      ok('Play-স্টোরের বিজ্ঞাপন অ্যাপে ঢাকা');
    else bad('অ্যাপের ভিতরেই "অ্যাপ ডাউনলোড করুন" বিজ্ঞাপন দেখা যাবে');

    /* ব্যাক চাপলে ফাঁকা পর্দা — তালিকা দুটো এক জায়গায় থাকা চাই,
       আর দুই WebView-ই সেটাই পড়া চাই। */
    if (/RESULTS_CONTAINER_IDS/.test(h) && /FORM_CONTAINER_IDS/.test(h))
      ok('ব্যাক-এ ফর্ম ফেরানোর তালিকা এক উৎসে');
    else bad('তালিকাদুটো শেয়ার্ড ফাইলে নেই — দুই কপি একদিন সরে যাবে');
    for (const f of ['src/components/LocalWebView.js', 'src/screens/KundaliScreen.js']) {
      const src = fs.readFileSync(path.join(APP, f), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
      if ((src.match(/makeHideResultsJS/g) || []).length >= 2)
        ok(path.basename(f) + ' — ব্যাক-এ ফর্ম ফিরিয়ে আনে');
      else bad(path.basename(f) + ' — ব্যাক চাপলে পর্দা ফাঁকা হয়ে যাবে');
    }

    /* দুটো WebView, দুটোতেই বসাতে হয় — কুণ্ডলী নিজেরটা চালায়। */
    for (const f of ['src/components/LocalWebView.js', 'src/screens/KundaliScreen.js']) {
      const src = fs.readFileSync(path.join(APP, f), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
      const used = (src.match(/HIDE_LANG_SWITCH_JS/g) || []).length;
      if (used >= 2) ok(path.basename(f) + ' — সারিটা ঢাকা হয়');
      else bad(path.basename(f) + ' — সারিটা ঢাকা হয় না (import + ব্যবহার দুটোই লাগে)');
    }
  }
}

console.log(`\n${fail ? '❌' : '✅'} ${checks}টি পরীক্ষা, ${fail}টি সমস্যা`);
process.exit(fail ? 1 : 0);
