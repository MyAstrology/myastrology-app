/*  অ্যাপের ভিতরে ওয়েবপাতার যেটুকু অর্থহীন — ভাষা-সারি ও Play-বিজ্ঞাপন।
 *  ═══════════════════════════════════════════════════════════════
 *  সহকর্মীর কথা (২০২৬-০৯-০৭): "ভাষা পরিবর্তনের অপশন শুধু মাত্র
 *  সেটিংসে থাকা উচিৎ, সমস্ত স্ক্রিনে নয়।" — ঠিকই, কারণ অ্যাপে ভাষা
 *  ঠিক হয় Settings থেকে, আর পাতার নিজের সারিটা **সেটাকে না জানিয়েই**
 *  ঠিকানা বদলে দেয়। ফলে অ্যাপ ভাবত বাংলা, পাতা দেখাত ইংরেজি — দুটো
 *  আলাদা হয়ে যেত।
 *
 *  ⚠️ ওয়েবসাইটে সারিটা **থাকতেই হবে** — ওগুলো আসল <a href>, আর
 *  `verify-seo` প্রতিটি পাতায় ভাষা-লিংক গুনে দেখে। তাই মোছা হয় না,
 *  কেবল অ্যাপের ভিতরে CSS দিয়ে ঢাকা হয়।
 *
 *  ⚠️ `[class*="mya-lang"]` — কারণ সুইচারটা পাতাভেদে তিন রকম নামে আসে
 *  (`mya-lang`, `mya-lang-links`, `mya-lang-float`), আর ভিতরের অংশগুলোও
 *  (`mya-lang-cur`, `-tick`) ওই উপসর্গেই। একটাই নিয়মে তিনটেই ঢাকা পড়ে।
 */
export const HIDE_LANG_SWITCH_CSS =
  '[class*="mya-lang"]{display:none!important;}'
  /* ⚠️ অ্যাপের ভিতরে "অ্যাপটি ডাউনলোড করুন" বিজ্ঞাপন অর্থহীন — পাঠক তো
     অ্যাপেই আছেন। কার্ডদুটো নাম ধরে, আর Play-র লিংকটা যেখানেই থাক
     (ফুটারের ব্যাজ সহ) ঢাকা পড়ে। ওয়েবসাইটে অক্ষত — সেখানে ওটাই
     ইনস্টল আনে। */
  + '.rf-app-card,.blog-app-card{display:none!important;}'
  + 'a[href*="play.google.com"]{display:none!important;}';

/* পাতা লোড হওয়ার আগে-পরে — দুবারই চালানো নিরাপদ (একই id ব্যবহার করে,
   তাই দ্বিতীয়বার আগেরটাই বদলায়, নতুন <style> জমে না)। */
export const HIDE_LANG_SWITCH_JS = `(function(){try{
  var el=document.getElementById('__appHideLang__');
  if(!el){el=document.createElement('style');el.id='__appHideLang__';
    (document.head||document.documentElement).appendChild(el);}
  el.textContent=${JSON.stringify(HIDE_LANG_SWITCH_CSS)};
}catch(e){}})();true;`;
