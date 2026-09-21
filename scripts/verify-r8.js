#!/usr/bin/env node
// R8 প্লাগিনের রূপান্তরটা সত্যিকারের টেমপ্লেট-ফাইলে কাজ করে কি না।
//
// ⛔ কেন এই পরীক্ষাটা আগে সবুজ থেকেও বিল্ড ভেঙেছিল (২০২৬-০৯-২১):
// সে **আমার লেখা তিনটে আকৃতি** পরীক্ষা করত, টেমপ্লেটের আসল লাইনটা নয়।
// SDK 54 আসলে লেখে `minifyEnabled enableMinifyInReleaseBuilds`, যেটা ওই
// তিনটের একটাও নয় — ৭/৭ সবুজ, আর EAS-এ prebuild ব্যর্থ।
// তাই এখন আসল `expo-template-bare-minimum@54` থেকে নেওয়া
// `plugins/__fixtures__/sdk54-app-build.gradle` ফাইলটার উপরেই চালানো হয়।
// এই রিপোর নিয়ম: **যা সত্যিই চলে তার সঙ্গে তুলনা করুন, যা ধরে নিয়েছেন
// তার সঙ্গে নয়।**
const fs = require('fs');
const path = require('path');
const { applyR8 } = require('../plugins/r8-transform');

let bad = 0, n = 0;
const fail = (m) => { console.log('✗ ' + m); bad++; };
const ok = (m) => console.log('✓ ' + m);

// ① আসল টেমপ্লেট — ঠিক একটা লাইন বদলাতে হবে, আর সেটা minifyEnabled-এরই
const fx = path.join(__dirname, '..', 'plugins', '__fixtures__', 'sdk54-app-build.gradle');
n++;
try {
  const src = fs.readFileSync(fx, 'utf8');
  const out = applyR8(src);
  const a = src.split('\n'), b = out.split('\n');
  const diff = b.map((l, i) => [i + 1, a[i], l]).filter(([, x, y]) => x !== y);
  if (diff.length !== 1) fail('আসল টেমপ্লেট: ' + diff.length + 'টি লাইন বদলেছে, ১টি হওয়ার কথা');
  else if (!/^\s*minifyEnabled\s+true\s*$/.test(diff[0][2])) fail('আসল টেমপ্লেট: বদলানো লাইনটা ' + JSON.stringify(diff[0][2]));
  else if (!/^\s*minifyEnabled\s/.test(diff[0][1])) fail('আসল টেমপ্লেট: ভুল লাইন বদলানো হয়েছে — ' + JSON.stringify(diff[0][1]));
  else ok('আসল SDK 54 টেমপ্লেট: ' + JSON.stringify(diff[0][1].trim()) + ' → minifyEnabled true');
  // ⚠️ shrinkResources ঠিক পাশের লাইনেই বসে, আর ওটাই একবার বিল্ড ভেঙেছিল
  n++;
  if (out.includes('shrinkResources enableShrinkResources.toBoolean()')) ok('shrinkResources অক্ষত');
  else fail('shrinkResources বদলে গেছে — ২০২৬-০৮-০৯-এ এটাই বিল্ড ভেঙেছিল');
  n++;
  if (out.includes('proguardFiles getDefaultProguardFile')) ok('proguardFiles অক্ষত');
  else fail('proguardFiles নষ্ট হয়েছে');
} catch (e) { fail('আসল টেমপ্লেট: ' + e.message); n += 2; }

// ② পুরনো/ভবিষ্যতের আকৃতিগুলোও চলা উচিত (বাড়তি সুরক্ষা, আসল প্রমাণ নয়)
const HEAD = 'android {\n  buildTypes {\n    release {\n      shrinkResources false\n      ';
const TAIL = '\n      proguardFiles getDefaultProguardFile("proguard-android.txt")\n    }\n  }\n}\n';
for (const [name, line] of [
  ['পুরনো টেমপ্লেট', 'minifyEnabled false'],
  ['SDK 50-ধাঁচ', 'minifyEnabled enableProguardInReleaseBuilds'],
  ['findProperty-ধাঁচ', "minifyEnabled (findProperty('android.enableMinifyInReleaseBuilds')?.toBoolean() ?: true)"],
  ['চলক-ধাঁচ', 'minifyEnabled enableMinifyInReleaseBuilds'],
  ['ইতিমধ্যেই চালু', 'minifyEnabled true'],
]) {
  n++;
  try {
    const src = HEAD + line + TAIL;
    const out = applyR8(src);
    if (out.replace(/minifyEnabled true/, line) !== src) fail(name + ': ওই লাইনটা ছাড়া আর কিছুও বদলেছে');
    else ok(name);
  } catch (e) { fail(name + ': ' + e.message); }
}

// ③ উল্টো দিক — না মিললে সত্যিই থামে তো?
for (const [name, src] of [
  ['লাইনটাই নেই', HEAD + 'crunchPngs true' + TAIL],
  ['দুবার আছে', HEAD + 'minifyEnabled false\n      minifyEnabled false' + TAIL],
]) {
  n++;
  try { applyR8(src); fail(name + ': থামেনি — নীরবে এড়িয়ে গেল'); }
  catch (e) { if (e.r8) ok(name + ': ঠিকভাবে থামল'); else fail(name + ': অন্য ত্রুটি — ' + e.message); }
}
// মন্তব্যে লেখা থাকলে যেন গোনা না হয়
n++;
try { applyR8(HEAD + '// minifyEnabled false\n      crunchPngs true' + TAIL); fail('মন্তব্যের লাইন গোনা হয়েছে'); }
catch (e) { if (e.r8) ok('মন্তব্যে লেখা minifyEnabled গোনা হয় না'); else fail('অন্য ত্রুটি — ' + e.message); }

// ④ প্লাগিনটা app.json-এ সত্যিই বসানো আছে তো?
n++;
const app = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'));
if ((app.expo.plugins || []).some(p => (Array.isArray(p) ? p[0] : p) === './plugins/withR8.js')) ok('app.json-এ প্লাগিনটা বসানো আছে');
else fail('app.json-এর plugins তালিকায় withR8 নেই — তাহলে কিছুই হবে না');

console.log('');
if (bad) { console.log('✗ ' + bad + '/' + n + 'টি সমস্যা'); process.exit(1); }
console.log('✓ ' + n + 'টি পরীক্ষাই ঠিক — আসল SDK 54 টেমপ্লেটে R8 চালু হয়, আর না মিললে বিল্ড থামে');
