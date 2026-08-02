#!/usr/bin/env node
/**
 * অ্যাপ খোলার স্প্ল্যাশ যাচাই — বিল্ড করার আগেই।
 *
 * কেন দরকার (২০২৬-০৮-০২-এর শিক্ষা): অ্যাপ খুললে ছবিটা দুবার দেখানো হয় —
 * প্রথমে অ্যান্ড্রয়েডের নিজের স্প্ল্যাশ (app.json-এর expo-splash-screen),
 * তারপরই App.js-এর <SplashOverlay>। **দুটোতে একই ছবি একই মাপে না থাকলে**
 * চোখে একটা ধাক্কার মতো লাফ লাগে, অথচ কোড দেখে সেটা বোঝার উপায় নেই —
 * ফোনে অ্যাপ খুলে না দেখা পর্যন্ত ধরা পড়ে না।
 *
 * এই স্ক্রিপ্ট তিনটে জিনিস মেলায়:
 *   ১. দুই জায়গায় ছবি একই কি না
 *   ২. দুই জায়গায় প্রস্থ (imageWidth ↔ SPLASH_IMAGE_WIDTH) একই কি না
 *   ৩. ওভারলে "cover" ব্যবহার করছে কি না — করলে ছবির দুপাশ কেটে যায়
 *      (এই ভুলেই "MYASTROLOGY" লেখার প্রথম ও শেষ অক্ষর কাটা পড়ছিল)
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const problems = [];

const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
const plugin = (appJson.expo.plugins || []).find(
  p => Array.isArray(p) && p[0] === 'expo-splash-screen'
);
if (!plugin) {
  problems.push('app.json-এ expo-splash-screen প্লাগইন নেই');
}

// মন্তব্য বাদ দিয়ে পড়া — নাহলে "আগে cover ছিল, সেটা ভুল" জাতীয় ব্যাখ্যামূলক
// মন্তব্যকেই স্ক্রিপ্ট আসল কোড ভেবে অভিযোগ করবে
const overlaySrc = fs.readFileSync(
  path.join(ROOT, 'src', 'components', 'SplashOverlay.js'), 'utf8'
).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

if (plugin) {
  const cfg = plugin[1] || {};

  // ১. একই ছবি?
  const osImage = String(cfg.image || '').split('/').pop();
  const m = overlaySrc.match(/require\(\s*['"][^'"]*\/([\w.-]+\.png)['"]\s*\)/);
  const ovImage = m ? m[1] : null;
  if (!ovImage) {
    problems.push('SplashOverlay.js-এ কোন ছবি ব্যবহার হচ্ছে বোঝা গেল না');
  } else if (ovImage !== osImage) {
    problems.push(
      `স্প্ল্যাশ ছবি আলাদা — app.json: "${osImage}", SplashOverlay: "${ovImage}". ` +
      `অ্যাপ খোলার সময় ছবি বদলে যাবে, চোখে লাফ লাগবে`
    );
  }

  // ২. একই প্রস্থ?
  const mw = overlaySrc.match(/SPLASH_IMAGE_WIDTH\s*=\s*(\d+)/);
  const ovWidth = mw ? Number(mw[1]) : null;
  if (ovWidth === null) {
    problems.push('SplashOverlay.js-এ SPLASH_IMAGE_WIDTH পাওয়া গেল না');
  } else if (Number(cfg.imageWidth) !== ovWidth) {
    problems.push(
      `স্প্ল্যাশ ছবির প্রস্থ মিলছে না — app.json imageWidth: ${cfg.imageWidth}, ` +
      `SplashOverlay SPLASH_IMAGE_WIDTH: ${ovWidth}. ছবিটা হঠাৎ ছোট/বড় হয়ে যাবে`
    );
  }

  if (cfg.resizeMode !== 'contain') {
    problems.push(
      `app.json-এ resizeMode "${cfg.resizeMode}" — "contain" হওয়া উচিত, ` +
      `নাহলে ছবির অংশ কেটে যায়`
    );
  }
}

// ৩. ওভারলে cover ব্যবহার করছে?
if (/resizeMode\s*=\s*["']cover["']/.test(overlaySrc)) {
  problems.push(
    'SplashOverlay resizeMode="cover" ব্যবহার করছে — ছবির অনুপাত (১:১.৫) আর ' +
    'ফোনের পর্দার অনুপাত (১:২.২) আলাদা, তাই দুপাশ থেকে ~৩১% কেটে যাবে ' +
    '("MYASTROLOGY" লেখার প্রথম ও শেষ অক্ষর হারাবে). "contain" ব্যবহার করুন'
  );
}

if (problems.length) {
  console.error('❌ স্প্ল্যাশে সমস্যা:\n');
  problems.forEach(p => console.error('  · ' + p));
  process.exit(1);
}
console.log('✅ স্প্ল্যাশ যাচাই সম্পন্ন — OS স্প্ল্যাশ ও ওভারলে একই ছবি, একই মাপ');
