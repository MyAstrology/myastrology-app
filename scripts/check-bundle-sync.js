#!/usr/bin/env node
/**
 * ওয়েবসাইটের পাতা আর অ্যাপের বান্ডল কতটা মিলছে, তা মেপে দেখায়।
 *
 * কেন দরকার (#১৭-এর মূল সমাধান): ওয়েবসাইটের `kundali.html` ইত্যাদির একটা
 * করে কপি এই রিপোতে `src/web-html/*.js`-এ বসানো আছে। ওয়েবসাইটে কিছু ঠিক
 * করলে অ্যাপে আপনাআপনি যায় না — হাতে বসাতে হয়। কেউ ভুলে গেলে অ্যাপ নীরবে
 * পুরোনো সংস্করণে আটকে থাকে, আর সেটা ফোনে না দেখা পর্যন্ত ধরা পড়ে না।
 *
 * ২০২৬-০৮-০২-এ ঠিক এটাই ঘটেছিল: ওয়েবসাইটের numerology.html-এ আইকনগুলো
 * অনেক আগেই ইমোজি থেকে SVG-তে বদলানো হয়েছিল (১৬৯টা svg), কিন্তু অ্যাপের
 * কপিতে ছিল মাত্র ৭২টা — ৫৭টা ইমোজি রয়ে গিয়েছিল।
 *
 * এই স্ক্রিপ্ট *হুবহু* মিল খোঁজে না (অ্যাপের বান্ডলে ইচ্ছাকৃত হাতে-করা
 * পরিবর্তন থাকে — ছবি এমবেড, PDF পাইপলাইন, স্ক্রিন-নেভিগেশন)। বরং কয়েকটা
 * সহজে-গোনা সংকেত মেলায়, যেগুলো বেশি ফারাক দেখালে বুঝতে হবে বান্ডল পুরোনো।
 *
 * চালান:  node scripts/check-bundle-sync.js
 * ওয়েবসাইট রিপো না থাকলে চুপচাপ বেরিয়ে যায় (exit 0) — CI ভাঙে না।
 */

const fs   = require('fs');
const path = require('path');

const SITE = path.resolve(__dirname, '..', '..', 'services');
const BUNDLES = path.join(__dirname, '..', 'src', 'web-html');

if (!fs.existsSync(SITE)) {
  console.log('ℹ️  ওয়েবসাইট রিপো (../services) এখানে নেই — যাচাই বাদ দেওয়া হলো।');
  process.exit(0);
}

// অ্যাপের বান্ডল ↔ ওয়েবসাইটের পাতা
const PAGES = {
  'kundali':      'kundali.html',
  'match-making': 'match-making.html',
  'namakaran':    'namakaran.html',
  'numerology':   'numerology.html',
  'prashna':      'prashna.html',
  'varshaphala':  'varshaphala.html',
  'result':       'result.html',
  'panjika':      'panjika.html',
};

// অ্যাপের বান্ডলে ইচ্ছাকৃতভাবে বেশি থাকা স্বাভাবিক (হাতে যোগ করা অংশ),
// তাই কেবল "ওয়েবসাইটে আছে অথচ অ্যাপে কম" সেটাই সমস্যা হিসেবে ধরা হয়।
const SVG_GAP_LIMIT = 8;      // এর বেশি svg কম থাকলে সতর্কতা
const EMOJI_ICONS = ['📅','💎','🎨','🧭','📱','🚗','🏢','🔢','📜','🔮','⭐'];

