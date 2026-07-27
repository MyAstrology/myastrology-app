#!/usr/bin/env node
/* স্ক্রিনগুলো দেরিতে (lazy) লোড হচ্ছে কিনা — regression check

   কেন দরকার: প্রতিটা ক্যালকুলেটর স্ক্রিন নিজের web-html/*.js বান্ডল static
   import করে, আর সেগুলো একেকটা বিশাল HTML স্ট্রিং (মোট ~১০.২MB)। BottomTabs
   যদি আবার `component={X}` স্টাইলে static import-এ ফিরে যায়, Metro অ্যাপ
   চালুর মুহূর্তেই সব মডিউল evaluate করবে — cold start ধীর হবে ও কম-RAM
   ফোনে ক্র্যাশের ঝুঁকি বাড়বে। নতুন স্ক্রিন যোগ করার সময় ভুলে static import
   করে ফেলা সবচেয়ে সহজ ভুল, আর সেটা চোখে পড়ে না (অ্যাপ ঠিকই চলে, শুধু
   ধীরে) — তাই এখানে বেঁধে রাখা।

   চালাতে: npm run check:lazy */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const NAV = path.join(ROOT, 'src', 'navigation', 'BottomTabs.js');
const SRC = fs.readFileSync(NAV, 'utf8');
let pass = 0, fail = 0;
const t = (n, c, x) => { c ? (pass++, console.log('  ✓ ' + n)) : (fail++, console.log('  ✗ ' + n + (x !== undefined ? '  → ' + JSON.stringify(x) : ''))); };

/* HomeScreen-ই initial route, প্রথম render-এ লাগেই — এটাই একমাত্র ছাড় */
const ALLOWED_EAGER = ['HomeScreen'];

console.log('\n১) BottomTabs.js — ভারী স্ক্রিন static import করা নেই');
{
  const eager = [...SRC.matchAll(/^import\s*\{?\s*(\w+)\s*\}?\s*from\s*'\.\.\/screens\/(\w+)'/gm)]
    .map(m => m[2]);
  t('static import কেবল অনুমোদিত স্ক্রিনে',
    eager.every(s => ALLOWED_EAGER.includes(s)), eager);
  t('HomeScreen static import আছে (initial route)', eager.includes('HomeScreen'));
}

console.log('\n২) বাকি সব স্ক্রিন getComponent দিয়ে বসানো');
{
  const screens = [...SRC.matchAll(/<Tab\.Screen\s+name="(\w+)"([\s\S]*?)\/>/g)]
    .map(m => ({ name: m[1], body: m[2] }));
  t('স্ক্রিন সংখ্যা ২০-এর বেশি (তালিকা কাটা পড়েনি)', screens.length > 20, screens.length);
  const eagerScreens = screens.filter(s => /\bcomponent=/.test(s.body) && !/\bgetComponent=/.test(s.body));
  t('component={} ব্যবহার কেবল Home-এ',
    eagerScreens.length === 1 && eagerScreens[0].name === 'Home',
    eagerScreens.map(s => s.name));
  const lazyScreens = screens.filter(s => /\bgetComponent=/.test(s.body));
  t('বাকি সবগুলোতে getComponent আছে',
    lazyScreens.length === screens.length - 1, { মোট: screens.length, lazy: lazyScreens.length });
}

console.log('\n৩) lazy ম্যাপের প্রতিটা পাথ ও নামযুক্ত এক্সপোর্ট সত্যি আছে');
{
  const pairs = [...SRC.matchAll(/require\('(\.\.\/screens\/\w+)'\)\.(\w+)/g)]
    .map(m => [path.join(ROOT, 'src', m[1].replace('../', '')) + '.js', m[2]]);
  t('lazy এন্ট্রি পাওয়া গেছে', pairs.length > 20, pairs.length);
  const missing = [], noExport = [];
  for (const [f, ex] of pairs) {
    if (!fs.existsSync(f)) { missing.push(path.basename(f)); continue; }
    const s = fs.readFileSync(f, 'utf8');
    const re = new RegExp('export\\s+(function|const|class)\\s+' + ex + '\\b|export\\s*\\{[^}]*\\b' + ex + '\\b');
    if (!re.test(s)) noExport.push(path.basename(f) + '→' + ex);
  }
  t('সব ফাইল আছে', missing.length === 0, missing);
  t('সব নামযুক্ত এক্সপোর্ট আছে', noExport.length === 0, noExport);
  /* একই পাথ দুবার লেখা থাকলে টাইপো ধরা পড়ে (যেমন ভুল স্ক্রিনে ম্যাপ করা) */
  const names = pairs.map(p => p[0]);
  t('একই স্ক্রিন-ফাইল দুবার ম্যাপ করা হয়নি', new Set(names).size === names.length);
}

console.log('\n৪) getComponent-এ import() নয়, require() — সিঙ্ক্রোনাস হতেই হবে');
{
  /* React Navigation-এর SceneView সরাসরি screen.getComponent() ডাকে এবং
     ফেরত মানকে কম্পোনেন্ট হিসেবে render করে; Promise ফেরালে ভাঙবে। */
  const lazyBlock = SRC.slice(SRC.indexOf('const lazy = {'), SRC.indexOf('const Tab ='));
  t('lazy ব্লকে dynamic import() নেই', !/\bimport\s*\(/.test(lazyBlock));
  t('lazy ব্লকে async/await নেই', !/\b(async|await)\b/.test(lazyBlock));
}

console.log('\n৫) স্ক্রিন-তালিকা অক্ষত (কোনোটা বাদ পড়েনি)');
{
  /* মেনু যেসব রুটে পাঠায়, সেগুলো নেভিগেটরে থাকতেই হবে — নইলে
     "The action 'NAVIGATE' was not handled" এসে ট্যাপ কাজ করবে না */
  const declared = new Set([...SRC.matchAll(/<Tab\.Screen\s+name="(\w+)"/g)].map(m => m[1]));
  const menu = fs.readFileSync(path.join(ROOT, 'src', 'navigation', 'menuItems.js'), 'utf8');
  const targets = [...menu.matchAll(/\btab:\s*'(\w+)'/g)].map(m => m[1]);
  const orphan = [...new Set(targets)].filter(x => !declared.has(x));
  t('মেনুর প্রতিটা গন্তব্য নেভিগেটরে ঘোষিত', orphan.length === 0, orphan);
}

console.log('\n=== pass=' + pass + '  fail=' + fail + ' ===');
process.exit(fail ? 1 : 0);
