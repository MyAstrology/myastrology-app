/*  বিদেশি পাঠকের জন্য পাতার ₹ অঙ্ক → Play-র নিজের দাম (তাঁর মুদ্রায়)।
 *
 *  ⛔ ২০২৬-০৯-২৫ — সহকর্মীর ১০ ও ১১ নম্বর: অ্যাপে কেনা হয় Play Billing-এ,
 *  আর Play বিদেশি পাঠককে দাম দেখায় তাঁর মুদ্রায় ($1.99, ৳…)। কিন্তু পাতার
 *  বোতাম, পপআপ আর PDF-এর শেষ পাতার বিজ্ঞাপন ওয়েবসাইট থেকে আসে, সেখানে
 *  হাতে লেখা "₹১০১" — পাঠক এক দাম দেখে Play-র পর্দায় আরেক দাম দেখতেন।
 *
 *  কী করে: Play-র তালিকা (billing.loadPrices) থেকে প্রতিটি পণ্যের দাম, আর
 *  config/products.js-এর `inr` থেকে "কোন ₹ অঙ্ক কোন পণ্য"। পাতার লেখায়
 *  "₹১০১"/"₹101" খুঁজে সেই পণ্যের Play-দাম বসানো হয় — MutationObserver
 *  দিয়ে, কারণ পপআপ ও ছাপার পাতা পরে আঁকা হয়।
 *
 *  ⚠️ ভারতীয় পাঠকের (Play-র মুদ্রা INR) জন্য **কিছুই বদলায় না** — পাতার
 *  লেখাই সঠিক, আর "₹101.00" বসানো অকারণ বদল।
 *  ⚠️ যে ₹ অঙ্ক কোনো পণ্যের নয় (কেটে-দেওয়া ₹৯৯৯, "₹৫০০ সাশ্রয়") সেটা
 *  বিদেশি পাঠকের কাছে ভুল তুলনা — ছোট আলাদা লেখা হলে লুকোনো হয়, বাক্যের
 *  ভিতরে থাকলে ছোঁয়া হয় না।
 *  ⚠️ দাম আসে **ডাকার সময়** (getPriceMap) — মডিউল লোডের সময় ধরে রাখলে
 *  প্রথম পাতায় null জমে যেত (এই রিপোর আটবার ধরা পড়া ভুল)। */
import { useEffect, useMemo, useState } from 'react';
import { PRODUCTS } from '../config/products';

let _map = null;          // {"101":"$1.99", …} — কেবল বিদেশি মুদ্রায়
let _loading = null;

/** একবারই Play থেকে আনা; ব্যর্থ বা INR হলে null। */
export function loadPriceMap() {
  if (_loading) return _loading;
  _loading = (async () => {
    try {
      const billing = require('./billing');
      const prices = await billing.loadPrices();
      _map = buildMap(prices);
    } catch (e) {
      /* Play-র সঙ্গে কথা হয়নি (নেট নেই, সাইডলোড) — পরের পর্দায় আবার চেষ্টা */
      _map = null; _loading = null;
    }
    return _map;
  })();
  return _loading;
}

export function getPriceMap() { return _map; }

/** Play-র তালিকা → অঙ্ক-ভিত্তিক মানচিত্র (পরীক্ষার জন্য আলাদা করে রাখা) */
export function buildMap(prices) {
  if (!prices) return null;
  const out = {};
  const clash = {};
  let foreign = false;
  for (const key of Object.keys(PRODUCTS)) {
    const p = prices[key];
    if (!p || !p.price) continue;
    if (p.currency && p.currency !== 'INR') foreign = true;
    const amt = String(PRODUCTS[key].inr);
    if (!out[amt]) out[amt] = p.price;
    else if (out[amt] !== p.price) clash[amt] = 1;
  }
  /* ⚠️ ২০২৬-০৯-২৫ — পাতার "₹১০১" থেকে পণ্য চেনা হয় অঙ্ক দিয়ে, আর ₹১০১ দুটো
     পণ্যের (কুণ্ডলী PDF, যোটক PDF)। Console-এ বিদেশে দুটোর দাম আলাদা হলে
     প্রথমটার দামই দুই পাতায় বসত — নীরবে ভুল দাম। সেই অঙ্ক তাই বদলানোই হয় না
     (পাঠক ₹ রেফারেন্স দেখেন, Play-র পর্দায় আসল দাম) — ভুল দাবির চেয়ে ভালো। */
  for (const amt of Object.keys(clash)) delete out[amt];
  return foreign && Object.keys(out).length ? out : null;
}

