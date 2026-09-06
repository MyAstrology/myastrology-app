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
 *  ⚠️ সবগুলোই **consumable** — একজন পাঠক একাধিক কুণ্ডলীর PDF কিনতে পারেন,
 *  তাই একবার কিনলেই "কেনা হয়ে গেছে" হয়ে যাওয়া চলবে না।
 */
export const PRODUCTS = {
  kundaliPdf:     { id: 'mya_kundali_pdf',     inr: 101,  label: 'জন্মকুণ্ডলী PDF' },
  mmPdf:          { id: 'mya_match_pdf',       inr: 101,  label: 'কোষ্ঠী মিলন PDF' },
  numerologyPdf:  { id: 'mya_numerology_pdf',  inr: 51,   label: 'সংখ্যা জ্যোতিষ PDF' },
  varshaphalaPdf: { id: 'mya_varshaphala_pdf', inr: 51,   label: 'বর্ষফল PDF' },
  panjikaPdf:     { id: 'mya_panjika_pdf',     inr: 21,   label: 'বার্ষিক পঞ্জিকা PDF' },
  premiumKundali: { id: 'mya_premium_kundali', inr: 501,  label: 'প্রিমিয়াম কুণ্ডলী রিপোর্ট' },
  solutionKundali:{ id: 'mya_solution_kundali',inr: 1501, label: 'VIP পরামর্শ ও সমাধান' },
};

/** Console-এ যে আইডিগুলো বানাতে হবে */
export const PRODUCT_IDS = Object.keys(PRODUCTS).map(k => PRODUCTS[k].id);

/** Play-র আইডি থেকে আমাদের চাবি — যাচাইয়ের ফল মেলানোর জন্য */
export const KEY_BY_ID = Object.keys(PRODUCTS).reduce((m, k) => {
  m[PRODUCTS[k].id] = k;
  return m;
}, {});
