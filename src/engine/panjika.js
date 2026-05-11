// src/engine/panjika.js — বিশুদ্ধসিদ্ধ পদ্ধতিতে পঞ্জিকা গণনা, যেকোনো শহর

const DEFAULT_LAT = 23.18; // রাণাঘাট
const DEFAULT_LON = 88.55;
const TZ = 5.5; // IST

const TITHIS = [
  'প্রতিপদা','দ্বিতীয়া','তৃতীয়া','চতুর্থী','পঞ্চমী',
  'ষষ্ঠী','সপ্তমী','অষ্টমী','নবমী','দশমী',
  'একাদশী','দ্বাদশী','ত্রয়োদশী','চতুর্দশী','পূর্ণিমা',
];
const PAKSHA = ['শুক্লা ','কৃষ্ণা '];

const NAKSHATRAS = [
  'অশ্বিনী','ভরণী','কৃত্তিকা','রোহিণী','মৃগশিরা',
  'আর্দ্রা','পুনর্বসু','পুষ্যা','অশ্লেষা','মঘা',
  'পূর্বফল্গুনী','উত্তরফল্গুনী','হস্তা','চিত্রা','স্বাতী',
  'বিশাখা','অনুরাধা','জ্যেষ্ঠা','মূলা','পূর্বাষাঢ়া',
  'উত্তরাষাঢ়া','শ্রবণা','ধনিষ্ঠা','শতভিষা','পূর্বভাদ্রপদ',
  'উত্তরভাদ্রপদ','রেবতী',
];

const YOGAS = [
  'বিষ্কম্ভ','প্রীতি','আয়ুষ্মান','সৌভাগ্য','শোভন',
  'অতিগণ্ড','সুকর্মা','ধৃতি','শূল','গণ্ড',
  'বৃদ্ধি','ধ্রুব','ব্যাঘাত','হর্ষণ','বজ্র',
  'সিদ্ধি','ব্যতীপাত','বরীয়ান','পরিঘ','শিব',
  'সিদ্ধ','সাধ্য','শুভ','শুক্ল','ব্রহ্ম',
  'ইন্দ্র','বৈধৃতি',
];

const KARANA = [
  'বব','বালব','কৌলব','তৈতিল','গর','বণিজ','বিষ্টি',
  'শকুনি','চতুষ্পদ','নাগ','কিন্তুঘ্ন',
];

// রাহুকাল বার অনুযায়ী (দিনের ৮ ভাগের কোন ভাগ)
const RAHU_SLOTS = [8, 2, 7, 5, 6, 4, 3]; // Sun…Sat

// ── Math helpers ────────────────────────────────────────
const toRad = d => d * Math.PI / 180;
const toDeg = r => r * 180 / Math.PI;
const mod360 = x => ((x % 360) + 360) % 360;

function jdn(date) {
  const y = date.getUTCFullYear(), m = date.getUTCMonth() + 1, d = date.getUTCDate();
  const A = Math.floor((14 - m) / 12);
  const Y = y + 4800 - A, M = m + 12 * A - 3;
  return d + Math.floor((153 * M + 2) / 5) + 365 * Y +
    Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400) - 32045;
}

