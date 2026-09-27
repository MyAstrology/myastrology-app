#!/usr/bin/env node
/* adminVerifyRazorpayPayment — আসল functions/index.js চালিয়ে, নকল Razorpay দিয়ে (২০২৬-০৯-২৯)
   firebase-functions/admin এখানে ইনস্টল নেই, তাই require-এর মুখে ছোট নকল বসানো হয়;
   ফাংশনের নিজের কোড অপরিবর্তিত চলে। প্রতিটি পথ: অ্যাডমিন নয় · ভুল নম্বর · চাবি নেই ·
   Razorpay-তে নেই · টাকা এসেছে · শুধু authorized · ভুল চাবি। */
const Module = require('module'), path = require('path');
class HttpsError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const secrets = {};
const stubs = {
  'firebase-functions/v2/https': { onCall: (opt, fn) => (typeof opt === 'function' ? opt : fn), HttpsError },
  'firebase-functions/params': { defineSecret: n => ({ value: () => secrets[n] || '' }) },
  'firebase-admin': { initializeApp() {}, auth: () => ({}), firestore: Object.assign(() => ({}), { FieldValue: {} }) },
};
const orig = Module._load;
Module._load = function (r, ...a) { return stubs[r] || orig.call(this, r, ...a); };
const fns = require(path.join(__dirname, '..', 'functions', 'index.js'));
Module._load = orig;
const fn = fns.adminVerifyRazorpayPayment;

const ADMIN = { uid: 'a', token: { email: 'prodyutacharya7@gmail.com', email_verified: true } };
let bad = 0, n = 0;
async function expect(name, req, fetchImpl, check) {
  n++; global.fetch = fetchImpl || (async () => { throw new Error('fetch ডাকা উচিত ছিল না'); });
  let out, err; try { out = await fn(req); } catch (e) { err = e; }
  const m = check(out, err);
  if (m) { bad++; console.log('  ✗ ' + name + ' — ' + m + ' | ' + JSON.stringify(out || (err && [err.code, err.message]))); }
  else console.log('  ✓ ' + name);
}
const resp = (status, body) => async (url, opt) => {
  if (!/^https:\/\/api\.razorpay\.com\/v1\/payments\/pay_/.test(url)) throw new Error('ভুল URL ' + url);
  if (!/^Basic /.test(opt.headers.Authorization)) throw new Error('Basic auth নেই');
  return { status, ok: status >= 200 && status < 300, json: async () => body };
};
(async () => {
  console.log('Razorpay যাচাই-ফাংশন');
  await expect('অ্যাডমিন নয় → permission-denied', { auth: { uid: 'x', token: { email: 'x@y.z', email_verified: true } }, data: { pid: 'pay_ABCDEF123' } }, null,
    (o, e) => e && e.code === 'permission-denied' ? '' : 'অ্যাডমিন-পাহারা নেই');
  await expect('ইমেইল যাচাই-না-করা অ্যাডমিন → permission-denied', { auth: { uid: 'x', token: { email: 'prodyutacharya7@gmail.com', email_verified: false } }, data: { pid: 'pay_ABCDEF123' } }, null,
    (o, e) => e && e.code === 'permission-denied' ? '' : 'email_verified দেখা হয় না');
  await expect('ভুল নম্বর → invalid-argument', { auth: ADMIN, data: { pid: 'pay_x/../orders' } }, null,
    (o, e) => e && e.code === 'invalid-argument' ? '' : 'নম্বর যাচাই নেই');
  await expect('চাবি নেই → failed-precondition (নীরব সফল নয়)', { auth: ADMIN, data: { pid: 'pay_ABCDEF123' } }, null,
    (o, e) => e && e.code === 'failed-precondition' ? '' : 'চাবি ছাড়াও চলল');
  secrets.RZP_KEY_ID = 'rzp_live_x'; secrets.RZP_KEY_SECRET = 's';
  await expect('Razorpay-তে নেই (400) → found:false', { auth: ADMIN, data: { pid: 'pay_ABCDEF123' } }, resp(400, { error: {} }),
    o => o && o.found === false ? '' : 'found:false নয়');
  await expect('টাকা এসেছে → captured, ₹৫০১', { auth: ADMIN, data: { pid: 'pay_ABCDEF123' } },
    resp(200, { status: 'captured', captured: true, amount: 50100, currency: 'INR', email: 'a@b.c', method: 'upi' }),
    o => o && o.found && o.captured === true && o.amount === 501 && o.status === 'captured' ? '' : 'মান ভুল');
  await expect('কেবল authorized → captured:false', { auth: ADMIN, data: { pid: 'pay_ABCDEF123' } },
    resp(200, { status: 'authorized', captured: false, amount: 10100, currency: 'INR' }),
    o => o && o.found && o.captured === false && o.amount === 101 ? '' : 'authorized-কে এসেছে ধরল');
  await expect('ভুল চাবি (401) → permission-denied', { auth: ADMIN, data: { pid: 'pay_ABCDEF123' } }, resp(401, {}),
    (o, e) => e && e.code === 'permission-denied' ? '' : '401 ধরা পড়ল না');
  console.log('');
  if (bad) { console.log(`❌ ${n}টি পরীক্ষা, ${bad}টি সমস্যা`); process.exit(1); }
  console.log(`✅ ${n}টি পরীক্ষা, 0টি সমস্যা`);
})();
