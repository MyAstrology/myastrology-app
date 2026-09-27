#!/usr/bin/env node
/* Razorpay webhook ও অ্যাডমিন-যাচাই — আসল functions/index.js চালিয়ে (২০২৬-০৯-২৯)
   firebase-functions/admin এখানে নেই, তাই require-এর মুখে ছোট নকল (Firestore = মেমরির Map)।
   webhook: সই মিললে লেখা · না মিললে ৪০০ ও কিছুই লেখা নয় · GET ৪০৫ · ফেরত (refund) ·
   অ্যাডমিন: অ্যাডমিন নয় · ভুল নম্বর · পাওয়া গেছে · চালুর আগের অর্ডার = অজানা · নতুন অর্ডার = অজানা ·
   চালুর পরের অর্ডার, পাওয়া যায়নি = ভুয়া-সন্দেহ। */
const Module = require('module'), path = require('path'), crypto = require('crypto');
class HttpsError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const SECRET = 'whsec_test_123';
const store = new Map();
const docRef = (c, id) => ({
  get: async () => ({ exists: store.has(c + '/' + id), data: () => store.get(c + '/' + id) }),
  set: async (v, o) => { store.set(c + '/' + id, o && o.merge ? { ...(store.get(c + '/' + id) || {}), ...v } : v); },
});
const fsStub = Object.assign(() => ({ collection: c => ({ doc: id => docRef(c, id) }) }), { FieldValue: { serverTimestamp: () => 'TS' } });
const stubs = {
  'firebase-functions/v2/https': { onCall: (o, f) => (typeof o === 'function' ? o : f), onRequest: (o, f) => (typeof o === 'function' ? o : f), HttpsError },
  'firebase-functions/params': { defineSecret: n => ({ value: () => (n === 'RZP_WEBHOOK_SECRET' ? SECRET : '') }) },
  'firebase-admin': { initializeApp() {}, auth: () => ({}), firestore: fsStub },
};
const orig = Module._load;
Module._load = function (r, ...a) { return stubs[r] || orig.call(this, r, ...a); };
const F = require(path.join(__dirname, '..', 'functions', 'index.js'));
Module._load = orig;

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m); } };
function hook(body, sig, method = 'POST') {
  const raw = Buffer.from(JSON.stringify(body));
  const r = { code: 0 };
  const res = { status(c) { r.code = c; return this; }, send() { return this; } };
  const req = { method, rawBody: raw, body, get: h => (h === 'x-razorpay-signature' ? (sig === undefined ? crypto.createHmac('sha256', SECRET).update(raw).digest('hex') : sig) : '') };
  return F.razorpayWebhook(req, res).then(() => r.code);
}
const ADMIN = { uid: 'a', token: { email: 'prodyutacharya7@gmail.com', email_verified: true } };
const verify = async (data, auth = ADMIN) => { try { return await F.adminVerifyRazorpayPayment({ auth, data }); } catch (e) { return { err: e.code }; } };
const cap = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_GOOD123456', status: 'captured', captured: true, amount: 50100, currency: 'INR', email: 'a@b.c' } } } };

(async () => {
  console.log('Razorpay webhook');
  ok(await hook(cap, 'deadbeef') === 400 && !store.has('payments/pay_GOOD123456'), 'ভুল সই → ৪০০, কিছুই লেখা হয়নি');
  ok(await hook(cap, undefined, 'GET') === 405, 'GET → ৪০৫');
  ok(await hook(cap) === 200 && store.get('payments/pay_GOOD123456').amount === 501, 'সই মিলল → ₹৫০১ লেখা হলো');
  ok(!!store.get('payments/_meta').webhookSince, 'প্রথম বার্তায় webhookSince বসল');
  const since = store.get('payments/_meta').webhookSince;
  await hook({ event: 'refund.processed', payload: { refund: { entity: { payment_id: 'pay_GOOD123456', amount: 50100 } } } });
  ok(store.get('payments/pay_GOOD123456').refunded === true && store.get('payments/pay_GOOD123456').captured === true, 'ফেরত → refunded, আগের তথ্য অক্ষত');
  console.log('অ্যাডমিন-যাচাই');
  ok((await verify({ pid: 'pay_GOOD123456' }, { uid: 'x', token: { email: 'x@y.z', email_verified: true } })).err === 'permission-denied', 'অ্যাডমিন নয় → permission-denied');
  ok((await verify({ pid: 'pay_x/../y' })).err === 'invalid-argument', 'ভুল নম্বর → invalid-argument');
  const g = await verify({ pid: 'pay_GOOD123456', ts: since + 1 });
  ok(g.found === true && g.captured === true && g.amount === 501 && g.refunded === true, 'পাওয়া গেছে → ₹৫০১, ফেরত-চিহ্ন সহ');
  ok((await verify({ pid: 'pay_OLD1234567', ts: since - 86400000 })).found === null, 'webhook চালুর আগের অর্ডার → অজানা (ভুয়া নয়)');
  ok((await verify({ pid: 'pay_NEW1234567', ts: Date.now() })).found === null, 'একদম নতুন অর্ডার → অজানা (বার্তা পথে থাকতে পারে)');
  store.set('payments/_meta', { webhookSince: Date.now() - 2 * 3600000 });   /* চালু দু'ঘণ্টা আগে */
  ok((await verify({ pid: 'pay_FAKE123456', ts: Date.now() - 3600000 })).found === false, 'চালুর পরের পুরনো অর্ডার, পাওয়া যায়নি → ভুয়া-সন্দেহ');
  console.log('');
  if (bad) { console.log(`❌ ${n}টি পরীক্ষা, ${bad}টি সমস্যা`); process.exit(1); }
  console.log(`✅ ${n}টি পরীক্ষা, 0টি সমস্যা`);
})();