function unescapeBundle(s) {
  return s.replace(/\\"/g, '"').replace(/\\n/g, '\n');
}

// ওয়েবসাইটের পাতা তার বেশিরভাগ কোড *আলাদা* ফাইল থেকে লোড করে
// (<script src="js/renderers/…">), কিন্তু অ্যাপের বান্ডলে সেসব ভিতরেই
// ঢুকিয়ে দেওয়া হয়। তাই শুধু .html-এর সাথে মেলালে ভুল সতর্কতা আসে —
// প্রথমবার চালিয়ে ঠিক এই ফাঁদেই পড়েছিলাম (result পাতায় ৫৩টা "বাসি ইমোজি"
// দেখাচ্ছিল, যেগুলো আসলে বাইরের রেন্ডারার-ফাইলে ছিল)। তাই লিংক করা
// লোকাল স্ক্রিপ্টগুলোও পড়ে একসাথে জুড়ে নেওয়া হয়।
function readPageWithScripts(htmlPath) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  const dir = path.dirname(htmlPath);
  const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
  // kundali.html স্ক্রিপ্টগুলো *চলার সময়* লোড করে (CALC_SCRIPTS + createElement),
  // <script src="…"> ট্যাগ দিয়ে নয় — সেগুলোও ধরতে হবে, নাহলে ওই ফাইলগুলোর
  // বিষয়বস্তু "অ্যাপে আছে অথচ ওয়েবসাইটে নেই" বলে ভুল সতর্কতা দেয়।
  const calcBlock = html.match(/CALC_SCRIPTS\s*=\s*\[([\s\S]{0,4000}?)\]/);
  if (calcBlock) {
    for (const m of calcBlock[1].matchAll(/'([^']+)'/g)) srcs.push(m[1]);
  }
  for (const raw of srcs) {
    if (/^https?:\/\//i.test(raw)) continue;          // বাইরের CDN — বাদ
    const rel = raw.split('?')[0].replace(/^\//, '');
    for (const base of [dir, SITE]) {
      const p = path.join(base, rel);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        html += '\n' + fs.readFileSync(p, 'utf8');
        break;
      }
    }
  }
  return html;
}

/* ── ইনলাইন করা ইঞ্জিন-ফাইল হুবহু মেলানো ──────────────────────────────
   উপরের svg/ইমোজি গোনাগুলো "পাতা কতটা পুরোনো" তার আন্দাজ দেয় মাত্র — গণনার
   ভিতরের পরিবর্তন ওতে ধরা পড়ে না। ২০২৬-০৮-০৩-এ ঠিক সেটাই ঘটেছিল: অ্যাপের
   কুণ্ডলী পাতায় "জীবন" ট্যাবে বয়স-অনুযায়ী ৫টার বদলে ১২টা বিষয় আসছিল, আর
   বর্ষফল ইঞ্জিন সায়ন (tropical) দ্রাঘিমাংশে গ্রহ বসাচ্ছিল — দুটোই ওয়েবসাইটে
   অনেক আগে ঠিক হয়েছিল, বান্ডলে পোর্ট হয়নি। svg-সংখ্যা তখনও নিখুঁত মিলছিল।

   বান্ডলার প্রতিটা ইনলাইন করা ফাইলের আগে একটা কমেন্ট-চিহ্ন বসায় (ফাইলের পথ
   একটা ব্লক-কমেন্টে মোড়া, যেমন src/maha-dasha.js) — সেই চিহ্ন MARKER_RE
   ধরে ভিতরের কপিটা ওয়েবসাইটের আসল ফাইলের সাথে অক্ষরে-অক্ষরে মেলানো
   যায়। এখানে হাতে-করা প্যাচ থাকে না (প্যাচগুলো পাতার নিজস্ব HTML/স্ক্রিপ্টে),
   তাই হুবহু মিল দাবি করা নিরাপদ।

   KNOWN_DRIFT: যেগুলো ইচ্ছাকৃতভাবে আলাদা, সেগুলো এখানে লিখে রাখুন — নতুন
   ফারাক তখনই সতর্কতা দেবে, পুরোনো জানা ফারাক নয়। এখন খালি: কোনো ইনলাইন
   ফাইলই ইচ্ছাকৃতভাবে আলাদা নয়, তাই সবগুলোই হুবহু মিলতে হবে। */
const KNOWN_DRIFT = {
  /* ২০২৬-০৮-০৪ — মালিকের নির্দেশ: অ্যাপে কপি ও প্রিন্টের বোতাম থাকবে না,
     শুধু "অ্যাপ শেয়ার করুন" (Play Store লিঙ্ক)। কারণ WebView-এ
     ব্রাউজারের print চলে না, আর file:// অরিজিনে ক্লিপবোর্ডের অনুমতিও
     নেই — দুটো বোতামই অ্যাপে নিষ্ফল ছিল। বোতাম দুটো বাদ দেওয়া ও
     shareApp() যোগ করায় এই দুই ফাইল ওয়েবসাইট থেকে আলাদা।
     ফের পোর্ট করার সময় ওই বদলগুলো আবার বসাতে হবে —
     scratchpad/port-result.js-এর ধাপ ২ দ্রষ্টব্য। */
  'result': ['js/main.js', 'js/renderers/compatibility-renderer.js'],
};

const MARKER_RE = /\/\*((?:src|js)\/[A-Za-z0-9_\-./]+\.js)\*\//g;

/* ── src/engine/ — বান্ডলের বাইরের তৃতীয় কপি ──────────────────────────
   PanchangScreen ইত্যাদি নেটিভ স্ক্রিন এই ফাইলগুলো সরাসরি import করে,
   WebView বান্ডলের মধ্য দিয়ে নয়। ফলে উপরের কোনো পরীক্ষাই এদের ছুঁত না।
   ২০২৬-০৮-০৩-এ ধরা পড়ল: ওয়েবসাইটে src/adhika-masa.js দিয়ে গণনা করে
   ২০২৭/২০২৮/২০৩০-এর মনগড়া মলমাস বাদ দেওয়ার পরও এই কপিতে সেগুলো রয়ে
   গিয়েছিল — ভুল মলমাস মানে ওই মাসের উৎসবগুলোও ভুল। */
function checkEngineCopies() {
  const dir = path.join(__dirname, '..', 'src', 'engine');
  if (!fs.existsSync(dir)) return [];
  const stale = [];
  for (const f of fs.readdirSync(dir)) {
    const web = path.join(SITE, 'src', f);
    if (!fs.existsSync(web)) continue;          // অ্যাপের নিজস্ব ফাইল — মেলানোর কিছু নেই
    if (fs.readFileSync(path.join(dir, f), 'utf8').trim() !== fs.readFileSync(web, 'utf8').trim()) {
      stale.push('src/engine/' + f);
    }
  }
  return stale.length
    ? [`src/engine: ${stale.length}টি ফাইল ওয়েবসাইটের সাথে মিলছে না (${stale.join(', ')}) — পোর্ট করা বাকি।`]
    : [];
}

/* ── বার্ষিক পঞ্জিকা PDF-এর প্রিন্ট CSS ────────────────────────────────
   ওয়েবসাইটে PDF হয় ব্রাউজারের "Save as PDF" দিয়ে, তাই নিয়মগুলো
   @media print-এর ভিতরে। অ্যাপে PDF হয় expo-print দিয়ে (WebView → static
   HTML), যেখানে media query নির্ভরযোগ্যভাবে চলে না — তাই PanchangScreen.js
   একই নিয়মগুলোর একটা মোড়ক-ছাড়া কপি (YEARLY_PRINT_CSS) রাখে।

   অর্থাৎ এটা হাতে রাখা দ্বিতীয় কপি: ওয়েবসাইটের প্রিন্ট-নকশা বদলালে এখানেও
   বদলাতে হবে, নইলে একই বছরের পঞ্জিকা দুই জায়গা থেকে নামালে দেখতে আলাদা
   হবে (পৃষ্ঠা-ভাগ, লেখার আকার, মলমাস ব্যানার — সবই এই নিয়মে ঠিক হয়)।
   ব্যবহারকারী দুটো মিলিয়ে দেখলে সঙ্গে সঙ্গে চোখে পড়ে, অথচ কোডে নীরব। */
function checkYearlyPrintCss() {
  const appFile = path.join(__dirname, '..', 'src', 'screens', 'PanchangScreen.js');
  const webFile = path.join(SITE, 'panjika.html');
  if (!fs.existsSync(appFile) || !fs.existsSync(webFile)) return [];

  const appSrc = fs.readFileSync(appFile, 'utf8');
  const MARK = 'const YEARLY_PRINT_CSS = `';
  const a = appSrc.indexOf(MARK);
  if (a < 0) return ['PanchangScreen.js-এ YEARLY_PRINT_CSS পাওয়া গেল না — নাম বদলেছে?'];
  const appCss = appSrc.slice(a + MARK.length, appSrc.indexOf('`;', a));

  // ওয়েবসাইটের সব @media print ব্লক (ব্যালান্সড ব্রেস, নেস্টেড নিয়মসহ)
  const html = fs.readFileSync(webFile, 'utf8');
  let webCss = '';
  const re = /@media\s+print\s*\{/g;
  let m;
  while ((m = re.exec(html))) {
    let depth = 1, i = m.index + m[0].length;
    for (; i < html.length && depth > 0; i++) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}') depth--;
    }
    webCss += html.slice(m.index + m[0].length, i - 1) + '\n';
  }

  // বার্ষিক পঞ্জিকা সংক্রান্ত নিয়মগুলোই কেবল মেলানো হয় — কুণ্ডলী/অন্য
  // পাতার প্রিন্ট নিয়ম এই স্ক্রিনের সাথে সম্পর্কিত নয়
  const RELEVANT = /yp-|yearlyPanjika|@page|pdfPromoOverlay|payOverlay/;
  const rules = css => {
    const map = new Map();
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const r of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = r[1].trim().replace(/\s+/g, ' ');
      if (RELEVANT.test(sel)) map.set(sel, r[2].replace(/\s+/g, '').replace(/;$/, ''));
    }
    return map;
  };
  const W = rules(webCss), A = rules(appCss);
  const missing = [...W.keys()].filter(k => !A.has(k));
  const extra   = [...A.keys()].filter(k => !W.has(k));
  const differ  = [...W.keys()].filter(k => A.has(k) && A.get(k) !== W.get(k));

  const out = [];
  if (missing.length) out.push(`বার্ষিক পঞ্জিকা PDF: ওয়েবসাইটের ${missing.length}টি প্রিন্ট-নিয়ম অ্যাপে নেই (${missing.slice(0, 5).join(', ')}) — অ্যাপের PDF আলাদা দেখাবে।`);
  if (extra.length)   out.push(`বার্ষিক পঞ্জিকা PDF: অ্যাপে ${extra.length}টি বাড়তি প্রিন্ট-নিয়ম (${extra.slice(0, 5).join(', ')}) — ওয়েবসাইটে নেই।`);
  if (differ.length)  out.push(`বার্ষিক পঞ্জিকা PDF: ${differ.length}টি প্রিন্ট-নিয়মের মান আলাদা (${differ.slice(0, 5).join(', ')})।`);
  return out;
}

