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
  /* ⚠️ গণকূট এখানে আর মেলানো হয় না। মালিকের শাস্ত্রগ্রন্থে (পৃ. ৩৩১)
     গণের সারণি তিনটে ঘরে AstroSage/EKundali-র থেকে আলাদা, আর বইটাই
     আমাদের প্রমাণ। বইয়ের সারণি নিচে আলাদা করে যাচাই হয়। */
  const got = {
    'গ্রহমৈত্রী': e.calcGrahaMaitri(gR, bR).points,
    'ভকূট':       e.calcRashi(gR, bR).points
  };
  const exp = { 'গ্রহমৈত্রী': em, 'ভকূট': er };
  void eg; void bG; void gG;
  for (const k of Object.keys(exp)) {
    if (got[k] === exp[k]) { ok++; continue; }
    bad++;
    console.log(`❌ ${ref.padEnd(14)} ${k.padEnd(11)} EKundali ${exp[k]} · বান্ডিল ${got[k]}`);
  }
}
/* দ্বিতীয় দম্পতি — santosh (বর, উত্তরাষাঢ়া/মকর) ও rakhi (কন্যা,
   উত্তরফাল্গুনী/সিংহ)। এখানে AstroSage ও EKundali **দুটোই** আছে; যে ছ-টা
   কূটে দুজনে একমত সেগুলোই বাঁধা হলো। এই জোড়াতেই নাড়ীর ভুলটা ধরা পড়ে —
   দুই সফটওয়্যার বলে ৮, আমাদের ইঞ্জিন বলছিল ০ (মিথ্যা নাড়ীদোষ)। */
const C2 = { gn: 'উত্তরফাল্গুনী', gr: 'সিংহ', bn: 'উত্তরাষাঢ়া', br: 'মকর' };
const C2_EXP = { 'বর্ণ': 0, 'তারা': 3, 'গ্রহমৈত্রী': 0, 'গণ': 6, 'ভকূট': 0, 'নাড়ী': 8 };
// (এখানে দুজনেরই একই গণ, তাই বই ও সফটওয়্যার দুই-ই ৬ দেয় — মিলিয়ে দেখা নিরাপদ)
const C2_GOT = {
  'বর্ণ':       e.calcVarna(C2.gr, C2.br).points,
  'তারা':       e.calcTara(C2.gn, C2.bn).points,
  'গ্রহমৈত্রী': e.calcGrahaMaitri(C2.gr, C2.br).points,
  'গণ':         e.calcGana(C2.gn, C2.bn).points,
  'ভকূট':       e.calcRashi(C2.gr, C2.br).points,
  'নাড়ী':      e.calcNadi(C2.gn, C2.bn).points
};
for (const k of Object.keys(C2_EXP)) {
  if (C2_GOT[k] === C2_EXP[k]) { ok++; continue; }
  bad++;
  console.log(`❌ দ্বিতীয় দম্পতি · ${k.padEnd(11)} দুই সফটওয়্যার ${C2_EXP[k]} · বান্ডিল ${C2_GOT[k]}`);
}

// নাড়ীর ২৭টা নক্ষত্র শাস্ত্রীয় আগুপিছু ছকে আছে কিনা
const NAK_ORDER = ['অশ্বিনী','ভরণী','কৃত্তিকা','রোহিণী','মৃগশিরা','আর্দ্রা','পুনর্বসু','পুষ্যা','অশ্লেষা','মঘা','পূর্বফাল্গুনী','উত্তরফাল্গুনী','হস্তা','চিত্রা','স্বাতী','বিশাখা','অনুরাধা','জ্যেষ্ঠা','মূলা','পূর্বাষাঢ়া','উত্তরাষাঢ়া','শ্রবণা','ধনিষ্ঠা','শতভিষা','পূর্বভাদ্রপদ','উত্তরভাদ্রপদ','রেবতী'];
const NB = ['আদ্য','মধ্য','অন্ত্য','অন্ত্য','মধ্য','আদ্য','আদ্য','মধ্য','অন্ত্য'];
const NEXP = [...NB, ...[...NB].reverse(), ...NB];
NAK_ORDER.forEach((nak, i) => {
  if (e.nakshatraNadi[nak] === NEXP[i]) { ok++; return; }
  bad++;
  console.log(`❌ নাড়ী: ${nak} → ${e.nakshatraNadi[nak]}, হওয়ার কথা ${NEXP[i]}`);
});

