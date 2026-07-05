// পাইথাগোরীয় সংখ্যাতত্ত্ব
// মূলাংক = জন্মতারিখের একক সংখ্যা
// ভাগ্যাংক = সম্পূর্ণ জন্মতারিখের একক সংখ্যা

const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBN = n => String(n).split('').map(d => BN_DIGITS[+d] || d).join('');

function digitSum(n) {
  if (n < 10) return n;
  return digitSum(String(n).split('').reduce((a, d) => a + (+d), 0));
}

// মূলাংক: জন্মতারিখ (১–৩১) থেকে একক অঙ্ক
export function getMoolank(day) {
  const d = parseInt(day, 10);
  if (isNaN(d) || d < 1 || d > 31) return null;
  return digitSum(d);
}

// ভাগ্যাংক: দিন + মাস + বছর সব ডিজিট যোগ করে একক অঙ্ক
export function getBhagyank(day, month, year) {
  const allDigits = `${day}${month}${year}`.split('').map(Number).filter(n => !isNaN(n));
  const total = allDigits.reduce((a, d) => a + d, 0);
  return digitSum(total);
}

// নামাংক (সরল পাইথাগোরীয়): A=1,B=2,...,Z=26 → একক অঙ্ক
function charValue(ch) {
  const c = ch.toUpperCase().charCodeAt(0);
  if (c >= 65 && c <= 90) return c - 64;
  return 0;
}
export function getNameank(name) {
  if (!name) return null;
  const total = name.split('').reduce((a, c) => a + charValue(c), 0);
  return total ? digitSum(total) : null;
}

const MOOLANK_MEANING = [
  '',
  'সূর্যের সংখ্যা। নেতৃত্ব, স্বাধীনতা, সাহস ও উদ্যোগশীলতার প্রতীক। আপনি স্বনির্ভর ও দৃঢ়চেতা।',
  'চন্দ্রের সংখ্যা। সংবেদনশীলতা, সহানুভূতি, সহযোগিতা ও শান্তিপ্রিয়তার প্রতীক। আপনি মিষ্টভাষী ও সম্পর্ক-সচেতন।',
  'বৃহস্পতির সংখ্যা। সৃজনশীলতা, আনন্দ, প্রকাশশক্তি ও সামাজিকতার প্রতীক। আপনি বাগ্মী ও উজ্জ্বল ব্যক্তিত্বের অধিকারী।',
  'রাহুর সংখ্যা। কঠোর পরিশ্রম, স্থিতিশীলতা, শৃঙ্খলা ও বাস্তববুদ্ধির প্রতীক। আপনি ভিত্তি গড়তে ওস্তাদ।',
  'বুধের সংখ্যা। স্বাধীনতা, অ্যাডভেঞ্চার, বহুমুখিতা ও পরিবর্তনপ্রিয়তার প্রতীক। আপনি অত্যন্ত চটপটে ও কৌতূহলী।',
  'শুক্রের সংখ্যা। প্রেম, সৌন্দর্য, দায়িত্ব ও পরিবারপ্রেমের প্রতীক। আপনি পোষ্যবৎসল ও যত্নশীল।',
  'কেতুর সংখ্যা। আধ্যাত্মিকতা, বিশ্লেষণী মন, জ্ঞানতৃষ্ণা ও একাকিত্বপ্রিয়তার প্রতীক। আপনি গভীর চিন্তক।',
  'শনির সংখ্যা। শক্তি, সাফল্য, বস্তুবাদিতা ও ব্যবসায়িক দক্ষতার প্রতীক। আপনি উচ্চাকাঙ্ক্ষী ও কার্যকুশলী।',
  'মঙ্গলের সংখ্যা। মানবতা, সহমর্মিতা, সর্বজনীনতা ও অনুকম্পার প্রতীক। আপনি পরোপকারী ও দয়ালু।',
];

const BHAGYANK_MEANING = [
  ...MOOLANK_MEANING,
];

export function getNumerologyReport(day, month, year, name = '') {
  const moolank  = getMoolank(day);
  const bhagyank = getBhagyank(day, month, year);
  const nameank  = name ? getNameank(name) : null;

  return {
    moolank,
    bhagyankNum:  bhagyank,
    nameank,
    moolankBN:    moolank  ? toBN(moolank)  : '—',
    bhagyankBN:   bhagyank ? toBN(bhagyank) : '—',
    nameankBN:    nameank  ? toBN(nameank)  : null,
    moolankMeaning:  moolank  ? (MOOLANK_MEANING[moolank]  || '') : '',
    bhagyankMeaning: bhagyank ? (BHAGYANK_MEANING[bhagyank] || '') : '',
  };
}
