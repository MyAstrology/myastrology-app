import v from '../vsop87-planets';

export const RASHI_NAMES = [
  'মেষ','বৃষ','মিথুন','কর্কট','সিংহ','কন্যা',
  'তুলা','বৃশ্চিক','ধনু','মকর','কুম্ভ','মীন',
];
const RASHI_SYM = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

const NAKSHATRA_NAMES = [
  'অশ্বিনী','ভরণী','কৃত্তিকা','রোহিণী','মৃগশিরা','আর্দ্রা','পুনর্বসু',
  'পুষ্যা','আশ্লেষা','মঘা','পূর্বফাল্গুনী','উত্তরফাল্গুনী','হস্তা','চিত্রা',
  'স্বাতী','বিশাখা','অনুরাধা','জ্যেষ্ঠা','মূলা','পূর্বাষাঢ়া','উত্তরাষাঢ়া',
  'শ্রবণা','ধনিষ্ঠা','শতভিষা','পূর্বভাদ্রপদ','উত্তরভাদ্রপদ','রেবতী',
];
const PADA_NAMES  = ['প্রথম','দ্বিতীয়','তৃতীয়','চতুর্থ'];
const WEEKDAY_NAMES = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];
const TITHI_NAMES = [
  'প্রতিপদা','দ্বিতীয়া','তৃতীয়া','চতুর্থী','পঞ্চমী','ষষ্ঠী','সপ্তমী',
  'অষ্টমী','নবমী','দশমী','একাদশী','দ্বাদশী','ত্রয়োদশী','চতুর্দশী','পূর্ণিমা',
  'প্রতিপদা','দ্বিতীয়া','তৃতীয়া','চতুর্থী','পঞ্চমী','ষষ্ঠী','সপ্তমী',
  'অষ্টমী','নবমী','দশমী','একাদশী','দ্বাদশী','ত্রয়োদশী','চতুর্দশী','অমাবস্যা',
];
const YOGA_NAMES = [
  'বিষ্কম্ভ','প্রীতি','আয়ুষ্মান','সৌভাগ্য','শোভন','অতিগণ্ড','সুকর্মা',
  'ধৃতি','শূল','গণ্ড','বৃদ্ধি','ধ্রুব','ব্যাঘাত','হর্ষণ','বজ্র',
  'সিদ্ধি','ব্যতীপাত','বরীয়ান','পরিঘ','শিব','সিদ্ধ','সাধ্য','শুভ',
  'শুক্ল','ব্রহ্ম','ইন্দ্র','বৈধৃতি',
];

// North Indian chart: 4×4 grid, 0 = centre (blank)
export const HOUSE_GRID = [
  [12,  1,  2,  3],
  [11,  0,  0,  4],
  [10,  0,  0,  5],
  [ 9,  8,  7,  6],
];

export const PLANET_LIST = [
  { key: 'surya',      vsopKey: 'sun',     name: 'সূর্য',     short: 'সূ'  },
  { key: 'chandra',    vsopKey: 'moon',    name: 'চন্দ্র',    short: 'চ'   },
  { key: 'mangal',     vsopKey: 'mars',    name: 'মঙ্গল',     short: 'মঙ্' },
  { key: 'budha',      vsopKey: 'mercury', name: 'বুধ',       short: 'বু'  },
  { key: 'brihaspati', vsopKey: 'jupiter', name: 'বৃহস্পতি',  short: 'বৃ'  },
  { key: 'shukra',     vsopKey: 'venus',   name: 'শুক্র',     short: 'শু'  },
  { key: 'shani',      vsopKey: 'saturn',  name: 'শনি',       short: 'শ'   },
  { key: 'rahu',       vsopKey: 'rahu',    name: 'রাহু',      short: 'রা'  },
  { key: 'ketu',       vsopKey: 'ketu',    name: 'কেতু',      short: 'কে'  },
];

// ── D9 নবাংশ ──────────────────────────────────────────────────
// প্রতিটি রাশি (৩০°) = ৯ নবাংশ × ৩°২০'
// অগ্নিরাশি (0,4,8): মেষ থেকে শুরু; পৃথ্বীরাশি (1,5,9): মকর; বায়ুরাশি (2,6,10): তুলা; জলরাশি (3,7,11): কর্কট
const _NAV_START = [0, 9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3];
function getD9Rashi(lon) {
  const r = Math.floor(lon / 30) % 12;
  const n = Math.floor((lon % 30) * 9 / 30);
  return (_NAV_START[r] + n) % 12;
}

