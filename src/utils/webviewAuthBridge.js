/* ═══════════════════════════════════════════════════════════════
   অ্যাপ ↔ ওয়েবসাইট লগইন ব্রিজ — অ্যাপ-সাইড অংশ
   অ্যাপে সাইন-ইন করা থাকলে, WebView-এ খোলা বান্ডল করা ওয়েবসাইট পেজেও
   (kundali/varshaphala/namakaran/match-making/prashna/panjika) একই
   Firebase অ্যাকাউন্টে সাইন-ইন করাতে Cloud Function থেকে একটা
   custom token আনে — সেটা LocalWebView ইনজেক্ট করে
   window.myaAuth.bridgeSignIn(token) কল করে (js/mya-auth.js দেখুন)।
   ═══════════════════════════════════════════════════════════════ */
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase';

const functions = getFunctions(app, 'asia-south1');
const mintWebViewToken = httpsCallable(functions, 'mintWebViewToken');

// প্রতিবার নতুন টোকেন আনে (Cloud Function কল) — signInWithCustomToken()-এর
// জন্য ব্যবহারের পর টোকেনটার আর দরকার নেই (Firebase নিজে সেশন-রিফ্রেশ
// সামলায়), তাই ক্যাশ করার প্রয়োজন নেই।
export async function fetchWebViewAuthToken() {
  try {
    const result = await mintWebViewToken();
    return (result && result.data && result.data.token) || null;
  } catch (e) {
    return null;
  }
}

// ২০ বার (~৬ সেকেন্ড) চেষ্টা করেই থামে — কোনো পেজের বান্ডলে এখনো
// bridgeSignIn না থাকলে (mya-auth.js সিঙ্ক না হওয়া পুরনো বান্ডেল) যেন
// অসীমকাল পোলিং-টাইমার চলতে না থাকে।
export function buildBridgeSignInJS(token) {
  return `(function(){
    var t=${JSON.stringify(token)},n=0;
    function tryBridge(){
      if(window.myaAuth&&window.myaAuth.bridgeSignIn){window.myaAuth.bridgeSignIn(t);return;}
      if(++n>20)return;
      setTimeout(tryBridge,300);
    }
    tryBridge();
  })();true;`;
}

export const BRIDGE_SIGNOUT_JS = `(function(){
  if(window.myaAuth&&window.myaAuth.bridgeSignOut){window.myaAuth.bridgeSignOut();}
})();true;`;