function checkInlinedEngines(name, bundleRaw) {
  let decoded;
  try {
    decoded = JSON.parse(bundleRaw.replace(/^[\s\S]*?export default /, '').replace(/;\s*$/, ''));
  } catch (e) {
    return [`${name}: বান্ডল স্ট্রিং হিসেবে পড়া গেল না — ${e.message}`];
  }
  const allowed = KNOWN_DRIFT[name] || [];
  const stale = [];
  const seen = new Set();
  for (const m of decoded.matchAll(MARKER_RE)) {
    const rel = m[1];
    if (seen.has(rel) || allowed.includes(rel)) continue;
    seen.add(rel);
    const srcPath = path.join(SITE, rel);
    if (!fs.existsSync(srcPath)) continue;
    const start = m.index + m[0].length;
    const end = decoded.indexOf('</script>', start);
    if (end < 0) continue;
    if (decoded.slice(start, end).trim() !== fs.readFileSync(srcPath, 'utf8').trim()) stale.push(rel);
  }
  return stale.length
    ? [`${name}: ইনলাইন করা ${stale.length}টি ফাইল ওয়েবসাইটের সাথে মিলছে না ` +
       `(${stale.join(', ')}) — পোর্ট করা বাকি।`]
    : [];
}

/* ── পাতার নিজস্ব ফাংশন মেলানো ────────────────────────────────────────
   উপরের পরীক্ষা কেবল ইনলাইন করা *ফাইল* ধরে। কিন্তু ওয়েবসাইটের অনেক কাজ
   পাতার নিজের <script> ব্লকে থাকে, আর সেখানেই সবচেয়ে বেশি পোর্ট বাকি পড়ে
   ছিল: কুণ্ডলীর "যোগের গ্রহবল", "লগ্নভিত্তিক গ্রহ-প্রকৃতি ও মারক", ভাবপতি
   জোড়ার ১২টি যোগ, তাজিক যোগ/পুণ্য সহম, বর্ষফলের "বছরের সামগ্রিক রায়" ও
   মুদ্দা দশা — সবই ওয়েবসাইটে ছিল, অ্যাপে ছিল না।

   তাই দুই দিকের নামযুক্ত ফাংশনের শরীর তুলে এনে মেলানো হয় (কমেন্ট ও
   সাদা-স্পেস বাদ দিয়ে — বান্ডলে কমেন্ট ছাঁটা থাকতে পারে, সেটা সমস্যা নয়)।

   INTENDED_FN_DIFF: যেসব ফাংশন অ্যাপে ইচ্ছাকৃতভাবে আলাদা (PDF পাইপলাইন,
   অফলাইন নেভিগেশন, ইনলাইন করা শহর-তালিকা, শুধু-SEO schema) — নতুন কিছু
   আলাদা হলে তবেই সতর্কতা আসবে। */
