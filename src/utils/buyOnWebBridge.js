import { Alert, Linking } from 'react-native';
/* এই ফাইলটা কম্পোনেন্ট নয় (LocalWebView-এর বার্তা-হ্যান্ডলার থেকে ডাকা হয়),
   তাই useLanguage() ডাকা যায় না। tGlobal ভাষাটা **ডাকার সময়** পড়ে। */
import { tGlobal as t, getCurrentLang } from '../i18n';
import * as billing from './billing';
import { UNLOCK_JS, PAGE_MAIN_PRODUCT, unlockJS } from './billingUnlock';
import { takePending, addPending } from './billingPending';
import { auth } from '../config/firebase';

// অ্যাপের ভিতরে ₹৫১/₹৫০১ পেমেন্ট ইচ্ছাকৃতভাবে বন্ধ — বান্ডলের app-bridge
// Razorpay-র জায়গায় শুধু একটা টোস্ট দেখাত ("পেমেন্টের জন্য myastrology.in
// ওয়েবসাইট ব্যবহার করুন")। কারণ Google Play-র নিয়মে অ্যাপের ভিতরে ডিজিটাল
// পণ্য বেচতে হলে Play Billing লাগে, Razorpay নয়।
//
// কিন্তু ওই টোস্টটা একটা বন্ধ গলি ছিল — ব্যবহারকারী বোতাম চাপতেন, একটা বার্তা
// ভেসে উঠত, তারপর আর কিছুই হতো না; মনে হতো বোতামটা নষ্ট। তাই বোতামটা এখন
// জন্মতথ্যসহ ওয়েবসাইটের একই পাতায় ব্রাউজারে নিয়ে যায়।
//
// ⛔⛔ এখানে আগে লেখা ছিল "Play-র নিয়মে অ্যাপের বাইরের কেনাকাটা সম্পূর্ণ ঠিক"
// — **সেটা ভুল**, আর ভুলটা Google-এর নিজের পাতাতেই ধরা পড়ে
// (support.google.com/googleplay/android-developer/answer/10281818):
//
//     "Within an app, developers may not lead users to a payment method
//      other than Google Play's billing system unless Section 3, 8 or 9
//      of the payments policy applies."
//
// PDF রিপোর্ট ওই পাতার ভাষায় "digital items" — অর্থাৎ অ্যাপ থেকে ব্রাউজারে
// পাঠিয়ে Razorpay-তে কেনানো নিয়মভঙ্গ। ভারতে alternative billing-এর সুযোগ
// আছে (service fee ৪% কম), কিন্তু সেটা আলাদা করে নথিভুক্ত হতে হয় — এমনি
// লিংক করে দেওয়া নয়।
//
// ⚠️ তবু এই পথটা **এখনই তুলে দেওয়া যাবে না** — Play Billing চালু ও পরীক্ষিত
// না হওয়া পর্যন্ত এটাই অ্যাপ থেকে কেনার একমাত্র উপায়; তুলে দিলে কেউ কিছুই
// কিনতে পারতেন না। ক্রমটা: Play Billing কাজ করছে দেখা → তবেই এই ফলব্যাক
// বাদ। PLAY-BILLING-SETUP.md দেখুন।
//
// বান্ডল (multi-MB এক-লাইন স্ট্রিং) স্পর্শ না করে এটা করা হচ্ছে — পেজ লোডের
// পরে চলা injectedJavaScript থেকে window.openRzp আবার সংজ্ঞায়িত করে। বান্ডলের
// নিজের স্ক্রিপ্ট আগে চলে, তাই পরেরটাই টেকে।

const SITE = 'https://myastrology.in/';

