import v from '../vsop87-planets';
import PEph from './panjika-ephemeris';

const BN_MONTH_NAMES = ['বৈশাখ','জ্যৈষ্ঠ','আষাঢ়','শ্রাবণ','ভাদ্র','আশ্বিন','কার্তিক','অগ্রহায়ণ','পৌষ','মাঘ','ফাল্গুন','চৈত্র'];
const BN_RITU        = ['গ্রীষ্মকাল','গ্রীষ্মকাল','বর্ষাকাল','বর্ষাকাল','শরৎকাল','শরৎকাল','হেমন্তকাল','হেমন্তকাল','শীতকাল','শীতকাল','বসন্তকাল','বসন্তকাল'];

// Bengali month start dates (source: panjika-ephemeris.js bms table)
// [gregorianDateISO, bnYear, bnMonthIndex]

/* ⛔ আগে এখানে হাতে লেখা BMS সারণী দেখে বাংলা তারিখ বলা হতো, আর
   ৭২টি মাস-শুরুর ৩৪টিই (৪৭%) এক-দুদিন সরে ছিল — তাই হোম স্ক্রিন
   "১৯ ভাদ্র" দেখাত যেখানে পঞ্জিকা স্ক্রিন ও ওয়েবসাইট "২০ ভাদ্র"।
   ওয়েবসাইট এই সারণী অনেক আগেই বাদ দিয়েছে ("Dynamic Bengali date —
   replaces static BMS lookup"), অ্যাপে পুরনোটা রয়ে গিয়েছিল।

   এখন সংক্রান্তি থেকেই গণনা — rashifal-core.js-এর যাচাই-করা নিয়ম
   হুবহু পোর্ট করা (ছাপা পঞ্জিকার সঙ্গে ২০৫/২০৫ মেলে):
     মাসান্ত নির্ণয় → মাসারম্ভ = মাসান্ত + ১ → দিন = তারিখ − মাসারম্ভ + ১
   দ্বিদণ্ডাত্মক মধ্যরাত্রি নিয়ম, আর আষাঢ়/পৌষের দুটি ব্যতিক্রম-সহ।

   ⚠️ কোনো নীরব ফলব্যাক রাখা হয়নি — গণনা না হলে null, আর UI তখন
   '—' দেখায়। জ্যোতিষে ভুল তারিখ দেখানোর চেয়ে না-দেখানো ভালো। */
const _sunSidAt = jd => ((v.sunL(jd) - v.lahiriAY(jd)) % 360 + 360) % 360;

