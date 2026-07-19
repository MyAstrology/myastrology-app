/* ═══════════════════════════════════════════════════════════════
   MyAstrology — অ্যাপ ↔ ওয়েবসাইট লগইন ব্রিজ
   অ্যাপে (native Firebase Auth সেশন) লগইন করা থাকলে, WebView-এ খোলা
   ওয়েবসাইট পেজেও (kundali/varshaphala/namakaran/match-making/prashna/
   panjika — যেগুলো js/mya-auth.js + js/mya-cloud-sync.js ব্যবহার করে)
   একই Firebase অ্যাকাউন্টে সাইন-ইন হওয়া দরকার, যাতে প্রোফাইল-সেভ/সার্চ
   ক্লাউড-সিঙ্ক (Firestore) WebView থেকেও কাজ করে।

   Firebase JS SDK ID টোকেন দিয়ে সরাসরি অন্য সেশন "হয়ে যাওয়া" যায় না —
   Custom Token লাগে (শুধু Admin SDK দিয়ে তৈরি করা যায়, তাই এই সার্ভার-
   সাইড ফাংশন)। অ্যাপ নিজের বৈধ (signed-in) সেশন দিয়ে এই ফাংশন কল করে,
   ফাংশন সেই একই uid-এর জন্য একটা কাস্টম টোকেন বানিয়ে ফেরত দেয়, অ্যাপ
   সেটা WebView-এ ইনজেক্ট করে signInWithCustomToken() দিয়ে সাইন-ইন করায়।
   ═══════════════════════════════════════════════════════════════ */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

exports.mintWebViewToken = onCall({ region: 'asia-south1' }, async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'সাইন-ইন করা থাকতে হবে।');
  }
  try {
    const token = await admin.auth().createCustomToken(request.auth.uid);
    return { token };
  } catch (err) {
    console.error('mintWebViewToken failed:', err);
    throw new HttpsError('internal', 'টোকেন তৈরি করা যায়নি।');
  }
});
