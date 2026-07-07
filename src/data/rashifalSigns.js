// 12 রাশি, ক্রম মেষ→মীন — RashifalScreen.js-এর RASHI_IMAGES-এর ক্রমের সাথে মিল রেখে।
// dailySlug: rashifal/<slug>.html (বাংলা নাম), weeklySlug: rashifal/saptahik/<slug>.html (ইংরেজি নাম)
export const RASHI_SIGNS = [
  { name: 'মেষ',     dailySlug: 'mesh',     weeklySlug: 'aries'       },
  { name: 'বৃষ',     dailySlug: 'brisha',   weeklySlug: 'taurus'      },
  { name: 'মিথুন',   dailySlug: 'mithun',   weeklySlug: 'gemini'      },
  { name: 'কর্কট',   dailySlug: 'karkat',   weeklySlug: 'cancer'      },
  { name: 'সিংহ',    dailySlug: 'simha',    weeklySlug: 'leo'         },
  { name: 'কন্যা',   dailySlug: 'kanya',    weeklySlug: 'virgo'       },
  { name: 'তুলা',    dailySlug: 'tula',     weeklySlug: 'libra'       },
  { name: 'বৃশ্চিক', dailySlug: 'brischik', weeklySlug: 'scorpio'     },
  { name: 'ধনু',     dailySlug: 'dhanu',    weeklySlug: 'sagittarius' },
  { name: 'মকর',     dailySlug: 'makar',    weeklySlug: 'capricorn'   },
  { name: 'কুম্ভ',   dailySlug: 'kumbha',   weeklySlug: 'aquarius'    },
  { name: 'মীন',     dailySlug: 'meen',     weeklySlug: 'pisces'      },
];

export function rashifalUrl(rashiIndex, mode) {
  const sign = RASHI_SIGNS[rashiIndex];
  return mode === 'weekly'
    ? `https://myastrology.in/rashifal/saptahik/${sign.weeklySlug}.html`
    : `https://myastrology.in/rashifal/${sign.dailySlug}.html`;
}
