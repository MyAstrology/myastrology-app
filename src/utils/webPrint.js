/*  পাতা নিজেই ছাপে — এমন WebView-এর জন্য PDF তৈরি
 *  ═══════════════════════════════════════════════════════════════
 *  বর্ষফল ও সংখ্যা-জ্যোতিষের PDF বোতাম শেষমেশ `window.print()` ডাকে।
 *  WebView-এ ওটা **কিছুই করে না** — কোনো ত্রুটিও দেয় না। ফলে প্রোমো
 *  কোড ঠিক দিলেও পাঠক কিছুই পেতেন না, আর টাকা দিলেও তাই হতো।
 *
 *  কুণ্ডলী, পঞ্জিকা ও যোটক-বিচারের পর্দায় এর সমাধান আলাদা আলাদা করে
 *  তিনবার লেখা হয়েছিল। এটি সেই কোডেরই এক জায়গার রূপ — নতুন কিছু নয়,
 *  যাতে চতুর্থ কপি না জন্মায়।
 *
 *  ⚠️ HTML একসঙ্গে postMessage করলে কম-RAM ফোনে WebView-এর সেতু
 *     ওভারলোড হয়ে অ্যাপ ক্র্যাশ করে — তাই টুকরো করে পাঠানো হয়
 *     (পঞ্জিকার পর্দায় মাপা আচরণ)।
 */
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const PDF_CHUNK = 'pagePdfChunk';

/*  ছাপার তথ্য (আর দরকার হলে ভাষা) ছাপার পাতায় বসানো — এক জায়গায়।
 *
 *  ⛔ আগে পাঁচটা পর্দার প্রত্যেকটা **নিজের মতো করে** ছাপার পাতার
 *  localStorage-লাইনটা হুবহু খুঁজে বদলাত (`__kData`, `__mmRaw`, `__nkRaw`,
 *  `__nuRaw`, `__vpRaw` — পাঁচটা আলাদা নাম, পাঁচটা আলাদা needle)। সাইটে
 *  ওই লাইনের একটা অক্ষর বদলালেই `replace()` **নীরবে** কিছুই করত না —
 *  কোনো ত্রুটি নয়, লগে কিছু নয় — আর ছাপার পাতা ফাঁকা তথ্য নিয়ে কেবল
 *  মলাট, সূচিপত্র ও বিজ্ঞাপনের PDF বানাত (মালিকের অভিযোগ খ৭, ২০২৬-০৯-২১)।
 *
 *  এখন services-এর পাঁচটা ছাপার পাতাই `window.__myaPrintData` দেখে
 *  (localStorage ফাঁকা হলে), তাই কোনো স্ট্রিং মেলানোর দরকারই নেই।
 *  ⚠️ lang কেবল কুণ্ডলীর ছাপার পাতা পড়ে (js/i18n.js ইনলাইন আছে) — বাকিগুলোয়
 *  i18n.js বান্ডল থেকে বাদ পড়ে, তাই ওখানে পাঠানো হয় না। */
export function withPrintData(html, rawJson, lang) {
  const safe = JSON.stringify(rawJson).replace(/</g, '\\u003c');
  const L = (lang === 'en' || lang === 'hi') ? lang : (lang === 'bn' ? 'bn' : null);
  const langJs = L ? `try{document.documentElement.setAttribute('data-mya-lang',${JSON.stringify(L)});}catch(e){}` : '';
  return html.replace('<head>', () => `<head><script>window.__myaPrintData=${safe};${langJs}${IMG_FIX_JS}<\/script>`);
}

