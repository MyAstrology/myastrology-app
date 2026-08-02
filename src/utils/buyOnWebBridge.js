import { Alert, Linking } from 'react-native';

// অ্যাপের ভিতরে ₹৫১/₹৫০১ পেমেন্ট ইচ্ছাকৃতভাবে বন্ধ — বান্ডলের app-bridge
// Razorpay-র জায়গায় শুধু একটা টোস্ট দেখাত ("পেমেন্টের জন্য myastrology.in
// ওয়েবসাইট ব্যবহার করুন")। কারণ Google Play-র নিয়মে অ্যাপের ভিতরে ডিজিটাল
// পণ্য বেচতে হলে Play Billing লাগে, Razorpay নয়।
//
// কিন্তু ওই টোস্টটা একটা বন্ধ গলি ছিল — ব্যবহারকারী বোতাম চাপতেন, একটা বার্তা
// ভেসে উঠত, তারপর আর কিছুই হতো না; মনে হতো বোতামটা নষ্ট। তাই এখন বোতামটা
// আসল কাজ করে: জন্মতথ্যসহ ওয়েবসাইটের একই পাতায় ব্রাউজারে নিয়ে যায়, যেখানে
// পেমেন্ট বৈধভাবে করা যায় (Play-র নিয়মে অ্যাপের বাইরের কেনাকাটা সম্পূর্ণ ঠিক)।
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
    function ask(){
      var q='';
      try{ q=${page === 'kundali' ? 'kundaliQuery()' : "''"}; }catch(e){}
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({
          __rn:'buyOnWeb', page:${JSON.stringify(page)}, query:q
        }));
      }
    }
    window.openRzp=ask;
    window.proceedToRazorpay=ask;
    /* পঞ্জিকার বার্ষিক PDF (₹২১) বোতামটা openRzp ব্যবহারই করে না — সে নিজে
       new Razorpay(...) বানায়। আর তার আগে একটা পাহারা আছে:
         if(typeof Razorpay==='undefined'){closePdfPromo();_doPrint();return;}
       WebView-এ Razorpay-র চেকআউট চলে না, আর _doPrint() শেষমেশ
       window.print() ডাকে — যেটা WebView-এ কিছুই করে না। ফলে বোতামটা
       চাপলে পপআপ বন্ধ হয়ে যেত, আর কিছুই হতো না — একেবারে মরা বোতাম।
       এখন সেটাও ব্রাউজারে পাঠানো হয়, যেখানে পেমেন্ট সত্যিই কাজ করে। */
    window.pdfPayAndPrint=ask;

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
        if(isBuyMsg(msg)){ ask(); return; }
        return orig.apply(this, arguments);
      };
      w.__myaWrapped=1;
      window[name]=w;
    }
    ['showToast','_mmShowFormError','alert'].forEach(wrap);
  })();
  `;
}

// ফোনের ব্রাউজারে খোলার আগে একবার জানিয়ে দেওয়া — হঠাৎ অ্যাপ ছেড়ে বেরিয়ে
// যাওয়াটা যেন অপ্রত্যাশিত না লাগে।
export function handleBuyOnWeb(msg) {
  const PAGES = {
    'match-making': 'match-making.html',
    'panjika':      'panjika.html',
    'kundali':      'kundali.html',
  };
  const page = PAGES[msg?.page] || 'kundali.html';
  const q = msg?.query ? '?' + msg.query : '';
  const url = SITE + page + q;
  Alert.alert(
    'ওয়েবসাইটে কিনুন',
    msg?.page === 'panjika'
      ? 'বার্ষিক পঞ্জিকা PDF এখন myastrology.in ওয়েবসাইট থেকে সংরক্ষণ করা যাবে।'
      : 'এই রিপোর্টটি এখন myastrology.in ওয়েবসাইট থেকে কেনা যাবে। '
        + 'আপনার দেওয়া তথ্য সেখানে নিয়ে যাওয়া হবে, আবার লিখতে হবে না।',
    [
      { text: 'বাতিল', style: 'cancel' },
      { text: 'ওয়েবসাইটে যান', onPress: () => { Linking.openURL(url).catch(() => {}); } },
    ],
  );
}
