/*  Google Play Billing — অ্যাপের দিক
 *  ═══════════════════════════════════════════════════════════════
 *  কেন Play Billing, Razorpay নয়: Google-এর নিয়মে অ্যাপের **ভিতরে**
 *  ডিজিটাল পণ্য (PDF রিপোর্ট) বেচতে হলে Play Billing বাধ্যতামূলক;
 *  Razorpay ব্যবহার করলে অ্যাপ সাসপেন্ড হতে পারে।
 *
 *  ⚠️ লাইব্রেরিটা **অলসভাবে** লোড করা হয় (require ভিতরে, try/catch-এ)।
 *  কারণ: react-native-iap একটা native মডিউল — যতক্ষণ না নতুন dev-client
 *  বিল্ড হচ্ছে ততক্ষণ ওটা বান্ডলে নেই। উপরে static import দিলে অ্যাপটাই
 *  চালু হতো না। নেই মানে isAvailable() false — আর তখন অ্যাপ **আগের মতোই**
 *  ওয়েবসাইটে পাঠায় (buyOnWebBridge)। অর্থাৎ এই ফাইল যোগ করায় আজকের
 *  আচরণের কিছুই বদলায়নি।
 *
 *  ⚠️ পেমেন্ট সফল হলেই "কেনা হয়েছে" ধরা হয় না — purchaseToken সার্ভারে
 *  (verifyPlayPurchase) পাঠিয়ে Google-এর কাছে যাচাই করানো হয়, আর অধিকার
 *  লেখে সার্ভারই। ফোনের কথায় বিশ্বাস করলে রুট-করা ফোনে নকল ক্রয় বানানো
 *  যেত। যাচাই ব্যর্থ হলে রিপোর্ট খোলা হয় না।
 */
import { Platform } from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase';
import { PRODUCTS, PRODUCT_IDS, KEY_BY_ID } from '../config/products';

let _iap = null;        // লাইব্রেরি (থাকলে)
let _tried = false;     // একবারই খোঁজা হয়
let _connected = false;

function iap() {
  if (_tried) return _iap;
  _tried = true;
  try { _iap = require('react-native-iap'); } catch (e) { _iap = null; }
  return _iap;
}

/** লাইব্রেরিটা এই বিল্ডে আছে কি — না থাকলে ডাকা জায়গা ওয়েবসাইটে পাঠাবে */
export function isAvailable() {
  return Platform.OS === 'android' && !!iap();
}

async function connect() {
  const m = iap();
  if (!m) throw new Error('billing-unavailable');
  if (!_connected) {
    await m.initConnection();
    _connected = true;
    /* ⚠️ আগের কোনো ক্রয় যদি যাচাইয়ের আগেই অ্যাপ বন্ধ হয়ে গিয়ে আটকে
       থাকে, সেটা এখানে শেষ করা হয় — নইলে পাঠক টাকা দিয়েছেন অথচ কিছুই
       পাননি, আর Google ৩ দিনে টাকা ফেরত দিয়ে দিত। */
    try { await flushPending(); } catch (e) {}
  }
  return m;
}

const fns = getFunctions(app, 'asia-south1');
const verify = httpsCallable(fns, 'verifyPlayPurchase');

/** Play-র নিজের দাম ও মুদ্রা — অ্যাপ কখনো নিজের ₹ সংখ্যা দেখায় না,
 *  কারণ পাঠক অন্য দেশে অন্য মুদ্রায় দেখবেন। */
export async function loadPrices() {
  const m = await connect();
  const list = await m.getProducts({ skus: PRODUCT_IDS });
  const out = {};
  for (const p of list || []) {
    const key = KEY_BY_ID[p.productId];
    if (key) out[key] = { price: p.localizedPrice, currency: p.currency, title: p.title };
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

  const purchase = await m.requestPurchase({ sku: item.id, skus: [item.id] });
  const p = Array.isArray(purchase) ? purchase[0] : purchase;
  if (!p || !p.purchaseToken) throw new Error('no-token');

  const res = await verify({ productId: item.id, purchaseToken: p.purchaseToken });
  if (!res || !res.data || !res.data.ok) throw new Error('verify-failed');

  /* সার্ভার Google-এর কাছে consume করেছে; ফোনের দিকের লেনদেনটাও শেষ
     করতে হয়, নইলে একই ক্রয় বারবার ফিরে আসত। */
  try { await m.finishTransaction({ purchase: p, isConsumable: true }); } catch (e) {}

  return res.data;
}

/** অ্যাপ বন্ধ হয়ে যাওয়া বা নেট কেটে যাওয়ায় আটকে থাকা ক্রয় শেষ করা */
export async function flushPending() {
  const m = iap();
  if (!m) return 0;
  let n = 0;
  const pend = await m.getAvailablePurchases();
  for (const p of pend || []) {
    const key = KEY_BY_ID[p.productId];
    if (!key || !p.purchaseToken) continue;
    try {
      const res = await verify({ productId: p.productId, purchaseToken: p.purchaseToken });
      if (res && res.data && res.data.ok) {
        try { await m.finishTransaction({ purchase: p, isConsumable: true }); } catch (e) {}
        n++;
      }
    } catch (e) { /* পরে আবার চেষ্টা হবে — এখানে চুপ করে থাকা নিরাপদ */ }
  }
  return n;
}

export async function disconnect() {
  const m = iap();
  if (m && _connected) { try { await m.endConnection(); } catch (e) {} _connected = false; }
}
