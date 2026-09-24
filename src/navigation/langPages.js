/*  কোন লাইভ পাতার কোন ভাষার সংস্করণ সাইটে সত্যিই আছে — একটাই উৎস।
 *
 *  ⛔ ২০২৬-০৯-২৫ — আগে দুটো আলাদা হাতে-লেখা তালিকা ছিল: LocalWebView-এর
 *  REMOTE_LANG_PATHS (কোন পাতা en/hi খোলে) আর menuItems-এর bnOnly (মেনুতে
 *  "বাংলা" চিহ্ন)। দ্বিতীয়টা পুরনো হয়ে গিয়েছিল — জ্যোতিষ · হস্তরেখা · রত্ন ·
 *  বাস্তুর en/hi পাতা খুলত, অথচ মেনু তখনো বলত "কেবল বাংলা" (সহকর্মীর ১৫)।
 *  আর তালিকাটা "en ও hi দুটোই, নয়তো কিছুই না" ধরত, তাই সহকর্মীর বানানো
 *  /hi/booking অ্যাপে কখনো খুলত না। এখন পাতা → ভাষার তালিকা।
 *
 *  নতুন ভাষা-পাতা যোগ করলে কেবল এখানে; verify-app-i18n সাইটে ফাইলটা আছে কি না
 *  আর সাইটে থাকা পাতা এখানে বাদ পড়েছে কি না — দুটোই মিলিয়ে দেখে। */
export const REMOTE_LANG_PATHS = {
  'palmistry':     ['en', 'hi'],
  'gemstone':      ['en', 'hi'],
  'astrology':     ['en', 'hi'],
  'vastu-science': ['en', 'hi'],
  'booking':       ['hi'],
};

const SITE = 'https://myastrology.in/';

/** লাইভ পাতার ঠিকানা থেকে পথ ('palmistry') — না মিললে null */
export function remotePath(url) {
  const m = /^https:\/\/myastrology\.in\/([a-z0-9-]+?)(?:\.html)?$/.exec(url || '');
  return m ? m[1] : null;
}

/* যে পাতা আলাদা /en/ ফাইল নয়, ঠিকানার ?lang= দিয়ে ভাষা বদলায়
   (blog-list — বাংলা, ইংরেজি ও হিন্দি পোস্ট একই তালিকায়; ২০২৬-০৯-২৫) */
export const QUERY_LANG_PAGES = { 'blog-list': ['en', 'hi'] };

/** এই ভাষায় পাতাটা আছে? বাংলা সবসময় আছে */
export function hasLang(page, lang) {
  return lang === 'bn' || (REMOTE_LANG_PATHS[page] || []).includes(lang)
    || (QUERY_LANG_PAGES[page] || []).includes(lang);
}

/** ভাষা অনুযায়ী ঠিকানা — ওই ভাষার সংস্করণ না থাকলে বাংলা ঠিকানাই */
export function langRemote(url, lang) {
  if (!url || lang === 'bn') return url;
  const p = remotePath(url);
  if (!p || !hasLang(p, lang)) return url;
  return SITE + lang + '/' + p;
}
