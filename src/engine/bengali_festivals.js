import PANJIKA_DATA from './panjika-data';

// Festival database for Bengali/Hindu calendar
// Types: 'tithi' | 'bn_date' | 'gregorian' | 'জন্মবার্ষিকী'

const TITHI_FESTIVALS = [
  // ── Any month ──────────────────────────────────────────
  { tithiIdx:  4, bnMonthIdx: -1, name: 'শুক্ল পঞ্চমী' },
  { tithiIdx: 10, bnMonthIdx: -1, name: 'একাদশী ব্রত' },
  { tithiIdx: 14, bnMonthIdx: -1, name: 'পূর্ণিমা' },
  { tithiIdx: 25, bnMonthIdx: -1, name: 'একাদশী ব্রত' },
  { tithiIdx: 29, bnMonthIdx: -1, name: 'অমাবস্যা' },
  { tithiIdx: 12, bnMonthIdx: -1, name: 'প্রদোষ ব্রত (শুক্ল)' },
  { tithiIdx: 27, bnMonthIdx: -1, name: 'প্রদোষ ব্রত (কৃষ্ণ)' },

  // ── Baisakh (0) ─────────────────────────────────────────
  { tithiIdx:  2, bnMonthIdx:  0, name: 'অক্ষয় তৃতীয়া' },

  // ── Ashadh (2) ──────────────────────────────────────────
  { tithiIdx:  1, bnMonthIdx:  2, name: 'রথযাত্রা' },

  // ── Sravan (3) ──────────────────────────────────────────
  { tithiIdx:  4, bnMonthIdx:  3, name: 'নাগ পঞ্চমী' },
  { tithiIdx: 14, bnMonthIdx:  3, name: 'রক্ষাবন্ধন' },

  // ── Bhadra (4) ──────────────────────────────────────────
  { tithiIdx:  3, bnMonthIdx:  4, name: 'গণেশ চতুর্থী' },

  // ── Ashwin (5) ──────────────────────────────────────────
  { tithiIdx:  4, bnMonthIdx:  5, name: 'মহালয়া পঞ্চমী' },
  { tithiIdx:  5, bnMonthIdx:  5, name: 'দুর্গা পূজা (ষষ্ঠী)' },
  { tithiIdx:  6, bnMonthIdx:  5, name: 'দুর্গা পূজা (সপ্তমী)' },
  { tithiIdx:  7, bnMonthIdx:  5, name: 'দুর্গা পূজা (অষ্টমী)' },
  { tithiIdx:  8, bnMonthIdx:  5, name: 'দুর্গা পূজা (নবমী)' },
  { tithiIdx:  9, bnMonthIdx:  5, name: 'বিজয়া দশমী (দুর্গা পূজা)' },
  { tithiIdx: 14, bnMonthIdx:  5, name: 'কোজাগরী পূর্ণিমা (লক্ষ্মী পূজা)' },
  { tithiIdx: 19, bnMonthIdx:  5, name: 'কৃষ্ণ পঞ্চমী (মহালয়া)' },

  // ── Kartik (6) ──────────────────────────────────────────
  { tithiIdx: 14, bnMonthIdx:  6, name: 'কার্তিক পূর্ণিমা (রাসযাত্রা)' },
  { tithiIdx: 28, bnMonthIdx:  6, name: 'কালী পূজা' },
  { tithiIdx: 29, bnMonthIdx:  6, name: 'দীপাবলি / অমাবস্যা' },

  // ── Agrahayan (7) ───────────────────────────────────────
  { tithiIdx: 10, bnMonthIdx:  7, name: 'উথান একাদশী' },

  // ── Magh (9) ────────────────────────────────────────────
  { tithiIdx:  4, bnMonthIdx:  9, name: 'সরস্বতী পূজা (বসন্ত পঞ্চমী)' },
  { tithiIdx: 14, bnMonthIdx:  9, name: 'মাঘী পূর্ণিমা' },

  // ── Phalgun (10) ────────────────────────────────────────
  { tithiIdx: 13, bnMonthIdx: 10, name: 'শিবরাত্রি' },
  { tithiIdx: 14, bnMonthIdx: 10, name: 'দোলযাত্রা / হোলি' },

  // ── Chaitra (11) ────────────────────────────────────────
  { tithiIdx:  0, bnMonthIdx: 11, name: 'চৈত্র প্রতিপদা' },
  { tithiIdx:  8, bnMonthIdx: 11, name: 'রাম নবমী' },
];

const BN_DATE_FESTIVALS = [
  { bnMonthIdx: 0,  bnDay:  1, name: 'পহেলা বৈশাখ · বাংলা নববর্ষ' },
  { bnMonthIdx: 0,  bnDay: 25, name: 'রবীন্দ্র জন্মজয়ন্তী' },
  { bnMonthIdx: 8,  bnDay:  1, name: 'পৌষ পার্বণ' },
  { bnMonthIdx: 11, bnDay: 25, name: 'চৈত্র সংক্রান্তি' },
];

const GREGORIAN_FESTIVALS = [
  { month:  1, day: 23, name: 'নেতাজির জন্মদিন' },
  { month:  1, day: 26, name: 'প্রজাতন্ত্র দিবস' },
  { month:  4, day: 14, name: 'আম্বেদকর জয়ন্তী' },
  { month:  5, day:  1, name: 'শ্রমিক দিবস' },
  { month:  8, day: 15, name: 'স্বাধীনতা দিবস' },
  { month:  9, day:  5, name: 'শিক্ষক দিবস' },
  { month: 10, day:  2, name: 'গান্ধী জয়ন্তী' },
  { month: 12, day: 25, name: 'বড়দিন' },
];

