/*  ফোনের নিজের ভাষা — নতুন কোনো dependency ছাড়াই।
 *
 *  expo-localization যোগ করলে আরেকটা native rebuild লাগত; তার দরকার নেই,
 *  কারণ react-native নিজেই লোকেল-টা দেয়। তিনটে উৎস পরপর দেখা হয়, আর
 *  প্রতিটাই try/catch-এ — কোনোটা না থাকলেও যেন অ্যাপ না ভাঙে।
 *
 *  ⚠️ এটা কেবল **প্রথম চালুর পর্দায় কোন ভাষাটা আগে থেকে বাছা থাকবে** তা ঠিক
 *  করে — নিজে থেকে ভাষা বদলে দেয় না। ফোন ইংরেজিতে সেট করা বহু বাংলাভাষী
 *  পাঠক আছেন; নীরবে ইংরেজি করে দিলে তাঁরা হঠাৎ অন্য ভাষার অ্যাপ পেতেন।
 */
import { NativeModules, Platform } from 'react-native';

export function deviceLang() {
  let raw = '';
  try {
    if (Platform.OS === 'android') {
      raw = (NativeModules.I18nManager && NativeModules.I18nManager.localeIdentifier) || '';
    } else {
      const sm = NativeModules.SettingsManager && NativeModules.SettingsManager.settings;
      raw = (sm && (sm.AppleLocale || (sm.AppleLanguages && sm.AppleLanguages[0]))) || '';
    }
  } catch (e) {}
  if (!raw) {
    try { raw = Intl.DateTimeFormat().resolvedOptions().locale || ''; } catch (e) {}
  }
  const l = String(raw).toLowerCase().replace(/_/g, '-');
  if (l.indexOf('bn') === 0) return 'bn';
  if (l.indexOf('hi') === 0) return 'hi';
  if (l.indexOf('en') === 0) return 'en';
  return null;   // চেনা গেল না — ডাকা জায়গায় বাংলাই ধরা হবে
}
