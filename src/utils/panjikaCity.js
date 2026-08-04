import AsyncStorage from '@react-native-async-storage/async-storage';

// পঞ্জিকা ট্যাবের শহর-নির্বাচক (panjika.html-এর openCityModal) নিজের পছন্দ
// WebView-এর localStorage-এ 'pjk_city' নামে রাখে। হোম স্ক্রিন নেটিভ কোড, সে
// ওই localStorage সরাসরি পড়তে পারে না — তাই পঞ্জিকা পেজ থেকে শহরটা RN-এ
// পাঠিয়ে এখানে AsyncStorage-এ রাখা হয়, আর হোম স্ক্রিন এখান থেকে পড়ে।
//
// কেন দরকার: হোম স্ক্রিন আগে সবসময় কলকাতা ধরে হিসাব করত, আর পঞ্জিকা ট্যাব
// ব্যবহারকারীর বেছে নেওয়া শহর ধরে — ফলে একই দিনের সূর্যোদয় দুই জায়গায় দুরকম
// দেখাত (২০২৬-০৮-০২: হোমে ৫:১০, পঞ্জিকায় ৫:১২:০৭)।
const KEY = 'mya_panjika_city';

// panjika.html-এর নিজস্ব ডিফল্ট (`let LAT=23.1677, LNG=88.5808`)-এর হুবহু একই
// মান — শহর বেছে না নিলে হোম ও পঞ্জিকা যেন একই হিসাব দেখায়।
// panchang_full.js-এর DEF_LAT/DEF_LON-ও এই একই মান; দুটো একসাথে বদলাতে হবে।
export const DEFAULT_CITY = { lat: 23.1677, lon: 88.5808, tz: 5.5, label: 'রানাঘাট', country: 'ভারত' };

// আগে ভারতের বাইরের শহর বাতিল করা হতো — getPanchangForDate() তখন শুধু
// lat/lon নিত, ভিতরে IST ধরা ছিল, তাই ঢাকা বাছলেও সময় ভারতীয় ঘড়িতে দেখাত।
// ২০২৬-০৮-০৪: ইঞ্জিন এখন tz নেয়, তাই যেকোনো দেশের শহর সরাসরি চলে।
const IST = 5.5;

export async function savePanjikaCity(city) {
  if (!city || city.lat == null || city.lon == null) return;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({
      lat: Number(city.lat),
      lon: Number(city.lon),
      tz: Number.isFinite(Number(city.tz)) ? Number(city.tz) : IST,
      label: city.label || '',
      country: city.country || '',
    }));
  } catch (_) {}
}

export async function loadPanjikaCity() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_CITY;
    const c = JSON.parse(raw);
    if (c?.lat == null || c?.lon == null) return DEFAULT_CITY;
    const tz = Number.isFinite(Number(c.tz)) ? Number(c.tz) : IST;
    return { lat: c.lat, lon: c.lon, tz, label: c.label || DEFAULT_CITY.label,
             country: c.country || '' };
  } catch (_) {
    return DEFAULT_CITY;
  }
}
