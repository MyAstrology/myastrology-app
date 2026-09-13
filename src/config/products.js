/*  Play Console-এর ইন-অ্যাপ প্রোডাক্ট — কোড ও Console-এর একমাত্র সত্য।
 *
 *  ⚠️ চাবি (kundaliPdf ইত্যাদি) ওয়েবসাইটের Firestore `pricing/config`-এর
 *  চাবির **হুবহু এক** — নইলে একই জিনিস অ্যাপে এক দামে আর সাইটে অন্য দামে
 *  বিক্রি হতো, আর কোনটা কোনটা তা মেলানোর উপায় থাকত না।
 *
 *  ⚠️ Play-র দাম Console-এ আলাদা করে বসাতে হয়; নিচের `inr` কেবল
 *  **রেফারেন্স** — অ্যাপ কখনো এই সংখ্যাটা দেখায় না, Play-র নিজের দামই
 *  দেখায় (পাঠকের দেশ ও মুদ্রায়)। এখানে আছে যাতে Console-এ বসানোর সময়
 *  মিলিয়ে নেওয়া যায় এবং verify-play-billing পার্থক্য ধরতে পারে।
 *
 *  ⚠️ `intl` = ভারতের বাইরের দাম (Play Console-এ আলাদা মূল্য-সারণী)।
 *  এটিও কেবল রেফারেন্স — অ্যাপ Play-র নিজের দামই দেখায়।
 *
 *  ⚠️ সবগুলোই **consumable** — একজন পাঠক একাধিক কুণ্ডলীর PDF কিনতে পারেন,
 *  তাই একবার কিনলেই "কেনা হয়ে গেছে" হয়ে যাওয়া চলবে না।
 */
export const PRODUCTS = {
  kundaliPdf:     { id: 'basic_kundli',                 inr: 101,  intl: 149,  label: 'জন্মকুণ্ডলী PDF' },
  mmPdf:          { id: 'basic_matching_report',        inr: 101,  intl: 149,  label: 'কোষ্ঠী মিলন PDF' },
  numerologyPdf:  { id: 'basic_numerology_report',      inr: 51,   intl: 59,   label: 'সংখ্যা জ্যোতিষ PDF' },
  varshaphalaPdf: { id: 'basic_varsh_kundli',           inr: 51,   intl: 59,   label: 'বর্ষফল PDF' },
  panjikaPdf:     { id: 'panchang_donate',              inr: 21,   intl: 25,   label: 'বার্ষিক পঞ্জিকা PDF' },
  premiumKundali: { id: 'premium_kundli',               inr: 501,  intl: 599,  label: 'প্রিমিয়াম কুণ্ডলী রিপোর্ট' },
  solutionKundali:{ id: 'ultimate_astro_combo',         inr: 1501, intl: 1799, label: 'VIP পরামর্শ ও সমাধান' },
  premiumMatch:   { id: 'premium_matching_gemini',      inr: 501,  intl: 599,  label: 'প্রিমিয়াম যোটক মিলন' },
  specialMatch:   { id: 'premium_matching_consultant',  inr: 1501, intl: 1799, label: 'স্পেশাল যোটক মিলন' },
};

/** Console-এ যে আইডিগুলো বানাতে হবে */
export const PRODUCT_IDS = Object.keys(PRODUCTS).map(k => PRODUCTS[k].id);

/** Play-র আইডি থেকে আমাদের চাবি — যাচাইয়ের ফল মেলানোর জন্য */
export const KEY_BY_ID = Object.keys(PRODUCTS).reduce((m, k) => {
  m[PRODUCTS[k].id] = k;
  return m;
}, {});
