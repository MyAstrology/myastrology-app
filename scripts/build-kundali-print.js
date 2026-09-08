#!/usr/bin/env node
/**
 * src/web-html/kundali-print.js — ওয়েবসাইটের kundali-print.html থেকে তৈরি।
 * ═══════════════════════════════════════════════════════════════════
 *
 * ⛔ কেন আলাদা স্ক্রিপ্ট, bundle-web-assets.js নয়:
 *    এই পাতাটা কখনো bundle()-এর তালিকায় ছিল না। একবার হাতে কপি হয়ে
 *    তারপর মাসের পর মাস পিছিয়ে পড়েছিল — ২,১৫৬ লাইনের সাইট-পাতার
 *    বিপরীতে বান্ডলে ছিল ১,৮০৩। ফল: ইংরেজি PDF-এ জন্মসময়/জন্মস্থান/
 *    সূর্যোদয়/সূর্যাস্ত/বর্ণ "—", পাতা কম, আর প্রিমিয়ামের অন্তর্দশা-
 *    প্রত্যন্তর্দশা ও যোনি-বর্ণ প্রতিকার একেবারেই অনুপস্থিত।
 *
 * ⚠️ অ্যাপের প্যাচগুলো এখানে **ঘোষিত**, হাতে বসানো নয় — তাই সাইটের
 *    পাতা বদলালে এই স্ক্রিপ্ট আবার চালালেই হলো, আর কোনো প্যাচ হারায় না।
 *    verify-print-bundle.js প্রতিবার মিলিয়ে দেখে বান্ডলটা এই নিয়মেই
 *    তৈরি কিনা — নইলে আবার নীরবে পিছিয়ে পড়ত।
 *
 * চালানো:  node scripts/build-kundali-print.js
 */
const fs = require('fs');
const path = require('path');

const SITE = path.resolve(__dirname, '..', '..', 'services', 'kundali-print.html');
const OUT  = path.resolve(__dirname, '..', 'src', 'web-html', 'kundali-print.js');

/* অ্যাপের প্যাচ — প্রতিটির কারণ পাশে লেখা।
   কোনো প্যাচ প্রয়োগ না হলে স্ক্রিপ্ট **থেমে যায়**, নীরবে এড়ায় না:
   সাইটের পাতা বদলে গেলে সেটাই একমাত্র সৎ আচরণ। */
const PATCHES = [
  { why: 'GTM অ্যাপে নয় — ছাপার WebView-এ ট্র্যাকিং স্ক্রিপ্টের কাজ নেই, আর অফলাইনে সে ঝুলে থাকে',
    find: /<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->\n?/g, to: '' },
  { why: 'GTM noscript-ও নয়', 
    find: /<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->\n?/g, to: '' },
  { why: 'ফন্ট file:// থেকে আপেক্ষিক পথে আসে না — নিরঙ্কুশ URL, আর preload/onload ছাড়া সরল <link>',
    find: '<link rel="preload" href="/css/noto-sans-font.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">\n<noscript><link rel="stylesheet" href="/css/noto-sans-font.css"></noscript>',
    to:   '<link rel="stylesheet" href="https://myastrology.in/css/noto-sans-font.css">' },
  { why: 'expo-print পর্দার DOM ধরে ছাপে, তাই #printRoot পর্দাতেও দেখা যেতে হবে',
    find: '@media screen{#printRoot{display:none}}', to: '#printRoot{display:block!important}' },
  { why: 'file:// পাতায় আপেক্ষিক ছবি ৪০৪ — লাইভ সাইটের ঠিকানা',
    find: /src="(images|gallery)\//g, to: 'src="https://myastrology.in/$1/' },
  { why: 'ফিরে যাওয়ার লিংকও নিরঙ্কুশ',
    find: /href="kundali"/g, to: 'href="https://myastrology.in/kundali"' },
  /* ⛔ এটাই ছিল "ইংরেজি PDF-এ বাংলা"-র আসল কারণ: পাতাটা /js/i18n.js
     রুট-নিরঙ্কুশ পথে ডাকে, আর অ্যাপে HTML আসে file:// থেকে — সেখানে
     "/js/…" মানে ফাইল-সিস্টেমের রুট, অর্থাৎ ৪০৪। MyaI18n কখনো তৈরিই
     হতো না, তাই PDF সবসময় বাংলা থাকত, কোনো ত্রুটি ছাড়াই। */
  /* ⛔ ২০২৬-০৯-০৮ — ইংরেজি PDF-এ তবু সব বাংলাই আসছিল, আর কারণটা
     আগেরবারের চেয়ে এক ধাপ গভীরে। js/i18n.js এখন লাইভ সাইট থেকে নামে
     (উপরের প্যাচ), অর্থাৎ MyaI18n তৈরি হয় — কিন্তু সে অভিধান আনে
     `fetch('/i18n/<ভাষা>/<নাম>.json')` দিয়ে, আর অ্যাপে পাতাটা আসে
     `source={{html}}` থেকে যার ভিত্তি-ঠিকানা about:blank। ওখানে
     "/i18n/…" কোনো ঠিকানাই নয়, তাই প্রতিটি অভিধান নীরবে ব্যর্থ হতো —
     কোনো ত্রুটি নেই, শুধু গোটা PDF বাংলা।
     ⚠️ আর দ্বিতীয় ফাঁদ: কোন অভিধান লাগবে সেটা i18n.js ঠিকানা থেকে
     বার করে; about:blank-এ ঠিকানা খালি, তাই সে 'index' ধরে নিত —
     অর্থাৎ ঠিক অভিধানটা চাইতই না। পাতা নিজেই বলে দিলে সেটা মেটে। */
  { why: 'ছাপার পাতা নিজেই বলে দেয় কোন অভিধান তার দরকার (about:blank-এ ঠিকানা নেই)',
    find: '<html lang="bn-IN">\n<head>',
    to:   '<html lang="bn-IN" data-i18n-page="kundali-print">\n<head>\n'
        + '<script>/* অ্যাপ: রুট-নিরঙ্কুশ fetch লাইভ সাইটে পাঠানো — নইলে অভিধান আসে না */\n'
        + '(function(){var f=window.fetch;if(!f)return;window.fetch=function(u,o){'
        + 'try{if(typeof u===\'string\'&&u.charAt(0)===\'/\')u=\'https://myastrology.in\'+u;}catch(e){}'
        + 'return f.call(this,u,o);};})();<\/script>' },
  { why: 'রুট-নিরঙ্কুশ স্ক্রিপ্ট/স্টাইল file://-এ ৪০৪ — লাইভ সাইট থেকে',
    find: /(src|href)="\/(js|css)\//g, to: '$1="https://myastrology.in/$2/' },
];

let html = fs.readFileSync(SITE, 'utf8');
for (const p of PATCHES) {
  const before = html;
  html = html.replace(p.find, p.to);
  if (html === before) {
    console.error('✗ প্যাচ বসল না — সাইটের পাতা বদলেছে:\n   ' + p.why);
    process.exit(1);
  }
}

fs.writeFileSync(OUT,
  '// AUTO-GENERATED — হাতে সম্পাদনা করবেন না।\n' +
  '// Run: node scripts/build-kundali-print.js\n' +
  'export default ' + JSON.stringify(html) + ';\n', 'utf8');
console.log('✓ ' + path.relative(process.cwd(), OUT) + '  (' + html.length + ' অক্ষর, ' + PATCHES.length + 'টি প্যাচ)');
