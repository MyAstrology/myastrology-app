// Compatibility wrapper around vsop87-planets.js
// Provides the API that engine/panjika.js and engine/rashifal.js expect

const v = require('./vsop87-planets');

const DEFAULT_LAT = 22.5726; // Kolkata
const DEFAULT_LON = 88.3639;

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
  'সিদ্ধি','ব্যতীপাত','বরীয়ান','পরিঘ','শিব','সিদ্ধ','সাধ্য','শুভ',
  'শুক্ল','ব্রহ্ম','ইন্দ্র','বৈধৃতি',
];

const RASHI_NAMES = [
  'মেষ','বৃষ','মিথুন','কর্কট','সিংহ','কন্যা',
  'তুলা','বৃশ্চিক','ধনু','মকর','কুম্ভ','মীন',
];

function parseDate(dateStr) {
  const parts = String(dateStr).split('-').map(Number);
  return { y: parts[0], m: parts[1], d: parts[2] };
}

function hm(decimalHour) {
  const total = ((decimalHour % 24) + 24) % 24;
  const h = Math.floor(total);
  const mins = Math.round((total - h) * 60);
  const m2 = mins === 60 ? 0 : mins;
  const h2 = mins === 60 ? h + 1 : h;
  return `${String(h2 % 24).padStart(2, '0')}:${String(m2).padStart(2, '0')}`;
}

function getDayOfYear(y, m, d) {
  const leapYear = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysInMonth = [0,31,leapYear?29:28,31,30,31,30,31,31,30,31,30,31];
  let doy = d;
  for (let i = 1; i < m; i++) doy += daysInMonth[i];
  return doy;
}

function getSunrise(dateStr) {
  const { y, m, d } = parseDate(dateStr);
  const doy = getDayOfYear(y, m, d);
  const declRad = 23.45 * Math.sin(((360 / 365) * (doy - 81)) * Math.PI / 180) * Math.PI / 180;
  const latRad  = DEFAULT_LAT * Math.PI / 180;
  const cosHA   = -Math.tan(latRad) * Math.tan(declRad);
  const ha      = Math.acos(Math.max(-1, Math.min(1, cosHA))) * 180 / Math.PI;
  // UTC = 12 - ha/15 - lon_correction; IST = UTC + 5.5
  const sunriseUT = 12 - ha / 15 - (DEFAULT_LON - 82.5) / 15;
  return sunriseUT + 5.5;
}

function getSunset(dateStr) {
  const { y, m, d } = parseDate(dateStr);
  const doy = getDayOfYear(y, m, d);
  const declRad = 23.45 * Math.sin(((360 / 365) * (doy - 81)) * Math.PI / 180) * Math.PI / 180;
  const latRad  = DEFAULT_LAT * Math.PI / 180;
  const cosHA   = -Math.tan(latRad) * Math.tan(declRad);
  const ha      = Math.acos(Math.max(-1, Math.min(1, cosHA))) * 180 / Math.PI;
  const sunsetUT = 12 + ha / 15 - (DEFAULT_LON - 82.5) / 15;
  return sunsetUT + 5.5;
}

function getDailyPanchang(dateStr) {
  const { y, m, d } = parseDate(dateStr);
  const result = v.getDailyPanchang(y, m, d, DEFAULT_LAT, DEFAULT_LON);
  const jd  = v.JD_IST(y, m, d, 12);
  const pos = v.planetaryPositions(jd);
  const yogaIndex = Math.floor(((pos.sun + pos.moon) % 360) / (360 / 27)) % 27;
  return {
    tithi:    result.tithi.index,
    nakshatra: result.nakshatra.index,
    yoga:     yogaIndex,
  };
}

function getNavagraha(dateStr) {
  const { y, m, d } = parseDate(dateStr);
  const jd  = v.JD_IST(y, m, d, 12);
  const pos = v.planetaryPositions(jd);
  const rashi = (deg) => deg !== null && deg !== undefined ? Math.floor(deg / 30) % 12 : null;
  return {
    surya:      { rashi: rashi(pos.sun) },
    chandra:    { rashi: rashi(pos.moon) },
    mangal:     { rashi: rashi(pos.mars) },
    budha:      { rashi: rashi(pos.mercury) },
    brihaspati: { rashi: rashi(pos.jupiter) },
    shukra:     { rashi: rashi(pos.venus) },
    shani:      { rashi: rashi(pos.saturn) },
    rahu:       { rashi: rashi(pos.rahu) },
    ketu:       { rashi: rashi(pos.ketu) },
  };
}

module.exports = {
  TITHI_NAMES,
  NAKSHATRA_NAMES,
  YOGA_NAMES,
  RASHI_NAMES,
  getDailyPanchang,
  getSunrise,
  getSunset,
  hm,
  getNavagraha,
};