/* ⚠️ উপরের সব পরীক্ষা calc*() সরাসরি ডাকে, তাই match() পুরো ভেঙে গেলেও
   সেগুলো সবুজই থাকত — পোর্ট করার সময় ঠিক সেটাই একবার ঘটেছিল (চারটে
   `const` লাইন মুছে গিয়েছিল, তবু ৬৩/৬৩ দেখাচ্ছিল)। তাই আসল প্রবেশপথটাও
   চালিয়ে দেখা হয়, আর তার ফল সরাসরি ডাকের সঙ্গে মিলিয়ে নেওয়া হয়। */
try {
  const r = e.match(
    { moonNakshatra: C2.gn, moonRashi: C2.gr, lagnaRashi: C2.gr },
    { moonNakshatra: C2.bn, moonRashi: C2.br, lagnaRashi: C2.br });
  const direct = { varna: C2_GOT['বর্ণ'], tara: C2_GOT['তারা'], grahaMaitri: C2_GOT['গ্রহমৈত্রী'],
                   gana: C2_GOT['গণ'], rashi: C2_GOT['ভকূট'], nadi: C2_GOT['নাড়ী'] };
  for (const k of Object.keys(direct)) {
    const got = r.kootas && r.kootas[k] && r.kootas[k].points;
    if (got === direct[k]) { ok++; continue; }
    bad++;
    console.log(`❌ match() · ${k}: সরাসরি ডাকে ${direct[k]}, match()-এ ${got}`);
  }
} catch (err) {
  bad++;
  console.log('❌ match() চালাতেই ব্যর্থ — ' + err.message);
}

/* মালিকের শাস্ত্রগ্রন্থের গণ-সারণি (পৃ. ৩৩১) — বান্ডিলেও পৌঁছেছে কিনা */
const GANA_BOOK = {
  'দেব':    { 'দেব': 6, 'নর': 5, 'রাক্ষস': 0 },
  'নর':     { 'দেব': 4, 'নর': 6, 'রাক্ষস': 0 },
  'রাক্ষস': { 'দেব': 2, 'নর': 1, 'রাক্ষস': 6 }
};
for (const b of Object.keys(GANA_BOOK)) for (const g of Object.keys(GANA_BOOK[b])) {
  const got = e.calcGana(nakOf[g], nakOf[b]).points;
  if (got === GANA_BOOK[b][g]) { ok++; continue; }
  bad++;
  console.log(`❌ গণ (বই) বর ${b} × কন্যা ${g}: বান্ডিল ${got}, বইয়ে ${GANA_BOOK[b][g]}`);
}

/* বশ্যকূট — বইয়ের বশ্য রাশিচক্রের কয়েকটি নমুনা ঘর (পৃ. ৩৩০)।
   পুরো চক্রটা services/scripts/verify-mm-book.js-এ যাচাই হয়; এখানে
   শুধু দেখা হয় যে পোর্টটা সত্যিই এসেছে (পুরনো ছকে এগুলো অন্য ফল দিত)। */
const VASHYA_SAMPLE = [
  ['কন্যা', 'মীন', 2], ['মকর', 'সিংহ', 0], ['বৃশ্চিক', 'তুলা', 0],
  ['মিথুন', 'মকর', 2], ['কর্কট', 'বৃশ্চিক', 2], ['সিংহ', 'কুম্ভ', 2]
];
for (const [br, gr, exp] of VASHYA_SAMPLE) {
  const got = e.calcVashya(gr, br, 5, 5).points;
  if (got === exp) { ok++; continue; }
  bad++;
  console.log(`❌ বশ্য বর ${br} × কন্যা ${gr}: বান্ডিল ${got}, বইয়ে ${exp}`);
}

/* যোনিকূট — বইয়ের ধাপ ০/২/৪, পুরনো ১.৫ ফিরে আসেনি তো? */
{
  let oneAndHalf = 0;
  for (const g of Object.keys(e.nakshatraYoni)) for (const b of Object.keys(e.nakshatraYoni))
    if (e.calcYoni(g, b).points === 1.5) oneAndHalf++;
  if (oneAndHalf) { bad++; console.log(`❌ যোনি: ${oneAndHalf}টি ঘরে এখনো পুরনো ১.৫ বসছে`); }
  else ok++;
}

console.log(bad ? `\n⚠️  ${bad}টি ঘর মেলেনি (${ok}টি মিলেছে)` : `✓ ${ok}টি ঘরই মিলেছে (মালিকের শাস্ত্রগ্রন্থ + EKundali/AstroSage)`);
process.exit(bad ? 1 : 0);