/*  ⛔ ২০২৬-০৯-২৪ — ইংরেজি/হিন্দি ক্রেতার PDF-এর উৎস।
 *  অ্যাপের বান্ডল করা ছাপার পাতাগুলো বাংলা-only (অনুবাদ-যন্ত্র নেই), অথচ
 *  en/hi-তে ক্যালকুলেটর চলে লাইভ ওয়েবসাইটে, তাই রিপোর্টের লেখা ইংরেজি।
 *  ফল: ভিতরে ইংরেজি, আর মলাট · সূচিপত্র · শেষ পাতা · বিজ্ঞাপন বাংলায় —
 *  সহকর্মীর ১৬ নম্বর অভিযোগ হুবহু। ওয়েবসাইটের লাইভ ছাপার পাতা সম্পূর্ণ
 *  অনূদিত (verify-kundali-pdf-lang), তাই en/hi-তে লুকোনো WebView ওটাই
 *  খোলে, আর তথ্যটা পাতার নিজের JS চলার **আগেই** বসিয়ে দেওয়া হয়
 *  (localStorage ও window.__myaPrintData — ছাপার পাতা দুটোই পড়ে)।
 *  বাংলায় আগের মতোই বান্ডল — নেট ছাড়াও চলে। */
export const SITE_ORIGIN = 'https://myastrology.in';
const PRINT_KEYS = {
  'match-making-print': 'match_print_data',
  'kundali-print':      'kundali_print_data',
  'numerology-print':   'numerology_print_data',
  'varshaphala-print':  'varshaphala_print_data',
  'namakaran-print':    'namakaran_print_data',
};
export function printSource(page, bundleHtml, rawJson, lang) {
  if ((lang === 'en' || lang === 'hi') && PRINT_KEYS[page]) {
    return livePrintSource(`/${page}.html`, rawJson, lang);
  }
  return { html: withPrintData(bundleHtml, rawJson, lang) };
}

/*  যেকোনো ছাপার-পাতার ঠিকানা (পাতা যা window.open করল, যেমন
 *  '/kundali-print.html?premium=1') → লাইভ উৎস। "আমার রিপোর্ট"-এর প্রিমিয়াম
 *  PDF এভাবেই বানানো হয় — ?premium=1 সহ ঠিকানাটা হুবহু রাখা হয়।
 *  ভাষা **সবসময়** পাঠানো হয় (বাংলাও) — না পেলে ছাপার পাতা localStorage-এর
 *  পুরনো পছন্দ ধরে (match-making.html-এর ২০২৬-০৮-২৫ শিক্ষা)।
 *  🔒 origin সবসময় নিজেদের সাইট; বাইরের ঠিকানা এলে null। */
