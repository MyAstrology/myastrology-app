/*  Google Play Billing — অ্যাপের দিক
 *  ═══════════════════════════════════════════════════════════════
 *  কেন Play Billing, Razorpay নয়: Google-এর নিয়মে অ্যাপের **ভিতরে**
 *  ডিজিটাল পণ্য (PDF রিপোর্ট) বেচতে হলে Play Billing বাধ্যতামূলক;
 *  Razorpay ব্যবহার করলে অ্যাপ সাসপেন্ড হতে পারে।
 *
 *  ⚠️ লাইব্রেরিটা **অলসভাবে** লোড করা হয় (require ভিতরে, try/catch-এ)।
 *  কারণ: react-native-iap একটা native মডিউল — যতক্ষণ না নতুন dev-client
 *  বিল্ড হচ্ছে ততক্ষণ ওটা বান্ডলে নেই। উপরে static import দিলে অ্যাপটাই
 *  চালু হতো না। নেই মানে isAvailable() false — আর তখন অ্যাপ **আগের মতোই**
 *  ওয়েবসাইটে পাঠায় (buyOnWebBridge)।
 *
 *  ⚠️ পেমেন্ট সফল হলেই "কেনা হয়েছে" ধরা হয় না — purchaseToken সার্ভারে
 *  (verifyPlayPurchase) পাঠিয়ে Google-এর কাছে যাচাই করানো হয়, আর অধিকার
 *  লেখে সার্ভারই। ফোনের কথায় বিশ্বাস করলে রুট-করা ফোনে নকল ক্রয় বানানো
 *  যেত। যাচাই ব্যর্থ হলে রিপোর্ট খোলা হয় না।
 *
 *  ⛔ ২০২৬-০৯-১৫: এই ফাইলটা লেখা ছিল react-native-iap ১২/১৩-এর API ধরে,
 *  অথচ বিল্ডে আছে **১৬.৫.১**, যেটা পুরো নতুন (Nitro) ভিত্তির উপর। তিনটে
 *  জায়গায় অমিল ছিল, আর তিনটেই নীরবে "কেনা সম্পূর্ণ হলো না" দেখাত:
 *    ১. getProducts() আর নেই — এখন fetchProducts({skus, type})
 *    ২. requestPurchase() এখন {request:{google:{skus}}, type:'in-app'}
 *    ৩. ⛔ requestPurchase() **ফলটা ফেরত দেয় না** — ফল আসে
 *       purchaseUpdatedListener / purchaseErrorListener দিয়ে। আগের কোড
 *       ফেরত-মান থেকে purchaseToken খুঁজত, তাই টাকা কাটা হলেও ব্যর্থ বলত।
 *  আর লাইব্রেরিটার peer dependency `react-native-nitro-modules` package.json-এ
 *  ছিলই না — সেটা ছাড়া native অংশটাই বিল্ডে ঢোকে না, তাই initConnection()
 *  ব্যর্থ হতো। (সেটাও যোগ করা হয়েছে — নতুন বিল্ড লাগবে।)
 */
import { Platform } from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase';
import { PRODUCTS, PRODUCT_IDS, KEY_BY_ID } from '../config/products';
import { addPending } from './billingPending';

let _iap = null;        // লাইব্রেরি (থাকলে)
let _tried = false;     // একবারই খোঁজা হয়
let _connected = false;
let _subUpd = null;     // ক্রয় সফল হলে যে শোনে
let _subErr = null;     // ক্রয় ব্যর্থ হলে যে শোনে
let _waiter = null;     // এই মুহূর্তে কোন ক্রয়ের ফলের জন্য অপেক্ষা

function iap() {
  if (_tried) return _iap;
  _tried = true;
  try { _iap = require('react-native-iap'); } catch (e) { _iap = null; }
  return _iap;
}

/** লাইব্রেরিটা এই বিল্ডে আছে কি — না থাকলে ডাকা জায়গা ওয়েবসাইটে পাঠাবে */
export function isAvailable() {
  const m = iap();
  return Platform.OS === 'android' && !!m && typeof m.requestPurchase === 'function';
}

