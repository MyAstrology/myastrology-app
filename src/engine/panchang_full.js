import v from '../vsop87-planets';

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
const WEEKDAY_NAMES = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];
const RASHI_NAMES   = ['মেষ','বৃষ','মিথুন','কর্কট','সিংহ','কন্যা','তুলা','বৃশ্চিক','ধনু','মকর','কুম্ভ','মীন'];
const PADA_NAMES    = ['প্রথম','দ্বিতীয়','তৃতীয়','চতুর্থ'];

// Kolkata default
const DEF_LAT = 22.5726;
const DEF_LON = 88.3639;

// Rahu Kala / Gulika / Yamagnda slot (1-indexed) by weekday (0=Sun…6=Sat)
const RAHU_SLOT     = [8, 2, 7, 5, 6, 4, 3];
const GULIKA_SLOT   = [6, 5, 4, 3, 2, 1, 7];
const YAMAGNDA_SLOT = [4, 3, 2, 1, 8, 7, 6];

function parseHMS(hms) {
  if (!hms) return null;
  const [h, m, s] = hms.split(':').map(Number);
  return h + (m || 0) / 60 + (s || 0) / 3600;
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

export function getPanchangForDate(dateStr, lat = DEF_LAT, lon = DEF_LON) {
  const [y, m, d] = dateStr.split('-').map(Number);

  let p;
  try { p = v.getDailyPanchang(y, m, d, lat, lon); }
  catch (_) { return null; }

  const wd    = p.date.weekday;
  const riseH = parseHMS(p.sunrise);
  const setH  = parseHMS(p.sunset);

  const rahuKala  = (riseH && setH) ? getSlotTime(riseH, setH, RAHU_SLOT[wd])     : null;
  const gulika    = (riseH && setH) ? getSlotTime(riseH, setH, GULIKA_SLOT[wd])    : null;
  const yamagnda  = (riseH && setH) ? getSlotTime(riseH, setH, YAMAGNDA_SLOT[wd])  : null;

  let abhijit = null;
  if (p.transit) {
    const tH = parseHMS(p.transit);
    abhijit = { start: decToHM(tH - 0.2), end: decToHM(tH + 0.2) };
  }

  const tIdx  = p.tithi.index;
  const paksha = tIdx < 15 ? 'শুক্লপক্ষ' : 'কৃষ্ণপক্ষ';

  const ay      = p.ayanamsa || 0;
  const ayDeg   = Math.floor(ay);
  const ayMin   = Math.floor((ay - ayDeg) * 60);
  const aySec   = Math.round(((ay - ayDeg) * 60 - ayMin) * 60);
  const ayanamsaStr = `${ayDeg}°${String(ayMin).padStart(2,'0')}'${String(aySec).padStart(2,'0')}"`;

  return {
    date:     dateStr,
    weekday:  WEEKDAY_NAMES[wd],
    weekdayNum: wd,
    sunrise:  p.sunrise  ? p.sunrise.substring(0,5)  : '—',
    sunset:   p.sunset   ? p.sunset.substring(0,5)   : '—',
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
  };
}
