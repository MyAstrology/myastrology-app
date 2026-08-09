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

   ⚠️ https://myastrology.in/... লিংক অ্যাপে খুলতে হলে আরও একটা ধাপ
   বাকি — ওয়েবসাইটে /.well-known/assetlinks.json রাখতে হয় যেখানে
   অ্যাপের সই-করা SHA-256 ছাপ থাকে। ছাপটা Play Console-এ
   (Release → Setup → App signing) পাওয়া যায়; সেটা হাতে না পাওয়া
   পর্যন্ত https:// অংশটা নিষ্ক্রিয় থাকবে, আর myastrology:// এখনই কাজ
   করবে। নিচের তালিকায় দুটোই রাখা আছে, তাই ফাইলটা বসানোমাত্র বাকিটাও
   আপনাআপনি চালু হবে।
   ═══════════════════════════════════════════════════════════════ */
import { getStateFromPath } from '@react-navigation/native';
import { RASHI_SIGNS } from '../data/rashifalSigns';

const SLUG_TO_INDEX = {};
RASHI_SIGNS.forEach((s, i) => { SLUG_TO_INDEX[s.dailySlug] = i; });

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

  /* rashifal/<রাশির নাম> আলাদা করে ধরা — ওয়েবসাইটে ঠিকানায় থাকে নাম
     (rashifal/mesh), অথচ পর্দাটা চায় ক্রমসংখ্যা। config-এর parse শুধু
     প্যারামিটারের *মান* বদলাতে পারে, নাম নয় — তাই এখানে। অচেনা নাম হলে
     নিচে স্বাভাবিক নিয়মেই যায় (rashifal → রাশির তালিকা)। */
  getStateFromPath(path, options) {
    const m = path.match(/^\/?rashifal\/([a-z]+)(?:\.html)?\/?(?:[?#].*)?$/i);
    if (m && SLUG_TO_INDEX[m[1].toLowerCase()] !== undefined) {
      return {
        routes: [{
          name: 'RashifalDetail',
          params: { rashiIndex: SLUG_TO_INDEX[m[1].toLowerCase()] },
        }],
      };
    }
    return getStateFromPath(path, options);
  },
};
