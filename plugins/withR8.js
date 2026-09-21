const { withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');
const { applyR8 } = require('./r8-transform');

// Play Console-এর "DEX code optimisation" সুপারিশ — রিলিজ বিল্ডে R8 চালু
// করা। R8 জাভা/কোটলিন কোড ছেঁটে ছোট করে এবং ক্লাসের নাম বদলে দেয়
// (obfuscation)।
//
// ⚠️ প্রথম চেষ্টা কেন ভেঙেছিল (২০২৬-০৮-০৯, বিল্ড ব্যর্থ):
// gradle.properties-এ দুটো সুইচ বসানো হয়েছিল —
//   android.enableProguardInReleaseBuilds        (কোড ছোট করা)
//   android.enableShrinkResourcesInReleaseBuilds (রিসোর্স বাদ দেওয়া)
// কিন্তু টেমপ্লেট দ্বিতীয়টা পড়ে, প্রথমটা পড়ে না — ফলে রিসোর্স-ছাঁটাই চালু
// হলো অথচ কোড-ছাঁটাই হলো না, আর Android নিজেই বিল্ড থামিয়ে দিল:
//   "Removing unused resources requires unused code shrinking to be turned on"
// তাই রিসোর্স-ছাঁটাই আজও ছোঁয়া হয় না — ওটাই ভাঙার কারণ ছিল, আর লাভও কম।
//
// ⛔ দ্বিতীয় দফার আসল দোষ (২০২৬-০৯-২১): regex কেবল দুটো আকৃতি চিনত —
// `minifyEnabled false` ও `minifyEnabled enableProguardInReleaseBuilds`।
// Expo SDK 53/54-এর টেমপ্লেট লেখে
//   minifyEnabled (findProperty('android.enableMinifyInReleaseBuilds')?.toBoolean() ?: true)
// — কোনোটাই মেলে না। প্লাগিন তখন `console.warn` করে **নীরবে এড়িয়ে যেত**,
// আর EAS-এর হাজার লাইনের লগে ওই সতর্কতা কেউ দেখে না। ফলাফল: Play Console
// বলল Obfuscation ১%। এই রিপোর পুরনো নিয়মটাই আবার — নীরব no-op সবচেয়ে
// খারাপ ব্যর্থতা। **তাই এখন না মিললে বিল্ড থেমে যায়**, আর prebuild
// সেকেন্ডের কাজ, তাই থামাটা সস্তা।
//
// ⚠️ R8 ক্লাসের নাম বদলে দেয়, তাই যে লাইব্রেরি নাম ধরে (reflection) ক্লাস
// খোঁজে সেটা রিলিজ বিল্ডে নীরবে ভাঙতে পারে — ডিবাগ বিল্ডে ধরা পড়ে না।
// এখানকার নাম-নির্ভর লাইব্রেরিগুলো (Firebase, OneSignal, Google Sign-In,
// React Native/Hermes) নিজেরাই নিজেদের keep-নিয়ম AAR-এর ভিতরে পাঠায়।
//
// ↩️ বন্ধ করতে: নিচের ENABLED-কে false করে আবার বিল্ড করুন।
const ENABLED = true;

// build.gradle-এর লাইনটা সরাসরি বদলানোই আসল কাজ; নিচের দুটো property
// কেবল অতিরিক্ত সুরক্ষা — টেমপ্লেট যদি কোনোদিন property-টাই পড়ে, তখনও
// যেন উত্তরটা "হ্যাঁ" হয়। (shrinkResources ইচ্ছে করেই বাদ।)
const PROPS = {
  'android.enableMinifyInReleaseBuilds': 'true',
  'android.enableProguardInReleaseBuilds': 'true',
};

module.exports = function withR8(config) {
  if (!ENABLED) return config;
  config = withGradleProperties(config, (config) => {
    const keys = Object.keys(PROPS);
    config.modResults = config.modResults.filter(
      (item) => !(item.type === 'property' && keys.includes(item.key))
    );
    for (const key of keys) {
      config.modResults.push({ type: 'property', key, value: PROPS[key] });
    }
    return config;
  });
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = applyR8(config.modResults.contents);
    return config;
  });
};