// পেজ অনুযায়ী ফর্ম থেকে তথ্য তুলে ওয়েবসাইটের query string বানায়। ওয়েবসাইটের
// kundali.html/match-making.html এই নামগুলোই পড়ে (p.get('name') ইত্যাদি),
// auto=1 দিলে পাতা খুলেই নিজে থেকে গণনা করে ফেলে।
export function buildBuyOnWebJS(page) {
  return `
  (function(){
    function val(id){var e=document.getElementById(id);return e?String(e.value||''):'';}
    function pad(v){return String(v).padStart(2,'0');}
    function kundaliQuery(){
      var d=val('dobDay'),mo=val('dobMonth'),y=val('dobYear'),h=val('tobHour'),mi=val('tobMin');
      if(!d||!mo||!y||h===''||mi==='') return '';
      var g=document.querySelector('input[name="gender"]:checked');
      var p=new URLSearchParams({
        name:val('userName'),
        dob:y+'-'+pad(mo)+'-'+pad(d),
        tob:pad(h)+':'+pad(mi),
        lat:val('lat'), lon:val('lon'),
        city:val('citySearch'),
        gender:g?g.value:'male',
        tz:val('tzOffset')||'5.5',
        auto:'1'
      });
      return p.toString();
    }
    /* পঞ্জিকা পাতা ?by=<বাংলা সন> পড়ে সরাসরি ওই বছরের বার্ষিক পঞ্জিকা খুলে
       দেয় (পাতার নিজের কোডেই আছে — history.pushState('/panjika?by='+bnY))।
       সনটা সঙ্গে না পাঠালে ব্রাউজারে গিয়ে আবার "পুরনো বছরের পঞ্জিকা" ট্যাব
       খুঁজে, সন লিখে, খুলে, তারপর আবার PDF বোতাম চাপতে হতো। */
    function panjikaQuery(){
      var e=document.getElementById('yrBnInput');
      var y=e?parseInt(String(e.value||'').trim(),10):NaN;
      if(!(y>=1200&&y<=2000)) return '';
      return 'by='+y;
    }
    /* কোন জিনিসটা কেনা হচ্ছে — Play Billing-এ প্রোডাক্ট ধরে টাকা নিতে হয়,
       পাতা ধরে নয়। একই পাতায় (কুণ্ডলী) তিনটে আলাদা দামের জিনিস আছে, তাই
       প্রতিটি প্রবেশপথ নিজের প্রোডাক্টটা বসিয়ে দেয়।
       ⚠️ চেনা না গেলে খালি — তখন অ্যাপ ব্রাউজারেই পাঠায় (আজকের আচরণ)।
       না চেনা প্রোডাক্টে টাকা নেওয়ার চেয়ে ব্রাউজারে পাঠানো নিরাপদ। */
    function ask(product){
      var q='';
      try{ q=${page === 'kundali' ? 'kundaliQuery()'
              : page === 'panjika' ? 'panjikaQuery()' : "''"}; }catch(e){}
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({
          __rn:'buyOnWeb', page:${JSON.stringify(page)}, query:q,
          product: (typeof product==='string' && product) ? product
                   : (window.__myaProduct||'')
        }));
      }
    }
    var MAIN=${JSON.stringify(page)};
    window.openRzp=function(){ return ask(''); };
    window.proceedToRazorpay=window.openRzp;

    /* ₹৫০১ ও ₹১৫০১ নিজেরাই new Razorpay(...) বানায়, openRzp ছোঁয় না।
       তাই ওদের শুরুর ফাংশনটা মুড়ে প্রোডাক্টটা মনে রাখা হয় — তারপর
       পাতার নিজের কোড যেখানেই আটকাক, ask() ঠিক জিনিসটাই জানে। */
    function tag(name, product){
      var orig=window[name];
      if(typeof orig!=='function' || orig.__myaTagged) return;
      var w=function(){ window.__myaProduct=product; return orig.apply(this, arguments); };
      w.__myaTagged=1;
      window[name]=w;
    }
    tag('_prmStartPayment','premiumKundali');
    tag('_cspStartPayment','solutionKundali');
    /* পঞ্জিকার বার্ষিক PDF (₹২১) বোতামটা openRzp ব্যবহারই করে না — সে নিজে
       new Razorpay(...) বানায়। আর তার আগে একটা পাহারা আছে:
         if(typeof Razorpay==='undefined'){closePdfPromo();_doPrint();return;}
       WebView-এ Razorpay-র চেকআউট চলে না, আর _doPrint() শেষমেশ
       window.print() ডাকে — যেটা WebView-এ কিছুই করে না। ফলে বোতামটা
       চাপলে পপআপ বন্ধ হয়ে যেত, আর কিছুই হতো না — একেবারে মরা বোতাম।
       এখন সেটাও ব্রাউজারে পাঠানো হয়, যেখানে পেমেন্ট সত্যিই কাজ করে। */
    window.pdfPayAndPrint=function(){ return ask('panjikaPdf'); };

    /* আসল আটকে যাওয়ার জায়গাটা openRzp নয়। কুণ্ডলী/যোটক পাতা নিজেই ভিতরে
       _inApp() পরীক্ষা করে, এবং অ্যাপ হলে showToast/alert/_mmShowFormError
       দিয়ে "ওয়েবসাইট ব্যবহার করুন" লিখে return করে দেয় — openRzp পর্যন্ত
       পৌঁছায়ই না। তাই ওই তিনটে বার্তা-ফাংশনও ধরা হচ্ছে: বার্তাটা যদি
       "myastrology.in ওয়েবসাইট ব্যবহার করুন" জাতীয় হয়, টোস্ট না দেখিয়ে
       সরাসরি কেনার প্রস্তাব তোলা হয়। অন্য সব বার্তা আগের মতোই যায়। */
    function isBuyMsg(m){
      return typeof m==='string' && m.indexOf('myastrology.in')>-1
             && m.indexOf('ওয়েবসাইট ব্যবহার করুন')>-1;
    }
    /* এই স্ক্রিপ্ট একাধিকবার চলে: LocalWebView একে পেজ লোডের *আগে* একবার
       আর *পরে* একবার ইনজেক্ট করে। আগে একটা গ্লোবাল "একবারই চালাও" পাহারা
       ছিল — কিন্তু প্রথম (লোডের আগের) দফায় পেজের ফাংশনগুলো এখনও তৈরিই হয়
       না, অথচ পাহারাটা বসে যেত, ফলে পরের দফায় আর মোড়া হতো না। যোটক বিচারে
       ₹৫১ বোতাম কাজ না করার আসল কারণ এটাই ছিল (কুণ্ডলী নিজের WebView
       ব্যবহার করে, তাই সেখানে ধরা পড়েনি)।
       এখন প্রতিটা ফাংশনে নিজস্ব চিহ্ন বসানো হয় — বারবার চালালেও দুবার
       মোড়া হয় না, আর ফাংশন পরে তৈরি হলেও ধরা পড়ে। */
    function wrap(name){
      var orig=window[name];
      if(typeof orig!=='function' || orig.__myaWrapped) return;
      var w=function(msg){
        if(isBuyMsg(msg)){ ask(''); return; }
        return orig.apply(this, arguments);
      };
      w.__myaWrapped=1;
      window[name]=w;
    }
    ['showToast','_mmShowFormError','alert'].forEach(wrap);
  })();
  `;
}

