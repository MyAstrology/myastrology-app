import React from 'react';
import { Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// কুণ্ডলীর জন্য MaterialCommunityIcons-এর গোল "chart-donut"-এর বদলে আসল বৈদিক
// কুণ্ডলী ছকের (বর্গ + কোণাকুণি + মাঝের রম্বস) কাস্টম আইকন — react-native-svg
// নতুন native dependency (আরেকটা dev-client rebuild) এড়াতে PNG হিসেবে বসানো,
// tintColor দিয়ে অন্য আইকনগুলোর মতোই যেকোনো রঙে দেখানো যায়।
const KUNDALI_ICON = require('../../assets/kundali-icon.png');

export function MenuIcon({ tab, icon, size = 20, color }) {
  if (tab === 'Kundali') {
    return <Image source={KUNDALI_ICON} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" />;
  }
  return <MaterialCommunityIcons name={icon} size={size} color={color} />;
}

// হ্যামবার্গার মেনু ও হোম স্ক্রিনের quick-access গ্রিডে ব্যবহৃত একমাত্র সোর্স —
// আগে AppHeader.js, HomeScreen.js, PanchangScreen.js, KundaliScreen.js প্রতিটা
// নিজের একটা করে হার্ডকোডেড কপি রাখত, যেগুলো এই সেশনে যোগ হওয়া নতুন স্ক্রিন
// (Blog, Booking, Gemstone, Vastu, Palmistry, VedicAstrology, Video) কোনোটাই
// তালিকাভুক্ত করেনি। এখন থেকে সব জায়গায় এই একটা লিস্ট ব্যবহার হবে।
//
// NumerologyResult ও RashifalDetail ইচ্ছাকৃতভাবে বাদ — এগুলো নিজে থেকে
// দেখার মতো স্ক্রিন না (route params ছাড়া অর্থহীন ফলাফল/ডিফল্ট দেখাবে),
// অন্য স্ক্রিন থেকে navigate করেই এখানে আসা উচিত।
export const MENU_ITEMS = [
  { tab: 'Home',           icon: 'home-variant',            label: 'হোম'            },
  { tab: 'Panchang',       icon: 'calendar-month',          label: 'পঞ্জিকা'         },
  { tab: 'Rashifal',       icon: 'star-circle',             label: 'রাশিফল'          },
  { tab: 'Kundali',        icon: 'chart-donut',             label: 'জন্ম কুণ্ডলী'    },
  { tab: 'MatchMaking',    icon: 'heart-multiple',          label: 'যোটক বিচার'      },
  { tab: 'Numerology',     icon: 'numeric-9-plus-box',      label: 'সংখ্যাজ্যোতিষ'   },
  { tab: 'Namakaran',      icon: 'baby-face-outline',       label: 'নামকরণ'          },
  { tab: 'Varshaphala',    icon: 'chart-timeline-variant',  label: 'বর্ষফল'          },
  { tab: 'Prashna',        icon: 'help-circle-outline',     label: 'প্রশ্ন জ্যোতিষ'  },
  { tab: 'VedicAstrology', icon: 'star-four-points-outline',label: 'জ্যোতিষ শাস্ত্র' },
  { tab: 'Palmistry',      icon: 'hand-back-right-outline', label: 'হস্তরেখা বিচার'  },
  { tab: 'Gemstone',       icon: 'diamond-stone',           label: 'রত্নপাথর পরামর্শ'},
  { tab: 'Vastu',          icon: 'home-city-outline',       label: 'বাস্তু শাস্ত্র'   },
  { tab: 'Learning',       icon: 'school-outline',          label: 'জ্যোতিষ শিক্ষা'  },
  { tab: 'Blog',           icon: 'post-outline',            label: 'ব্লগ'            },
  { tab: 'News',           icon: 'newspaper-variant-outline',label: 'মহাজাগতিক সংবাদ' },
  { tab: 'Video',          icon: 'youtube',                 label: 'ভিডিও'           },
  { tab: 'Booking',        icon: 'phone-in-talk-outline',   label: 'পরামর্শ বুকিং'   },
  { tab: 'AboutAstrologer',icon: 'account-star-outline',    label: 'জ্যোতিষী সম্পর্কে'},
  { tab: 'Settings',       icon: 'cog-outline',             label: 'সেটিংস'          },
  { tab: 'More',           icon: 'dots-horizontal-circle',  label: 'আরও'             },
];

// হোম স্ক্রিনের ছোট quick-access গ্রিডের জন্য — সবচেয়ে বেশি ব্যবহৃত ৮টা
// (2×4 গ্রিড পূর্ণ করার জন্য ঠিক ৮টা — 'More' বাদ, কারণ সেটা নিচের ট্যাব বারেই
// সবসময় দেখা যায়, এখানে ডুপ্লিকেট করার দরকার নেই)
export const QUICK_ACCESS_TABS = [
  'Kundali', 'MatchMaking', 'Panchang', 'Numerology',
  'Rashifal', 'Namakaran', 'Prashna', 'Booking',
];

export const QUICK_ACCESS_ITEMS = QUICK_ACCESS_TABS.map(
  tab => MENU_ITEMS.find(m => m.tab === tab)
).filter(Boolean);