// ── বিংশোত্তরী দশা ───────────────────────────────────────────
const DASHA_PLANETS = [
  { name: 'কেতু',      short: 'কে', years: 7  },
  { name: 'শুক্র',     short: 'শু', years: 20 },
  { name: 'সূর্য',     short: 'সূ', years: 6  },
  { name: 'চন্দ্র',    short: 'চ',  years: 10 },
  { name: 'মঙ্গল',     short: 'মঙ্', years: 7  },
  { name: 'রাহু',      short: 'রা', years: 18 },
  { name: 'বৃহস্পতি',  short: 'বৃ', years: 16 },
  { name: 'শনি',       short: 'শ',  years: 19 },
  { name: 'বুধ',       short: 'বু', years: 17 },
];
// নক্ষত্র সূচক → দশা গ্রহ সূচক (0=কেতু, 1=শুক্র, ...)
const NAK_TO_DASHA = [0,1,2,3,4,5,6,7,8, 0,1,2,3,4,5,6,7,8, 0,1,2,3,4,5,6,7,8];

function fmtDate(d) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function getDashas(dateStr, moonNakIdx, moonFrac) {
  const birth = new Date(dateStr + 'T00:00:00');
  const di    = NAK_TO_DASHA[moonNakIdx];
  const cur   = DASHA_PLANETS[di];
  const rem   = (1 - moonFrac) * cur.years;

  const dashas = [];
  let cursor = new Date(birth);

  const ms1   = rem * 365.25 * 24 * 3600 * 1000;
  const end1  = new Date(cursor.getTime() + ms1);
  dashas.push({ planet: cur.name, short: cur.short, years: +rem.toFixed(2), start: fmtDate(cursor), end: fmtDate(end1), current: true });
  cursor = end1;

  for (let i = 1; i < 9; i++) {
    const pl  = DASHA_PLANETS[(di + i) % 9];
    const ms  = pl.years * 365.25 * 24 * 3600 * 1000;
    const end = new Date(cursor.getTime() + ms);
    dashas.push({ planet: pl.name, short: pl.short, years: pl.years, start: fmtDate(cursor), end: fmtDate(end), current: false });
    cursor = end;
  }
  return dashas;
}

// ── মাঙ্গলিক দোষ ─────────────────────────────────────────────
function checkMangalik(planets, lagnaRashi) {
  const mars = planets.find(p => p.key === 'mangal');
  if (!mars) return { isMangalik: false, house: -1 };
  return { isMangalik: [1,2,4,7,8,12].includes(mars.house), house: mars.house };
}

// ── কালসর্প যোগ ───────────────────────────────────────────────
function checkKalaSarpa(planets) {
  const rahu = planets.find(p => p.key === 'rahu');
  const ketu = planets.find(p => p.key === 'ketu');
  if (!rahu || !ketu) return { hasYoga: false };

  const others = planets.filter(p => !['rahu','ketu'].includes(p.key));
  function inArc(lon, start, end) {
    const d = ((lon - start) % 360 + 360) % 360;
    const a = ((end - start) % 360 + 360) % 360;
    return d <= a;
  }
  const rL = rahu.lon, kL = ketu.lon;
  const fwd = others.every(p => inArc(p.lon, rL, kL));
  const bwd = others.every(p => inArc(p.lon, kL, rL));
  return { hasYoga: fwd || bwd, type: fwd ? 'কালসর্প' : (bwd ? 'কালামৃত' : null) };
}

// ── Default location: Kolkata ─────────────────────────────────
const DEFAULT_LAT = 22.5726;
const DEFAULT_LON = 88.3639;

