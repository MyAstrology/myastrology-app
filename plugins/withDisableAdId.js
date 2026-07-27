const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

// Firebase Analytics অ্যান্ড্রয়েডে ডিফল্টভাবে Advertising ID (AAID) সংগ্রহ
// করে — বিজ্ঞাপন-লক্ষ্যায়নের জন্য, যা এই অ্যাপে একেবারেই দরকার নেই (অ্যাপে
// কোনো বিজ্ঞাপন নেই, Play Console-এও "doesn't contain ads" ঘোষণা করা)।
//
// কেন এটা জরুরি: Play Console-এর App content → Advertising ID-তে ঘোষণা করা
// আছে "your app doesn't use advertising ID"। কিন্তু Analytics চালু থাকায়
// বাস্তবে AAID সংগ্রহ হতো — অর্থাৎ ঘোষণাটা ভুল হয়ে যেত, আর Play নীতিতে ভুল
// ঘোষণা অ্যাপ সরিয়ে দেওয়ার কারণ হতে পারে। দুই পথ ছিল: ঘোষণা বদলে "হ্যাঁ,
// ব্যবহার করি" লেখা, অথবা সংগ্রহটাই বন্ধ করা। অ্যাপের কোনো কাজে AAID লাগে
// না বলে বন্ধ করাই সঠিক — ঘোষণা সত্যি হয়ে যায় এবং কম তথ্য সংগ্রহ হয়।
//
// screen_view/logEvent-এর মতো ব্যবহার-পরিসংখ্যান আগের মতোই কাজ করে; শুধু
// বিজ্ঞাপন-শনাক্তকারীটা আর তোলা হয় না।
//
// একই সাথে ssaid/সংকেত-ভিত্তিক ব্যক্তিগতকরণও বন্ধ — না হলে AAID ছাড়াও
// Analytics বিজ্ঞাপন-উদ্দেশ্যে সংকেত পাঠাতে পারত।
const FLAGS = {
  google_analytics_adid_collection_enabled: 'false',
  google_analytics_ssaid_collection_enabled: 'false',
  google_analytics_default_allow_ad_personalization_signals: 'false',
};

module.exports = function withDisableAdId(config) {
  return withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    app['meta-data'] = app['meta-data'] || [];
    for (const [name, value] of Object.entries(FLAGS)) {
      // একই meta-data দুবার থাকলে Gradle merge-এ সংঘর্ষ হয়, তাই আগে সরিয়ে নিই
      app['meta-data'] = app['meta-data'].filter(m => m.$['android:name'] !== name);
      app['meta-data'].push({ $: { 'android:name': name, 'android:value': value } });
    }
    return config;
  });
};
