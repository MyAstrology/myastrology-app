import v from '../vsop87-planets';

const BN_MONTH_NAMES = ['বৈশাখ','জ্যৈষ্ঠ','আষাঢ়','শ্রাবণ','ভাদ্র','আশ্বিন','কার্তিক','অগ্রহায়ণ','পৌষ','মাঘ','ফাল্গুন','চৈত্র'];
const BN_RITU        = ['গ্রীষ্মকাল','গ্রীষ্মকাল','বর্ষাকাল','বর্ষাকাল','শরৎকাল','শরৎকাল','হেমন্তকাল','হেমন্তকাল','শীতকাল','শীতকাল','বসন্তকাল','বসন্তকাল'];

// Bengali month start dates (source: panjika-ephemeris.js bms table)
// [gregorianDateISO, bnYear, bnMonthIndex]
const BMS = [
  ['2023-04-15',1430,0],['2023-05-15',1430,1],['2023-06-15',1430,2],['2023-07-17',1430,3],
  ['2023-08-17',1430,4],['2023-09-17',1430,5],['2023-10-18',1430,6],['2023-11-17',1430,7],
  ['2023-12-17',1430,8],['2024-01-15',1430,9],['2024-02-14',1430,10],['2024-03-14',1430,11],
  ['2024-04-14',1431,0],['2024-05-15',1431,1],['2024-06-15',1431,2],['2024-07-16',1431,3],
  ['2024-08-17',1431,4],['2024-09-17',1431,5],['2024-10-17',1431,6],['2024-11-16',1431,7],
  ['2024-12-16',1431,8],['2025-01-14',1431,9],['2025-02-13',1431,10],['2025-03-14',1431,11],
  ['2025-04-15',1432,0],['2025-05-16',1432,1],['2025-06-16',1432,2],['2025-07-17',1432,3],
  ['2025-08-18',1432,4],['2025-09-18',1432,5],['2025-10-18',1432,6],['2025-11-17',1432,7],
  ['2025-12-17',1432,8],['2026-01-15',1432,9],['2026-02-14',1432,10],['2026-03-16',1432,11],
  ['2026-04-15',1433,0],['2026-05-16',1433,1],['2026-06-16',1433,2],['2026-07-18',1433,3],
  ['2026-08-19',1433,4],['2026-09-17',1433,5],['2026-10-17',1433,6],['2026-11-18',1433,7],
  ['2026-12-17',1433,8],['2027-01-15',1433,9],['2027-02-13',1433,10],['2027-03-15',1433,11],
  ['2027-04-15',1434,0],['2027-05-16',1434,1],['2027-06-16',1434,2],['2027-07-17',1434,3],
  ['2027-08-19',1434,4],['2027-09-17',1434,5],['2027-10-17',1434,6],['2027-11-16',1434,7],
  ['2027-12-16',1434,8],['2028-01-15',1434,9],['2028-02-14',1434,10],['2028-03-14',1434,11],
  ['2028-04-14',1435,0],['2028-05-15',1435,1],['2028-06-15',1435,2],['2028-07-16',1435,3],
  ['2028-08-17',1435,4],['2028-09-16',1435,5],['2028-10-17',1435,6],['2028-11-16',1435,7],
  ['2028-12-16',1435,8],['2029-01-15',1435,9],['2029-02-13',1435,10],['2029-03-15',1435,11],
];

export function getBengaliDate(dateStr) {
  let found = null;
  for (let i = BMS.length - 1; i >= 0; i--) {
    if (dateStr >= BMS[i][0]) { found = BMS[i]; break; }
  }
  if (!found) return null;
  const dayDiff = Math.round((new Date(dateStr + 'T00:00:00') - new Date(found[0] + 'T00:00:00')) / 86400000);
  return { year: found[1], monthName: BN_MONTH_NAMES[found[2]], day: dayDiff + 1, ritu: BN_RITU[found[2]] };
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

// IST string "HH:MM:SS" → Julian Day
function istStrToJD(y, m, d, istStr) {
  if (!istStr) return null;
  const [h, mn, s] = istStr.split(':').map(Number);
  return v.JD(y, m, d) - 0.5 + (h + mn / 60 + (s || 0) / 3600 - 5.5) / 24;
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

function jdHM(jd) {
  if (!jd) return null;
  return v.jdToIST(jd).substring(0, 5);
}

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

  const tIdx  = p.tithi.index;
  const paksha = tIdx < 15 ? 'শুক্লপক্ষ' : 'কৃষ্ণপক্ষ';
  const bnDate = getBengaliDate(dateStr);

  // Compute slot start/end times via binary search
  const refJD = p.sunrise ? istStrToJD(y, m, d, p.sunrise)
                           : (v.JD(y, m, d) + 5.5 / 24 - 0.5 + 5 / 24);
  const tSt = jdHM(findStartJD(v.getTithi,     refJD, tIdx));
  const tEn = jdHM(findEndJD  (v.getTithi,     refJD, tIdx));
  const nSt = jdHM(findStartJD(v.getNakshatra, refJD, p.nakshatra.index));
  const nEn = jdHM(findEndJD  (v.getNakshatra, refJD, p.nakshatra.index));
  const ySt = jdHM(findStartJD(v.getYoga,      refJD, p.yoga.index));
  const yEn = jdHM(findEndJD  (v.getYoga,      refJD, p.yoga.index));

  const ay      = p.ayanamsa || 0;
  const ayDeg   = Math.floor(ay);
  const ayMin   = Math.floor((ay - ayDeg) * 60);
  const aySec   = Math.round(((ay - ayDeg) * 60 - ayMin) * 60);
  const ayanamsaStr = `${ayDeg}°${String(ayMin).padStart(2,'0')}'${String(aySec).padStart(2,'0')}"`;

  return {
    date:     dateStr,
    weekday:  WEEKDAY_NAMES[wd],
    weekdayNum: wd,
    bengaliDay:   bnDate ? bnDate.day       : null,
    bengaliMonth: bnDate ? bnDate.monthName : '—',
    bengaliYear:  bnDate ? bnDate.year      : null,
    ritu:         bnDate ? bnDate.ritu      : '—',
    tithiStart:     tSt,  tithiEnd:     tEn,
    nakshatraStart: nSt,  nakshatraEnd: nEn,
    yogaStart:      ySt,  yogaEnd:      yEn,
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