function sunLon(jd) {
  const n = jd - 2451545.0;
  const L = mod360(280.460 + 0.9856474 * n);
  const g = toRad(mod360(357.528 + 0.9856003 * n));
  return mod360(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
}

function moonLon(jd) {
  const n = jd - 2451545.0;
  const L = mod360(218.316 + 13.176396 * n);
  const M = toRad(mod360(134.963 + 13.064993 * n));
  const F = toRad(mod360(93.272 + 13.229350 * n));
  return mod360(L + 6.289 * Math.sin(M) - 1.274 * Math.sin(2 * F - M)
    + 0.658 * Math.sin(2 * F) - 0.214 * Math.sin(2 * M)
    - 0.186 * Math.sin(toRad(mod360(357.528 + 0.9856003 * n))));
}

// সূর্যোদয়/সূর্যাস্তের decimal ঘণ্টা (IST) — lat/lon প্যারামিটার
function _sunDecimal(date, lat, lon, rising) {
  const jd = jdn(date) + 0.5 - lon / 360;
  const n = jd - 2451545.0;
  const Lsun = mod360(280.460 + 0.9856474 * n);
  const g = toRad(mod360(357.528 + 0.9856003 * n));
  const eclLon = mod360(Lsun + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
  const sinDec = Math.sin(toRad(23.439)) * Math.sin(toRad(eclLon));
  const dec = Math.asin(sinDec);
  const cosH = (Math.cos(toRad(90.833)) - Math.sin(toRad(lat)) * sinDec)
    / (Math.cos(toRad(lat)) * Math.cos(dec));
  if (Math.abs(cosH) > 1) return rising ? 6 : 18;
  const H = toDeg(Math.acos(cosH));
  const transit = 12 + (lon - 15 * TZ) / 15 - (Lsun - 180) / 360;
  return rising ? transit - H / 15 : transit + H / 15;
}

function fmtTime(decimal) {
  const totalMin = Math.round(decimal * 60);
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  const hh = h % 12 || 12;
  let suffix;
  if (h >= 20 || h < 4) suffix = 'রাত ';
  else if (h < 12) suffix = 'সকাল ';
  else if (h < 17) suffix = 'বিকেল ';
  else if (h < 20) suffix = 'সন্ধ্যা ';
  else suffix = 'রাত ';
  return `${suffix}${hh}:${String(m).padStart(2, '0')}`;
}

const AMRIT_NAKS = {
  0:[6,10,18], 1:[2,7,20], 2:[0,9,17],
  3:[4,11,21], 4:[1,8,16], 5:[3,12,22], 6:[5,13,25],
};

// ── Public API ───────────────────────────────────────────

export function getTodayPanjika(date = new Date(), lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const jd  = jdn(date) + 0.5 - lon / 360 + TZ / 24;
  const sLon = sunLon(jd);
  const mLon = moonLon(jd);
  const diff = mod360(mLon - sLon);

  // তিথি
  const tithiIdx = Math.floor(diff / 12); // 0–29
  const paksha = tithiIdx < 15 ? 0 : 1;
  const tithiName = tithiIdx === 14 ? 'পূর্ণিমা'
    : tithiIdx === 29 ? 'অমাবস্যা'
    : PAKSHA[paksha] + TITHIS[tithiIdx % 15];

  // নক্ষত্র
  const nakIdx = Math.floor(mod360(mLon) / (360 / 27)) % 27;

  // যোগ
  const yogaIdx = Math.floor(mod360(sLon + mLon) / (360 / 27)) % 27;

  // করণ
  const karanaIdx = Math.floor(diff / 6) % 11;

  // সূর্যোদয় / সূর্যাস্ত
  const srDec = _sunDecimal(date, lat, lon, true);
  const ssDec = _sunDecimal(date, lat, lon, false);

  // রাহুকাল
  const seg = (ssDec - srDec) / 8;
  const rSlot = RAHU_SLOTS[date.getDay()];
  const rStart = srDec + seg * (rSlot - 1);

  // অমৃতযোগ
  const amritNaks = AMRIT_NAKS[date.getDay()] || [];
  const amStart = amritNaks.includes(nakIdx)
    ? srDec + seg * 3
    : ssDec + 0.5;
  const amritStr = `${fmtTime(amStart)} – ${fmtTime(amStart + 1.5)}`;

  return {
    tithi:    tithiName,
    nakshatra: NAKSHATRAS[nakIdx],
    yoga:     YOGAS[yogaIdx],
    karana:   KARANA[karanaIdx],
    sunrise:  fmtTime(srDec),
    sunset:   fmtTime(ssDec),
    rahukal:  `${fmtTime(rStart)} – ${fmtTime(rStart + seg)}`,
    amrit:    amritStr,
    tithiIdx,
  };
}

// পরবর্তী তিথি পরিবর্তনের সময়
export function getNextTithiChange(date = new Date(), lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const now = date.getTime();
  for (let min = 1; min <= 1440; min++) {
    const t1 = new Date(now + (min - 1) * 60000);
    const t2 = new Date(now + min * 60000);
    const jd1 = jdn(t1) + 0.5 - lon / 360 + TZ / 24;
    const jd2 = jdn(t2) + 0.5 - lon / 360 + TZ / 24;
    const idx1 = Math.floor(mod360(moonLon(jd1) - sunLon(jd1)) / 12);
    const idx2 = Math.floor(mod360(moonLon(jd2) - sunLon(jd2)) / 12);
    if (idx1 !== idx2) {
      const name = idx2 === 14 ? 'পূর্ণিমা'
        : idx2 === 29 ? 'অমাবস্যা'
        : (idx2 < 15 ? 'শুক্লা ' : 'কৃষ্ণা ') + TITHIS[idx2 % 15];
      return { time: t2, tithiName: name };
    }
  }
  return null;
}