/* ক্রয়ের ফল আসে event হিসেবে, তাই শ্রোতা দুটো একবারই বসানো হয় আর
   _waiter দিয়ে চলতি ক্রয়ের সঙ্গে মিলিয়ে নেওয়া হয়। ⚠️ প্রতি কেনায়
   নতুন শ্রোতা বসালে একই ক্রয় বহুবার গোনা হতো। */
function listen(m) {
  if (_subUpd) return;
  try {
    _subUpd = m.purchaseUpdatedListener((p) => {
      const w = _waiter;
      if (!w) return;                       // আটকে থাকা পুরনো ক্রয় — flushPending দেখবে
      if (p && p.productId && p.productId !== w.productId) return;
      _waiter = null; w.done(null, p);
    });
    _subErr = m.purchaseErrorListener((e) => {
      const w = _waiter;
      if (!w) return;
      _waiter = null;
      /* ⚠️ আগে কেবল e.code রাখা হতো, তাই পাঠক ও আমরা দু'জনেই কেবল
         "[developer-error]" দেখতাম — Play আসলে **কেন** না বলল সেটা
         debugMessage-এ থাকে, আর responseCode-এ Play-র নিজের সংখ্যা।
         দুটো হারিয়ে ফেলা মানে প্রতিটি ব্যর্থ ক্রয়ের তদন্ত শূন্য থেকে শুরু। */
      const code = String((e && e.code) || '');
      const dbg  = String((e && (e.debugMessage || e.message)) || '');
      const rc   = (e && e.responseCode != null) ? ('#' + e.responseCode) : '';
      const err = new Error([code, rc, dbg].filter(Boolean).join(' · ') || 'purchase-error');
      err.code = code;
      err.debugMessage = dbg;
      err.responseCode = (e && e.responseCode != null) ? e.responseCode : null;
      w.done(err, null);
    });
  } catch (e) { /* শ্রোতা বসাতে না পারলে নিচের timeout-ই শেষ ভরসা */ }
}

let _warm = null;        // শেষ সফল fetchProducts-এর ফল (দামের জন্যও কাজে লাগে)

/*  ⛔ ২০২৬-০৯-২২ — `initConnection()` true ফেরত দিলেও Play-র বিলিং
 *  ক্লায়েন্ট তখনো তৈরি না-ও থাকতে পারে; তখন সঙ্গে সঙ্গে fetchProducts()
 *  ডাকলে "Billing client not ready" আসে। আমার আগের সংশোধনে ওই ভুলেই
 *  কেনা **থেমে যেত** (মালিকের স্ক্রিনশট: product-fetch-failed ·
 *  basic_numerology_report · Billing client not ready) — অর্থাৎ যে
 *  পাহারাটা [developer-error] আটকাতে বসিয়েছিলাম, সেটাই নতুন দরজা বন্ধ
 *  করে দিয়েছিল।
 *
 *  তাই এখন একবার নয়, ধৈর্য ধরে কয়েকবার — আর "তৈরি নয়" বললে সংযোগটা
 *  ভেঙে আবার জোড়া হয়। এক নিঃশ্বাসে হার মানা আর নিঃশব্দে এড়িয়ে যাওয়া,
 *  দুটোই এখানে ভুল হতো। */
async function fetchSkus(m, skus) {
  const notReady = e => /not ready|not prepared|not initialized|not connected/i.test(
    String((e && (e.message || e.code)) || ''));
  let last = null;
  for (let i = 0; i < 4; i++) {
    try {
      const list = await m.fetchProducts({ skus, type: 'in-app' });
      if (list && list.length) { _warm = list; return list; }
      last = new Error('product-unavailable');
    } catch (e) {
      last = e;
      if (notReady(e)) {
        _connected = false;
        try { await m.initConnection(); _connected = true; } catch (e2) {}
      }
    }
    await new Promise(r => setTimeout(r, 500 + 500 * i));
  }
  throw last || new Error('product-fetch-failed');
}

