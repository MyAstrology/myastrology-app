#!/usr/bin/env node
/**
 * অ্যাপের match-making বান্ডিলের ভিতরের অষ্টকূট ইঞ্জিন যাচাই।
 *
 * কেন আলাদা করে। এই বান্ডিলটা ওয়েবসাইটের পাতা থেকে হাতে-প্যাচ করা কপি —
 * services রিপোয় ইঞ্জিন ঠিক করলে এখানে আপনা থেকে আসে না। ২০২৬-০৮-২৩-এ
 * গ্রহমৈত্রী ও গণকূট শাস্ত্রীয় সারণিতে ফেরানো হয়; সেটা এখানেও পৌঁছেছে
 * কিনা তা প্রমাণ করার একমাত্র উপায় বান্ডিলের **নিজের** কোড চালানো।
 *
 * সংখ্যাগুলো EKundali Professional ৬.৩/৬.৫-এর ছাপা রিপোর্ট থেকে নেওয়া
 * (services/scripts/verify-mm-ekundali.js-এর মতোই) — আমার হিসাব নয়।
 *
 * চালাতে: node scripts/check-ashtakoota.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const file = path.join(__dirname, '..', 'src', 'web-html', 'match-making.js');
const mod = fs.readFileSync(file, 'utf8');
const html = eval(mod.replace(/^\s*\/\/.*$/gm, '').replace(/^\s*export default\s*/m, ''));
if (typeof html !== 'string') { console.error('❌ বান্ডিল স্ট্রিং নয়'); process.exit(1); }

// ইঞ্জিনের ক্লাসটা যে <script>-এ আছে সেটাই বের করি
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.find(s => s.includes('class YotakBicharEngine'));
if (!code) { console.error('❌ বান্ডিলে YotakBicharEngine পাওয়া গেল না'); process.exit(1); }

const sb = { window: {}, document: { addEventListener() {} }, console };
sb.globalThis = sb;
vm.createContext(sb);
// class-ঘোষণা vm-এ global property হয় না (lexical binding), তাই শেষে
// নিজেরাই একটা হাতল বসিয়ে দিই।
vm.runInContext(code + '\n;this.__E = (typeof YotakBicharEngine !== "undefined") ? YotakBicharEngine : null;',
                sb, { filename: 'match-making.js(bundle)' });
const E = sb.__E || sb.YotakBicharEngine || (sb.window && sb.window.YotakBicharEngine);
if (!E) { console.error('❌ ক্লাসটা চালানোর পরে পাওয়া গেল না'); process.exit(1); }
const e = new E();

// [সূত্রবিন্দু, বরের রাশি, কন্যার রাশি, বরের গণ, কন্যার গণ, মৈত্রী, গণ, ভকূট]
const ROWS = [
  ['লগ্ন',        'কর্কট',   'মেষ',     'রাক্ষস', 'নর',     4,   0, 7],
  ['রবি',         'তুলা',    'তুলা',    'দেব',    'দেব',    5,   6, 7],
  ['চন্দ্র (মূল)', 'কন্যা',   'মীন',     'রাক্ষস', 'নর',     0.5, 0, 7],
  ['মঙ্গল',       'মকর',     'তুলা',    'দেব',    'দেব',    5,   6, 7],
  ['বুধ',         'বৃশ্চিক', 'তুলা',    'দেব',    'রাক্ষস', 3,   0, 0],
  ['বৃহস্পতি',    'কুম্ভ',   'বৃশ্চিক', 'রাক্ষস', 'রাক্ষস', 0.5, 6, 7],
  ['শুক্র',       'তুলা',    'তুলা',    'রাক্ষস', 'দেব',    5,   1, 7],
  ['শনি',         'বৃশ্চিক', 'সিংহ',    'দেব',    'রাক্ষস', 5,   0, 7],
  ['রাহু',        'মীন',     'কুম্ভ',   'দেব',    'নর',     3,   6, 0],
  ['কেতু',        'কন্যা',   'সিংহ',    'রাক্ষস', 'নর',     4,   0, 0]
];

// গণকূট নক্ষত্র নেয়, গণের নাম নয় — তাই প্রতিটা গণের একটা নমুনা নক্ষত্র লাগে।
const nakOf = {};
for (const nak of Object.keys(e.nakshatraGana)) if (!nakOf[e.nakshatraGana[nak]]) nakOf[e.nakshatraGana[nak]] = nak;
for (const g of ['দেব', 'নর', 'রাক্ষস'])
  if (!nakOf[g]) { console.error('❌ বান্ডিলের গণ-সারণিতে "' + g + '" নেই — নামগুলো বদলে গেছে?'); process.exit(1); }

let bad = 0, ok = 0;
for (const [ref, bR, gR, bG, gG, em, eg, er] of ROWS) {
  const got = {
    'গ্রহমৈত্রী': e.calcGrahaMaitri(gR, bR).points,
    'গণ':         e.calcGana(nakOf[gG], nakOf[bG]).points,
    'ভকূট':       e.calcRashi(gR, bR).points
  };
  const exp = { 'গ্রহমৈত্রী': em, 'গণ': eg, 'ভকূট': er };
  for (const k of Object.keys(exp)) {
    if (got[k] === exp[k]) { ok++; continue; }
    bad++;
    console.log(`❌ ${ref.padEnd(14)} ${k.padEnd(11)} EKundali ${exp[k]} · বান্ডিল ${got[k]}`);
  }
}
console.log(bad ? `\n⚠️  ${bad}টি ঘর মেলেনি (${ok}টি মিলেছে)` : `✓ ${ok}টি ঘরই EKundali-র ছাপা ফলের সঙ্গে মেলে`);
process.exit(bad ? 1 : 0);