const INTENDED_FN_DIFF = {
  // loadCalcScripts — অ্যাপে সব স্ক্রিপ্ট বান্ডলেই ঢোকানো, রানটাইমে লোড করার নেই।
  // _openSamplePdf — WebView-এ নতুন ট্যাব খোলে না, তাই location.href
  'kundali': ['loadCalcScripts', '_openSamplePdf'],
  // PDF অ্যাপে expo-print দিয়ে হয়, ব্রাউজারের print/নতুন ট্যাব দিয়ে নয়
  'match-making': ['_doMatchPrint', '_mmOpenSamplePdf'],
  // অফলাইন ফাইল বলে 'result' নয়, 'result.html'-এ যেতে হয়
  'numerology': ['nav'],
  'result': ['doTry'],
  // ওয়েবসাইট CITY_DB (২২৮ KB) দেরিতে নামায়, অ্যাপে সেটা বান্ডলেই আছে;
  // schema/JSON-LD কেবল Google-এর জন্য — WebView-এ নিষ্ক্রিয়
  'panjika': ['_applyCity', 'openCityModal', '_cityFilter', '_ensureCityDB',
              '_cityDbResolveSel', 'renderTodayEvents', '_buildEventSchema',
              '_writePjSchema'],
};

/* বান্ডলের অখণ্ডতা — ওয়েবসাইটের পাতা তার কোড বাইরের ফাইল থেকে <script src="…">
   দিয়ে টানে; বান্ডলে সেসব ভিতরে ঢোকানো থাকে। তাই বান্ডলে একটাও বাইরের
   /js/ বা /src/ স্ক্রিপ্ট-ট্যাগ থাকার কথা নয় — থাকলে বুঝতে হবে পোর্ট করতে
   গিয়ে ওয়েবসাইটের কাঁচা HTML ঢুকে পড়েছে (একবার ঠিক তাই হয়েছিল: একটা ভুল
   ব্রেস-ম্যাচার বান্ডলের শেষ অংশ — mya-auth/mya-profiles/mya-cloud-sync-এর
   ইনলাইন কপি — মুছে দিয়েছিল, অথচ ফাইলটা দিব্যি পার্স হচ্ছিল)। */
