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
    window.openRzp=function(){
      var q='';
      try{ q=${page === 'kundali' ? 'kundaliQuery()' : "''"}; }catch(e){}
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({
          __rn:'buyOnWeb', page:${JSON.stringify(page)}, query:q
        }));
      }
    };
    window.proceedToRazorpay=window.openRzp;
  })();
  `;
}

// ফোনের ব্রাউজারে খোলার আগে একবার জানিয়ে দেওয়া — হঠাৎ অ্যাপ ছেড়ে বেরিয়ে
// যাওয়াটা যেন অপ্রত্যাশিত না লাগে।
export function handleBuyOnWeb(msg) {
  const page = msg?.page === 'match-making' ? 'match-making.html' : 'kundali.html';
  const q = msg?.query ? '?' + msg.query : '';
  const url = SITE + page + q;
  Alert.alert(
    'ওয়েবসাইটে কিনুন',
    'এই রিপোর্টটি এখন myastrology.in ওয়েবসাইট থেকে কেনা যাবে। '
    + 'আপনার দেওয়া তথ্য সেখানে নিয়ে যাওয়া হবে, আবার লিখতে হবে না।',
    [
      { text: 'বাতিল', style: 'cancel' },
      { text: 'ওয়েবসাইটে যান', onPress: () => { Linking.openURL(url).catch(() => {}); } },
    ],
  );
}
