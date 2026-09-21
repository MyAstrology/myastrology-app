// R8 চালু করার আসল কাজটা এখানে — একটা বিশুদ্ধ স্ট্রিং-রূপান্তর, কোনো
// নির্ভরতা ছাড়াই। কেন আলাদা ফাইলে: `withR8.js` `@expo/config-plugins`
// require করে, আর এই স্যান্ডবক্সে `node_modules` নেই। আলাদা রাখায়
// `npm run verify-r8` আসল টেমপ্লেট-ফাইলের উপরেই রূপান্তরটা চালিয়ে দেখতে
// পারে, কোনো কিছু ইনস্টল না করেই।

// ⛔ আগে এখানে আকৃতির তালিকা ছিল — `false|true|enableProguardInReleaseBuilds|
// (…)` — আর সেই তালিকাটা **আন্দাজে লেখা**, টেমপ্লেট দেখে নয়। SDK 54 আসলে
// লেখে `minifyEnabled enableMinifyInReleaseBuilds` (উপরে def করা একটা চলক),
// যা তালিকার কোনোটাই নয় — ফলে ০ মিল, আর prebuild থেমে গিয়ে বিল্ড ব্যর্থ।
//
// তাই এখন আর আকৃতি গোনা হয় না: লাইনটা যা-ই বলুক, গোটা লাইনটাই বদলে দেওয়া
// হয়। মিল হতে হবে ঠিক একবার — শূন্য বা একাধিক হলে থেমে যায়।
// ⚠️ নোঙরটা লাইনের শুরুতে, তাই `// minifyEnabled …` মন্তব্য ধরা পড়ে না,
// আর পাশের `shrinkResources` লাইনটা ছোঁয়াই হয় না (ওটাই ২০২৬-০৮-০৯-এ
// বিল্ড ভেঙেছিল)।
const MINIFY_LINE = /^([ \t]*)minifyEnabled[ \t]+\S.*$/gm;

function applyR8(src) {
  const hits = src.match(MINIFY_LINE);
  if (!hits || hits.length !== 1) {
    const e = new Error(
      '[withR8] app/build.gradle-এ minifyEnabled লাইনটা ঠিক একবার পাওয়া গেল না ('
      + (hits ? hits.length + ' বার: ' + hits.join(' | ') : '০ বার')
      + ')। টেমপ্লেট বদলেছে — অনুমানে হাত না দিয়ে বিল্ড থামানো হলো, '
      + 'কারণ নীরবে এড়িয়ে গেলে R8 ছাড়াই APK তৈরি হতো আর সেটা কেউ জানত না।'
    );
    e.r8 = true;
    throw e;
  }
  const out = src.replace(MINIFY_LINE, '$1minifyEnabled true');
  // নিজের কাজটা নিজেই মিলিয়ে দেখা — "নিয়ম লেখা আছে" আর "নিয়ম খাটল"
  // এক কথা নয়।
  if (!/^[ \t]*minifyEnabled[ \t]+true[ \t]*$/m.test(out)) {
    const e = new Error('[withR8] প্রতিস্থাপনের পরেও minifyEnabled true নেই।');
    e.r8 = true;
    throw e;
  }
  return out;
}

module.exports = { applyR8, MINIFY_LINE };