export function getKundali(dateStr, timeStr, lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, m]     = (timeStr || '12:00').split(':').map(Number);
  const h_ist      = h + (m || 0) / 60;

  const jd = v.JD_IST(y, mo, d, h_ist);

  // লগ্ন
  const lagnaLon   = v.getLagna(jd, lat, lon);
  const lagnaRashi = Math.floor(lagnaLon / 30) % 12;

  // গ্রহ অবস্থান
  const pos = v.planetaryPositions(jd);

  const planets = PLANET_LIST.map(pl => {
    const lon_deg = pos[pl.vsopKey];
    if (lon_deg == null) return null;
    const rashi   = Math.floor(lon_deg / 30) % 12;
    const house   = ((rashi - lagnaRashi + 12) % 12) + 1;
    const deg     = +(lon_deg % 30).toFixed(2);
    const d9Rashi = getD9Rashi(lon_deg);
    // নক্ষত্র (চন্দ্র অনুযায়ী for Moon; others use same formula)
    const nakIdx  = Math.floor(lon_deg / (360/27)) % 27;
    const nakFrac = (lon_deg % (360/27)) / (360/27);
    const pada    = Math.floor(nakFrac * 4) + 1;
    return {
      ...pl, lon: lon_deg, rashi, house, deg,
      rashiName: RASHI_NAMES[rashi],
      rashiSym:  RASHI_SYM[rashi],
      d9Rashi,   d9RashiName: RASHI_NAMES[d9Rashi],
      nakIdx,    nakName: NAKSHATRA_NAMES[nakIdx],
      pada,      padaName: PADA_NAMES[pada - 1],
    };
  }).filter(Boolean);

  // ঘর → গ্রহ সংক্ষিপ্ত নাম
  const houseMap = {};
  for (let i = 1; i <= 12; i++) houseMap[i] = [];
  planets.forEach(pl => houseMap[pl.house]?.push(pl.short));

  // প্রতিটি ঘরের রাশি
  const houseRashi = {};
  for (let i = 1; i <= 12; i++) houseRashi[i] = (lagnaRashi + i - 1) % 12;

  // D9 chart — লগ্ন D9 rashi
  const lagnaD9   = getD9Rashi(lagnaLon);
  const houseMapD9 = {};
  const houseRashiD9 = {};
  for (let i = 1; i <= 12; i++) {
    houseMapD9[i]   = [];
    houseRashiD9[i] = (lagnaD9 + i - 1) % 12;
  }
  planets.forEach(pl => {
    const d9House = ((pl.d9Rashi - lagnaD9 + 12) % 12) + 1;
    houseMapD9[d9House]?.push(pl.short);
  });

  // জন্মকালীন পঞ্চাঙ্গ
  const panchang = v.getDailyPanchang(y, mo, d, lat, lon);
  // হিন্দু বার: সূর্যোদয়ের আগে জন্ম হলে আগের দিনের বার
  let weekdayNum = panchang.date.weekday;
  if (panchang.sunrise) {
    const [srH, srM] = panchang.sunrise.split(':').map(Number);
    if (h_ist < srH + (srM || 0) / 60) weekdayNum = (weekdayNum + 6) % 7;
  }
  const tithiIdx   = panchang.tithi.index;
  const paksha     = tithiIdx < 15 ? 'শুক্লপক্ষ' : 'কৃষ্ণপক্ষ';
  const yogaIdx    = panchang.yoga.index;

  // জন্ম নক্ষত্র (জন্মসময় অনুযায়ী)
  const birthNak   = v.getNakshatra(jd);
  const moonNakIdx = birthNak.index;
  const moonFrac   = birthNak.fraction;

  // অয়নাংশ
  const ay    = panchang.ayanamsa || 0;
  const ayDeg = Math.floor(ay);
  const ayMin = Math.floor((ay - ayDeg) * 60);
  const aySec = Math.round(((ay - ayDeg) * 60 - ayMin) * 60);

  // দোষ
  const mangalik  = checkMangalik(planets, lagnaRashi);
  const kalaSarpa = checkKalaSarpa(planets);

  // বিংশোত্তরী দশা
  const dashas = getDashas(dateStr, moonNakIdx, moonFrac);

  return {
    lagnaRashi,
    lagnaName:  RASHI_NAMES[lagnaRashi],
    lagnaD9,
    lagnaD9Name: RASHI_NAMES[lagnaD9],
    planets,
    houseMap,
    houseRashi,
    houseMapD9,
    houseRashiD9,
    // জন্মকালীন পঞ্চাঙ্গ
    weekday:    WEEKDAY_NAMES[weekdayNum],
    weekdayNum,
    paksha,
    tithi:      TITHI_NAMES[tithiIdx]            || '—',
    nakshatra:  NAKSHATRA_NAMES[moonNakIdx]       || '—',
    nakshatraIdx: moonNakIdx,
    pada:       birthNak.pada,
    padaName:   PADA_NAMES[birthNak.pada - 1]    || '',
    yoga:       YOGA_NAMES[yogaIdx]              || '—',
    karana:     panchang.karana?.name            || '—',
    janmaRashi: RASHI_NAMES[panchang.janmaRashi] || '—',
    ayanamsa:   `${ayDeg}°${String(ayMin).padStart(2,'0')}'${String(aySec).padStart(2,'0')}"`,
    sunrise:    panchang.sunrise  ? panchang.sunrise.substring(0,5)  : '—',
    sunset:     panchang.sunset   ? panchang.sunset.substring(0,5)   : '—',
    // দোষ ও দশা
    mangalik,
    kalaSarpa,
    dashas,
  };
}