async function connect() {
  const m = iap();
  if (!m) throw new Error('billing-unavailable');
  if (!_connected) {
    const ok = await m.initConnection();
    /* ⚠️ initConnection() এখন true/false ফেরত দেয়। false মানে Play-র
       সঙ্গে কথা বলাই গেল না — প্রায় সবসময় অ্যাপটা Play থেকে ইনস্টল
       করা হয়নি (সাইডলোড), বা রিলিজটা এখনো প্রকাশিত নয়। */
    if (ok === false) throw new Error('not-prepared');
    _connected = true;
    listen(m);
    /* ⚠️ তালিকাটা এখানেই একবার তুলে রাখা হয় — পাঠক বোতাম চাপার আগেই,
       যাতে চাপার মুহূর্তে অপেক্ষা করতে না হয়। ব্যর্থ হলে চুপ: buy()
       আবার চেষ্টা করবে, আর তখন ব্যর্থ হলে সেটা জোরেই বলবে। */
    try { await fetchSkus(m, PRODUCT_IDS); } catch (e) {}
    /* ⚠️ আগের কোনো ক্রয় যদি যাচাইয়ের আগেই অ্যাপ বন্ধ হয়ে গিয়ে আটকে
       থাকে, সেটা এখানে শেষ করা হয় — নইলে পাঠক টাকা দিয়েছেন অথচ কিছুই
       পাননি, আর Google ৩ দিনে টাকা ফেরত দিয়ে দিত। */
    try { await flushPending(); } catch (e) {}
  }
  return m;
}

/** Play-র সঙ্গে যোগাযোগ চালু করা ও আটকে থাকা ক্রয় তুলে আনা।
 *
 *  ⛔ কেনার **আগে** এটা ডাকতেই হয়। কারণ flushPending() চলে connect()-এর
 *  ভিতরে, আর connect() চলে buy()-এর ভিতরে — অর্থাৎ আগের অসম্পূর্ণ ক্রয়টা
 *  requestPurchase()-এর *পরে* উদ্ধার হতো। অ্যাপ নতুন করে চালু হওয়ার পর
 *  প্রথম ক্রয়ে তাই পাঠকের **দু'বার** টাকা কাটত: পুরনোটা উদ্ধার হয়ে পাওনা
 *  হিসেবে জমা পড়ত, আর নতুন ক্রয়ও হয়ে যেত। ব্যর্থ হলে চুপ — তখন
 *  স্বাভাবিক কেনার পথেই যাওয়া হয়। */
export async function ensureReady() {
  try { await connect(); } catch (e) {}
}

const fns = getFunctions(app, 'asia-south1');
const verify = httpsCallable(fns, 'verifyPlayPurchase');

/** Play-র নিজের দাম ও মুদ্রা — অ্যাপ কখনো নিজের ₹ সংখ্যা দেখায় না,
 *  কারণ পাঠক অন্য দেশে অন্য মুদ্রায় দেখবেন। */
export async function loadPrices() {
  const m = await connect();
  const list = (_warm && _warm.length) ? _warm : await fetchSkus(m, PRODUCT_IDS);
  const out = {};
  for (const p of list || []) {
    const key = KEY_BY_ID[p.id || p.productId];
    if (key) out[key] = { price: p.displayPrice, currency: p.currency, title: p.title };
  }
  return out;
}

/**
 * একটা জিনিস কেনা।
 * @param key  PRODUCTS-এর চাবি ('kundaliPdf' ইত্যাদি) — ওয়েবসাইটের
 *             pricing/config-এর চাবির হুবহু এক।
 * @returns {ok:true, key} — সার্ভার যাচাই করার **পরে**
 */
