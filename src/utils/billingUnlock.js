/*  পেমেন্ট সফল হওয়ার পরে পাতাটাকে যা করতে বলা হয়।
 *  ═══════════════════════════════════════════════════════════════
 *  ⚠️ এই লাইনগুলো নতুন করে লেখা হয়নি — ওয়েবসাইটের নিজের Razorpay
 *  `handler:` ফাংশনে ঠিক এই কাজটাই হয়। অর্থাৎ Play Billing-এ কেনা আর
 *  ওয়েবসাইটে কেনা — দুটোর পরে পাতাটা **হুবহু একই পথে** যায়।
 *  আলাদা করে ডেলিভারির দ্বিতীয় কোনো পথ বানানো হয়নি; বানালে একদিন
 *  ওয়েবসাইটে এক জিনিস আর অ্যাপে অন্য জিনিস ডেলিভারি হতো।
 *
 *  ⚠️ কোনো প্রোডাক্টের এখানে এন্ট্রি না থাকলে অ্যাপ Play Billing চালাবেই
 *  না — ব্রাউজারে পাঠাবে (আজকের আচরণ)। টাকা নিয়ে ডেলিভারি করতে না পারার
 *  চেয়ে ব্রাউজারে পাঠানো ঢের ভালো।
 *
 *  উৎস (ওয়েবসাইটের handler:function অংশ):
 *    kundaliPdf      kundali.html
 *    mmPdf           match-making.html
 *    varshaphalaPdf  varshaphala.html
 *    numerologyPdf   result.html
 *    panjikaPdf      panjika.html
 *    premiumKundali  kundali.html  (_prmOv ওভারলে)
 *    solutionKundali kundali.html  (_cspOv ওভারলে)
 */

/* পেমেন্ট-আইডির ঘরে Play-র orderId বসে — অ্যাডমিন পাতায় ওটাই দেখা যাবে,
   তাই কোন অর্ডার কোন ক্রয় তা মেলানো যায়। */
const PID = "var _pid=" + JSON.stringify('PLAY:') + "+(window.__myaPlayOrder||'');";

/* ⚠️ ওভারলে দুটোর CSS-এ `opacity:0` **ও** একটা transition আছে
   (kundali.html: `display:none;...;opacity:0;transition:opacity .3s`)।
   তাই কেবল display='flex' করলে ব্লকটা DOM-এ বসে যায় কিন্তু পর্দায়
   অদৃশ্যই থাকে — ক্রেতা টাকা দিয়ে ফাঁকা পর্দা দেখতেন। ওয়েবসাইটের নিজের
   Razorpay handler দুটো ধাপই করে, তাই এখানেও দুটোই। */
const OPEN_OV = id =>
  "var ov=document.getElementById(" + JSON.stringify(id) + ");" +
  "if(ov){ov.style.display='flex';setTimeout(function(){ov.style.opacity='1';},10);}";

export const UNLOCK_JS = {
  kundaliPdf: `(function(){
    try{sessionStorage.setItem('myastro_kundali_paid','1');}catch(e){}
    if(typeof _showPdfBtn==='function')_showPdfBtn();
  })();true;`,

  mmPdf: `(function(){
    try{sessionStorage.setItem('myastro_match_paid','1');}catch(e){}
    if(typeof _doMatchPrint==='function')_doMatchPrint();
  })();true;`,

  varshaphalaPdf: `(function(){
    if(typeof vpClosePdfPay==='function')vpClosePdfPay();
    if(typeof _vpPrint==='function')_vpPrint();
  })();true;`,

  numerologyPdf: `(function(){
    if(typeof nuClosePdfPay==='function')nuClosePdfPay();
    if(typeof _nuPrint==='function')_nuPrint();
  })();true;`,

  panjikaPdf: `(function(){
    if(typeof closePdfPromo==='function')closePdfPromo();
    if(typeof _doPrint==='function')_doPrint();
  })();true;`,

  /* ₹৫০১ ও ₹১৫০১ — ওয়েবসাইটে Razorpay সফল হলে পেমেন্ট-আইডি বসিয়ে
     অর্ডারের ওভারলেটা খোলা হয়; সেখান থেকে ক্রেতা তথ্য দিয়ে সাবমিট করেন
     আর অর্ডার Firestore-এ যায়। এখানেও ঠিক তাই। */
  premiumKundali: `(function(){
    ${PID}
    var e=document.getElementById('_prmPid'); if(e)e.value=_pid;
    ${OPEN_OV('_prmOv')}
  })();true;`,

  solutionKundali: `(function(){
    ${PID}
    var e=document.getElementById('_cspPid'); if(e)e.value=_pid;
    ${OPEN_OV('_cspOv')}
  })();true;`,
};

/* কোন পাতার প্রধান PDF কোন প্রোডাক্ট — openRzp/proceedToRazorpay
   দিয়ে যেটা কেনা হয়। */
export const PAGE_MAIN_PRODUCT = {
  kundali:        'kundaliPdf',
  'match-making': 'mmPdf',
  varshaphala:    'varshaphalaPdf',
  result:         'numerologyPdf',
  numerology:     'numerologyPdf',
  panjika:        'panjikaPdf',
};


/** পেমেন্টের পরে WebView-এ যে স্ক্রিপ্টটা ইনজেক্ট করতে হবে।
 *
 *  Play-র orderId আগে বসানো হয় — `_prmPid`/`_cspPid` ঘরে ওটাই যায়, তাই
 *  অ্যাডমিন পাতায় অর্ডারের সঙ্গে ক্রয়টা মেলানো যায়। চেনা প্রোডাক্ট না
 *  হলে null — ডাকা জায়গা তখন Play Billing চালাবেই না।
 */
export function unlockJS(product, orderId) {
  const body = UNLOCK_JS[product];
  if (!body) return null;
  const pre = 'window.__myaPlayOrder=' + JSON.stringify(String(orderId || '')) + ';';
  return '(function(){' + pre + '})();' + body;
}