function _findSankrantiJD(targetDeg, jdApprox) {
  const diff = jd => { let d = targetDeg - _sunSidAt(jd); if (d > 180) d -= 360; if (d < -180) d += 360; return d; };
  let lo = jdApprox - 20, hi = jdApprox + 20;
  let guard = 0;
  while (diff(lo) * diff(hi) > 0 && guard++ < 40) { lo -= 10; hi += 10; }
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (hi - lo < 1e-8) break;
    if (diff(lo) * diff(mid) <= 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

function _activeSankranti(jd) {
  const sunSid = _sunSidAt(jd);
  const signIdx = Math.floor(sunSid / 30);              // 0=মেষ … 11=মীন
  const daysAgo = (sunSid - signIdx * 30) / (360 / 365.25);
  return { signIdx, sankrantiJD: _findSankrantiJD(signIdx * 30, jd - daysAgo) };
}

const _tithiIdxAt = jd => Math.floor(((v.moonL(jd) - v.sunL(jd) + 360) % 360) / 12) % 30;

/* মাসান্ত — দ্বিদণ্ডাত্মক মধ্যরাত্রি নিয়ম (rashifal-core.js থেকে হুবহু)
   ⚠️ প্রথম চেষ্টায় এই ফাংশনের শুরুটা বাদ পড়েছিল — দ্বিদণ্ডাত্মক জানালার
   পরীক্ষাটাই ছিল না, আর সবসময় midnightDayJD (+১) ধরা হচ্ছিল। ফলে পোর্ট
   করা কোড হুবহু পুরনো ভুল সারণীরই উত্তর দিচ্ছিল (১৯ ভাদ্র), আর সিনট্যাক্স
   পরীক্ষা সবুজই ছিল। একটা ফাংশনের লেজ পড়ে পোর্ট করা যায় না। */
function _masantaJD(sankrantiJD, signIdx) {
  const istMs = (sankrantiJD - 2440587.5) * 86400000 + 5.5 * 3600000;
  const dt = new Date(istMs);
  const y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
  const h = dt.getUTCHours() + dt.getUTCMinutes() / 60 + dt.getUTCSeconds() / 3600;

  // দ্বিদণ্ডাত্মক জানালা: রাত ১১:৩৬ → পরদিন ১২:২৪
  const DWS = 23 + 36 / 60, DWE = 24 / 60;
  if (!(h >= DWS || h < DWE)) return v.JD(y, m, d);   // সাধারণ নিয়ম: সংক্রান্তির দিনই মাসান্ত

  let dy = y, dm = m, dd = d;
  if (h < DWE) {                                       // ১২:০০–১২:২৪ → আগের IST তারিখ
    const prev = new Date(istMs - 86400000);
    dy = prev.getUTCFullYear(); dm = prev.getUTCMonth() + 1; dd = prev.getUTCDate();
  }
  const midnightDayJD = v.JD(dy, dm, dd) + 1;
  if (signIdx === 3) return midnightDayJD;             // আষাঢ় শেষ — সেই দিবসই মাসান্ত
  if (signIdx === 9) return midnightDayJD + 1;         // পৌষ শেষ — পরদিবস মাসান্ত

  let sunriseJD = null;
  try {
    const t = PEph && PEph.sunTimes ? PEph.sunTimes(dy, dm, dd) : null;
    if (t && typeof t.rise === 'number') sunriseJD = v.JD(dy, dm, dd) + (t.rise - DEF_TZ) / 24;
  } catch (_) { }
  if (sunriseJD == null) return midnightDayJD;
  return _tithiIdxAt(sunriseJD) !== _tithiIdxAt(sankrantiJD) ? midnightDayJD + 1 : midnightDayJD;
}

/* বঙ্গাব্দ — মেষ সংক্রান্তির গ্রেগরীয় বছর ধরে */
function _bnYearFor(signIdx, gregYear, gregMonth) {
  let meshaGregYear;
  if (gregMonth <= 3) meshaGregYear = gregYear - 1;
  else if (gregMonth === 4 && signIdx === 11) meshaGregYear = gregYear - 1;
  else meshaGregYear = gregYear;
  const meshaJD = _findSankrantiJD(0, v.JD(meshaGregYear, 4, 14) + 0.5);
  return new Date((meshaJD - 2440587.5) * 86400000).getUTCFullYear() - 593;
}

export function getBengaliDate(dateStr) {
  try {
    const [y, m, d] = String(dateStr).split('-').map(Number);
    if (!y || !m || !d) return null;
    const jd = v.JD(y, m, d) + 0.5;                       // noon UTC
    const { signIdx, sankrantiJD } = _activeSankranti(jd);
    let idx = signIdx;
    let day = Math.floor(v.JD(y, m, d) - (_masantaJD(sankrantiJD, signIdx) + 1)) + 1;
    if (day < 1) {
      // দিনটি মাসান্ত — আগের মাসের শেষ দিন
      idx = (signIdx + 11) % 12;
      const prevSank = _findSankrantiJD(idx * 30, sankrantiJD - 30);
      day = Math.floor(v.JD(y, m, d) - (_masantaJD(prevSank, idx) + 1)) + 1;
    }
    if (day < 1 || day > 32) return null;
    return { year: _bnYearFor(idx, y, m), monthName: BN_MONTH_NAMES[idx], day, ritu: BN_RITU[idx] };
  } catch (_) { return null; }
}

const TITHI_NAMES = [
  'প্রতিপদা','দ্বিতীয়া','তৃতীয়া','চতুর্থী','পঞ্চমী','ষষ্ঠী','সপ্তমী',
  'অষ্টমী','নবমী','দশমী','একাদশী','দ্বাদশী','ত্রয়োদশী','চতুর্দশী','পূর্ণিমা',
  'প্রতিপদা','দ্বিতীয়া','তৃতীয়া','চতুর্থী','পঞ্চমী','ষষ্ঠী','সপ্তমী',
  'অষ্টমী','নবমী','দশমী','একাদশী','দ্বাদশী','ত্রয়োদশী','চতুর্দশী','অমাবস্যা',
];
const NAKSHATRA_NAMES = [
  'অশ্বিনী','ভরণী','কৃত্তিকা','রোহিণী','মৃগশিরা','আর্দ্রা','পুনর্বসু',
  'পুষ্যা','আশ্লেষা','মঘা','পূর্বফাল্গুনী','উত্তরফাল্গুনী','হস্তা','চিত্রা',
  'স্বাতী','বিশাখা','অনুরাধা','জ্যেষ্ঠা','মূলা','পূর্বাষাঢ়া','উত্তরাষাঢ়া',
  'শ্রবণা','ধনিষ্ঠা','শতভিষা','পূর্বভাদ্রপদ','উত্তরভাদ্রপদ','রেবতী',
];
const YOGA_NAMES = [
  'বিষ্কম্ভ','প্রীতি','আয়ুষ্মান','সৌভাগ্য','শোভন','অতিগণ্ড','সুকর্মা',
  'ধৃতি','শূল','গণ্ড','বৃদ্ধি','ধ্রুব','ব্যাঘাত','হর্ষণ','বজ্র',
  'অসৃক (সিদ্ধি)','ব্যতীপাত','বরীয়ান','পরিঘ','শিব','সিদ্ধ','সাধ্য','শুভ',
  'শুক্ল','ব্রহ্ম','ইন্দ্র','বৈধৃতি',
];
const WEEKDAY_NAMES = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];
const RASHI_NAMES   = ['মেষ','বৃষ','মিথুন','কর্কট','সিংহ','কন্যা','তুলা','বৃশ্চিক','ধনু','মকর','কুম্ভ','মীন'];
const PADA_NAMES    = ['প্রথম','দ্বিতীয়','তৃতীয়','চতুর্থ'];

// ডিফল্ট অবস্থান — পঞ্জিকা পাতার (panjika.html-এর `let LAT=23.1677, LNG=88.5808`)
// হুবহু একই মান, ইচ্ছাকৃতভাবে। আগে এখানে কলকাতা (22.5726/88.3639) বসানো ছিল
// আর পঞ্জিকা পাতায় রানাঘাট — ফলে ব্যবহারকারী কোনো শহর না বাছলে হোম স্ক্রিন ও
// পঞ্জিকা ট্যাব দুই রকম সূর্যোদয় দেখাত (২০২৬-০৮-০২: ৫:১০ vs ৫:১২:০৭)।
// পঞ্জিকা পাতাই এখানে সত্যের উৎস — মুদ্রিত বিশুদ্ধসিদ্ধান্ত পঞ্জিকার বিরুদ্ধে
// ১১১টা assertion দিয়ে ওটাই পরীক্ষিত (npm run test:panjika), তাই নেটিভ
// ইঞ্জিনকে ওটার সাথে মেলানো হলো, উল্টোটা নয়।
const DEF_LAT = 23.1677;
const DEF_LON = 88.5808;
const DEF_TZ  = 5.5;   // ভারতীয় প্রামাণ্য সময় — শহর না বাছলে এটাই

// Rahu Kala / Gulika / Yamagnda slot (1-indexed) by weekday (0=Sun…6=Sat).
// GULIKA_SLOT and YAMAGNDA_SLOT were previously off by one weekday (rotated —
// each day showed the next day's correct window). Cross-checked GULIKA_SLOT
// against src/panjika-ephemeris.js's own computeGulikakal (the live
// website's reference implementation) for all 7 weekdays: [7,6,5,4,3,2,1]
// is what it actually returns. RAHU_SLOT already matched that reference for
// 6 of 7 days (its own Sunday value looks separately bugged, not ours).
// YAMAGNDA_SLOT isn't exposed by that reference engine, so it's corrected
// to match the standard descending-table pattern shared with Gulika.
const RAHU_SLOT     = [8, 2, 7, 5, 6, 4, 3];
const GULIKA_SLOT   = [7, 6, 5, 4, 3, 2, 1];
const YAMAGNDA_SLOT = [5, 4, 3, 2, 1, 7, 6];

/* PEph-এর সূর্যোদয়/অস্ত টেবিল একটা নির্দিষ্ট সময়সীমা ঢাকে (২০২৫-০১-০১ …
   ২০৩১-০৪-৩০)। তার বাইরের তারিখে সে সূচক **ক্ল্যাম্প** করে — আগের যেকোনো
   দিন প্রথম সারিটাই ফেরত দেয়, পরের যেকোনো দিন শেষ সারিটা। মানটা দেখতে
   স্বাভাবিক বলে `if (peSunrise && peSunset)` পরীক্ষায় ধরা পড়ত না, আর
   ২০৩১-০৫-০১ থেকে হোম স্ক্রিনের সূর্যোদয়/সূর্যাস্ত/রাহুকাল একই জায়গায়
   জমে যেত। টেবিলের সারি বাইরে থেকে দেখা যায় না, তাই দুই প্রান্তের
   ক্ল্যাম্প-মান একবার তুলে রেখে rise ও set — দুটোই মিলিয়ে দেখা হয়;
   সত্যিকারের কোনো দিনের দুটো মানই প্রান্তের সারির সাথে হুবহু মিলে যাওয়া
   কার্যত অসম্ভব। টেবিল নতুন করে বানালে পরীক্ষাটা নিজেই মানিয়ে নেয়।
   জানা পার্শ্বফল: সীমার ঠিক প্রথম ও শেষ দিনটিও (২০২৫-০১-০১, ২০৩১-০৪-৩০)
   "বাইরে" ধরা পড়ে, কারণ ওদের মানই ক্ল্যাম্প-মান। ওই দু'দিনে VSOP87
   ফলব্যাক চলে — নির্ভুলতা ~১০ সেকেন্ড, তাই ক্ষতি নেই। */
let _ephEdgeCache = null;
function _ephClamped(rise, set) {
  if (!_ephEdgeCache) {
    try {
      _ephEdgeCache = [
        { r: PEph.getSunrise('1900-01-01'), s: PEph.getSunset('1900-01-01') },
        { r: PEph.getSunrise('2400-01-01'), s: PEph.getSunset('2400-01-01') },
      ];
    } catch (_) { _ephEdgeCache = []; }
  }
  return _ephEdgeCache.some(e => e && rise === e.r && set === e.s);
}

// IST string "HH:MM:SS" → Julian Day
function istStrToJD(y, m, d, istStr, tz) {
  if (!istStr) return null;
  const off = (typeof tz === 'number' && isFinite(tz)) ? tz : DEF_TZ;
  const [h, mn, s] = istStr.split(':').map(Number);
  return v.JD(y, m, d) - 0.5 + (h + mn / 60 + (s || 0) / 3600 - off) / 24;
}

// Binary search: find JD when getterFn(jd).index transitions away from currentIdx (= end)
function findEndJD(getterFn, refJD, currentIdx) {
  let lo = refJD, hi = refJD + 2;
  if (getterFn(hi).index === currentIdx) return null;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (getterFn(mid).index === currentIdx) lo = mid; else hi = mid;
  }
  return hi;
}

