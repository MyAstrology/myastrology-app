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

   ⚠️ Android App Links (https:// লিংক অ্যাপে খোলা) ইচ্ছাকৃতভাবে **বন্ধ**।
   ২০২৬-০৮-০৯-এ একদিনের জন্য চালু করা হয়েছিল — app.json-এ গোটা
   myastrology.in হোস্ট দাবি করে। ফল ছিল অগ্রহণযোগ্য: ওয়েবসাইটের *প্রতিটা*
   পাতা অ্যাপে ঢুকে পড়ত, Chrome থেকে কুণ্ডলীর PDF ডাউনলোড করা যেত না
   (লিংকটা অ্যাপ ছিনিয়ে নিত), আর 404-এর মতো পাতা অ্যাপের হালকা থিমে
   পড়ে অপাঠ্য হয়ে যেত। ওয়েবসাইট ব্রাউজারেই খোলা উচিত — সেটাই মানুষ আশা করে।
   তাই intentFilters সরানো হয়েছে; নিচের https:// prefix দুটো নিষ্ক্রিয়
   (কোনো https লিংক আর অ্যাপে আসে না), শুধু myastrology:// চালু — সেটাই
   নোটিফিকেশনের app_url ব্যবহার করে।
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