/** পাতায় চালানোর JS — map না থাকলে ফাঁকা */
export function priceJS(map) {
  if (!map) return '';
  return `(function(){try{
  if(window.__myaPriceLoc) return; window.__myaPriceLoc=1;
  var MAP=${JSON.stringify(map)};
  var BN='০১২৩৪৫৬৭৮৯';
  function num(s){return parseInt(String(s).replace(/[০-৯]/g,function(d){return BN.indexOf(d);}).replace(/[,\\s]/g,''),10);}
  /* তিন আকৃতি: "₹১০১", ছাপার শেষ পাতার "দক্ষিণা: ৫০১/-", আর যোটকের "₹501/-"
     (শেষেরটায় আগে কেবল ₹ বদলাত আর "$7.49/-" থেকে যেত — verify-local-prices) */
  var RE=/₹\\s?([০-৯0-9][০-৯0-9,]*)(?:\\s?\\/-)?|([০-৯0-9][০-৯0-9,]*)\\s?\\/-/g;
  function fix(root){
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null),n,list=[];
    while((n=w.nextNode())){
      var p=n.parentNode, t=p&&p.nodeName;
      if(t==='SCRIPT'||t==='STYLE'||t==='NOSCRIPT'||t==='TEXTAREA') continue;
      if(n.nodeValue.indexOf('₹')>=0||n.nodeValue.indexOf('/-')>=0) list.push(n);
    }
    list.forEach(function(n){
      var hideParent=false;
      var v=n.nodeValue.replace(RE,function(all,d,d2){
        var k=String(num(d||d2));
        if(MAP[k]) return MAP[k];
        if(d) hideParent=true;         /* "/-" আকৃতির অচেনা অঙ্ক ছোঁয়া হয় না */
        return all;
      });
      if(v!==n.nodeValue) n.nodeValue=v;
      if(hideParent){
        var el=n.parentNode;
        if(el&&el.nodeType===1&&(el.textContent||'').trim().length<=28&&!/[\\$€£]|[A-Z]{2,3}\\s?\\d/.test(el.textContent)) el.style.display='none';
      }
    });
  }
  fix(document.body||document.documentElement);
  var tm=null;
  new MutationObserver(function(){clearTimeout(tm);tm=setTimeout(function(){fix(document.body);},60);})
    .observe(document.documentElement,{childList:true,subtree:true,characterData:true});
}catch(e){}})();true;`;
}

/** WebView-ওয়ালা কম্পোনেন্টের জন্য — দাম এলে নতুন JS; আগে থেকে পাতা খোলা
 *  থাকলে ডাকা জায়গাটা injectJavaScript দিয়ে বসায় (নিচে ref দিলে নিজেই)।
 *  ⚠️ হুক — early-return-এর **উপরে** ডাকতে হবে (verify-hook-order)। */
export function usePriceJS(webViewRef) {
  const [map, setMap] = useState(getPriceMap());
  useEffect(() => {
    let alive = true;
    loadPriceMap().then(m => { if (alive) setMap(m); });
    return () => { alive = false; };
  }, []);
  const js = useMemo(() => priceJS(map), [map]);
  useEffect(() => {
    if (js && webViewRef && webViewRef.current) webViewRef.current.injectJavaScript(js);
  }, [js]); // eslint-disable-line react-hooks/exhaustive-deps
  return js;
}