/* কোন জিনিসটা কেনা হচ্ছে। বার্তায় প্রোডাক্ট থাকলে সেটাই; না থাকলে
   পাতার প্রধান PDF। কোনোটাই না মিললে খালি — তখন Play Billing চালানো
   হয় না, ব্রাউজারেই যায়। */
function productOf(msg) {
  const p = String((msg && msg.product) || '');
  if (p) return p;
  return PAGE_MAIN_PRODUCT[(msg && msg.page) || ''] || '';
}

function isCancel(e) {
  const s = String((e && (e.code || e.message)) || '');
  return /E_USER_CANCELLED|USER_CANCELED|cancell?ed/i.test(s);
}

async function playBuy(product, inject, msg) {
  /* ① আগের কোনো ক্রয় টাকা কাটার পরেও ডেলিভারি হয়নি? তাহলে আর টাকা
        নেওয়া হয় না — পাওনাটাই মিটিয়ে দেওয়া হয়।
        ⛔ ensureReady() আগে, কারণ আটকে থাকা ক্রয় Play থেকে উদ্ধার হয়
        ওই ধাপেই। না ডাকলে পাওনাটা জমা পড়ত requestPurchase()-এর পরে —
        অর্থাৎ পাঠকের দ্বিতীয় বার টাকা কেটে যেত। */
  try {
    await billing.ensureReady();
    if (await takePending(product)) {
      inject(unlockJS(product, 'RECOVERED'));
      return;
    }
  } catch (e) { /* চিহ্ন পড়া না গেলে স্বাভাবিক কেনার পথেই যাওয়া হয় */ }

  /* ② সার্ভার ক্রয় যাচাই করে uid ধরে — সাইন-ইন ছাড়া সেটা হয় না।
        টাকা কাটার *আগেই* বলা হয়, পরে নয়। */
  let user = null;
  try { user = auth.currentUser; } catch (e) {}
  if (!user) {
    Alert.alert(
      t('আগে সাইন-ইন করুন'),
      t('কেনা জিনিসটি আপনার অ্যাকাউন্টের সঙ্গে যুক্ত থাকে, তাই ফোন বদলালেও হারায় না। উপরের ডান দিকের বোতাম থেকে সাইন-ইন করে আবার চেষ্টা করুন।'),
      [{ text: t('ঠিক আছে') }],
    );
    return;
  }

  let paid = false;
  try {
    const res = await billing.buy(product);
    paid = true;
    inject(unlockJS(product, res && res.orderId));
  } catch (e) {
    if (isCancel(e)) return;               // পাঠক নিজেই বাতিল করেছেন — চুপ
    if (paid) {
      /* ⚠️ টাকা নেওয়া ও যাচাই হয়ে গেছে, আটকেছে কেবল ডেলিভারিতে। এখানে
         "আবার কিনুন" বলা মানে দু'বার টাকা নেওয়া। চিহ্ন রেখে দেওয়া হয়,
         পরের বার বোতাম চাপলে বিনামূল্যেই পাবেন। */
      addPending(product).catch(() => {});
      Alert.alert(
        t('টাকা জমা পড়েছে'),
        t('ক্রয়টি সম্পূর্ণ হয়েছে, কিন্তু রিপোর্টটি খুলতে সমস্যা হলো। গণনা করে আবার একই বোতামে চাপ দিন — নতুন করে টাকা লাগবে না।'),
        [{ text: t('ঠিক আছে') }],
      );
      return;
    }
    /* এখানে টাকা কাটা হয়েছে কি না, নিশ্চিত করে বলা যায় না — Play-তে
       পেমেন্ট সফল হয়ে যাচাইয়ের ধাপে নেট কেটে গেলেও এখানেই আসা হয়।
       তাই চুপচাপ ওয়েবসাইটে পাঠানো হয় না; পাঠানো হলে তিনি হয়তো দ্বিতীয়
       বার টাকা দিয়ে ফেলতেন। আটকে থাকা ক্রয়টা পরের বার অ্যাপ খুললেই
       flushPending() তুলে আনে, তখন বিনামূল্যেই পাবেন — কথাটা তাঁকে
       বলে দেওয়া হয়, আর ওয়েবসাইটের পথটা তাঁর নিজের পছন্দে থাকে। */
    Alert.alert(
      t('কেনা সম্পূর্ণ হলো না'),
      t('টাকা কাটা হয়ে থাকলে চিন্তা করবেন না — পরের বার অ্যাপ খুলে একই বোতামে চাপ দিলে নতুন করে টাকা লাগবে না। এখনই দরকার হলে ওয়েবসাইট থেকেও নেওয়া যাবে।'),
      [
        { text: t('বাতিল'), style: 'cancel' },
        { text: t('ওয়েবসাইটে যান'), onPress: () => openOnWeb(msg) },
      ],
    );
  }
}

