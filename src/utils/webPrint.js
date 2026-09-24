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
import { getPriceMap, priceJS } from './localPrices';

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
  /* বিদেশি পাঠকের PDF-এর শেষ পাতায় ₹-এর বদলে Play-র দাম (localPrices.js) —
     দাম পড়া হয় এখন, ছাপার মুহূর্তে */
  const pj = priceJS(getPriceMap());
  return html.replace('<head>', () => `<head><script>window.__myaPrintData=${safe};${langJs}${IMG_FIX_JS}${pj}<\/script>`);
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
      + `window.__myaPrintData=r;}catch(e){}})();` + priceJS(getPriceMap()) + `true;`,
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
  /* ⛔ ২০২৬-০৯-২৫ — বান্ডলে ছবি base64 হয়ে পাতার ভিতরেই থাকে (নামকরণ ~২ লাখ
     অক্ষর), লাইভ en/hi পাতায় কেবল ঠিকানা (~৭ হাজার)। বান্ডল ধরে লেখা ৮,০০০-এর
     সীমা তাই লাইভ নামকরণ ও সংখ্যা জ্যোতিষে **কখনো** পেরোত না — PDF আসতই না।
     ফাঁকা পাতায় printRoot ০ (মাপা), আর "শেষ হয়েছে কি না" দেখে উপরের স্থিরতা-
     পরীক্ষা; তাই লাইভে সীমাটা কেবল "কিছু একটা আঁকা হয়েছে"-র পাহারা। */
  var _min=/^https?:/.test(location.protocol)?Math.min(${minLen},2000):${minLen};
  if(root && _len > _min && _settled){
    if(window.__myaCapBusy) return; window.__myaCapBusy=1;
    [].slice.call(document.querySelectorAll('script')).forEach(function(s){s.parentNode&&s.parentNode.removeChild(s);});
    var live=/^https?:/.test(location.protocol);
    /* লাইভ পাতার CSS/ফন্ট/ছবি মূল-থেকে-লেখা পথে (/css/print-a4.css) — <base>
       থাকলে অন্তত ঠিকানাটা ঠিক থাকে। বান্ডলে (about:blank) দরকার নেই। */
    if(live && !document.querySelector('base')){
      var b=document.createElement('base'); b.href=location.origin+'/';
      document.head.insertBefore(b, document.head.firstChild);
    }
    /* ⛔ ২০২৬-০৯-২৫ — কিন্তু ঠিকানা ঠিক থাকলেই চলে না। সহকর্মীর ফোনে ইংরেজি
       বর্ষফল ও সংখ্যা জ্যোতিষের PDF: লোগোর জায়গায় ফাঁকা বাক্স, গণেশ ও দেবতার
       ছবি নেই, পাতার ফ্রেম নেই, "Page 1 | …" লেখার মাঝখানে। expo-print
       (Android) ছাপার সময় নেট থেকে কিছুই নামায় না — ব্রাউজারে নেট আটকে
       হুবহু একই চেহারা পাওয়া গেল। বাংলা বান্ডল ঠিক থাকে কারণ সেখানে সব
       ছবি ও CSS পাতার ভিতরেই থাকে। তাই এখানেও তাই করা হয়: স্টাইলশিট →
       <style>, আর প্রতিটি ছবি/ফন্ট → data: ঠিকানা (একই সাইট, তাই fetch চলে)।
       কোনোটা না নামলে আগের ঠিকানাই থাকে; সব মিলিয়ে বেশিজোর ১০ সেকেন্ড। */
    function abs(u,base){try{return new URL(u,base).href;}catch(e){return u;}}
    function toData(u){
      if(/^data:/.test(u)) return Promise.resolve(u);
      return fetch(u).then(function(r){ if(!r.ok) throw 0; return r.blob(); }).then(function(bl){
        return new Promise(function(res){ var fr=new FileReader(); fr.onload=function(){res(fr.result);}; fr.onerror=function(){res(u);}; fr.readAsDataURL(bl); });
      }).catch(function(){ return u; });
    }
    var URL_RE=/url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
    function inlineCss(css, base){
      var urls=[], m; URL_RE.lastIndex=0;
      while((m=URL_RE.exec(css))) if(urls.indexOf(m[1])<0) urls.push(m[1]);
      return Promise.all(urls.map(function(u){ return toData(abs(u,base)); })).then(function(ds){
        return css.replace(URL_RE, function(all,u){ var i=urls.indexOf(u); return 'url("'+(i>=0?ds[i]:abs(u,base))+'")'; });
      });
    }
    function inlineAll(){
      var jobs=[];
      [].slice.call(document.querySelectorAll('link[rel~="stylesheet"][href]')).forEach(function(l){
        var href=l.href;
        jobs.push(fetch(href).then(function(r){ return r.ok?r.text():''; }).then(function(css){
          if(!css) return;
          return inlineCss(css, href).then(function(c2){
            var st=document.createElement('style'); st.textContent=c2;
            if(l.media && l.media!=='all') st.media=l.media;
            l.parentNode && l.parentNode.replaceChild(st,l);
          });
        }).catch(function(){}));
      });
      [].slice.call(document.querySelectorAll('style')).forEach(function(st){
        if(st.textContent.indexOf('url(')<0) return;
        jobs.push(inlineCss(st.textContent, document.baseURI).then(function(c2){ st.textContent=c2; }));
      });
      [].slice.call(document.querySelectorAll('img[src]')).forEach(function(im){
        jobs.push(toData(im.src).then(function(d){ im.setAttribute('src',d); im.removeAttribute('srcset'); im.removeAttribute('loading'); }));
      });
      [].slice.call(document.querySelectorAll('[style*="url("]')).forEach(function(el){
        jobs.push(inlineCss(el.getAttribute('style'), document.baseURI).then(function(c2){ el.setAttribute('style',c2); }));
      });
      return Promise.race([Promise.all(jobs), new Promise(function(r){ setTimeout(r,10000); })]);
    }
    function send(){
      var h=document.documentElement.outerHTML, C=200000, n=Math.ceil(h.length/C)||1;
      for(var i=0;i<n;i++){
        window.ReactNativeWebView.postMessage(JSON.stringify({
          __rn:${JSON.stringify(type)}, i:i, total:n, chunk:h.substring(i*C,(i+1)*C)
        }));
      }
      window.__myaCapBusy=0;
    }
    if(live && window.fetch && window.Promise) inlineAll().then(send, send); else send();
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

/*  ⛔ ২০২৬-০৯-২৫ — PDF-এর আগে শেষ পাহারা: নেটের ঠিকানায় থাকা ছবি/CSS/ফন্ট
 *  ফোনেই নামিয়ে HTML-এর ভিতরে বসানো।
 *  সহকর্মী: "ডাউনলোডের আগে পর্যন্ত ঠিক, ডাউনলোড করলে খারাপ" — পর্দার WebView
 *  নেট থেকে ছবি পায়, কিন্তু expo-print (Android) PDF বানানোর সময় কিছুই
 *  নামায় না। makeCaptureJS লাইভ পাতায় এটা আগেই করে; কিন্তু বাংলা বান্ডলেও
 *  নেটের ঠিকানা থাকে — সংখ্যা জ্যোতিষের দেবতা ও রত্নের ছবি (তথ্য থেকে আসে,
 *  IMG_FIX_JS https করে), কুণ্ডলীর noto-sans-font.css। এখানে RN-এর দিকে
 *  করা হয়, তাই CORS-এর বাধা নেই আর সব পথেই (বান্ডল, লাইভ, কুণ্ডলী,
 *  পঞ্জিকা) একই পাহারা।
 *  🔒 কেবল নিজেদের সাইটের ঠিকানা। কোনোটা না নামলে আগের ঠিকানাই থাকে। */
const OWN = /^https:\/\/(www\.)?myastrology\.in\//i;
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  svg: 'image/svg+xml', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf' };
function absUrl(u, base) { try { return new URL(u, base).href; } catch (e) { return null; } }
async function toDataUri(url, cache) {
  if (cache[url]) return cache[url];
  const ext = (/\.([a-z0-9]+)(?:[?#]|$)/i.exec(url) || [])[1];
  const mime = MIME[(ext || '').toLowerCase()];
  if (!mime) return null;
  const p = (async () => {
    try {
      const dest = FileSystem.cacheDirectory + 'pdfimg_' + url.replace(/[^a-z0-9]/gi, '_').slice(-80) + '.' + ext;
      const r = await FileSystem.downloadAsync(url, dest);
      if (!r || r.status !== 200) return null;
      const b64 = await FileSystem.readAsStringAsync(r.uri, { encoding: FileSystem.EncodingType.Base64 });
      return b64 && b64.length < 4e6 ? `data:${mime};base64,${b64}` : null;
    } catch (e) { return null; }
  })();
  cache[url] = p;
  return p;
}
const CSS_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
async function inlineCssUrls(css, base, cache) {
  const found = [];
  css.replace(CSS_URL, (a, q, u) => { if (!/^data:/.test(u)) found.push(u); return a; });
  const map = {};
  await Promise.all(found.map(async u => {
    const a = absUrl(u, base);
    if (a && OWN.test(a)) { const d = await toDataUri(a, cache); if (d) map[u] = d; }
  }));
  return css.replace(CSS_URL, (a, q, u) => (map[u] ? `url("${map[u]}")` : a));
}
async function withTimeout(p, ms, fallback) {
  let t;
  const r = await Promise.race([p, new Promise(res => { t = setTimeout(() => res(fallback), ms); })]);
  clearTimeout(t);
  return r;
}
export async function inlineRemote(html) {
  if (!html || typeof html !== 'string') return html;
  const work = (async () => {
    const bm = /<base\s[^>]*href=["']([^"']+)["']/i.exec(html);
    const base = bm ? bm[1] : SITE_ORIGIN + '/';
    const cache = {};
    let out = html;
    /* ১. বাইরের স্টাইলশিট → <style> */
    const links = out.match(/<link\b[^>]*rel=["']?stylesheet[^>]*>/gi) || [];
    for (const tag of links) {
      const hm = /href=["']([^"']+)["']/i.exec(tag);
      const a = hm && absUrl(hm[1].replace(/&amp;/g, '&'), base);
      if (!a || !OWN.test(a)) continue;
      try {
        const res = await withTimeout(fetch(a), 8000, null);
        if (!res || !res.ok) continue;
        const css = await inlineCssUrls(await res.text(), a, cache);
        out = out.split(tag).join(`<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`);
      } catch (e) {}
    }
    /* ২. <img src> */
    const srcs = new Set();
    out.replace(/<img\b[^>]*?\ssrc=["']([^"']+)["']/gi, (a, u) => { if (!/^data:/.test(u)) srcs.add(u); return a; });
    const map = {};
    await Promise.all([...srcs].map(async u => {
      const a = absUrl(u.replace(/&amp;/g, '&'), base);
      if (a && OWN.test(a)) { const d = await toDataUri(a, cache); if (d) map[u] = d; }
    }));
    out = out.replace(/(<img\b[^>]*?\ssrc=)(["'])([^"']+)\2/gi, (a, pre, q, u) => (map[u] ? `${pre}${q}${map[u]}${q}` : a));
    /* ৩. <style> ও style="" -এর url() */
    const styles = out.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) || [];
    for (const st of styles) {
      if (st.indexOf('url(') < 0) continue;
      const fixed = await inlineCssUrls(st, base, cache);
      if (fixed !== st) out = out.split(st).join(fixed);
    }
    return out;
  })();
  /* নেট না থাকলে PDF আটকে থাকবে না — বেশিজোর ২০ সেকেন্ড, তারপর যা আছে */
  return withTimeout(work.catch(() => html), 20000, html);
}

/** HTML → PDF, তারপর পাঠককে সংরক্ষণ বা শেয়ারের সুযোগ।
 *  alertT আসে useAlert() থেকে, তাই বার্তাগুলো পাঠকের ভাষায়। */
export async function deliverPdf(html, { alertT, fileName, dialogTitle }) {
  html = await inlineRemote(html);
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
