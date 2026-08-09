const { withAppBuildGradle } = require('@expo/config-plugins');

// Play Console-এর "app's memory and performance" সুপারিশ — রিলিজ বিল্ডে R8
// চালু করা। R8 জাভা/কোটলিন কোড ছেঁটে ছোট করে।
//
// ⚠️ প্রথম চেষ্টা কেন ভেঙেছিল (২০২৬-০৮-০৯, বিল্ড ব্যর্থ):
// gradle.properties-এ দুটো সুইচ বসানো হয়েছিল —
//   android.enableProguardInReleaseBuilds        (কোড ছোট করা)
//   android.enableShrinkResourcesInReleaseBuilds (রিসোর্স বাদ দেওয়া)
// কিন্তু Expo SDK 54 / RN 0.81-এর টেমপ্লেট দ্বিতীয়টা পড়ে, প্রথমটা পড়ে না —
// build.gradle-এ minifyEnabled আসে একটা স্থানীয় def থেকে, gradle property
// থেকে নয়। ফলে রিসোর্স-ছাঁটাই চালু হলো অথচ কোড-ছাঁটাই হলো না, আর Android
// নিজেই বিল্ড থামিয়ে দিল:
//   "Removing unused resources requires unused code shrinking to be turned on"
//
// তাই এখন gradle property-র ভরসায় না থেকে build.gradle-এর minifyEnabled
// লাইনটাই সরাসরি বদলানো হয়, আর রিসোর্স-ছাঁটাই ছোঁয়া হয় না (ওটাই ভাঙার
// কারণ ছিল, আর লাভও ওটাতেই কম)।
//
// 🛟 লাইনটা না মিললে ফাইল অক্ষত রেখে দেওয়া হয় — তখন R8 চালু হয় না, কিন্তু
// বিল্ড ঠিকঠাক হয়। অর্থাৎ এই প্লাগিন আর কখনো বিল্ড ভাঙতে পারবে না।
//
// ⚠️ R8 ক্লাসের নাম বদলে দেয়, তাই যে লাইব্রেরি নাম ধরে (reflection) ক্লাস
// খোঁজে সেটা রিলিজ বিল্ডে নীরবে ভাঙতে পারে — ডিবাগ বিল্ডে ধরা পড়ে না।
// এখানকার নাম-নির্ভর লাইব্রেরিগুলো (Firebase, OneSignal, Google Sign-In,
// React Native/Hermes) নিজেরাই নিজেদের keep-নিয়ম AAR-এর ভিতরে পাঠায়।
//
// ↩️ বন্ধ করতে: নিচের ENABLED-কে false করে আবার বিল্ড করুন।
const ENABLED = true;

// টেমপ্লেটে লাইনটা "minifyEnabled false" বা
// "minifyEnabled enableProguardInReleaseBuilds" — দুটোর যেকোনোটা হতে পারে।
const MINIFY_RE = /minifyEnabled\s+(?:false|enableProguardInReleaseBuilds)\b/g;

module.exports = function withR8(config) {
  if (!ENABLED) return config;
  return withAppBuildGradle(config, (config) => {
    const src = config.modResults.contents;
    const hits = src.match(MINIFY_RE);
    // ঠিক একটা লাইনই আশা করা হয় (release ব্লকের)। একাধিক বা শূন্য হলে
    // টেমপ্লেট বদলে গেছে — অনুমানে হাত না দিয়ে ছেড়ে দেওয়াই নিরাপদ।
    if (!hits || hits.length !== 1) {
      console.warn(
        '[withR8] minifyEnabled লাইনটা ঠিক একবার পাওয়া গেল না ('
        + (hits ? hits.length : 0) + 'বার) — R8 চালু করা হলো না, বিল্ড আগের মতোই চলবে।'
      );
      return config;
    }
    config.modResults.contents = src.replace(MINIFY_RE, 'minifyEnabled true');
    return config;
  });
};
