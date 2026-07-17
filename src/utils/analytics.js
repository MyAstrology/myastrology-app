// Firebase Analytics — অ্যাপের নিজস্ব ব্যবহার-ডেটা (ওয়েবসাইটের GA4 থেকে
// সম্পূর্ণ আলাদা প্রোপার্টি, একই Firebase প্রজেক্ট যেটা লগইনের জন্য ব্যবহৃত)।
// @react-native-firebase/analytics একটা নেটিভ মডিউল — Expo Go-তে থাকে না,
// তাই require() নিরাপদে try/catch-এ মুড়ে দেওয়া হয়েছে যেন Expo Go-তে ক্র্যাশ
// না করে (শুধু নীরবে no-op হয়ে যাবে); EAS কাস্টম বিল্ডে স্বয়ংক্রিয়ভাবে সক্রিয় হবে।
let _analytics = null;
try {
  _analytics = require('@react-native-firebase/analytics').default;
} catch (e) {
  // Expo Go বা নেটিভ মডিউল ছাড়া বিল্ড — analytics নীরবে বন্ধ থাকবে
}

export function logScreenView(screenName) {
  if (!_analytics) return;
  _analytics().logScreenView({ screen_name: screenName, screen_class: screenName }).catch(() => {});
}

export function logEvent(eventName, params) {
  if (!_analytics) return;
  _analytics().logEvent(eventName, params).catch(() => {});
}