function checkBundleIntact(name, bundleRaw) {
  let decoded;
  try {
    decoded = JSON.parse(bundleRaw.replace(/^[\s\S]*?export default /, '').replace(/;\s*$/, ''));
  } catch (e) { return []; }
  const leaked = decoded.match(/<script[^>]+src="\/(?:js|src)\/[^"]*"/g);
  return leaked
    ? [`${name}: বান্ডলে ওয়েবসাইটের বাইরের স্ক্রিপ্ট-ট্যাগ ঢুকে পড়েছে ` +
       `(${leaked.length}টি) — ইনলাইন কপি মুছে গেছে, ফাইলটা আগের অবস্থায় ফেরান।`]
    : [];
}

const FN_RE = /(?:^|\n)\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g;

/* ফাংশনের বডি { … } ব্যালান্সড-ব্রেস গুনে তোলে; স্ট্রিং ও কমেন্টের ভিতরের
   ব্রেস টপকে যায়, নাহলে একটা রেগেক্স-লিটারেলেই হিসাব ঘেঁটে যেত। */
function fnBodies(src) {
  const out = new Map();
  FN_RE.lastIndex = 0;
  let m;
  while ((m = FN_RE.exec(src))) {
    const start = src.indexOf('{', m.index + m[0].length - 1);
    if (start < 0) continue;
    let depth = 0, end = -1;
    for (let i = start; i < src.length; i++) {
      const c = src[i];
      if (c === '"' || c === "'" || c === '`') {
        const q = c; i++;
        while (i < src.length && !(src[i] === q && src[i - 1] !== '\\')) i++;
        continue;
      }
      if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    if (end < 0) continue;
    if (!out.has(m[1])) out.set(m[1], src.slice(start, end));
  }
  return out;
}
const stripNoise = s => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

// বান্ডল থেকে ইনলাইন করা ইঞ্জিন-ফাইল বাদ — সেগুলো উপরে আলাদা করে মিলছে,
// আর একই নামের ফাংশন দু'জায়গায় থাকলে ভুল জোড়া মিলে যেত
function pageScriptOnly(decoded) {
  let out = '', pos = 0;
  const re = new RegExp(MARKER_RE.source, 'g');
  let m;
  while ((m = re.exec(decoded))) {
    out += decoded.slice(pos, m.index);
    const e = decoded.indexOf('</script>', m.index);
    pos = e < 0 ? m.index + m[0].length : e;
    re.lastIndex = pos;
  }
  return out + decoded.slice(pos);
}
const inlineScriptsOf = html =>
  [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

function checkPageFunctions(name, bundleRaw, webHtml) {
  let decoded;
  try {
    decoded = JSON.parse(bundleRaw.replace(/^[\s\S]*?export default /, '').replace(/;\s*$/, ''));
  } catch (e) { return []; }
  const allowed = INTENDED_FN_DIFF[name] || [];
  const appFns = fnBodies(pageScriptOnly(decoded));
  const webFns = fnBodies(inlineScriptsOf(webHtml));
  const missing = [], changed = [];
  for (const [fn, body] of webFns) {
    if (allowed.includes(fn)) continue;
    const web = stripNoise(body);
    if (web.length < 60) continue;                 // ছোট মোড়ক — শব্দ বাড়ায় শুধু
    if (!appFns.has(fn)) missing.push(fn);
    else if (stripNoise(appFns.get(fn)) !== web) changed.push(fn);
  }
  const out = [];
  if (missing.length) out.push(`${name}: ওয়েবসাইটের ${missing.length}টি ফাংশন অ্যাপে নেই (${missing.join(', ')}) — পোর্ট করা বাকি।`);
  if (changed.length) out.push(`${name}: ${changed.length}টি ফাংশন ওয়েবসাইটের সাথে মিলছে না (${changed.join(', ')}) — পোর্ট করা বাকি।`);
  return out;
}

let warnings = [...checkEngineCopies(), ...checkYearlyPrintCss()];
let rows = [];

for (const [name, htmlFile] of Object.entries(PAGES)) {
  const bundlePath = path.join(BUNDLES, name + '.js');
  const htmlPath   = path.join(SITE, htmlFile);
  if (!fs.existsSync(bundlePath) || !fs.existsSync(htmlPath)) continue;

  const web = readPageWithScripts(htmlPath);
  const bundleRaw = fs.readFileSync(bundlePath, 'utf8');
  const app = unescapeBundle(bundleRaw);

  warnings.push(...checkBundleIntact(name, bundleRaw));
  warnings.push(...checkInlinedEngines(name, bundleRaw));
  warnings.push(...checkPageFunctions(name, bundleRaw, fs.readFileSync(htmlPath, 'utf8')));

  const webSvg = (web.match(/<svg/g) || []).length;
  const appSvg = (app.match(/<svg/g) || []).length;
  const svgGap = webSvg - appSvg;

  // ওয়েবসাইট যে আইকন-ইমোজিগুলো ছেড়ে দিয়েছে, অ্যাপে সেগুলো রয়ে গেছে কি না
  let staleEmoji = 0;
  const staleList = [];
  for (const e of EMOJI_ICONS) {
    const w = (web.split(e).length - 1);
    const a = (app.split(e).length - 1);
    if (w === 0 && a > 0) { staleEmoji += a; staleList.push(`${e}×${a}`); }
  }

  rows.push({ name, webSvg, appSvg, svgGap, staleEmoji });

  if (svgGap > SVG_GAP_LIMIT) {
    warnings.push(
      `${name}: ওয়েবসাইটে ${webSvg}টি svg, অ্যাপে ${appSvg}টি — ${svgGap}টি কম। ` +
      `বান্ডলটা সম্ভবত পুরোনো।`
    );
  }
  if (staleEmoji > 0) {
    warnings.push(
      `${name}: ওয়েবসাইট যে আইকন-ইমোজি আর ব্যবহার করে না, অ্যাপে সেগুলো ` +
      `${staleEmoji}টি রয়ে গেছে (${staleList.join(', ')}) — SVG-তে পোর্ট করা বাকি।`
    );
  }
}

console.log('পাতা            ওয়েবসাইট svg   অ্যাপ svg   পার্থক্য   বাসি ইমোজি');
console.log('─'.repeat(64));
for (const r of rows) {
  const flag = (r.svgGap > SVG_GAP_LIMIT || r.staleEmoji > 0) ? ' ⚠' : ' ✓';
  console.log(
    r.name.padEnd(16) +
    String(r.webSvg).padStart(8) +
    String(r.appSvg).padStart(12) +
    String(r.svgGap).padStart(10) +
    String(r.staleEmoji).padStart(12) + flag
  );
}
console.log('');

if (warnings.length) {
  console.error('⚠️  বান্ডল ও ওয়েবসাইটের মধ্যে ফারাক:\n');
  warnings.forEach(w => console.error('  · ' + w));
  console.error('\nএটা সবসময় ভুল নয় — কিছু পাতায় অ্যাপের নিজস্ব হাতে-করা');
  console.error('পরিবর্তন থাকে। কিন্তু দেখে নিশ্চিত হয়ে নিন।');
  process.exit(1);
}
console.log('✅ সব বান্ডল ওয়েবসাইটের সাথে যথেষ্ট মিলছে');
