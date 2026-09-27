#!/usr/bin/env node
/* firestore.rules — আসল Firestore emulator-এ (২০২৬-০৯-২৯)
   চালানো:  npx firebase emulators:exec --only firestore "node scripts/verify-firestore-rules.js"
   (firebase-tools, @firebase/rules-unit-testing, firebase@10 লাগে — রিপোতে নেই, তাই না
   পেলে কীভাবে চালাতে হয় বলে থামে; নীরবে সবুজ নয়)
   প্রমাণ করে: ওয়েবসাইটের আসল তিন পথের (কুণ্ডলী, মিলন, বুকিং) অর্ডার আগের মতোই ঢোকে,
   আর ভুয়াগুলো (অন্যের uid, 'ready' অবস্থা) আটকায়; পড়া/হালনাগাদের পুরনো নিয়ম অক্ষত। */
const fs = require('fs'), path = require('path');
let T;
try { T = require('@firebase/rules-unit-testing'); }
catch (e) { console.log('✗ @firebase/rules-unit-testing নেই — উপরের মন্তব্যে চালানোর নিয়ম'); process.exit(1); }
const { assertSucceeds, assertFails, initializeTestEnvironment } = T;
let bad = 0, n = 0;
async function chk(name, p, want) {
  n++;
  try { await (want ? assertSucceeds(p) : assertFails(p)); console.log('  ✓ ' + name); }
  catch (e) { bad++; console.log('  ✗ ' + name + ' — ' + (want ? 'আটকে গেল' : 'ঢুকে গেল')); }
}
(async () => {
  const env = await initializeTestEnvironment({
    projectId: 'demo-myastrology',
    firestore: { rules: fs.readFileSync(path.resolve(__dirname, '..', process.env.RULES || 'firestore.rules'), 'utf8') },
  });
  const anon = env.unauthenticatedContext().firestore();
  const A = env.authenticatedContext('userA', { email: 'a@x.in', email_verified: true }).firestore();
  const B = env.authenticatedContext('userB', { email: 'b@x.in', email_verified: true }).firestore();
  const ADM = env.authenticatedContext('adm', { email: 'prodyutacharya7@gmail.com', email_verified: true }).firestore();
  const base = { pid: 'pay_ABCDEF123', email: 'c@x.in', ts: 1759100000000 };
  console.log('firestore.rules — orders');
  /* আসল পথ (kundali.html _prmSyncOrderToCloud · match-making.html · booking.html _bkSyncOrderToCloud) */
  await chk('কুণ্ডলী, লগইন ছাড়া (uid:null, status:new)', anon.collection('orders').doc('k1').set({ ...base, source: 'kundali', uid: null, status: 'new', printHtml: '<p>x</p>' }), true);
  await chk('কুণ্ডলী, লগইন করা (নিজের uid)', A.collection('orders').doc('k2').set({ ...base, source: 'kundali', uid: 'userA', status: 'new' }), true);
  await chk('মিলন, লগইন করা (নিজের uid)', A.collection('orders').doc('m1').set({ ...base, source: 'matchmaking', uid: 'userA', status: 'new' }), true);
  await chk('বুকিং (uid/status নেই, ইমেইল ফাঁকা)', anon.collection('orders').doc('b1').set({ ...base, email: '', source: 'booking', pkg: 'booking' }), true);
  /* ভুয়া */
  await chk('লগইন ছাড়া অন্যের uid বসানো', anon.collection('orders').doc('f1').set({ ...base, uid: 'userA', status: 'new' }), false);
  await chk('নিজে লগইন করে অন্যের uid', B.collection('orders').doc('f2').set({ ...base, uid: 'userA', status: 'new' }), false);
  await chk("status:'ready' দিয়ে শুরু", A.collection('orders').doc('f3').set({ ...base, uid: 'userA', status: 'ready' }), false);
  await chk('pid ছাড়া', anon.collection('orders').doc('f4').set({ email: 'c@x.in', ts: 1 }), false);
  /* পুরনো নিয়ম অক্ষত */
  await chk('ক্রেতা নিজের অর্ডার পড়েন', A.collection('orders').doc('k2').get(), true);
  await chk('অন্যের অর্ডার পড়া যায় না', B.collection('orders').doc('k2').get(), false);
  await chk('ক্রেতা কেবল booking বদলান', A.collection('orders').doc('k2').update({ booking: { at: 1 } }), true);
  await chk('ক্রেতা status বদলাতে পারেন না', A.collection('orders').doc('k2').update({ status: 'ready' }), false);
  await chk("অ্যাডমিন 'ready' করেন", ADM.collection('orders').doc('k2').update({ status: 'ready' }), true);
  await env.cleanup();
  console.log('');
  if (bad) { console.log(`❌ ${n}টি পরীক্ষা, ${bad}টি সমস্যা`); process.exit(1); }
  console.log(`✅ ${n}টি পরীক্ষা, 0টি সমস্যা`);
})().catch(e => { console.log('✗ ' + e.message); process.exit(1); });
