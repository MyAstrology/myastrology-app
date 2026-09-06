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
  const tok = (request.auth && request.auth.token) || {};
  const email = (tok.email || '').toLowerCase();
  // email_verified-ও দেখা হয়: শুধু ঠিকানা মিলিয়ে দেখা যথেষ্ট নয়। আজ অ্যাপে
  // কেবল Google Sign-In চালু (সেখানে ঠিকানা সবসময় যাচাইকৃত), কিন্তু ভবিষ্যতে
  // ইমেইল/পাসওয়ার্ড বা অন্য কোনো প্রোভাইডার যোগ করলে কেউ অ্যাডমিনের ঠিকানা
  // দিয়ে অ্যাকাউন্ট খুলে (যাচাই না করেই) সরাসরি অ্যাডমিন হয়ে যেতে পারত।
  if (!request.auth || tok.email_verified !== true || !ADMIN_EMAILS.includes(email)) {
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

/* ═══════════════════════════════════════════════════════════════
   Google Play ক্রয়-যাচাই

   কেন সার্ভারে: Play Billing পেমেন্টের পরে ফোনকে একটা purchaseToken দেয়।
   ওটা ফোনেই "ঠিক আছে" ধরে নিলে রুট-করা ফোনে নকল টোকেন বানিয়ে যে কেউ
   ফ্রিতে রিপোর্ট নিতে পারত — অ্যাপের কোড পাঠকের হাতে, সার্ভারের নয়।
   তাই টোকেনটা Google-এর Developer API-তে পাঠিয়ে যাচাই করা হয়, আর
   অধিকারটা (entitlement) Firestore-এ **সার্ভার থেকেই** লেখা হয়;
   ক্লায়েন্ট ওই ঘরে লিখতে পারে না (firestore.rules দেখুন)।

   ⚠️ acknowledge করা বাধ্যতামূলক। Google-এর নিয়মে কেনার **৩ দিনের**
   মধ্যে acknowledge/consume না করলে টাকা স্বয়ংক্রিয়ভাবে ফেরত চলে যায়।
   consume করলে acknowledge-ও হয়ে যায়, আর প্রোডাক্টটা আবার কেনা যায় —
   আমাদের সবগুলোই consumable, কারণ একজন পাঠক একাধিক কুণ্ডলী কিনতে পারেন।

   ⚠️ একই টোকেন দু'বার পাঠিয়ে দুটো অধিকার বানানো যায় না — orderId-কেই
   ডকুমেন্টের নাম করা হয়েছে, তাই দ্বিতীয়বার একই ঘরেই লেখা পড়ে।

   দরকার: Play Console → Setup → API access-এ একটা service account, আর
   তার JSON কী functions-এর সিক্রেটে (PLAY_SA_KEY)। সেটি না থাকলে ফাংশন
   **স্পষ্ট ত্রুটি** দেয় — নীরবে "কেনা হয়েছে" বলে না, কারণ তাতে যাচাই
   বন্ধ থাকলেও সব কেনাই সফল দেখাত।
   ═══════════════════════════════════════════════════════════════ */
const { defineSecret } = require('firebase-functions/params');
const PLAY_SA_KEY = defineSecret('PLAY_SA_KEY');

const ANDROID_PACKAGE = 'in.myastrology.app';

/* আমাদের চাবি ↔ Play-র প্রোডাক্ট আইডি — অ্যাপের src/config/products.js-এর
   হুবহু এক। দুটো সরে গেলে verify-play-billing লাল হয়। */
const PLAY_PRODUCTS = {
  mya_kundali_pdf:      'kundaliPdf',
  mya_match_pdf:        'mmPdf',
  mya_numerology_pdf:   'numerologyPdf',
  mya_varshaphala_pdf:  'varshaphalaPdf',
  mya_panjika_pdf:      'panjikaPdf',
  mya_premium_kundali:  'premiumKundali',
  mya_solution_kundali: 'solutionKundali',
};

exports.verifyPlayPurchase = onCall(
  { region: 'asia-south1', secrets: [PLAY_SA_KEY] },
  async (request) => {
    const uid = request.auth && request.auth.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'সাইন-ইন করা নেই।');

    const productId = String((request.data && request.data.productId) || '');
    const token = String((request.data && request.data.purchaseToken) || '');
    if (!PLAY_PRODUCTS[productId]) throw new HttpsError('invalid-argument', 'অচেনা প্রোডাক্ট।');
    if (!token) throw new HttpsError('invalid-argument', 'purchaseToken নেই।');

    let sa;
    try { sa = JSON.parse(PLAY_SA_KEY.value()); }
    catch (e) { throw new HttpsError('failed-precondition', 'PLAY_SA_KEY বসানো নেই — যাচাই করা যাচ্ছে না।'); }

    const { google } = require('googleapis');
    const auth = new google.auth.JWT(
      sa.client_email, null, sa.private_key,
      ['https://www.googleapis.com/auth/androidpublisher']
    );
    const publisher = google.androidpublisher({ version: 'v3', auth });

    let p;
    try {
      const res = await publisher.purchases.products.get({
        packageName: ANDROID_PACKAGE, productId, token,
      });
      p = res.data;
    } catch (e) {
      /* Google-ই বলছে টোকেনটা অচেনা — নকল বা অন্য অ্যাপের */
      throw new HttpsError('permission-denied', 'ক্রয় যাচাই করা যায়নি।');
    }

    /* purchaseState: 0 = কেনা হয়েছে · 1 = বাতিল · 2 = অপেক্ষমাণ */
    if (p.purchaseState !== 0) throw new HttpsError('failed-precondition', 'ক্রয়টি সম্পূর্ণ হয়নি।');

    const orderId = String(p.orderId || token).replace(/[^\w.-]/g, '_');
    const db = admin.firestore();
    const ref = db.collection('entitlements').doc(uid).collection('items').doc(orderId);

    /* একই অর্ডার দু'বার এলে নতুন কিছু লেখা হয় না — ডকুমেন্টের নামই orderId */
    const already = await ref.get();
    if (!already.exists) {
      await ref.set({
        key: PLAY_PRODUCTS[productId],
        productId,
        orderId: p.orderId || null,
        purchaseTimeMillis: p.purchaseTimeMillis || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'play',
      });
    }

    /* ⚠️ consume — এটাই acknowledge-ও করে। না করলে ৩ দিনে টাকা ফেরত
       চলে যেত, অথচ পাঠক রিপোর্টটা পেয়ে গেছেন। ব্যর্থ হলেও অধিকারটা
       আগেই লেখা হয়ে গেছে, তাই পাঠক ক্ষতিগ্রস্ত হন না। */
    try {
      await publisher.purchases.products.consume({
        packageName: ANDROID_PACKAGE, productId, token,
      });
    } catch (e) { /* ইতিমধ্যেই consume হয়ে থাকলে Google ত্রুটি দেয় — উপেক্ষা */ }

    return { ok: true, key: PLAY_PRODUCTS[productId], orderId };
  }
);
