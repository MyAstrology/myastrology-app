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

/*  পাঠকের ভাষার পাতাটাই খোলা হয়।
 *
 *  ⚠️ বারোটি রাশির চিরসবুজ পাতা **ও** সাপ্তাহিক পাতা — দুটোরই `/en/` ও
 *  `/hi/` সংস্করণ সাইটে প্রকাশিত (মাপা: en/hi-তে দৃশ্যমান বাংলা ০)।
 *  আগে ভাষা নির্বিশেষে বাংলা ঠিকানাই খুলত, ফলে ইংরেজি অ্যাপের ভিতরে
 *  পুরো রাশিফলটাই বাংলায় আসত — সেই "অনূদিত খোলস, বাংলা ভিতর" ব্যর্থতা
 *  যা এই দুই রিপোতে বারবার নথিভুক্ত।
 *
 *  ⚠️ দৈনিক **তারিখ-পাতা** (`/rashifal/2026-09-07`) কেবল বাংলাতেই আছে —
 *  ওগুলো এখানে খোলা হয় না, তাই কোনো ৪০৪-এর ঝুঁকি নেই। */
export function rashifalUrl(rashiIndex, mode, lang) {
  const sign = RASHI_SIGNS[rashiIndex];
  const pre = (lang === 'en' || lang === 'hi') ? lang + '/' : '';
  return mode === 'weekly'
    ? `https://myastrology.in/${pre}rashifal/saptahik/${sign.weeklySlug}.html`
    : `https://myastrology.in/${pre}rashifal/${sign.dailySlug}.html`;
}
