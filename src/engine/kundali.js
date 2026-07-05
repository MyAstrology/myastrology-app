const p = require('../panjika-ephemeris');

export const RASHI_NAMES = p.RASHI_NAMES;

const RASHI_SYM = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

// North Indian chart: 4×4 grid, house positions
// 0 = center (blank)
export const HOUSE_GRID = [
  [12,  1,  2,  3],
  [11,  0,  0,  4],
  [10,  0,  0,  5],
  [ 9,  8,  7,  6],
];

export const PLANET_LIST = [
  { key: 'surya',      name: 'সূর্য',     short: 'সূ' },
  { key: 'chandra',    name: 'চন্দ্র',    short: 'চ'  },
  { key: 'mangal',     name: 'মঙ্গল',     short: 'মঙ্' },
  { key: 'budha',      name: 'বুধ',       short: 'বু' },
  { key: 'brihaspati', name: 'বৃহস্পতি',  short: 'বৃ' },
  { key: 'shukra',     name: 'শুক্র',     short: 'শু' },
  { key: 'shani',      name: 'শনি',       short: 'শ'  },
  { key: 'rahu',       name: 'রাহু',      short: 'রা' },
  { key: 'ketu',       name: 'কেতু',      short: 'কে' },
];

export function getKundali(dateStr, timeStr) {
  const [h, m] = (timeStr || '12:00').split(':').map(Number);
  const timeDecimal = h + (m || 0) / 60;

  const lagna = p.getLagna(dateStr, timeDecimal);
  const lagnaRashi = lagna.rashi ?? 0;

  // Use panchang.navagraha — provides all 9 planets including chandra, budha, shukra
  const panchang = p.getDailyPanchang(dateStr);
  const nav = panchang.navagraha;

  const planets = PLANET_LIST.map(pl => {
    const planetData = nav[pl.key];
    if (!planetData || planetData.rashi === null || planetData.rashi === undefined) return null;
    const rashi = planetData.rashi;
    const house = ((rashi - lagnaRashi + 12) % 12) + 1;
    return {
      ...pl,
      rashi,
      house,
      rashiName: RASHI_NAMES[rashi],
      sym: RASHI_SYM[rashi],
      deg: Math.round((planetData.deg || 0) * 100) / 100,
    };
  }).filter(Boolean);

  // Build house → planets map
  const houseMap = {};
  for (let i = 1; i <= 12; i++) houseMap[i] = [];
  planets.forEach(pl => houseMap[pl.house]?.push(pl.short));

  // Rashi in each house
  const houseRashi = {};
  for (let i = 1; i <= 12; i++) {
    houseRashi[i] = (lagnaRashi + i - 1) % 12;
  }

  return {
    lagnaRashi,
    lagnaName: RASHI_NAMES[lagnaRashi],
    planets,
    houseMap,
    houseRashi,
    weekday: panchang.weekday,
    weekdayNum: panchang.weekdayNum,
    tithi: panchang.tithiName,
    paksha: panchang.paksha,
    nakshatra: panchang.nakshatraName,
  };
}
