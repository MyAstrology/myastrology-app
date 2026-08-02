#!/usr/bin/env node
/**
 * অ্যাপের WebView স্ক্রিনগুলোর APP_CSS যাচাই করে — বিল্ড করার আগেই।
 *
 * কেন দরকার (২০২৬-০৮-০২-এর শিক্ষা): এই প্রকল্পে প্রতিটা ক্যালকুলেটর স্ক্রিন
 * ওয়েবসাইটের পেজের উপর একগাদা `!important` CSS চাপিয়ে দেয়। এখান থেকে দুই
 * রকম ভুল বারবার হয়েছে, দুটোই ফোনে না দেখা পর্যন্ত ধরা পড়ে না:
 *
 *   ১) একই সিলেক্টর দুবার লেখা — পরেরটা আগেরটাকে নীরবে হারিয়ে দেয়।
 *      (নামকরণ হিরোর রঙ ঠিক করতে গিয়ে ঠিক এটাই হয়েছিল: নতুন গাঢ় রঙ
 *      লিখেছিলাম, কিন্তু নিচে পুরোনো হালকা রঙের নিয়ম রয়ে গিয়েছিল।)
 *
 *   ২) ব্যাকগ্রাউন্ড বদলানো হয়েছে কিন্তু ভিতরের লেখা/আইকনের রঙ বদলানো হয়নি —
 *      গাঢ়ের উপর গাঢ়, বা হালকার উপর হালকা। (বর্ষফলের GPS চিহ্ন এভাবেই
 *      সম্পূর্ণ অদৃশ্য হয়ে গিয়েছিল।)
 *
 * চালান: node scripts/check-webview-css.js
 * ব্যর্থ হলে exit code 1 — অর্থাৎ বিল্ড করার আগে ঠিক করে নিন।
 */

const fs   = require('fs');
const path = require('path');

const SCREENS_DIR = path.join(__dirname, '..', 'src', 'screens');

// একটা JS ফাইল থেকে APP_CSS/MM_CSS ইত্যাদি template-string CSS ব্লকগুলো তোলে
function extractCssBlocks(src) {
  const blocks = [];
  const re = /const\s+([A-Z_][A-Z0-9_]*(?:CSS))\s*=\s*`/g;
  let m;
  while ((m = re.exec(src))) {
    const start = m.index + m[0].length;
    const end = src.indexOf('`', start);
    if (end > start) blocks.push({ name: m[1], css: src.slice(start, end) });
  }
  return blocks;
}

// CSS-কে { selector, body } তালিকায় ভাঙে (মন্তব্য বাদ দিয়ে)
function parseRules(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(clean))) {
    const sel = m[1].trim().replace(/\s+/g, ' ');
    if (!sel || sel.startsWith('@')) continue;
    rules.push({ sel, body: m[2] });
  }
  return rules;
}

// একটা হেক্স রঙ "গাঢ়" কিনা — আনুমানিক উজ্জ্বলতা দিয়ে
function isDarkHex(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 110;
}