export async function buy(key) {
  const item = PRODUCTS[key];
  if (!item) throw new Error('unknown-product:' + key);
  const m = await connect();
  listen(m);

  /* ⛔ Play-র launchBillingFlow() একটা ProductDetails ছাড়া চলে না,
     আর সেটা তৈরি হয় কেবল fetchProducts()-এ। লাইব্রেরির নিজের
     উদাহরণেও ক্রমটা connect → fetchProducts → requestPurchase।
     আগে এই ধাপটা বাদ ছিল — আর type:'in-app' পাঠানোর কারণে
     লাইব্রেরির নিজের উদ্ধার-পথটিও চলত না (HybridRnIap.kt-এ fetch
     হয় কেবল type না পাঠালে)।

     নীরবে এড়ানো হয় না — Play যে জিনিসটা ক্রয় করার আগে বর্ণনাই
     দিতে পারল না, সেটা বিক্রিও করতে পারত না। এখানে থামা নিরাপদ,
     কারণ এখনও কোনো টাকা লেনদেন শুরু হয়নি। */
  /* connect()-এ তালিকা গরম হয়ে থাকলে এটা সঙ্গে সঙ্গেই ফেরে */
  const already = (_warm || []).some(x => (x && (x.id || x.productId)) === item.id);
  if (!already) {
    try {
      await fetchSkus(m, [item.id]);
    } catch (e) {
      const why = String((e && (e.message || e.code)) || e);
      const err = new Error('product-fetch-failed · ' + item.id + ' · ' + why);
      err.code = 'product-fetch-failed';
      throw err;
    }
  }

  /* ⚠️ ফল আসে শ্রোতার হাত ধরে, তাই এখানে একটা প্রতিশ্রুতি বসিয়ে অপেক্ষা
     করা হয়। timeout না থাকলে পাঠক Play-র পর্দা বন্ধ করে দিলে বোতামটা
     চিরকাল ঘুরত। ৫ মিনিট — ধীর নেটে UPI-র জন্যও যথেষ্ট। */
  const p = await new Promise((resolve, reject) => {
    let over = false;
    const timer = setTimeout(() => {
      if (over) return;
      over = true; _waiter = null;
      reject(new Error('purchase-timeout'));
    }, 5 * 60 * 1000);
    _waiter = {
      productId: item.id,
      done: (err, purchase) => {
        if (over) return;
        over = true; clearTimeout(timer);
        if (err) reject(err); else resolve(purchase);
      },
    };
    Promise.resolve()
      .then(() => m.requestPurchase({ request: { google: { skus: [item.id] } }, type: 'in-app' }))
      .catch((e) => {
        /* dispatch-ই হলো না (অচেনা প্রোডাক্ট, লাইসেন্স নেই, Play বন্ধ) */
        if (over) return;
        over = true; clearTimeout(timer); _waiter = null;
        reject(e);
      });
  });

  if (!p || !p.purchaseToken) throw new Error('no-token');

  const res = await verify({ productId: item.id, purchaseToken: p.purchaseToken });
  if (!res || !res.data || !res.data.ok) throw new Error('verify-failed');

  /* সার্ভার Google-এর কাছে consume করেছে; ফোনের দিকের লেনদেনটাও শেষ
     করতে হয়, নইলে একই ক্রয় বারবার ফিরে আসত। */
  try { await m.finishTransaction({ purchase: p, isConsumable: true }); } catch (e) {}

  return res.data;
}

/** অ্যাপ বন্ধ হয়ে যাওয়া বা নেট কেটে যাওয়ায় আটকে থাকা ক্রয় শেষ করা।
 *
 *  ⚠️ যাচাই হয়ে গেলেই কাজ শেষ নয় — টাকাটা কাটা হয়েছিল কোনো একটা
 *  রিপোর্টের জন্য, আর সেই রিপোর্টটা পাঠক এখনো পাননি। consume করা
 *  বাধ্যতামূলক (নইলে Google ৩ দিনে টাকা ফেরত দেয়), অর্থাৎ Play-র দিকে
 *  ক্রয়টা আর পড়ে থাকে না। তাই এখানেই "ডেলিভারি বাকি" চিহ্ন বসিয়ে
 *  রাখা হয় — পাঠক পরের বার ওই বোতামে চাপলে নতুন করে টাকা লাগে না। */
export async function flushPending() {
  const m = iap();
  if (!m) return [];
  const done = [];
  const pend = await m.getAvailablePurchases();
  for (const p of pend || []) {
    const key = KEY_BY_ID[p.productId];
    if (!key || !p.purchaseToken) continue;
    try {
      const res = await verify({ productId: p.productId, purchaseToken: p.purchaseToken });
      if (res && res.data && res.data.ok) {
        await addPending(key);
        try { await m.finishTransaction({ purchase: p, isConsumable: true }); } catch (e) {}
        done.push(key);
      }
    } catch (e) { /* পরে আবার চেষ্টা হবে — এখানে চুপ করে থাকা নিরাপদ */ }
  }
  return done;
}

export async function disconnect() {
  const m = iap();
  if (m && _connected) {
    try { if (_subUpd) _subUpd.remove(); } catch (e) {}
    try { if (_subErr) _subErr.remove(); } catch (e) {}
    _subUpd = _subErr = _waiter = null;
    try { await m.endConnection(); } catch (e) {}
    _connected = false;
  }
}
