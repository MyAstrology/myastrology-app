#!/usr/bin/env node
// R8 প্লাগিনের রূপান্তরটা টেমপ্লেটের তিনটে চেনা আকৃতিতেই কাজ করে কি না।
//
// কেন দরকার: ২০২৬-০৯-২১ পর্যন্ত regex কেবল দুটো আকৃতি চিনত, SDK 54-এর
// তৃতীয় আকৃতিটা নয় — আর প্লাগিন নীরবে এড়িয়ে যেত। কোনো পরীক্ষা ছিল না,
// তাই মাসখানেক ধরে প্রতিটি রিলিজ R8 ছাড়াই গেছে। এই স্ক্রিপ্ট
// `node_modules` ছাড়াই চলে (বিশুদ্ধ স্ট্রিং-রূপান্তর আলাদা ফাইলে)।
const { applyR8 } = require('../plugins/r8-transform');

const HEAD = 'android {\n  buildTypes {\n    debug { signingConfig signingConfigs.debug }\n    release {\n      signingConfig signingConfigs.debug\n      shrinkResources (findProperty(\'android.enableShrinkResourcesInReleaseBuilds\')?.toBoolean() ?: false)\n      ';
const TAIL = '\n      proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"\n    }\n  }\n}\n';

const SHAPES = [
  ['পুরনো টেমপ্লেট', 'minifyEnabled false'],
  ['SDK 50-ধাঁচ', 'minifyEnabled enableProguardInReleaseBuilds'],
  ['SDK 53/54', "minifyEnabled (findProperty('android.enableMinifyInReleaseBuilds')?.toBoolean() ?: true)"],
  ['ইতিমধ্যেই চালু', 'minifyEnabled true'],
];

let bad = 0, n = 0;
for (const [name, line] of SHAPES) {
  const src = HEAD + line + TAIL;
  n++;
  try {
    const out = applyR8(src);
    if (!/minifyEnabled true/.test(out)) { console.log('✗ ' + name + ': minifyEnabled true বসেনি'); bad++; continue; }
    // বাকিটা অক্ষত থাকতেই হবে — বিশেষ করে shrinkResources (ওটাই একবার
    // বিল্ড ভেঙেছিল) আর proguardFiles।
    if (!out.includes('enableShrinkResourcesInReleaseBuilds') || !out.includes('proguardFiles')) {
      console.log('✗ ' + name + ': আশেপাশের লাইন নষ্ট হয়েছে'); bad++; continue;
    }
    if (out.replace(/minifyEnabled true/, line) !== src) {
      console.log('✗ ' + name + ': ওই লাইনটা ছাড়া আর কিছুও বদলেছে'); bad++; continue;
    }
    console.log('✓ ' + name);
  } catch (e) { console.log('✗ ' + name + ': ' + e.message); bad++; }
}

// উল্টো দিক — না মিললে সত্যিই থামে তো?
for (const [name, src] of [
  ['লাইনটাই নেই', HEAD + 'crunchPngs true' + TAIL],
  ['দুবার আছে', HEAD + 'minifyEnabled false\n      minifyEnabled false' + TAIL],
]) {
  n++;
  try { applyR8(src); console.log('✗ ' + name + ': থামেনি — নীরবে এড়িয়ে গেল'); bad++; }
  catch (e) { if (e.r8) console.log('✓ ' + name + ': ঠিকভাবে থামল'); else { console.log('✗ ' + name + ': অন্য ত্রুটি — ' + e.message); bad++; } }
}

// প্লাগিনটা app.json-এ সত্যিই বসানো আছে তো?
const app = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'app.json'), 'utf8'));
n++;
if ((app.expo.plugins || []).some(p => (Array.isArray(p) ? p[0] : p) === './plugins/withR8.js')) console.log('✓ app.json-এ প্লাগিনটা বসানো আছে');
else { console.log('✗ app.json-এর plugins তালিকায় withR8 নেই — তাহলে কিছুই হবে না'); bad++; }

console.log('');
if (bad) { console.log('✗ ' + bad + '/' + n + 'টি সমস্যা'); process.exit(1); }
console.log('✓ ' + n + 'টি পরীক্ষাই ঠিক — R8 টেমপ্লেটের তিন আকৃতিতেই চালু হবে, আর না মিললে বিল্ড থামবে');