// Binary search: find JD when getterFn(jd).index transitions to currentIdx (= start)
function findStartJD(getterFn, refJD, currentIdx) {
  let lo = refJD - 2, hi = refJD;
  if (getterFn(lo).index === currentIdx) return null;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (getterFn(mid).index !== currentIdx) lo = mid; else hi = mid;
  }
  return hi;
}

function jdHM(jd, tz) {
  if (!jd) return null;
  return v.jdToIST(jd, tz).substring(0, 5);
}

function parseHMS(hms) {
  if (!hms) return null;
  const [h, m, s] = hms.split(':').map(Number);
  return h + (m || 0) / 60 + (s || 0) / 3600;
}

// দশমিক ঘণ্টা → "HH:MM:SS" — মেলানো সূর্যোদয়কে আবার JD-তে ফেরাতে লাগে,
// তাই decToHM()-এর মিনিট-রাউন্ডিং এখানে চলবে না
function _hToHMS(h) {
  const t  = Math.round((((h % 24) + 24) % 24) * 3600);
  const hh = Math.floor(t / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60;
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}

function decToHM(h) {
  const totalMin = Math.round(((h % 24) + 24) % 24 * 60);
  const hh = Math.floor(totalMin / 60) % 24;
  const mm = totalMin % 60;
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

function getSlotTime(riseH, setH, slotNo) {
  const dur  = setH - riseH;
  const step = dur / 8;
  const s    = riseH + (slotNo - 1) * step;
  return { start: decToHM(s), end: decToHM(s + step) };
}

// tz — বাছাই-করা শহরের UTC-ফারাক (ভারত ৫.৫, বাংলাদেশ ৬)। না দিলে ৫.৫,
// তাই আগের সব কল অবিকল একই ফল পায়।
export function getPanchangForDate(dateStr, lat = DEF_LAT, lon = DEF_LON, tz = DEF_TZ) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const TZ = (typeof tz === 'number' && isFinite(tz)) ? tz : DEF_TZ;
  /* মুদ্রিত পঞ্জিকার নিজস্ব ঘোষণা (বিশুদ্ধ সিদ্ধান্ত পঞ্জিকা ১৪৩৩, পৃ. ১৮২):
     "অক্ষাংশ ও দ্রাঘিমাংশের তারতম্য অনুসারে বিভিন্ন স্থানের সূর্যোদয়,
     সূর্যাস্ত, পূর্বাহ্ণ ও বারবেলা বিভিন্ন প্রকার হয়। কিন্তু তিথির
     অন্তঃকাল ভারতীয় স্ট্যান্ডার্ড সময়ে সর্বত্র সমান।" — অর্থাৎ স্থান
     বদলালে সূর্য-নির্ভর সময়গুলোই বদলায়, তিথির মুহূর্ত নয়; কেবল সেটি
     কোন ঘড়িতে লেখা হচ্ছে তা বদলায়। */
  const atHome = (lat === DEF_LAT && lon === DEF_LON && TZ === DEF_TZ);

  let p;
  try { p = v.getDailyPanchang(y, m, d, lat, lon, TZ); }
  catch (_) { return null; }

  // যোগ ও করণ তিথি/নক্ষত্রের চেয়ে অনেক দ্রুত বদলায় (করণ প্রতি তিথিতেই
  // দুইবার), তাই ওয়েবসাইটের পঞ্জিকা এই দুটোকে সবসময় "এই মুহূর্তে চলতি"
  // মান দেখায় — সূর্যোদয়ের মান না (তিথি/নক্ষত্র সূর্যোদয়ের মানই দেখায়,
  // যেটা p থেকে ইতিমধ্যে ঠিক আছে)। এখানেও তাই বর্তমান মুহূর্ত ব্যবহার করা
  // হচ্ছে, যাতে হোম স্ক্রিন সবসময় ওয়েবসাইটের পঞ্জিকার সাথে মিলে যায়।
  let nowJD = null;
  try {
    const now   = new Date();
    const loc   = new Date(now.getTime() + TZ * 3600000);
    nowJD = v.JD_IST(loc.getUTCFullYear(), loc.getUTCMonth() + 1, loc.getUTCDate(),
                      loc.getUTCHours() + loc.getUTCMinutes() / 60 + loc.getUTCSeconds() / 3600, TZ);
    p.yoga   = v.getYoga(nowJD);
    p.karana = v.getKarana(nowJD);
  } catch (_) { /* keep the sunrise-based yoga/karana computed above */ }

  const wd    = p.date.weekday;
  let   riseH = parseHMS(p.sunrise);
  let   setH  = parseHMS(p.sunset);
  let   calibrated = false;

  /* ── অন্য শহরের সময় ছাপা পঞ্জিকার সঙ্গে মেলানো ──
     PEph-এর টেবিল (রানাঘাট) মুদ্রিত বিশুদ্ধ সিদ্ধান্ত পঞ্জিকার সঙ্গে হুবহু
     মেলে — ১৯ অক্টোবর ২০২৬-এ ছাপা কলকাতা ৫:৩৮/১৭:০৫, PEph-ও তাই। কিন্তু
     ওই টেবিল কেবল ওই এক জায়গার। vsop87 যেকোনো জায়গার হিসাব দেয়, তবে
     ছাপা পঞ্জিকার চেয়ে ধারাবাহিকভাবে উদয়ে ~২ মিঃ আগে ও অস্তে ~২ মিঃ পরে
     (দিনের দৈর্ঘ্য মাপার নিয়মটাই সামান্য আলাদা)।
     তাই দুটোর সেরাটা নেওয়া হলো: যাচাই-করা রানাঘাট-মান + vsop87-এর
     (এই শহর − রানাঘাট) ফারাক। নিয়মের ভুলটা ফারাক নিতে গিয়ে কেটে যায়।
     পৃষ্ঠা ১৮২-এর ২৬টি রাজ্য-রাজধানীর বিরুদ্ধে মাপা (২০২৬-১০-১৯):
       সরাসরি vsop87 — গড় ভুল ১.৬৯ মিঃ, ১১/২৬ শহরে ২ মিঃ-এর বেশি
       এই পদ্ধতি     — গড় ভুল ০.৮৫ মিঃ,  ২/২৬ শহরে ২ মিঃ-এর বেশি
     রানাঘাটের অক্ষাংশ থেকে ১৫° দূর পর্যন্তই প্রয়োগ (ভারত, বাংলাদেশ, নেপাল,
     শ্রীলঙ্কা, মায়ানমার, উপসাগরীয় দেশ — যেখানে প্রায় সব ব্যবহারকারী)।
     তার বাইরে ফারাকটা আর কাটাকাটি হয় না, তাই vsop87-ই থাকে। */
  if (!atHome && riseH != null && setH != null && Math.abs(lat - DEF_LAT) <= 15) {
    try {
      const peR = PEph.getSunrise(dateStr), peS = PEph.getSunset(dateStr);
      if (peR && peS && !_ephClamped(peR, peS)) {
        const home = v.getDailyPanchang(y, m, d, DEF_LAT, DEF_LON, DEF_TZ);
        const hR = parseHMS(home.sunrise), hS = parseHMS(home.sunset);
        if (hR != null && hS != null) {
          riseH = peR + (riseH - hR);
          setH  = peS + (setH  - hS);
          calibrated = true;
        }
      }
    } catch (_) { /* মেলানো না গেলে vsop87-এর মানই থাকে */ }
  }

  let rahuKala  = (riseH && setH) ? getSlotTime(riseH, setH, RAHU_SLOT[wd])     : null;
  let gulika    = (riseH && setH) ? getSlotTime(riseH, setH, GULIKA_SLOT[wd])    : null;
  const yamagnda  = (riseH && setH) ? getSlotTime(riseH, setH, YAMAGNDA_SLOT[wd])  : null;

  const brahmaM = riseH ? { start: decToHM(riseH - 96/60), end: decToHM(riseH - 48/60) } : null;

  const vs1 = YAMAGNDA_SLOT[wd];
  const vs2 = vs1 < 8 ? vs1 + 1 : 1;
  const varebela = (riseH && setH) ? {
    start: getSlotTime(riseH, setH, vs1).start,
    end:   getSlotTime(riseH, setH, vs2).end,
  } : null;

  let abhijit = null;
  if (p.transit) {
    const tH = parseHMS(p.transit);
    abhijit = { start: decToHM(tH - 0.2), end: decToHM(tH + 0.2) };
  }

  // রাহুকাল/গুলিক কাল/অভিজিৎ মুহূর্ত — ওয়েবসাইটের নিজস্ব লাইভ পঞ্জিকা ইঞ্জিন
  // (panjika-ephemeris.js, panjika.html-এ ব্যবহৃত, অর্থাৎ "আমার পঞ্জিকা")
  // দিয়ে পুনরায় গণনা করে override করা — এই ফাইলের sunrise/sunset আসে ভিন্ন
  // জ্যোতির্বিজ্ঞান ইঞ্জিন (vsop87-planets) থেকে, যার ফলে ২-৩ মিনিট পার্থক্য
  // থাকতে পারত। ব্যর্থ হলে (কোনো তারিখে) উপরের হিসাবই থেকে যায়, ক্র্যাশ করে না।
  let peSunriseHM = null, peSunsetHM = null;
  try {
    if (!atHome) throw new Error('অন্য শহর — PEph টেবিল রানাঘাটের, প্রযোজ্য নয়');
    const peSunrise = PEph.getSunrise(dateStr);
    const peSunset  = PEph.getSunset(dateStr);
    if (peSunrise && peSunset && !_ephClamped(peSunrise, peSunset)) {
      const peR = PEph.computeRahukal(peSunrise, peSunset, wd);
      const peG = PEph.computeGulikakal(peSunrise, peSunset, wd);
      const peA = PEph.computeAbhijit(peSunrise, peSunset);
      if (peR) rahuKala = { start: peR.startStr, end: peR.endStr };
      if (peG) gulika   = { start: peG.startStr, end: peG.endStr };
      if (peA) abhijit  = { start: peA.startStr, end: peA.endStr };
      // দেখানো সূর্যোদয়/সূর্যাস্তও এখান থেকেই — আগে এগুলো vsop87 থেকে আসত,
      // আর PEph কেবল রাহুকাল হিসাব করতে ব্যবহার হতো। দুই ইঞ্জিনের ফল ~৪
      // মিনিট আলাদা (২০২৬-০৮-০২: vsop87 ০৫:০৮, PEph ০৫:১২:০৭) — ফলে হোম
      // স্ক্রিন ও পঞ্জিকা ট্যাব দুই রকম সময় দেখাত। PEph-ই পঞ্জিকা পাতার
      // (panjika.html) ইঞ্জিন, তাই সেটাকে সত্যের উৎস ধরা হলো।
      // সীমা: PEph.getSunrise() শুধু তারিখ নেয়, অবস্থান নয় — তাই এটা সবসময়
      // PEph-এর নিজস্ব অবস্থানেরই (LAT ২৩.১৬৭৭) সময় দেয়। পঞ্জিকা ট্যাবে
      // অন্য শহর বাছলে সেখানে সময় বদলাবে, হোমে বদলাবে না।
      peSunriseHM = PEph.hm ? PEph.hm(peSunrise) : null;
      peSunsetHM  = PEph.hm ? PEph.hm(peSunset)  : null;
    }
  } catch (_) { /* keep the vsop87-based fallback computed above */ }

  // অমৃত কাল — একই লাইভ পঞ্জিকা ইঞ্জিন থেকে; দিনে একাধিক স্লট থাকতে পারে,
  // হোম স্ক্রিনে দেখানোর জন্য শুধু দিনের প্রথম (সবচেয়ে প্রাসঙ্গিক) স্লট নেওয়া হলো।
  let amritKal = null;
  try {
    if (!atHome) throw new Error('অন্য শহর — PEph-এর অমৃতযোগ রানাঘাটের');
    const dp = PEph.getDailyPanchang(dateStr, 12);
    const slot = dp?.amritaMahendra?.amritaDay?.[0];
    if (slot) amritKal = { start: slot.startStr, end: slot.endStr };
  } catch (_) { /* অমৃত কাল না থাকলে সেই চিপ বাদ যাবে, ক্র্যাশ করবে না */ }

  const tIdx  = p.tithi.index;
  const paksha = tIdx < 15 ? 'শুক্লপক্ষ' : 'কৃষ্ণপক্ষ';
  const bnDate = getBengaliDate(dateStr);

  // Compute slot start/end times via binary search
  const sunriseStr = calibrated ? _hToHMS(riseH) : p.sunrise;
  const refJD = sunriseStr ? istStrToJD(y, m, d, sunriseStr, TZ)
                           : (v.JD(y, m, d) + TZ / 24 - 0.5 + 5 / 24);
  // যোগ/করণ p.yoga.index ও p.karana.index-এ "বর্তমান মুহূর্তের" (nowJD) মান
  // বসানো হয়েছে উপরে (সূর্যোদয়ের না) — তাই তাদের start/end খোঁজার রেফারেন্স
  // JD-ও nowJD হতে হবে, refJD (সূর্যোদয়) না, নাহলে ভুল index-এর transition
  // খুঁজে ভুল/অসংগত সময় দিতে পারে (করণ দিনে ~৪ বার বদলায় বলে সবচেয়ে ঝুঁকিপূর্ণ)।
  const curJD = nowJD || refJD;
  const tSt = jdHM(findStartJD(v.getTithi,     refJD, tIdx), TZ);
  const tEn = jdHM(findEndJD  (v.getTithi,     refJD, tIdx), TZ);
  const nSt = jdHM(findStartJD(v.getNakshatra, refJD, p.nakshatra.index), TZ);
  const nEn = jdHM(findEndJD  (v.getNakshatra, refJD, p.nakshatra.index), TZ);
  const ySt = jdHM(findStartJD(v.getYoga,      curJD, p.yoga.index), TZ);
  const yEn = jdHM(findEndJD  (v.getYoga,      curJD, p.yoga.index), TZ);
  const kSt = jdHM(findStartJD(v.getKarana,    curJD, p.karana.index), TZ);
  const kEn = jdHM(findEndJD  (v.getKarana,    curJD, p.karana.index), TZ);

  const ay      = p.ayanamsa || 0;
  const ayDeg   = Math.floor(ay);
  const ayMin   = Math.floor((ay - ayDeg) * 60);
  const aySec   = Math.round(((ay - ayDeg) * 60 - ayMin) * 60);
  const ayanamsaStr = `${ayDeg}°${String(ayMin).padStart(2,'0')}'${String(aySec).padStart(2,'0')}"`;

  return {
    date:     dateStr,
    tz:       TZ,
    atDefaultPlace: atHome,
    weekday:  WEEKDAY_NAMES[wd],
    weekdayNum: wd,
    bengaliDay:   bnDate ? bnDate.day       : null,
    bengaliMonth: bnDate ? bnDate.monthName : '—',
    bengaliYear:  bnDate ? bnDate.year      : null,
    ritu:         bnDate ? bnDate.ritu      : '—',
    tithiStart:     tSt,  tithiEnd:     tEn,
    nakshatraStart: nSt,  nakshatraEnd: nEn,
    yogaStart:      ySt,  yogaEnd:      yEn,
    karanaStart:    kSt,  karanaEnd:    kEn,
    sunrise:  peSunriseHM || (riseH != null ? decToHM(riseH) : '—'),
    sunset:   peSunsetHM  || (setH  != null ? decToHM(setH)  : '—'),
    calibrated,
    transit:  p.transit  ? p.transit.substring(0,5)  : '—',
    tithi:        TITHI_NAMES[tIdx]                    || '—',
    tithiIdx:     tIdx,
    paksha,
    nakshatra:    NAKSHATRA_NAMES[p.nakshatra.index]   || '—',
    nakshatraIdx: p.nakshatra.index,
    pada:         p.nakshatra.pada,
    padaName:     PADA_NAMES[(p.nakshatra.pada || 1) - 1] || '',
    yoga:         YOGA_NAMES[p.yoga.index]             || '—',
    karana:       p.karana.name                        || '—',
    lagnaRashi:   RASHI_NAMES[p.lagna.rashi]           || '—',
    janmaRashi:   RASHI_NAMES[p.janmaRashi]            || '—',
    ayanamsa:     ayanamsaStr,
    mrityuDosha:  p.mrityuDosha?.dosha        || false,
    mrityuAlert:  p.mrityuDosha?.specialAlert || false,
    rahuKala,
    gulika,
    yamagnda,
    abhijit,
    amritKal,
    brahmaM,
    varebela,
  };
}

export function getMonthCalendar(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const results = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;
    const jdNoon  = v.JD(year, month + 1, d) + 5.5 / 24 - 0.5;
    let tithiIdx = 0, tithiName = '—';
    let nakName = '—', yogaName = '—', karana = '—';
    try {
      const t = v.getTithi(jdNoon);
      tithiIdx  = t.index;
      tithiName = TITHI_NAMES[t.index] || '—';
      nakName   = NAKSHATRA_NAMES[v.getNakshatra(jdNoon).index] || '—';
      yogaName  = YOGA_NAMES[v.getYoga(jdNoon).index] || '—';
      karana    = v.getKarana(jdNoon).name || '—';
    } catch (_) {}
    const bnDate = getBengaliDate(dateStr);
    const wd = new Date(dateStr + 'T00:00:00').getDay();
    results.push({
      dateStr,
      day: d,
      weekday: wd,
      tithiIdx,
      tithi:     tithiName,
      nakshatra: nakName,
      yoga:      yogaName,
      karana,
      bengaliDay:   bnDate?.day       || null,
      bengaliMonth: bnDate?.monthName || '—',
      bengaliYear:  bnDate?.year      || null,
    });
  }
  return results;
}
