/*  অ্যাপের ভিতরে ওয়েবপাতার ভাষা-বদলের সারিটা লুকোনো।
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
  '[class*="mya-lang"]{display:none!important;}';

/* পাতা লোড হওয়ার আগে-পরে — দুবারই চালানো নিরাপদ (একই id ব্যবহার করে,
   তাই দ্বিতীয়বার আগেরটাই বদলায়, নতুন <style> জমে না)। */
export const HIDE_LANG_SWITCH_JS = `(function(){try{
  var el=document.getElementById('__appHideLang__');
  if(!el){el=document.createElement('style');el.id='__appHideLang__';
    (document.head||document.documentElement).appendChild(el);}
  el.textContent=${JSON.stringify(HIDE_LANG_SWITCH_CSS)};
}catch(e){}})();true;`;
