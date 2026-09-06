/*  অ্যাপের অনুবাদ-স্তর।
 *
 *  চাবি বাংলা লেখাটাই — ওয়েবসাইটে প্রমাণিত নিয়ম। এর সুবিধা হলো চাবি ভুল
 *  হলে ইংরেজি/হিন্দি পাঠক বাংলাটাই দেখেন, ফাঁকা বা `undefined` নয়। নতুন
 *  চাবি বানালে একটা বানান-ভুল নীরবে পুরো লাইনটাই মুছে দিতে পারত।
 *
 *  দুটো সারণী, আর ক্রমটা ইচ্ছাকৃত:
 *    terms.js   — ওয়েবসাইটের নিজের অভিধান থেকে তৈরি (তিথি, নক্ষত্র, যোগ,
 *                 করণ, রাশি, উৎসব …) — একটিও নাম এখানে নতুন করে লেখা হয়নি
 *    strings.js — অ্যাপের নিজস্ব লেখা, হাতে অনূদিত
 *  একই চাবি দুই জায়গায় থাকলে strings.js জেতে — অ্যাপের প্রসঙ্গে যে শব্দটা
 *  ঠিক, সেটাই শেষ কথা।
 */
import { TERMS } from './terms';
import { STRINGS } from './strings';

export const LANGS = ['bn', 'hi', 'en'];
export const LANG_LABEL = { bn: 'বাংলা', hi: 'हिन्दी', en: 'English' };

/* NFC ড়/ঢ়/য় জোড়া লাগায় না (composition exclusion), তাই হাতে জুড়তে হয়।
   তালিকাটা কোডপয়েন্টে — বাংলা হরফে লিখলে ফাইলেই ভাঙা রূপ বসে যেতে পারে
   এবং প্রতিস্থাপনটা নীরবে কিছুই করে না। */
function nfc(s) {
  return String(s).normalize('NFC')
    .replace(/ড়/g, 'ড়')
    .replace(/ঢ়/g, 'ঢ়')
    .replace(/য়/g, 'য়');
}

const TABLE = Object.create(null);
for (const src of [TERMS, STRINGS]) {
  for (const k in src) TABLE[nfc(k)] = src[k];
}

/* কোনো বাংলা অক্ষর আছে কি না — অনুবাদের চেষ্টা তখনই করা হয় */
const BN = /[অ-হৎড়-য়]/;

/**
 * translate(lang, text) — অনুবাদ থাকলে সেটা, নইলে বাংলাটাই।
 * সামনে-পিছনে ফাঁকা জায়গা রক্ষা করা হয়, কারণ কিছু লেখা পাশের লেখার
 * সঙ্গে জোড়া লাগে (" — ব্লক করলে …")।
 */
export function translate(lang, text) {
  if (lang === 'bn' || text == null) return text;
  const s = String(text);
  if (!BN.test(s)) return s;
  const hit = TABLE[nfc(s)];
  if (hit && hit[lang]) return hit[lang];
  const t = s.trim();
  if (t !== s) {
    const h2 = TABLE[nfc(t)];
    if (h2 && h2[lang]) {
      const pre = s.slice(0, s.indexOf(t[0]));
      const post = s.slice(pre.length + t.length);
      return pre + h2[lang] + post;
    }
  }
  return s;
}

const DIGITS = {
  bn: ['০','১','২','৩','৪','৫','৬','৭','৮','৯'],
  hi: ['०','१','२','३','४','५','६','७','८','९'],
  en: ['0','1','2','3','4','5','6','7','8','9'],
};

/** অঙ্ক পাঠকের লিপিতে — ০১২ / ०१२ / 012 (ওয়েবসাইটের numText-এর মতো) */
export function numText(lang, n) {
  const d = DIGITS[lang] || DIGITS.bn;
  return String(n).replace(/[0-9০-৯०-९]/g, (c) => {
    const code = c.charCodeAt(0);
    let v;
    if (code >= 48 && code <= 57) v = code - 48;
    else if (code >= 0x09E6 && code <= 0x09EF) v = code - 0x09E6;
    else v = code - 0x0966;
    return d[v];
  });
}

/** অনুবাদ আছে কি না — লেখা বসানোর আগে দেখে নেওয়ার জন্য */
export function hasTranslation(lang, text) {
  if (lang === 'bn') return true;
  const hit = TABLE[nfc(String(text))] || TABLE[nfc(String(text).trim())];
  return !!(hit && hit[lang]);
}

/*  ── হুকের বাইরে থেকে ডাকার একমাত্র দরজা ──
 *  buyOnWebBridge-এর মতো কিছু ফাইল কম্পোনেন্ট নয়, তাই useLanguage() ডাকা
 *  যায় না। LanguageProvider ভাষা বদলালে এখানে জানিয়ে দেয়।
 *  ⚠️ ভাষাটা **ডাকার সময়** পড়া হয়, মডিউল লোডের সময় নয় — নইলে প্রথম
 *  লোডে বাংলা ধরা পড়ে যেত আর পরে ভাষা বদলালেও বাংলাই থাকত।
 */
let _current = 'bn';
export function setCurrentLang(l) { if (LANGS.indexOf(l) >= 0) _current = l; }
export function getCurrentLang() { return _current; }
export const tGlobal = (s) => translate(_current, s);

export const TABLE_SIZE = Object.keys(TABLE).length;
