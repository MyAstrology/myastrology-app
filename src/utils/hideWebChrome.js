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

/*  ব্যাক চাপলে ফলাফল লুকিয়ে ফর্ম ফিরিয়ে আনা।
    ⚠️ পাতাগুলো গণনার সময় ফর্মটাও display:none করে দেয়। কেবল ফলাফল
    লুকোলে দুটোই লুকানো অবস্থায় পর্দা **সম্পূর্ণ ফাঁকা** হয়ে যায় —
    সহকর্মী ঠিক সেটাই দেখেছেন (কুণ্ডলী → ব্যাক → আবার কুণ্ডলী)।
    ⚠️ তালিকা দুটো এখানেই থাকুক — LocalWebView ও KundaliScreen দুই
    জায়গায় কপি রাখলে একদিন সরে যেত, আর একটাতে ফাঁকা পর্দা ফিরত। */
export const RESULTS_CONTAINER_IDS = ['resultsArea', 'resultSection', 'resultsSection',
  /* সংখ্যা জ্যোতিষের ফলাফল আলাদা পাতায় (result.html), ঘরের নাম আলাদা */
  'resultContent'];
export const FORM_CONTAINER_IDS = ['inputSection', 'mmInputSection', 'formSection'];

export const makeHideResultsJS = () => `(function(){
  var ids=${JSON.stringify(RESULTS_CONTAINER_IDS)};
  var hid=false;
  for(var i=0;i<ids.length;i++){
    var el=document.getElementById(ids[i]);
    if(el&&getComputedStyle(el).display!=='none'){el.style.setProperty('display','none','important');hid=true;break;}
  }
  if(!hid) return;
  var fids=${JSON.stringify(FORM_CONTAINER_IDS)};
  for(var j=0;j<fids.length;j++){
    var f=document.getElementById(fids[j]);
    if(f){f.style.setProperty('display','block','important');}
  }
  window.scrollTo(0,0);
})();true;`;