// festival name → image key (matches keys in panjika-images.js)
const NAME_IMAGE = {
  'অক্ষয় তৃতীয়া':                    'Akshy-tritiya',
  'রথযাত্রা':                          'Rath-Yatra',
  'রক্ষাবন্ধন':                        'Rakhi-Purnima',
  'গণেশ চতুর্থী':                      'Ganesh-Chaturthi',
  'মহালয়া পঞ্চমী':                    'Mahalaya',
  'কৃষ্ণ পঞ্চমী (মহালয়া)':           'Mahalaya',
  'দুর্গা পূজা (ষষ্ঠী)':             'Durga-Puja',
  'দুর্গা পূজা (সপ্তমী)':            'Durga-Puja',
  'দুর্গা পূজা (অষ্টমী)':            'Durga-Puja',
  'দুর্গা পূজা (নবমী)':              'Durga-Puja',
  'বিজয়া দশমী (দুর্গা পূজা)':       'Durga-Puja',
  'কোজাগরী পূর্ণিমা (লক্ষ্মী পূজা)':'Lokkhi-Puja',
  'কার্তিক পূর্ণিমা (রাসযাত্রা)':   'Rash-Purnima',
  'কালী পূজা':                         'Kali-Puja',
  'উথান একাদশী':                       'Shukla-ekadashi',
  'একাদশী ব্রত':                       'Shukla-ekadashi',
  'সরস্বতী পূজা (বসন্ত পঞ্চমী)':    'Saraswati-Puja',
  'মাঘী পূর্ণিমা':                     'Maghi-Purnima',
  'শিবরাত্রি':                          'shiva-ratri',
  'দোলযাত্রা / হোলি':                 'Dol-Purnima',
  'রাম নবমী':                           'Ramnavami',
  'পহেলা বৈশাখ · বাংলা নববর্ষ':     'Pahla-baisakh',
  'রবীন্দ্র জন্মজয়ন্তী':             'Rabindra-Jayanti',
  'পৌষ পার্বণ':                        'Pous-Sankranti',
  'নেতাজির জন্মদিন':                  'Netaji-Subhash-Chandra',
  'প্রজাতন্ত্র দিবস':                 'Prajatantra-Divas',
  'আম্বেদকর জয়ন্তী':                 'Bheemrao-Ambedkar',
  'স্বাধীনতা দিবস':                   'Independent-Days',
  'গান্ধী জয়ন্তী':                    'Mahatma-Gandhi',
  // birthAnniversaries
  'স্বামী বিবেকানন্দ':                'Swami-Vivekananda',
  'নেতাজি সুভাষচন্দ্র বসু':          'Netaji-Subhash-Chandra',
  'শ্রীরামকৃষ্ণ পরমহংস':             'ramakrishna',
  'ঈশ্বরচন্দ্র বিদ্যাসাগর':          'Vidyasagar',
  'ড. বি. আর. আম্বেদকর':             'Bheemrao-Ambedkar',
  'রবীন্দ্রনাথ ঠাকুর':               'Rabindra-Jayanti',
  'মহাত্মা গান্ধী':                   'Mahatma-Gandhi',
  'কাজী নজরুল ইসলাম':                'Nazrul-Islam',
  'হরিচাঁদ ঠাকুর':                    'Harichand-Thakur',
};

// BMS table (duplicated from panchang_full for self-contained lookup)
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

function getBnMonthIdx(dateStr) {
  for (let i = BMS.length - 1; i >= 0; i--) {
    if (dateStr >= BMS[i][0]) return BMS[i][2];
  }
  return -1;
}

/**
 * Returns festivals for a given Gregorian month.
 * @param {number} year  - Gregorian year
 * @param {number} month - 0-indexed month
 * @param {Array}  calendarDays - output of getMonthCalendar(year, month)
 * @returns {Array} - [{dateStr, name, type}] sorted by date
 */
export function getFestivalsForMonth(year, month, calendarDays) {
  const results = [];
  const seen = new Set();

  function add(dateStr, name, type) {
    const key = `${dateStr}|${name}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ dateStr, name, type, imageKey: NAME_IMAGE[name] || null });
    }
  }

  const mmPrefix = String(month + 1).padStart(2, '0');

  // Gregorian fixed
  for (const f of GREGORIAN_FESTIVALS) {
    if (f.month === month + 1) {
      const dd = String(f.day).padStart(2, '0');
      add(`${year}-${mmPrefix}-${dd}`, f.name, 'জাতীয়');
    }
  }

  // Birth anniversaries from panjika-data.js
  if (PANJIKA_DATA?.birthAnniversaries) {
    for (const b of PANJIKA_DATA.birthAnniversaries) {
      if (b.mmdd && b.mmdd.startsWith(mmPrefix + '-')) {
        const dd = b.mmdd.slice(3);
        add(`${year}-${mmPrefix}-${dd}`, b.name, 'জন্মবার্ষিকী');
      }
    }
  }

  // Tithi & Bengali date based
  for (const day of calendarDays) {
    const bnMonthIdx = getBnMonthIdx(day.dateStr);

    for (const f of TITHI_FESTIVALS) {
      if (f.tithiIdx === day.tithiIdx && (f.bnMonthIdx === -1 || f.bnMonthIdx === bnMonthIdx)) {
        add(day.dateStr, f.name, 'তিথি');
      }
    }

    if (day.bengaliDay !== null) {
      for (const f of BN_DATE_FESTIVALS) {
        if (f.bnMonthIdx === bnMonthIdx && f.bnDay === day.bengaliDay) {
          add(day.dateStr, f.name, 'বাংলা');
        }
      }
    }
  }

  return results.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
}
