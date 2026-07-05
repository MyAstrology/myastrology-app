const p = require('../panjika-ephemeris');

const RASHI_SYM   = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const RASHI_LORD  = ['মঙ্গল','শুক্র','বুধ','চন্দ্র','সূর্য','বুধ','শুক্র','মঙ্গল','গুরু','শনি','শনি','গুরু'];
const RASHI_EL    = ['অগ্নি','পৃথিবী','বায়ু','জল','অগ্নি','পৃথিবী','বায়ু','জল','অগ্নি','পৃথিবী','বায়ু','জল'];
const RASHI_GEM   = ['প্রবাল','হীরা','পান্না','মুক্তা','মাণিক','পান্না','হীরা','প্রবাল','পুষ্পরাগ','নীলম','নীলম','পুষ্পরাগ'];
const RASHI_DIR   = ['পূর্ব','পূর্ব','উত্তর','উত্তর','পূর্ব','দক্ষিণ','পশ্চিম','উত্তর','পূর্ব','দক্ষিণ','পশ্চিম','উত্তর-পূর্ব'];
const LUCKY_NUMS  = [['১','৯'],['২','৬'],['৫','১৪'],['২','৭'],['১','৪'],['৫','১৪'],['৬','১৫'],['১','৮'],['৩','১২'],['৮','১৭'],['৪','১৩'],['৩','১২']];

const HOUSE_DATA = {
  1:  { tag:'বিশেষ শুভ',  base:{love:4,work:4,health:4,finance:4},
        summary:['চন্দ্র আপনার রাশিতে — ব্যক্তিত্ব উজ্জ্বল। নতুন সূচনার শুভ লগ্ন।','চন্দ্রের সরাসরি প্রভাবে মন প্রফুল্ল। আত্মবিশ্বাস চূড়ায় থাকবে।'],
        advice:['নতুন কাজ শুরু করুন','মানুষের সাথে মিশুন'] },
  2:  { tag:'শুভ',         base:{love:3,work:4,health:3,finance:5},
        summary:['আর্থিক বিষয়ে অগ্রগতি সম্ভব। পরিবারে আনন্দ ও সম্প্রীতি বজায় থাকবে।','ধন ও সম্পদ বৃদ্ধির ইঙ্গিত। বাক্‌শক্তি কার্যকর হবে আজ।'],
        advice:['আর্থিক পরিকল্পনা করুন','পরিবারের সাথে সময় কাটান'] },
  3:  { tag:'মিশ্র',       base:{love:3,work:3,health:3,finance:3},
        summary:['পরিশ্রম ও সাহসিকতায় সাফল্য আসবে। ভ্রমণে শুভ সংবাদ।','ছোট যাত্রা সম্ভব। কঠোর পরিশ্রমে কাজ এগিয়ে যাবে।'],
        advice:['উদ্যম বাড়ান','যোগাযোগ রক্ষা করুন'] },
  4:  { tag:'শুভ',         base:{love:4,work:3,health:4,finance:3},
        summary:['গৃহে শান্তি ও সুখ বিরাজ করবে। মাতৃস্থানীয় সহযোগিতা পাবেন।','মন ঘরমুখী থাকবে। পারিবারিক বন্ধন দৃঢ় হবে আজ।'],
        advice:['পরিবারকে সময় দিন','গৃহকাজে মনোযোগ দিন'] },
  5:  { tag:'অতিশুভ',     base:{love:5,work:4,health:4,finance:4},
        summary:['প্রেম ও সৃজনশীলতায় অপূর্ব দিন। বুদ্ধিবৃত্তিক কাজে সাফল্য।','নতুন প্রেম বা সৃষ্টিশীল প্রকল্পের শুভারম্ভ। মন উৎসাহে ভরপুর।'],
        advice:['সৃজনশীল কাজে মনোযোগ দিন','প্রিয়জনকে সময় দিন'] },
  6:  { tag:'সতর্কতা',    base:{love:2,work:3,health:2,finance:3},
        summary:['স্বাস্থ্য বিষয়ে সতর্ক থাকুন। প্রতিপক্ষের প্রতি মনোযোগ দিন।','দৈনন্দিন কাজে মনোযোগ দিন। স্বাস্থ্যবিধি মানলে ভালো থাকবেন।'],
        advice:['স্বাস্থ্যের যত্ন নিন','বিরোধ এড়িয়ে চলুন'] },
  7:  { tag:'শুভ',         base:{love:5,work:3,health:3,finance:3},
        summary:['দাম্পত্য জীবনে মধুরতা আসবে। ব্যবসায়িক অংশীদারিত্বে অগ্রগতি।','সম্পর্কে উষ্ণতা বাড়বে। সামাজিক মেলামেশায় আনন্দ মিলবে।'],
        advice:['সম্পর্কে সময় দিন','অংশীদারের পরামর্শ নিন'] },
  8:  { tag:'মিশ্র',       base:{love:2,work:3,health:2,finance:3},
        summary:['গোপন বিষয়ে সতর্ক থাকুন। আত্মশুদ্ধির উপযুক্ত দিন।','গভীর গবেষণায় সাফল্য। মানসিক রূপান্তরের সুযোগ।'],
        advice:['সাবধানে পদক্ষেপ নিন','ধ্যানে মন শান্ত রাখুন'] },
  9:  { tag:'অতিশুভ',     base:{love:4,work:4,health:4,finance:5},
        summary:['ভাগ্যের অনুকূলে দিন কাটবে। গুরুজনের আশীর্বাদ পাবেন।','দূরদেশ থেকে সুখবর আসতে পারে। ধর্ম ও দর্শনে আগ্রহ বাড়বে।'],
        advice:['ভালো কাজে এগিয়ে যান','গুরুজনের পরামর্শ নিন'] },
  10: { tag:'শুভ',         base:{love:3,work:5,health:3,finance:4},
        summary:['কর্মক্ষেত্রে বিশেষ সাফল্য। উচ্চপদস্থদের সহযোগিতা পাবেন।','সমাজে মর্যাদা বাড়বে। পেশাদার লক্ষ্যে এগিয়ে যাওয়ার শুভদিন।'],
        advice:['কর্মে পূর্ণ মনোযোগ দিন','নেতৃত্বের ভূমিকা নিন'] },
  11: { tag:'অতিশুভ',     base:{love:4,work:5,health:4,finance:5},
        summary:['ইচ্ছাপূরণের সম্ভাবনা প্রবল। বন্ধুমহলে আনন্দ ও সহযোগিতা।','আকাঙ্ক্ষিত লাভ ও প্রাপ্তির দিন। সামাজিক যোগাযোগ কার্যকর হবে।'],
        advice:['নতুন সুযোগ গ্রহণ করুন','বন্ধুদের সাথে যোগাযোগ করুন'] },
  12: { tag:'মিশ্র',       base:{love:3,work:2,health:3,finance:2},
        summary:['একাকীত্ব ও আধ্যাত্মিক চিন্তার দিন। অপ্রয়োজনীয় ব্যয়ে সতর্ক।','বিশ্রাম ও পুনরুদ্ধারের সময়। ধ্যান-প্রার্থনায় মন স্থির থাকবে।'],
        advice:['বিশ্রাম নিন','অতিরিক্ত ব্যয় এড়িয়ে চলুন'] },
};

function seedHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function pick(arr, seed) { return arr[seedHash(seed) % arr.length]; }

export function getTodayRashifal() {
  const today = new Date().toISOString().split('T')[0];
  const r = p.getDailyPanchang(today);
  const moonRashi = Math.floor(r.nakshatra * 4 / 9) % 12;

  const nav = p.getNavagraha(today);
  const jupRashi = nav?.brihaspati?.rashi ?? null;
  const satRashi = nav?.shani?.rashi ?? null;

  const result = [];
  for (let ri = 0; ri < 12; ri++) {
    const house = ((moonRashi - ri + 12) % 12) + 1;
    const hd = HOUSE_DATA[house];
    const seed = `${today}-${ri}`;
    const score = { ...hd.base };
    if (jupRashi !== null && [1,5,9].includes(((jupRashi - ri + 12) % 12) + 1)) {
      score.work = Math.min(5, score.work + 1);
      score.finance = Math.min(5, score.finance + 1);
    }
    if (satRashi !== null && [4,8,12].includes(((satRashi - ri + 12) % 12) + 1)) {
      score.health = Math.max(1, score.health - 1);
    }
    result.push({
      rashi:     p.RASHI_NAMES[ri],
      rashiIndex: ri,
      sym:       RASHI_SYM[ri],
      lord:      RASHI_LORD[ri],
      element:   RASHI_EL[ri],
      gem:       RASHI_GEM[ri],
      direction: RASHI_DIR[ri],
      luckyNums: LUCKY_NUMS[ri],
      house, tag: hd.tag,
      score,
      summary:   pick(hd.summary, seed),
      advice:    pick(hd.advice, seed + '-adv'),
    });
  }
  return { date: today, moonRashi, moonRashiName: p.RASHI_NAMES[moonRashi], rashifal: result };
}
