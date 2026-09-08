/*  পঞ্জিকা পাতার হুবহু একই পথে তিথি/নক্ষত্র/যোগ/করণের শেষ-সময়
 *  ═══════════════════════════════════════════════════════════════
 *  ⛔ ২০২৬-০৯-০৮ — হোম স্ক্রিন আর পঞ্জিকা স্ক্রিন একই দিনে আলাদা সময়
 *  দেখাত (নক্ষত্র ১৬:৪১ বনাম ১৬:৪০, যোগ ০০:৪২ বনাম ০০:৪০)। নাম দুটোই
 *  এক, কেবল **শেষ-সময়** আলাদা — কারণ দুটো আলাদা হিসাব:
 *    • পঞ্জিকা পাতা: PD সারণী (ছাপা বিশুদ্ধসিদ্ধান্ত পঞ্জিকার সঙ্গে
 *      ২০৫/২০৫ মেলে) ধরে ৫ মিনিট অন্তর নমুনা + দ্বিভাজন
 *    • হোম: vsop87 গণনা ধরে নিজের খোঁজ
 *  একই অ্যাপের দুই পর্দায় দুই সময় — এটা ছোট ব্যাপার নয়।
 *
 *  এই ফাইলটা পঞ্জিকা পাতার অ্যালগরিদমটাই (panjika.html-এর
 *  `_findTrans` / `_getTithiIdx` …) নেটিভে এনেছে — **নতুন কোনো হিসাব
 *  লেখা হয়নি**, নইলে তৃতীয় একটা উত্তর তৈরি হতো।
 *
 *  ⚠️ PD-র সারণী ২০২৫-০৪-০১ থেকে ~সাত বছর। বাইরে গেলে এই ফাইল `null`
 *  ফেরায় আর হোম আগের মতোই নিজে হিসাব করে — আন্দাজি সময় ছাপার চেয়ে
 *  পুরনো আচরণে ফেরা ভালো।
 */
import PD from './panjika-pd';

const TZ_IST = 5.5;

/* ⚠️ panjika.html-এর JD **মধ্যরাত-ভিত্তিক** (শেষে -1524.5), সাধারণ JDN নয়।
   প্রথমে JDN সূত্র বসিয়েছিলাম আর তাতে গোটা হিসাব ১২ ঘণ্টা সরে গিয়েছিল —
   অথচ তুলনা-স্ক্রিপ্টেও একই ভুল সূত্র ঢোকানো ছিল বলে "০ অমিল" দেখাচ্ছিল।
   নিজের কোডকে নিজের ভুলের সঙ্গে মেলালে সবসময়ই মিলে যায়। */
function JD(y, m, d) {
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

/* panjika.html-এর `_pdInRange` — হুবহু */
export function pdInRange(jd) {
  if (!PD || !PD.p || !PD.jdIST || !PD.di) return false;
  const ist = PD.jdIST(jd);
  const hUT = ist.h - 5.5;
  const dayOff = hUT < 0 ? -1 : 0;
  const i0 = PD.di(ist.dt) + dayOff;
  return i0 >= 0 && i0 + 1 < PD.p.length;
}

const idxFns = {
  tithi:     jd => (PD.tithiIdx     ? PD.tithiIdx(jd)     : null),
  nakshatra: jd => (PD.nakshatraIdx ? PD.nakshatraIdx(jd) : null),
  yoga:      jd => (PD.yogaIdx      ? PD.yogaIdx(jd)      : null),
  karana:    jd => (PD.karanaNum    ? PD.karanaNum(jd)    : null),
};

/* panjika.html-এর `_findTrans` — একই STEPS ও একই দ্বিভাজন-সীমা,
   নইলে দুই পর্দায় সেকেন্ডের ফারাক থেকে যেত। */
function findTrans(jdStart, jdEnd, getFn, y, m, d, tz) {
  const STEPS = 288, out = [];
  let prev = getFn(jdStart);
  if (prev === null || isNaN(prev)) return null;
  for (let i = 1; i <= STEPS; i++) {
    const jd = jdStart + (jdEnd - jdStart) * i / STEPS;
    const cur = getFn(jd);
    if (cur === null || isNaN(cur)) return null;
    if (cur !== prev) {
      let lo = jdStart + (jdEnd - jdStart) * (i - 1) / STEPS, hi = jd;
      for (let j = 0; j < 52; j++) {
        if (hi - lo < 1 / 86400 / 30) break;
        const mid = (lo + hi) / 2;
        if (getFn(mid) === prev) lo = mid; else hi = mid;
      }
      const bnd = (lo + hi) / 2;
      out.push({ toIdx: cur, localH: (bnd - JD(y, m, d)) * 24 + tz });
      prev = cur;
    }
  }
  return out;
}

/** সূর্যোদয়ের মান ও প্রথম পরিবর্তনের সময় — পঞ্জিকা পাতার মতোই।
 *  ফেরায় { tithi:{idx,endH}, nakshatra:…, yoga:…, karana:… } বা null। */
export function panchangSpans(dateStr, riseH, nextRiseH, tz = TZ_IST) {
  try {
    if (!PD || !PD.tithiIdx) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    const nd = new Date(Date.UTC(y, m - 1, d) + 86400000);
    const jdRise = JD(y, m, d) + (riseH - tz) / 24;
    const jdNext = JD(nd.getUTCFullYear(), nd.getUTCMonth() + 1, nd.getUTCDate())
                 + (nextRiseH - tz) / 24;
    if (!pdInRange(jdRise) || !pdInRange(jdNext)) return null;
    const res = {};
    for (const k of Object.keys(idxFns)) {
      const f = idxFns[k];
      const idx0 = f(jdRise);
      if (idx0 === null || isNaN(idx0)) return null;
      const tr = findTrans(jdRise, jdNext, f, y, m, d, tz);
      if (tr === null) return null;
      res[k] = { idx: idx0, endH: tr.length ? tr[0].localH : null };
    }
    return res;
  } catch (e) { return null; }
}

/* panjika.html-এর KARANS ও `_karanaName` — হুবহু, নইলে নাম মিলত না */
const KARANS = ['বব','বালব','কৌলব','তৈতিল','গর','বণিজ','বিষ্টি','শকুনি','চতুষ্পাদ','নাগ','কিংস্তুঘ্ন'];
export function karanaName(n) {
  const k = ((n % 60) + 60) % 60;
  if (k === 0)  return KARANS[10];
  if (k === 57) return KARANS[7];
  if (k === 58) return KARANS[8];
  if (k === 59) return KARANS[9];
  return KARANS[(k - 1) % 7];
}
