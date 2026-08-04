/* ═══════════════════════════════════════════════════════════════
   সেভ করা প্রোফাইল — অ্যাপ ↔ WebView সেতু

   সমস্যা (২০২৬-০৮-০৪, মালিকের রিপোর্ট): ওয়েবসাইটে লগইন করে কুণ্ডলী বা
   যোটকের প্রোফাইল সেভ করলে সেগুলো অ্যাপে দেখা যেত না — অ্যাপে লগইন করা
   থাকলেও "এখনো কোনো প্রোফাইল সেভ নেই" দেখাত।

   কেন: প্রোফাইল থাকে Firestore-এ users/{uid}/data/kundaliProfiles-এ, আর
   পাতার ভিতরের কোড (js/mya-cloud-sync.js) সেটা পড়ে কেবল তখনই যখন পাতাটা
   *নিজে* Firebase-এ সাইন-ইন। অ্যাপের WebView-এ সেই সাইন-ইন হয় একটা
   Cloud Function (mintWebViewToken) থেকে custom token এনে — সেটি ব্যর্থ
   হলে (ফাংশন deploy না থাকা, নেটওয়ার্ক, CDN থেকে Firebase SDK না আসা)
   পুরো ব্যাপারটা নীরবে থেমে যায়, ব্যবহারকারী কিছু জানতেই পারেন না।

   সমাধান: অ্যাপের নিজের Firebase (নেটিভ, ইতিমধ্যেই সাইন-ইন) দিয়ে সরাসরি
   ওই ডকটাই পড়া ও লেখা, আর তালিকাটা WebView-এর localStorage-এ বসিয়ে দেওয়া।
   এতে Cloud Function, CDN বা পাতার নিজের সাইন-ইন — কোনোটাই আর লাগে না।
   পুরনো টোকেন-সেতুও থাকল; দুটো একে অন্যের পরিপূরক, সংঘাত নেই (দুজনেই
   একই id ধরে merge করে, নতুনতর savedAt জেতে)।
   ═══════════════════════════════════════════════════════════════ */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const MAX_PROFILES = 20;   // js/mya-profiles.js-এর MAX_PROFILES-এর সাথে মিল

function ref(uid) {
  return doc(db, 'users', uid, 'data', 'kundaliProfiles');
}

export async function pullProfiles(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(ref(uid));
    const list = snap.exists() ? snap.data().list : null;
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return null;   // নেটওয়ার্ক/অনুমতি — নীরবে বাদ, স্থানীয় তালিকা অক্ষত থাকে
  }
}

export async function pushProfiles(uid, list) {
  if (!uid || !Array.isArray(list)) return false;
  try {
    await setDoc(ref(uid), { list: list.slice(0, MAX_PROFILES),
                             updatedAt: new Date().toISOString() });
    return true;
  } catch (_) {
    return false;
  }
}

/* ক্লাউডের তালিকা WebView-এ বসানোর স্ক্রিপ্ট।
   পাতার নিজের তালিকার সঙ্গে মিলিয়ে (id ধরে, নতুনতর savedAt জেতে) — তাই
   অফলাইনে অ্যাপে সেভ করা প্রোফাইলও হারায় না, আবার ওয়েবসাইটে সেভ করাগুলোও
   চলে আসে। মিলিয়ে নেওয়া তালিকাটা ফেরত পাঠানো হয় যাতে ক্লাউডেও ওঠে। */
export function buildProfileSyncJS(cloudList) {
  return `(function(){
  var KEY='mya_profiles', MAX=${MAX_PROFILES};
  var cloud=${JSON.stringify(Array.isArray(cloudList) ? cloudList : [])};
  function read(){try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}
  var local=read(), map={};
  cloud.concat(local).forEach(function(p){
    if(!p||!p.id) return;
    var ex=map[p.id];
    if(!ex||String(p.savedAt||'')>String(ex.savedAt||'')) map[p.id]=p;
  });
  var merged=Object.keys(map).map(function(k){return map[k];});
  merged.sort(function(a,b){return String(a.savedAt||'')<String(b.savedAt||'')?1:-1;});
  merged=merged.slice(0,MAX);
  try{localStorage.setItem(KEY,JSON.stringify(merged));}catch(e){}
  /* খোলা থাকা তালিকা-মোডাল সঙ্গে সঙ্গে নতুন করে আঁকতে */
  try{
    if(window._myaProfilesSetAll) window._myaProfilesSetAll(merged);
    else document.dispatchEvent(new Event('mya:profiles-changed'));
  }catch(e){}
  ${POST_BACK_JS}
})();true;`;
}

/* পাতায় প্রোফাইল যোগ/মুছলে সঙ্গে সঙ্গে নেটিভ দিকে পাঠানো — নেটিভ সেটা
   Firestore-এ লেখে। mya-profiles.js প্রতিটি বদলে 'mya:profiles-changed'
   ইভেন্ট ছাড়ে, তাই আলাদা করে হুক বসানোর দরকার নেই। */
const POST_BACK_JS = `
  try{
    var send=function(){
      try{
        var l=JSON.parse(localStorage.getItem('mya_profiles')||'[]');
        window.ReactNativeWebView.postMessage(JSON.stringify({__rn:'profiles',list:l}));
      }catch(e){}
    };
    send();
    if(!window.__myaProfWatch){
      window.__myaProfWatch=1;
      document.addEventListener('mya:profiles-changed',function(){setTimeout(send,50);});
    }
  }catch(e){}`;

/* লগইন ছাড়া অবস্থাতেও পাতার বদল শোনা দরকার নয় — তখন ক্লাউডে লেখার কিছু
   নেই। কিন্তু লগআউট করলে অ্যাপে আগের ইউজারের তালিকা রয়ে যাওয়া উচিত নয়। */
export const PROFILE_CLEAR_JS = `(function(){
  try{ localStorage.removeItem('mya_profiles');
       if(window._myaProfilesSetAll) window._myaProfilesSetAll([]);
  }catch(e){}
})();true;`;
