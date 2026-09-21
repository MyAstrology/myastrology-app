// R8 চালু করার আসল কাজটা এখানে — একটা বিশুদ্ধ স্ট্রিং-রূপান্তর, কোনো
// নির্ভরতা ছাড়াই। কেন আলাদা ফাইলে: `withR8.js` `@expo/config-plugins`
// require করে, আর এই স্যান্ডবক্সে `node_modules` নেই। আলাদা রাখায়
// `npm run verify-r8` টেমপ্লেটের তিনটে চেনা আকৃতিই পরীক্ষা করতে পারে,
// কোনো কিছু ইনস্টল না করেই।

// Expo/RN টেমপ্লেটে লাইনটা সংস্করণভেদে তিন রকম দেখা গেছে —
//   SDK 50-ধাঁচ : minifyEnabled enableProguardInReleaseBuilds
//   পুরনো       : minifyEnabled false
//   SDK 53/54   : minifyEnabled (findProperty('android.enableMinifyInReleaseBuilds')?.toBoolean() ?: true)
// প্রথম সংস্করণে কেবল প্রথম দুটো ধরা হয়েছিল, তাই SDK 54-এ প্লাগিনটা
// নীরবে কিছুই করত না — আর Play Console "Obfuscation 1%" বলত।
const MINIFY_LINE = /minifyEnabled\s+(?:false|true|enableProguardInReleaseBuilds|\((?:[^()]|\([^()]*\))*\))/g;

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
  const out = src.replace(MINIFY_LINE, 'minifyEnabled true');
  // নিজের কাজটা নিজেই মিলিয়ে দেখা — "নিয়ম লেখা আছে" আর "নিয়ম খাটল"
  // এক কথা নয়।
  if (!/minifyEnabled true/.test(out)) {
    const e = new Error('[withR8] প্রতিস্থাপনের পরেও minifyEnabled true নেই।');
    e.r8 = true;
    throw e;
  }
  return out;
}

module.exports = { applyR8, MINIFY_LINE };
