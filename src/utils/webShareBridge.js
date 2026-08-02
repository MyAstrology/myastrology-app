import { Share } from 'react-native';

// ওয়েব পেজের শেয়ার/কপি বোতাম দুটোই ব্রাউজারের API-র উপর নির্ভর করে —
// `navigator.share` (Web Share API) ও `navigator.clipboard`। অ্যান্ড্রয়েডের
// WebView-এ বান্ডল করা পেজ file:// অরিজিনে চলে, যা "secure context" নয়:
//   · navigator.share      — WebView-এ থাকেই না
//   · navigator.clipboard  — non-secure context-এ undefined
// ফলে বোতাম দুটো চাপলে নীরবে কিছুই হতো না। তাই দুটোকেই নেটিভ দিকে পাঠানো
// হচ্ছে: শেয়ার → অ্যান্ড্রয়েডের আসল শেয়ার-শিট, কপি → textarea +
// execCommand fallback (WebView-এ নির্ভরযোগ্যভাবে কাজ করে)।

export const WEB_SHARE_JS = `
(function(){
  /* গ্লোবাল "একবারই চালাও" পাহারা ইচ্ছাকৃতভাবে নেই। LocalWebView এই স্ক্রিপ্ট
     পেজ লোডের *আগে* একবার আর *পরে* একবার চালায়। আগে পাহারা ছিল, ফলে প্রথম
     (লোডের আগের) দফাতেই পাহারা বসে যেত, তারপর পেজের নিজের স্ক্রিপ্ট চলে
     window.shareResult আবার নিজের সংস্করণে ফিরিয়ে দিত — আর দ্বিতীয় দফা
     পাহারার কারণে চলত না। ফলাফল: "শেয়ার" চাপলে পেজের আসল কোড চলত, যেটা
     navigator.share না পেয়ে কপি করে ফেলত। প্রতিবার নতুন করে বসানোই সঠিক। */
  function resultText(){
    var el=document.querySelector('#resultContent');
    return el ? (el.innerText||'') : '';
  }

  window.shareResult=function(){
    var t=resultText();
    if(!t) return;
    if(window.ReactNativeWebView){
      window.ReactNativeWebView.postMessage(JSON.stringify({__rn:'shareText',text:t}));
    }
  };

  window.copyToClipboard=function(){
    var t=resultText();
    if(!t) return;
    function ok(){ try{alert('ফলাফল কপি হয়েছে!');}catch(e){} }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(ok).catch(fallback);
    } else { fallback(); }
    function fallback(){
      try{
        var ta=document.createElement('textarea');
        ta.value=t;
        ta.style.cssText='position:fixed;top:-9999px;left:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        ok();
      }catch(e){}
    }
  };
})();
`;

export function handleShareText(msg) {
  const text = String(msg?.text || '').trim();
  if (!text) return;
  // অ্যান্ড্রয়েডের শেয়ার-শিটে খুব লম্বা লেখা কিছু অ্যাপ কেটে দেয় বা
  // ব্যর্থ হয় — তাই একটা যুক্তিসঙ্গত সীমা, সাথে সাইটের লিংক।
  const body = text.length > 1500 ? text.slice(0, 1500) + '…' : text;
  Share.share({ message: body + '\n\n— MyAstrology · myastrology.in' }).catch(() => {});
}
