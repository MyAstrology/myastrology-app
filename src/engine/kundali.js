import v from '../vsop87-planets';

export const RASHI_NAMES = [
  'মেষ','বৃষ','মিথুন','কর্কট','সিংহ','কন্যা',
  'তুলা','বৃশ্চিক','ধনু','মকর','কুম্ভ','মীন',
];

const RASHI_SYM = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

const WEEKDAY_NAMES = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];

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

// North Indian chart: 4×4 grid, 0 = center (blank)
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

// Default: Kolkata
const DEFAULT_LAT = 22.5726;
const DEFAULT_LON = 88.3639;

export function getKundali(dateStr, timeStr, lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, m] = (timeStr || '12:00').split(':').map(Number);
  const h_ist = h + (m || 0) / 60;

  const jd = v.JD_IST(y, mo, d, h_ist);

  // Lagna using birth coordinates
  const lagnaLon   = v.getLagna(jd, lat, lon);
  const lagnaRashi = Math.floor(lagnaLon / 30) % 12;

  // All 9 planets via VSOP87
  const pos = v.planetaryPositions(jd);

  const planets = PLANET_LIST.map(pl => {
    const lon_deg = pos[pl.vsopKey];
    if (lon_deg === null || lon_deg === undefined) return null;
    const rashi = Math.floor(lon_deg / 30) % 12;
    const house = ((rashi - lagnaRashi + 12) % 12) + 1;
    const deg   = Math.round((lon_deg % 30) * 100) / 100;
    return { ...pl, rashi, house, deg, rashiName: RASHI_NAMES[rashi], sym: RASHI_SYM[rashi] };
  }).filter(Boolean);

  // House → planet short names
  const houseMap = {};
  for (let i = 1; i <= 12; i++) houseMap[i] = [];
  planets.forEach(pl => houseMap[pl.house]?.push(pl.short));

  // Rashi for each house
  const houseRashi = {};
  for (let i = 1; i <= 12; i++) {
    houseRashi[i] = (lagnaRashi + i - 1) % 12;
  }

  // Panchang for birth date (weekday, tithi, nakshatra)
  const panchang = v.getDailyPanchang(y, mo, d, lat, lon);
  const weekdayNum  = panchang.date.weekday;
  const tithiIdx    = panchang.tithi.index;
  const paksha      = tithiIdx <= 14 ? 'শুক্ল' : 'কৃষ্ণ';
  const tithiName   = TITHI_NAMES[tithiIdx] || '';
  const nakshatraName = NAKSHATRA_NAMES[panchang.nakshatra.index] || '';

  return {
    lagnaRashi,
    lagnaName: RASHI_NAMES[lagnaRashi],
    planets,
    houseMap,
    houseRashi,
    weekday: WEEKDAY_NAMES[weekdayNum],
    weekdayNum,
    paksha,
    tithi: tithiName,
    nakshatra: nakshatraName,
  };
}