export function livePrintSource(url, rawJson, lang) {
  let path = String(url || '').replace(/^https?:\/\/(www\.)?myastrology\.in/i, '');
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) return null;
  if (!path.startsWith('/')) path = '/' + path;
  const m = /^\/([a-z-]+-print)(?:\.html)?(?=[?#]|$)/.exec(path);
  if (!m || !PRINT_KEYS[m[1]]) return null;
  const L = (lang === 'en' || lang === 'hi') ? lang : 'bn';
  if (!/[?&]lang=/.test(path)) path += (path.includes('?') ? '&' : '?') + 'lang=' + L;
  const raw = typeof rawJson === 'string' ? rawJson : JSON.stringify(rawJson);
  const safe = JSON.stringify(raw).replace(/</g, '\\u003c');
  return {
    uri: SITE_ORIGIN + path,
    before: `(function(){try{var r=${safe};`
      + `try{localStorage.setItem(${JSON.stringify(PRINT_KEYS[m[1]])},r);}catch(e){}`
      + `window.__myaPrintData=r;}catch(e){}})();true;`,
  };
}

/*  ⛔ ২০২৬-০৯-২৪ — লাইভ (en/hi) ক্যালকুলেটর পাতার window.open-সেতু।
 *  বান্ডলে এই সেতু bundle-web-assets.js বসায়; লাইভ পাতায় কেউ বসাত না।
 *  ফলে ইংরেজি/হিন্দি পাঠক প্রোমো/পেমেন্টের পর PDF চাপলে ছাপার পাতাটা
 *  হয় নিঃশব্দে হারাত, নয়তো একই WebView-এ খুলে যেত — যেখান থেকে
 *  ডাউনলোডের কোনো পথ নেই (window.print() WebView-এ কিছুই করে না)।
 *  কেবল *-print পাতা ধরা হয়; বাকি সব window.open আগের মতোই চলে। */
export const OPEN_BRIDGE_JS = `(function(){try{
  if(window.__myaOpenBridge) return; window.__myaOpenBridge=1;
  var _o=window.open;
  var KEYS=${JSON.stringify(Object.entries(PRINT_KEYS).map(([pg, k]) => [pg, k]))};
  var WIN={'match_print_data':'_matchPrintData','kundali_print_data':'_kundaliPrintData','numerology_print_data':'_nuPrintData','varshaphala_print_data':'_vpPrintData','namakaran_print_data':'_nkPrintData'};
  window.open=function(url,target,f){
    var u=String(url||''), m=/([a-z-]+-print)(?:\\.html)?(?:[?#]|$)/.exec(u);
    if(m && window.ReactNativeWebView){
      var key=null, raw='';
      for(var i=0;i<KEYS.length;i++) if(KEYS[i][0]===m[1]) key=KEYS[i][1];
      if(key){
        try{ raw=localStorage.getItem(key)||''; }catch(e){}
        try{ if(!raw && window[WIN[key]]) raw=JSON.stringify(window[WIN[key]]); }catch(e){}
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({__rn:'open',url:u,raw:raw}));
      return {focus:function(){},closed:false,close:function(){}};
    }
    return _o?_o.call(window,url,target,f):null;
  };
}catch(e){}})();`;

/*  ⛔ ছাপার তথ্যের ভিতরে কিছু ছবির **ঠিকানা** থাকে (সংখ্যা জ্যোতিষের
 *  দেবতা ও রত্ন — `/gallery/shukra_dev.webp`)। কোনটা আসবে সেটা পাঠকের
 *  সংখ্যা ঠিক করে, তাই বান্ডলে আগে থেকে বসিয়ে রাখা যায় না।
 *
 *  কিন্তু অ্যাপে পাতাটা আসে `source={{html}}` থেকে, যার ভিত্তি-ঠিকানা
 *  about:blank — সেখানে "/gallery/…" কোনো ঠিকানাই নয়, তাই ছবিটা
 *  **নীরবে** ফাঁকা বাক্স হয়ে যায় আর পাশের লেখা সরে এসে ওভারল্যাপ
 *  দেখায় (মালিকের অভিযোগ খ২)। তাই মূল-থেকে-লেখা প্রতিটি পথ লাইভ
 *  সাইটের ঠিকানায় বদলে দেওয়া হয় — পাতা নিজে যখনই নতুন ছবি বসাক। */
const IMG_FIX_JS = `(function(){try{
  var SITE='https://myastrology.in';
  function fix(n){
    if(!n||n.nodeType!==1)return;
    var list=(n.tagName==='IMG')?[n]:(n.querySelectorAll?n.querySelectorAll('img'):[]);
    for(var i=0;i<list.length;i++){
      var s=list[i].getAttribute('src')||'';
      if(s.charAt(0)==='/'&&s.charAt(1)!=='/') list[i].setAttribute('src',SITE+s);
    }
  }
  fix(document.documentElement);
  if(window.MutationObserver){
    new MutationObserver(function(ms){
      for(var i=0;i<ms.length;i++){
        var a=ms[i].addedNodes;
        for(var j=0;j<a.length;j++) fix(a[j]);
      }
    }).observe(document.documentElement,{childList:true,subtree:true});
  }
}catch(e){}})();`;

/* পাতার নিজের `window.print()`-কে বদলে দেয়: DOM-এর একটা কপি নিয়ে
   <script> ফেলে দিয়ে স্ট্যাটিক HTML পাঠায়। স্ক্রিপ্ট রাখলে expo-print
   ওগুলো আবার চালাতে গিয়ে অর্ধেক-আঁকা পাতা ছাপত। */
export const PAGE_PRINT_JS = `(function(){try{
  if(window.__myaPrintHooked) return; window.__myaPrintHooked=1;
  window.print=function(){
    try{
      var clone=document.documentElement.cloneNode(true);
      var sc=clone.querySelectorAll('script');
      for(var i=0;i<sc.length;i++){ sc[i].parentNode&&sc[i].parentNode.removeChild(sc[i]); }
      var html='<!DOCTYPE html>'+clone.outerHTML;
      if(!window.ReactNativeWebView) return;
      var CHUNK=200000, total=Math.ceil(html.length/CHUNK)||1;
      for(var c=0;c<total;c++){
        window.ReactNativeWebView.postMessage(JSON.stringify({
          __rn:'${PDF_CHUNK}', i:c, total:total,
          chunk:html.substring(c*CHUNK,(c+1)*CHUNK)
        }));
      }
    }catch(e){}
  };
}catch(e){}})();true;`;

/*  লুকোনো WebView-এ ছাপার পাতাটা আঁকা শেষ হলে তার স্ট্যাটিক HTML ধরা।
 *  ⚠️ টুকরো করে পাঠানো **ঐচ্ছিক নয়** — কোষ্ঠী-মিলনের ছাপার পাতা মেপে
 *  ২,২০,৯৫৩ অক্ষর, আর এই ফাইলের উপরের নোটেই লেখা যে একসঙ্গে পাঠালে
 *  কম-RAM ফোনে সেতু ওভারলোড হয়। কুণ্ডলীর পর্দায় ঠিক এই সংশোধনটা
 *  আগেই বসানো হয়েছিল, মিলনের পর্দায় বসেনি — তাই এখানে এক জায়গায়।
 *  minLen: printRoot-এ অন্তত এত অক্ষর না এলে ধরা হবে না — নইলে
 *  অর্ধেক-আঁকা (কেবল মলাট) পাতাও "তৈরি" বলে ধরা পড়ত।
 */
export const makeCaptureJS = (type, minLen = 20000) => `(function poll(){
  var root=document.getElementById('printRoot');
  /* ⛔ ২০২৬-০৯-২৪ — লাইভ (en/hi) ছাপার পাতায় অভিধান আসে নেটওয়ার্ক থেকে,
     অনুবাদ বসে তার পরে। আগেভাগে ধরলে মলাট বাংলা থেকে যেত (কুণ্ডলীর
     পর্দায় একই শিক্ষা, ২০২৬-০৯-০৮)। MyaI18n.ready + ৬০০ms, সর্বোচ্চ ~১২ সে.। */
  if(!window.__myaI18nOk){
    window.__myaI18nT0=window.__myaI18nT0||Date.now();
    if(window.MyaI18n && window.MyaI18n.ready && !window.__myaI18nHooked){
      window.__myaI18nHooked=1;
      window.MyaI18n.ready.then(function(){ setTimeout(function(){ window.__myaI18nOk=1; },600); });
    }
    if(!window.MyaI18n || Date.now()-window.__myaI18nT0>12000) window.__myaI18nOk=1;
    if(!window.__myaI18nOk){ setTimeout(poll,400); return; }
  }
  /* ⛔ ছবি নামার আগেই ধরলে PDF-এ ফাঁকা বাক্স পড়ে, আর ছবি
     শূন্য হওয়ায় পাশের লেখা সরে এসে ওভারল্যাপ দেখায় (খ২)।
     তাই সব ছবি শেষ হওয়া পর্যন্ত অপেক্ষা — তবে বেশিজোর ~৬ সেকেন্ড,
     নয়তো নেট না থাকলে PDF-টাই কখনো তৈরি হতো না। */
  window.__myaImgWait=(window.__myaImgWait||0)+1;
  var imgs=root?root.querySelectorAll('img'):[];
  var pending=0;
  for(var q=0;q<imgs.length;q++) if(!imgs[q].complete) pending++;
  if(pending && window.__myaImgWait < 15){ setTimeout(poll,400); return; }
  /* ⛔ ২০২৬-০৯-২৪ — আগে printRoot-এ minLen অক্ষর দেখলেই ধরে নেওয়া হতো।
     কিন্তু ছাপার পাতা ধাপে ধাপে গড়ে — প্রিমিয়াম কুণ্ডলী মেপে দেখা গেল
     অর্ধেক-আঁকা অবস্থায় ধরা পড়ে ১৭ পাতার PDF, অথচ পুরোটা ৮০+ পাতা।
     সহকর্মীর "একবার ৩৯ পাতা, আবার নামালে ৯০+" — এটাই। এখন ধরা হয় তখনই,
     যখন "লোড হচ্ছে" বার্তা লুকিয়েছে **এবং** আকার টানা তিনবার (১.২ সে.)
     একই থেকেছে; সর্বোচ্চ ~৪০ সেকেন্ড, তারপর যা আছে। */
  var _len=root?root.innerHTML.length:0, _lm=document.getElementById('loadMsg');
  var _loading=!!(_lm && _lm.style.display!=='none' && _lm.offsetParent!==null);
  window.__myaCapT0=window.__myaCapT0||Date.now();
  if(_len===window.__myaLastLen && !_loading) window.__myaStable=(window.__myaStable||0)+1;
  else window.__myaStable=0;
  window.__myaLastLen=_len;
  var _settled=window.__myaStable>=3 || (Date.now()-window.__myaCapT0>40000);
  if(root && _len > ${minLen} && _settled){
    [].slice.call(document.querySelectorAll('script')).forEach(function(s){s.parentNode&&s.parentNode.removeChild(s);});
    /* লাইভ পাতার CSS/ফন্ট/ছবি মূল-থেকে-লেখা পথে (/css/print-a4.css) — expo-print
       ওগুলো খুঁজে পায় কেবল <base> থাকলে। বান্ডলে (about:blank) দরকার নেই। */
    if(/^https?:/.test(location.protocol) && !document.querySelector('base')){
      var b=document.createElement('base'); b.href=location.origin+'/';
      document.head.insertBefore(b, document.head.firstChild);
    }
    var h=document.documentElement.outerHTML, C=200000, n=Math.ceil(h.length/C)||1;
    for(var i=0;i<n;i++){
      window.ReactNativeWebView.postMessage(JSON.stringify({
        __rn:${JSON.stringify(type)}, i:i, total:n, chunk:h.substring(i*C,(i+1)*C)
      }));
    }
  } else { setTimeout(poll,400); }
})();true;`;

/** টুকরোগুলো জোড়া লাগায়। সব টুকরো এলে পুরো HTML ফেরায়, নইলে null।
 *  store একটা সাধারণ অবজেক্ট (useRef().current) — {parts, total}. */
export function collectPdfChunk(msg, store, type = PDF_CHUNK) {
  if (!msg || msg.__rn !== type) return null;
  if (store.total !== msg.total) { store.total = msg.total; store.parts = []; }
  store.parts[msg.i] = msg.chunk;
  for (let i = 0; i < store.total; i++) if (store.parts[i] == null) return null;
  const html = store.parts.join('');
  store.parts = []; store.total = 0;
  return html;
}

/** HTML → PDF, তারপর পাঠককে সংরক্ষণ বা শেয়ারের সুযোগ।
 *  alertT আসে useAlert() থেকে, তাই বার্তাগুলো পাঠকের ভাষায়। */
export async function deliverPdf(html, { alertT, fileName, dialogTitle }) {
  const { uri } = await Print.printToFileAsync({ html, base64: false, width: 595, height: 842 });
  alertT('PDF তৈরি হয়েছে', 'কী করতে চান?', [
    {
      text: 'সংরক্ষণ করুন',
      onPress: async () => {
        try {
          const { StorageAccessFramework } = FileSystem;
          const perm = await StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (perm.granted) {
            const dest = await StorageAccessFramework.createFileAsync(
              perm.directoryUri, fileName, 'application/pdf');
            const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            await FileSystem.writeAsStringAsync(dest, b64, { encoding: FileSystem.EncodingType.Base64 });
            alertT('সংরক্ষিত!', 'PDF ফোল্ডারে সেভ হয়েছে।');
          }
        } catch (_) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
        }
      },
    },
    {
      text: 'শেয়ার করুন',
      onPress: () => Sharing.shareAsync(uri, {
        mimeType: 'application/pdf', dialogTitle, UTI: 'com.adobe.pdf',
      }),
    },
    { text: 'বাতিল', style: 'cancel' },
  ]);
}
