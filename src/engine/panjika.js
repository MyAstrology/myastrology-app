const p = require('../panjika-ephemeris');

export function getTodayPanchang() {
  const today = new Date().toISOString().split('T')[0];
  const r = p.getDailyPanchang(today);
  return {
    date: today,
    tithi: p.TITHI_NAMES[r.tithi],
    nakshatra: p.NAKSHATRA_NAMES[r.nakshatra],
    yoga: p.YOGA_NAMES[r.yoga],
    sunrise: p.hm(p.getSunrise(today)),
    sunset: p.hm(p.getSunset(today)),
  };
}
