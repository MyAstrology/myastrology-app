#!/usr/bin/env node
/**
 * অ্যাপের পঞ্চাঙ্গ ইঞ্জিন (src/engine/panchang_full.js) যাচাই।
 *
 * কেন দরকার: হোম স্ক্রিনের সময় আসে এই ইঞ্জিন থেকে, আর পঞ্জিকা ট্যাবের সময়
 * আসে ওয়েব-বান্ডলের নিজস্ব ইঞ্জিন থেকে। দুটো আলাদা হয়ে গেলে একই দিনের
 * সূর্যোদয় দুই জায়গায় দুরকম দেখায় — ২০২৬-০৮-০২-এ ঠিক তাই হয়েছিল
 * (হোমে ৫:১০, পঞ্জিকায় ৫:১২:০৭), আর ঠিক করতে দুবার লেগেছিল:
 *   · প্রথম চেষ্টা — শহর মেলানো। কাজ করেনি, কারণ ব্যবহারকারী শহরই বাছেননি।
 *   · দ্বিতীয় চেষ্টা — ডিফল্ট স্থানাঙ্ক মেলানো। তাতে ৫:১০ → ৫:০৮ হলো,
 *     অর্থাৎ আরও দূরে সরল — কারণ পার্থক্যটা স্থানের নয়, অ্যালগরিদমের।
 *   · আসল সমাধান — দেখানো সূর্যোদয়/সূর্যাস্তও PEph (পঞ্জিকা পাতার ইঞ্জিন)
 *     থেকেই নেওয়া।
 *
 * এই পরীক্ষা সেই একই ফাঁদ আবার খুলে গেলে সাথে সাথে ধরবে।
 *
 * চালান: node scripts/check-panchang.js
 */

const babel  = require('@babel/core');
const Module = require('module');

// src/engine/*.js ও vsop87-planets ES module — Node-এ চালাতে রূপান্তর দরকার
const origJs = Module._extensions['.js'];
Module._extensions['.js'] = function (m, f) {
  if (f.includes('/src/engine/') || f.includes('vsop87')) {
    m._compile(
      babel.transformFileSync(f, {
        presets: ['babel-preset-expo'], babelrc: false, configFile: false,
      }).code, f);
    return;
  }
  return origJs(m, f);
};

const eng   = require('../src/engine/panchang_full.js');
const PEphM = require('../src/engine/panjika-ephemeris.js');
const PEph  = PEphM.default || PEphM;

const DATES = ['2026-08-02', '2026-01-15', '2026-10-19', '2027-03-15', '2026-12-25'];

let fail = 0;
const ok   = (msg) => console.log('  ✓ ' + msg);
const bad  = (msg) => { fail++; console.log('  ✗ ' + msg); };

// ── ১. দেখানো সূর্যোদয়/সূর্যাস্ত পঞ্জিকার ইঞ্জিনের সাথেই মিলতে হবে ──
console.log('\n১. সূর্যোদয়/সূর্যাস্ত — পঞ্জিকা ইঞ্জিনের (PEph) সাথে মিল');
for (const d of DATES) {
  const p = eng.getPanchangForDate(d);
  if (!p) { bad(`${d}: ইঞ্জিন কিছুই ফেরত দেয়নি`); continue; }
  const want = { rise: PEph.hm(PEph.getSunrise(d)), set: PEph.hm(PEph.getSunset(d)) };
  if (p.sunrise === want.rise && p.sunset === want.set) {
    ok(`${d}  ${p.sunrise} / ${p.sunset}`);
  } else {
    bad(`${d}  হোম ${p.sunrise}/${p.sunset}  ≠  পঞ্জিকা ${want.rise}/${want.set}`);
  }
}

// ── ২. ডিফল্ট অবস্থান দুই ইঞ্জিনে এক থাকতে হবে ──
console.log('\n২. ডিফল্ট অবস্থান দুই জায়গায় এক');
const src = require('fs').readFileSync(
  require('path').join(__dirname, '..', 'src', 'engine', 'panchang_full.js'), 'utf8');
const latM = src.match(/const DEF_LAT = ([\d.]+)/);
const lonM = src.match(/const DEF_LON = ([\d.]+)/);
if (latM && lonM && Number(latM[1]) === PEph.LAT && Number(lonM[1]) === PEph.LNG) {
  ok(`DEF_LAT/LON ${latM[1]}/${lonM[1]} = PEph ${PEph.LAT}/${PEph.LNG}`);
} else {
  bad(`DEF_LAT/LON ${latM && latM[1]}/${lonM && lonM[1]} ≠ PEph ${PEph.LAT}/${PEph.LNG}`);
}

// ── ৩. ফেরত-আসা মানগুলো যুক্তিসঙ্গত ──
console.log('\n৩. মানগুলো যুক্তিসঙ্গত কি না');
for (const d of DATES) {
  const p = eng.getPanchangForDate(d);
  if (!p) continue;
  const probs = [];
  const hm = (t) => { if (!t || !/^\d\d:\d\d$/.test(t)) return null;
                      const [h, m] = t.split(':').map(Number); return h + m / 60; };
  const r = hm(p.sunrise), s = hm(p.sunset);
  if (r === null || s === null) probs.push('সূর্যোদয়/সূর্যাস্ত পড়া গেল না');
  else {
    if (!(r > 3 && r < 8))  probs.push(`সূর্যোদয় অস্বাভাবিক (${p.sunrise})`);
    if (!(s > 16 && s < 20)) probs.push(`সূর্যাস্ত অস্বাভাবিক (${p.sunset})`);
    if (!(s > r))            probs.push('সূর্যাস্ত সূর্যোদয়ের আগে!');
  }
  for (const k of ['tithi', 'nakshatra', 'yoga', 'karana', 'weekday']) {
    if (!p[k] || p[k] === '—') probs.push(`${k} খালি`);
  }
  if (probs.length) bad(`${d}: ${probs.join(' · ')}`); else ok(`${d} ঠিক আছে`);
}

console.log('');
if (fail) { console.error(`❌ ${fail}টি যাচাই ব্যর্থ`); process.exit(1); }
console.log('✅ পঞ্চাঙ্গ যাচাই সম্পন্ন — সব ঠিক');