// গাঢ় ব্যাকগ্রাউন্ড ধরা। আগে শুধু `background:#0a192f` ধরনের সরাসরি হেক্স
// ধরত — কিন্তু এই প্রকল্পের প্রায় সব গাঢ় কার্ড gradient দিয়ে বানানো
// (`background:linear-gradient(135deg,#2d0060,#1a0040)`), সেগুলো পুরোপুরি
// বাদ পড়ে যেত। বিবাহ-মিলনের বিজ্ঞাপন কার্ডের আইকন অদৃশ্য হওয়ার বাগটা
// (২ অগাস্ট) এই অন্ধ জায়গাতেই লুকিয়ে ছিল — নিয়মটা এই স্ক্রিপ্ট পড়েও
// দেখেনি। এখন gradient-ও ধরা হয়: ঘোষণার সব হেক্স রঙ গাঢ় হলে গাঢ় ধরা হয়।
function darkBg(body) {
  const m = body.match(/(?:^|;)\s*background(?:-color|-image)?\s*:([^;]+)/i);
  if (!m) return false;
  const hexes = m[1].match(/#[0-9a-f]{3,8}\b/gi);
  if (!hexes || !hexes.length) return false;
  return hexes.every(isDarkHex);
}

const hasColour = b => /(^|;|\s)color\s*:/.test(b);
const hasStroke = b => /(^|;|\s)(stroke|fill)\s*:/.test(b);
// আইকন রাখার ঘর — নামে icon/ico আছে, বা সরাসরি svg-কে লক্ষ্য করে
const isIconSel = s => /(^|[.#\-\s>])(icon|ico)\b|-icon\b|\bsvg\b/i.test(s);

// যাচাই করে অনুমোদিত — এগুলো গাঢ় ব্যাকগ্রাউন্ড দেয় ঠিকই, কিন্তু ভিতরের
// উপাদানের রঙ আলাদা *ক্লাসে* দেওয়া আছে (নামের মিল না থাকায় স্ক্রিপ্ট
// আপনাআপনি ধরতে পারে না)। তালিকায় যোগ করার আগে চোখে দেখে নিশ্চিত করবেন —
// নাহলে এই ছাড়টাই একদিন আসল বাগ লুকিয়ে দেবে।
//   #tabNav      → ভিতরে .tab-btn    { color: rgba(255,255,255,0.8)  }
//   .mm-tabbar   → ভিতরে .mm-tab-btn { color: rgba(255,255,255,0.75) }
//   #premiumBtn  → এটা একটা .tab-btn; রঙ ও আইকনের stroke .tab-btn ও
//   #cspBtn        .tab-btn svg.tab-icon নিয়মে আগেই দেওয়া আছে
//   .ds-cur-md-box>.ds-ad-box-hdr → শুধু background override করে;
//                  .ds-ad-box-hdr{color:#fff} মূল নিয়মেই আছে
//   .nc-header-band → ভিতরে .nc-eyebrow / .nc-name হালকা সোনালি রঙ দেয়
const VERIFIED_OK = new Set([
  '#tabNav', '.mm-tabbar',
  '#premiumBtn', '#cspBtn',
  '.ds-cur-md-box>.ds-ad-box-hdr',
  '.nc-header-band',
]);

let problems = [];

for (const file of fs.readdirSync(SCREENS_DIR).filter(f => f.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(SCREENS_DIR, file), 'utf8');
  for (const { name, css } of extractCssBlocks(src)) {
    const rules = parseRules(css);

    // ① একই সিলেক্টর একাধিকবার + একই property দুবার সেট
    const bySel = new Map();
    rules.forEach((r, i) => {
      if (!bySel.has(r.sel)) bySel.set(r.sel, []);
      bySel.get(r.sel).push({ ...r, i });
    });
    for (const [sel, list] of bySel) {
      if (list.length < 2) continue;
      const props = new Map();
      for (const r of list) {
        for (const p of r.body.split(';')) {
          const k = p.split(':')[0].trim().toLowerCase();
          if (!k) continue;
          if (!props.has(k)) props.set(k, []);
          props.get(k).push(r.i);
        }
      }
      const clashing = [...props.entries()].filter(([, idxs]) => idxs.length > 1);
      if (clashing.length) {
        problems.push(
          `${file} → ${name}: "${sel}" একাধিকবার লেখা, একই property দুবার সেট ` +
          `(${clashing.map(([k]) => k).join(', ')}) — শেষেরটাই টিকবে, আগেরটা নীরবে হারাবে`
        );
      }
    }

    // ② গাঢ় ব্যাকগ্রাউন্ড বসানো হয়েছে কিন্তু লেখা/আইকনের রঙ দেওয়া হয়নি
    for (const r of rules) {
      if (!darkBg(r.body)) continue;
      if (VERIFIED_OK.has(r.sel)) continue;
      if (hasColour(r.body) || hasStroke(r.body)) continue;
      // একই সিলেক্টরের অন্য কোনো নিয়মে রঙ থাকলে গ্রহণযোগ্য
      const others = bySel.get(r.sel) || [];
      if (others.some(o => hasColour(o.body) || hasStroke(o.body))) continue;
      // সন্তান-সিলেক্টরে রঙ দেওয়া থাকলেও গ্রহণযোগ্য — যেমন "#tabNav" গাঢ়
      // করে কিন্তু "#tabNav .tab-btn{color:#fff}" আলাদা নিয়মে রঙ দেয়, বা
      // ".mm-gps-btn svg{stroke:#fff}" আইকনের রঙ দেয়। এগুলো বৈধ প্যাটার্ন,
      // এদের সতর্কতা দেখালে স্ক্রিপ্টটা "সবসময় লাল" হয়ে অকেজো হয়ে যেত।
      // যৌগিক সিলেক্টরের (".mm-promo-mini.mm-promo-prem") ক্ষেত্রে প্রথম
      // ক্লাসটাও একটা বৈধ ভিত্তি — সন্তানের রঙ সাধারণত ওই মূল ক্লাসের
      // নামেই লেখা থাকে (".mm-promo-mini-title")।
      const bases = [];
      for (const b of r.sel.split(',').map(x => x.trim()).filter(Boolean)) {
        bases.push(b);
        const first = b.match(/^[.#][A-Za-z0-9_-]+/);
        if (first && first[0] !== b) bases.push(first[0]);
      }
      const coveredByChild = rules.some(o =>
        (hasColour(o.body) || hasStroke(o.body)) &&
        o.sel.split(',').map(x => x.trim()).some(os =>
          // "-" যোগ করা হলো BEM-ধাঁচের সন্তান-ক্লাসের জন্য:
          // ".premium-promo" গাঢ়, আর ".premium-promo-title{color:…}"
          // ভিতরের লেখার রঙ দেয় — এটা এই প্রকল্পের প্রধান প্যাটার্ন।
          bases.some(b => os !== b && (os.startsWith(b + ' ') || os.startsWith(b + '.') ||
                                       os.startsWith(b + '[') || os.startsWith(b + '>') ||
                                       os.startsWith(b + '-')))
        )
      );
      if (coveredByChild) continue;
      problems.push(
        `${file} → ${name}: "${r.sel}" গাঢ় ব্যাকগ্রাউন্ড বসাচ্ছে কিন্তু color/stroke ` +
        `দেয়নি — ভিতরের লেখা বা SVG আইকন অদৃশ্য হয়ে যেতে পারে`
      );
    }
  }
}

if (problems.length) {
  console.error('❌ WebView CSS-এ সম্ভাব্য সমস্যা:\n');
  problems.forEach(p => console.error('  · ' + p));
  console.error(`\nমোট ${problems.length}টি। বিল্ড করার আগে দেখে নিন.`);
  process.exit(1);
}
console.log('✅ WebView CSS যাচাই সম্পন্ন — কোনো সমস্যা পাওয়া যায়নি');
