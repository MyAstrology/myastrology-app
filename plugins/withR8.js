const { withGradleProperties } = require('@expo/config-plugins');

// Play Console-এর "app's memory and performance" সুপারিশ — রিলিজ বিল্ডে R8
// চালানো। R8 জাভা/কোটলিন কোড ছেঁটে ছোট করে আর অব্যবহৃত রিসোর্স বাদ দেয়।
//
// ⚠️ সীমা, যেটা জেনে রাখা দরকার: এই অ্যাপের ওজনের বড় অংশ JS বান্ডলের ভিতরের
// ওয়েব-পাতাগুলো (kundali ৪.৩ MB, panjika ১.৮ MB, …) — R8 ওগুলো ছোঁয়ই না।
// তাই লাভটা নেটিভ দিকেই সীমিত, আর সেটাই স্বাভাবিক।
//
// ⚠️ ঝুঁকি: R8 ক্লাসের নাম বদলে দেয়, তাই যে লাইব্রেরি নাম ধরে (reflection)
// ক্লাস খোঁজে সেটা রিলিজ বিল্ডে নীরবে ভাঙতে পারে — ডিবাগ বিল্ডে ধরা পড়ে না।
// এখানকার নাম-নির্ভর লাইব্রেরিগুলো (Firebase, OneSignal, Google Sign-In,
// React Native/Hermes) নিজেরাই নিজেদের keep-নিয়ম AAR-এর ভিতরে পাঠায়, তাই
// হাতে বাড়তি নিয়ম যোগ করা হয়নি — না জেনে অনুমানে নিয়ম লেখার চেয়ে
// লাইব্রেরির নিজের নিয়মই নির্ভরযোগ্য।
//
// ↩️ বন্ধ করতে: নিচের দুটো 'true' কে 'false' করে আবার বিল্ড করুন।
const OVERRIDES = {
  'android.enableProguardInReleaseBuilds': 'true',
  'android.enableShrinkResourcesInReleaseBuilds': 'true',
};

module.exports = function withR8(config) {
  return withGradleProperties(config, (config) => {
    const keys = Object.keys(OVERRIDES);
    config.modResults = config.modResults.filter(
      (item) => !(item.type === 'property' && keys.includes(item.key))
    );
    for (const key of keys) {
      config.modResults.push({ type: 'property', key, value: OVERRIDES[key] });
    }
    return config;
  });
};
