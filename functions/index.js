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

/* ═══════════════════════════════════════════════════════════════
   নিবন্ধিত ব্যবহারকারী — ব্লক/ডিলিট (myastrology.in/users-admin.html
   ও অ্যাপের AdminScreen.js থেকে ব্যবহৃত)
   Firestore rules-এ অ্যাডমিনও অন্য কারো users/{uid} ডকুমেন্ট লিখতে/মুছতে
   পারেন না (শুধু নিজের), তাই এই মিউটেশনগুলো Admin SDK দিয়ে (rules এড়িয়ে)
   এখানে সার্ভার-সাইডে হয় — একই কারণে block করতে Firebase Auth অ্যাকাউন্ট
   disable করতে হয় (Firestore rule দিয়ে কারো login আটকানো যায় না)।
   ═══════════════════════════════════════════════════════════════ */
const ADMIN_EMAILS = ['prodyutacharya7@gmail.com', 'bipulbala64@gmail.com'];

function assertAdmin(request) {
  const email = ((request.auth && request.auth.token && request.auth.token.email) || '').toLowerCase();
  if (!request.auth || !ADMIN_EMAILS.includes(email)) {
    throw new HttpsError('permission-denied', 'অ্যাডমিন অনুমতি নেই।');
  }
}

exports.adminSetUserBlocked = onCall({ region: 'asia-south1' }, async (request) => {
  assertAdmin(request);
  const { uid, blocked } = request.data || {};
  if (!uid) throw new HttpsError('invalid-argument', 'uid প্রয়োজন।');
  if (uid === request.auth.uid) throw new HttpsError('failed-precondition', 'নিজেকে ব্লক করা যাবে না।');
  try {
    await admin.auth().updateUser(uid, { disabled: !!blocked });
    await admin.firestore().collection('users').doc(uid).set({ blocked: !!blocked }, { merge: true });
    return { ok: true };
  } catch (err) {
    console.error('adminSetUserBlocked failed:', err);
    throw new HttpsError('internal', 'ব্যর্থ হয়েছে।');
  }
});

exports.adminDeleteUser = onCall({ region: 'asia-south1' }, async (request) => {
  assertAdmin(request);
  const { uid } = request.data || {};
  if (!uid) throw new HttpsError('invalid-argument', 'uid প্রয়োজন।');
  if (uid === request.auth.uid) throw new HttpsError('failed-precondition', 'নিজেকে ডিলিট করা যাবে না।');
  try {
    await admin.auth().deleteUser(uid).catch((e) => {
      if (e.code !== 'auth/user-not-found') throw e;
    });
    await admin.firestore().collection('users').doc(uid).delete();
    return { ok: true };
  } catch (err) {
    console.error('adminDeleteUser failed:', err);
    throw new HttpsError('internal', 'ব্যর্থ হয়েছে।');
  }
});
