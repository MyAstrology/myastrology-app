/* ═══════════════════════════════════════════════════════════════
   Deep link — বাইরে থেকে অ্যাপের নির্দিষ্ট পর্দায় সরাসরি ঢোকা

   app.json-এ scheme: "myastrology" আগে থেকেই ছিল, অর্থাৎ ফোন জানত
   myastrology:// লিংক এই অ্যাপের। কিন্তু React Navigation-কে কখনো বলা
   হয়নি কোন ঠিকানা কোন পর্দা — তাই লিংকে চাপ দিলে অ্যাপ খুলত ঠিকই,
   হোম স্ক্রিনেই থেমে যেত।

   কাজে লাগে যেখানে:
   • প্রতিদিনের OneSignal নোটিফিকেশনে launch URL দিলে
     (myastrology://panjika) চাপলেই সোজা পঞ্জিকায় — হোম স্ক্রিন হয়ে
     খুঁজতে হয় না।
   • WhatsApp/Facebook-এ শেয়ার করা লিংক অ্যাপে খোলে।

   ঠিকানাগুলো ওয়েবসাইটের পথের হুবহু মিল রাখা হয়েছে, তাই একই লিংক
   ব্রাউজারে ও অ্যাপে — দুই জায়গাতেই ঠিক জিনিস দেখায়।

   https://myastrology.in/... লিংকও অ্যাপে খোলে — ওয়েবসাইটে
   /.well-known/assetlinks.json বসানো আছে (myastrology/services রেপো),
   সেখানে অ্যাপের App-signing SHA-256 ছাপ। ওই ফাইলটা সরালে বা ছাপ
   বদলালে https:// অংশটা নীরবে কাজ করা বন্ধ করে দেবে — myastrology://
   তখনো চলবে, তাই ভাঙাটা চট করে চোখে পড়বে না।

   www.myastrology.in নিচের prefixes-এ আছে (অ্যাপের ভিতরে ঠিকানা পড়ার
   জন্য), কিন্তু app.json-এর intentFilters-এ নেই — ওয়েবসাইটে www থেকে
   non-www-তে ৩০১ redirect হয় আর Google-এর যাচাইকারী redirect অনুসরণ
   করে না, তাই ওটা ঘোষণা করলে যাচাইই ব্যর্থ হতো।
   ═══════════════════════════════════════════════════════════════ */
import { getStateFromPath } from '@react-navigation/native';
import { RASHI_SIGNS } from '../data/rashifalSigns';

const SLUG_TO_INDEX = {};
const WEEKLY_TO_INDEX = {};
RASHI_SIGNS.forEach((s, i) => {
  SLUG_TO_INDEX[s.dailySlug] = i;
  WEEKLY_TO_INDEX[s.weeklySlug] = i;
});

export const linking = {
  prefixes: [
    'myastrology://',
    'https://myastrology.in',
    'https://www.myastrology.in',
  ],
  config: {
    screens: {
      Home: '',
      Panchang: 'panjika',
      Rashifal: 'rashifal',
      Kundali: 'kundali',
      More: 'more',
      MatchMaking: 'match-making',
      Namakaran: 'namakaran',
      Numerology: 'numerology',
      Varshaphala: 'varshaphala',
      Prashna: 'prashna',
      Booking: 'booking',
      Blog: 'blog',
      News: 'news',
      Palmistry: 'palmistry',
      Vastu: 'vastu',
      Learning: 'learning',
      VedicAstrology: 'vedic-astrology',
      Gemstone: 'gemstone',
    },
  },

  /* কয়েকটা ঠিকানা config-এর সাধারণ নিয়মে ধরা যায় না, তাই হাতে ধরা হচ্ছে।
     config-এর parse শুধু প্যারামিটারের *মান* বদলাতে পারে, নাম নয় — আর
     এখানে ঠিকানার একটা টুকরোকে সম্পূর্ণ আলাদা প্যারামিটারে বদলাতে হয়।
     কোনোটাই না মিললে নিচে স্বাভাবিক নিয়মেই যায়। */
  getStateFromPath(path, options) {
    const clean = String(path).replace(/[?#].*$/, '').replace(/\.html$/i, '').replace(/\/+$/, '');

    // সাপ্তাহিক রাশিফল — ঠিকানায় ইংরেজি নাম (rashifal/saptahik/aries)
    let m = clean.match(/^\/?rashifal\/saptahik\/([a-z]+)$/i);
    if (m && WEEKLY_TO_INDEX[m[1].toLowerCase()] !== undefined) {
      return { routes: [{ name: 'RashifalDetail',
        params: { rashiIndex: WEEKLY_TO_INDEX[m[1].toLowerCase()], mode: 'weekly' } }] };
    }

    // দৈনিক রাশিফল — ঠিকানায় বাংলা রাশির নাম (rashifal/mesh)
    m = clean.match(/^\/?rashifal\/([a-z]+)$/i);
    if (m && SLUG_TO_INDEX[m[1].toLowerCase()] !== undefined) {
      return { routes: [{ name: 'RashifalDetail',
        params: { rashiIndex: SLUG_TO_INDEX[m[1].toLowerCase()] } }] };
    }

    // ব্লগ পোস্ট — BlogScreen slug পেলে ওই পোস্টটাই খোলে
    m = clean.match(/^\/?blog\/([a-z0-9-]+)$/i);
    if (m) {
      return { routes: [{ name: 'Blog', params: { slug: m[1] } }] };
    }

    const std = getStateFromPath(path, options);
    if (std) return std;

    /* কিছুই মিলল না — ওয়েবসাইটে ৫০০-র বেশি পাতা, অ্যাপে পর্দা দুই ডজন।
       App Links চালু থাকায় ওই সব ঠিকানাও এখন অ্যাপেই আসে; এখানে কিছু না
       করলে React Navigation ব্যবহারকারীকে হোম স্ক্রিনে ফেলে দিত — লিংকে
       চাপ দিয়ে ভুল জায়গায় পৌঁছানো, ব্রাউজারে খোলার চেয়েও খারাপ।
       তাই পাতাটা WebPage পর্দায় দেখানো হয়। */
    const rest = clean.replace(/^\//, '');
    if (rest) return { routes: [{ name: 'WebPage', params: { path: rest } }] };
    return std;
  },
};
