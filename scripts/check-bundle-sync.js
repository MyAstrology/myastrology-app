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

let warnings = [];
let rows = [];

for (const [name, htmlFile] of Object.entries(PAGES)) {
  const bundlePath = path.join(BUNDLES, name + '.js');
  const htmlPath   = path.join(SITE, htmlFile);
  if (!fs.existsSync(bundlePath) || !fs.existsSync(htmlPath)) continue;

  const web = readPageWithScripts(htmlPath);
  const app = unescapeBundle(fs.readFileSync(bundlePath, 'utf8'));

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