/* Play Billing এই বিল্ডে থাকলে অ্যাপের ভিতরেই কেনা হয়; না থাকলে (বা
   জিনিসটা চেনা না গেলে) আগের মতো ব্রাউজারে। দুটোর মাঝে কোনো তৃতীয় পথ
   নেই — টাকা নেওয়ার আগে ডেলিভারির পথটা জানা আছে কি না, সেটাই শর্ত। */
export function handleBuyOnWeb(msg, inject) {
  const product = productOf(msg);
  if (typeof inject === 'function' && UNLOCK_JS[product] && billing.isAvailable()) {
    playBuy(product, inject, msg).catch(() => { openOnWeb(msg); });
    return;
  }
  openOnWeb(msg);
}

// ফোনের ব্রাউজারে খোলার আগে একবার জানিয়ে দেওয়া — হঠাৎ অ্যাপ ছেড়ে বেরিয়ে
// যাওয়াটা যেন অপ্রত্যাশিত না লাগে।
function openOnWeb(msg) {
  const PAGES = {
    'match-making': 'match-making.html',
    // panjika.html একটা 301 রিডাইরেক্ট (→ /panjika, query অক্ষত থাকে) —
    // সরাসরি পরিষ্কার ঠিকানাই দেওয়া হচ্ছে, একটা কম ধাপ।
    'panjika':      'panjika',
    'kundali':      'kundali.html',
  };
  const page = PAGES[msg?.page] || 'kundali.html';
  const q = msg?.query ? '?' + msg.query : '';
  /* অ্যাপ ইংরেজি/হিন্দিতে থাকলে ওয়েবসাইটেও সেই ভাষার পাতাই খোলে —
     ওই তিনটি পাতারই /en/ ও /hi/ সংস্করণ আছে। বাংলা হলে উপসর্গ নেই।
     ⚠️ কেবল এই তিনটিতে — অন্য পাতার অনূদিত সংস্করণ না থাকলে ৪০৪ হতো। */
  const lg = getCurrentLang();
  const prefix = (lg === 'en' || lg === 'hi') ? lg + '/' : '';
  const url = SITE + prefix + page + q;
  Alert.alert(
    t('ওয়েবসাইটে কিনুন'),
    msg?.page === 'panjika'
      ? t('বার্ষিক পঞ্জিকা PDF এখন myastrology.in ওয়েবসাইট থেকে সংরক্ষণ করা যাবে। ')
        + t('আপনি যে সনের পঞ্জিকা দেখছেন, সেটাই খুলে যাবে।')
      : t('এই রিপোর্টটি এখন myastrology.in ওয়েবসাইট থেকে কেনা যাবে। ')
        + t('আপনার দেওয়া তথ্য সেখানে নিয়ে যাওয়া হবে, আবার লিখতে হবে না।'),
    [
      { text: t('বাতিল'), style: 'cancel' },
      { text: t('ওয়েবসাইটে যান'), onPress: () => { Linking.openURL(url).catch(() => {}); } },
    ],
  );
}
