# MyAstrology app — Expo/React Native repo (`myastrology/myastrology-app`)

Mobile app for the MyAstrology website (myastrology.in). Expo (SDK 54) +
React Native, React Navigation bottom tabs, Firebase (Auth + Firestore),
OneSignal push. Most calculator screens are **not** native React Native UI —
they're a `WebView` (`src/components/LocalWebView.js`) rendering a
JS-bundled copy of the website's calculator pages.

## এই ফাইলটা কীভাবে পড়বেন

এখানে আছে **এখনো যেসব নিয়ম খাটে**। প্রতিটি নিয়মের পিছনের ঘটনার পুরো
বিবরণ (মাপ, ভুল পথ, যুক্তি) আছে `docs/history/CLAUDE-2026-09.md`-এ —
২২টি অধ্যায়, হুবহু। ⚠️ ওটা রোজ পড়ার জিনিস নয়; নির্দিষ্ট সিদ্ধান্তের কারণ
জানতে `grep` করুন।

⚠️ **নতুন কাজের নোট আর্কাইভে লিখুন**, এখানে নয়। এখানে কেবল তখনই যোগ
করুন যখন সেটা প্রতিবার খাটবে এমন নিয়ম — দুই-তিন লাইনে। দুটো CLAUDE.md
মিলে ৮ লাখ অক্ষর হয়ে গিয়েছিল আর প্রতিটি অনুরোধের সঙ্গে পুরোটা পাঠাতে হত।

## Sibling repo — this is the important one to know

The website lives in a **separate repo**, `myastrology/services` (on disk
in this sandbox at `/home/user/services` when both are checked out). That
repo has the canonical, human-edited source for each calculator
(`kundali.html`, `match-making.html`, `panjika.html`, `namakaran.html`,
etc). This repo's `src/web-html/*.js` files are **hand-bundled JS-string
copies** of those pages (`kundali.js`, `match-making.js`, `panjika.js`,
`namakaran.js`, `numerology.js`, `prashna.js`, `result.js`,
`varshaphala.js`, plus `-print.js` variants for PDF export) — each is
effectively "that HTML page, serialized into a JS string the WebView
injects."

**Consequence: a fix made in the website repo's `.html` files does not
automatically apply here.** It has to be manually ported into the matching
`src/web-html/*.js` file. These bundles are large (multi-MB single-line
strings) — don't regenerate one from scratch to make a small change.
Instead: read the target bundle, find the *exact* source snippet
corresponding to the website-side fix, and do a precise string replacement
(a small Python/Node script doing `count() == 1` before `replace()` is a
good safety check), then verify the file still parses. See git history
(e.g. the mahadasha `.toFixed(1)` display fix, ported the same day across
both repos with matching commit messages) for the pattern to follow.

When asked to fix something in a calculator's *display/logic*, always ask:
does this same code exist in both repos? If yes, port to both, and say so
explicitly rather than fixing only the one you were pointed at.

## Structure

- `src/screens/` — one file per screen (`HomeScreen.js`, `KundaliScreen.js`,
  `RashifalScreen.js`, `AdminScreen.js`, `SettingsScreen.js`, etc.)
- `src/components/LocalWebView.js` — the shared WebView wrapper that loads
  a `web-html/*.js` bundle; screens like `KundaliScreen.js` are thin
  wrappers around this
- `src/navigation/menuItems.js` — single source of truth for the app's menu
  list, consumed by both the drawer (`AppHeader.js`) and `BottomTabs.js`
  (hidden tabs use `tabBarItemStyle:{display:'none'}` for screens reached
  only via the menu, not the visible tab bar)
- `src/context/UserContext.js` — local profile, persisted to AsyncStorage
  (not tied to login)
- `src/context/AuthContext.js` — Firebase Auth (Google Sign-In), wraps
  `onAuthStateChanged`; on first sign-in upserts a `users/{uid}` Firestore
  doc
- `src/theme/` — `colors.js`, `radii.js`, `shadows.js`, `spacing.js`,
  `typography.js` — shared design tokens, use these instead of hardcoding
  values in a screen
- `firestore.rules` — admin allowlist (by email) gates `AdminScreen.js`'s
  Firestore reads; both this file and the client-side check in
  `AdminScreen.js` need updating together if the allowlist changes
- OneSignal App ID must match the website's `js/push-init.js` exactly (both
  register against the same OneSignal app so the site's existing daily
  cron-posted notifications reach the app too, with zero new server code)

## Testing / verification in this sandbox

- **No `node_modules` here** (not installed in this sandbox) — cannot run
  the app, a bundler, or Metro locally. Verify JS edits by syntax-checking
  (e.g. a babel-based parse check) rather than running the app, and say so
  plainly rather than claiming to have tested it live.
- Native-module features (OneSignal push, Google Sign-In via
  `@react-native-google-signin`) cannot be exercised in Expo Go — they need
  a custom dev client (`eas build --profile development`). That build step
  has to happen on the user's own machine/Expo account; hand them the exact
  commands rather than attempting it here.

## Porting one inlined `src/*.js` into a bundle — the safe, verifiable way

`scripts/bundle-web-assets.js` inlines each website `<script src="src/x.js">`
as `<script>/*src/x.js*/\n…\n</script>` inside the exported string. So a
whole engine file can be swapped **without** regenerating the bundle and
losing the hand-applied patches:

1. `JSON.parse` the `export default "…"` body back into the HTML string.
2. Find `<script>/*src/match-making.js*/\n` and the next `\n</script>`.
3. Replace only what is between them with the website file's contents.
4. Re-emit `export default ${JSON.stringify(html)};` with the same header.

**Then prove the edit was local**: assert the prefix before the block and
the suffix after it are character-identical to the originals. And **prove
the result is right**: re-decode the bundle, pull the block out, run it in
a `vm` context (`{window:{}, module:{exports:{}}}` is enough for
`match-making.js`), and compare `match()` output against the website engine
over a sweep — 6,048 couples, zero differences, is what "ported" should
mean. `node --check` alone only proves it parses.

This worked because `src/match-making.js` is self-contained — it defines
its own `MM_TEXT`/`_mm()`, and with no overlay loaded `_mm()` returns the
Bengali thunk, so the i18n plumbing is inert in the app and the Bengali
output is byte-identical. Check that self-containment before using this on
another file; an engine that expects a helper defined elsewhere in the page
will fail silently at runtime, not at parse time.

⚠️ The page-level code (`_mmDoshaNashakHtml`, `_MM_DOSHA_NAME`, …) is a
**separate** hand-maintained copy without the `_mp()` wrappers. Swapping
the engine does not update it — new `doshaNashak` keys need their Bengali
names added there by hand, or the reader sees a raw key like `rashi`.

## Termux থেকে `eas build` — দুটো বাধা (2026-09-07)

সহকর্মী ফোনে Termux দিয়েই বিল্ড করেন, আর সেখানে দুটো জিনিস আটকায়:

1. **`Expected 'concurrency' to be a number from 1 and up`** — `Failed to
   compute project fingerprint`-এর পরে, আর এতেই বিল্ড থেমে যায়। ফিঙ্গারপ্রিন্ট
   হিসাবটা CPU-সংখ্যা ধরে সমান্তরালতা ঠিক করে, আর Termux-এ ওই সংখ্যাটা ঠিকমতো
   পাওয়া যায় না। EAS নিজেই পথটা বলে দেয়:
   ```
   EAS_SKIP_AUTO_FINGERPRINT=1 eas build --platform android --profile production
   ```
   ⚠️ ফিঙ্গারপ্রিন্ট কেবল ক্যাশ/OTA মেলানোর কাজে লাগে — বাদ দিলে **তৈরি
   অ্যাপে কোনো পার্থক্য হয় না**।

2. **`git pull` আটকে যায় `app.json`-এ।** `autoIncrement` প্রতিবার
   `versionCode` বাড়িয়ে **app.json-এ লিখে দেয়**, কিন্তু সেটা কখনো কমিট করা
   হয় না — তাই ফাইলটা সবসময় "নোংরা" থাকে আর merge আটকায়।
   `git checkout app.json` দিয়ে ফেলে দিলেই চলে; পরের বিল্ড আবার ঠিক
   নম্বরেই বাড়াবে।

⚠️ **আর সেই কারণেই রিপোর `versionCode` হলো "ভিত্তি", প্রকাশিত নম্বর নয়** —
রিলিজ = ভিত্তি + ১। ভিত্তি না বাড়ালে পরের বিল্ড আগের রিলিজের নম্বরই বানায়
আর Play আপলোডটা **ত্রিশ মিনিটের বিল্ডের শেষে** ফিরিয়ে দেয়।

## ⛔ `node --check` এই রিপোতে কিছুই যাচাই করে না

ফাইল `import` দিয়ে শুরু হলে Node ওটাকে ESM ধরে নেয় এবং **সিনট্যাক্স
পরীক্ষাটাই এড়িয়ে যায়** — `const a = ((( ;` লেখা ফাইলও exit 0 দেয়।
অ্যাপের প্রতিটি স্ক্রিনই `import` দিয়ে শুরু, অর্থাৎ *"node --check দিয়ে
যাচাই করেছি"* এখানে **মিথ্যে সবুজ**।

`npm run check:parse` ব্যবহার করুন — babel থাকলে babel, নইলে গ্লোবাল
TypeScript-এর পার্সার (`/opt/node22/lib/node_modules/typescript`), যা JSX
বোঝে আর কেবল **পার্স** করে (টাইপ মেলায় না)। ⚠️ **কমিটের আগে চালান, পরে নয়** —
একবার ভাঙা `APP_CSS` template literal পুশ হয়ে গিয়েছিল।

## অ্যাপ তিন ভাষায় — কী কোথায়

| ফাইল | কী |
|---|---|
| `src/context/LanguageContext.js` | `lang` · `setLang` · `t()` · `n()` |
| `src/i18n/terms.js` | **তৈরি হয়** — হাতে সম্পাদনা করবেন না |
| `src/i18n/strings.js` | অ্যাপের নিজস্ব লেখা, হাতে অনূদিত |
| `src/i18n/Text.js` | ভাষা-সচেতন `<Text>` ও `useAlert()` |
| `scripts/build-app-terms.js` | services-এর অভিধান থেকে terms.js বানায় |

- **চাবি বাংলা লেখাটাই** — নতুন চাবি বানালে একটা বানান-ভুল নীরবে লাইনটাই মুছত।
- ⚠️ **৮০০+ জ্যোতিষ-নাম হাতে লেখা হয়নি।** নতুন নাম দরকার হলে **আগে
  ওয়েবসাইটের অভিধানে** যোগ করুন, তারপর `npm run build-app-terms`।
  সাইটের অভিধান বদলালেই এটা চালাতে হয় — কোনো পরীক্ষা "অভিধান বদলেছে কি না"
  জিজ্ঞেস করে না, তাই ধরা পড়ে অনেক দেরিতে।
- ⚠️ **টুকরো বাক্য চলবে না** — গোটা বাক্যটাই একটা চাবি, ভিতরে `{rashi}`
  প্লেসহোল্ডার। নইলে en/hi-তে শব্দক্রম ভাঙে।
- ⚠️ নতুন ফাইলে `<Text>` আনুন `src/i18n/Text` থেকে, `react-native` থেকে নয়।
- ⚠️ ভাষার বোতামের লেবেল অনূদিত হয় না (`<Text noTranslate>`)।

**ক্যালকুলেটর:** বাংলায় বান্ডল, en/hi-তে লাইভ পাতা
(`https://myastrology.in/<lang>/<webPath>`)। নেট না থাকলে বাংলায় ফেরা হয়,
**কিন্তু নীরবে নয়** — নিচে এক লাইনে বলা হয়। নতুন `webPath` বসালে সাইটে ওই
পথের `/en/` ও `/hi/` ফাইল **থাকতেই হবে**।

⚠️ **`KundaliScreen` নিজের WebView চালায়** — `LocalWebView`-এর প্রতিটি
সংশোধন ওখানে **আলাদা করে** বসাতে হয়। একই কারণে পাঁচটা জিনিস বাদ পড়েছে
(ভাষা-রুটিং, ভাষা-সারি ঢাকা, Play-বিজ্ঞাপন ঢাকা, ব্যাক-পুনরুদ্ধার,
`handleBuyOnWeb`-এর দ্বিতীয় আর্গুমেন্ট)। `PanchangScreen`-ও নিজেরটা চালায়।

⚠️ **module-স্তরে ধরা মান ভাষা জমিয়ে ফেলে** — `INJECTED_JS`,
`RESULTS_TRACKER_JS`, `setCurrentLang` — আটবার ধরা পড়েছে। `useMemo`-তে
রাখুন, আর `setCurrentLang` Provider-এর **রেন্ডারেই** চালান।

⚠️ **অ্যাপ নিজেও DOM-এ লেখা ঢোকায়** — পাতায় বাংলা দেখলে ধরে নেবেন না
সেটা ওয়েবসাইটের; দুই রিপোতেই খুঁজুন।

⚠️ **extractor-এর দুটো অন্ধ দিক ছিল** — একটামাত্র অ্যাপোস্ট্রফি গোটা ফাইল
অদৃশ্য করে দিত, আর বহু-লাইনের JSX লেখা ধরা পড়ত না। নতুন আকৃতিতে লেখা
বসালে **উল্টো দিকে চালিয়ে দেখুন extractor সেটা দেখে কি না**।

## Play Billing — যে নিয়মগুলো ভাঙলে টাকা নিয়েও কিছু দেওয়া হয় না

- ⛔ **নির্ভরতার major সংখ্যা বাড়লে কোড নীরবে ভুল হয়ে যায়** — বিল্ড সফল,
  পার্স সফল, শুধু চলে না। `react-native-iap` ১৪+ থেকে API পুরো নতুন:
  `fetchProducts({skus,type:'in-app'})`, `requestPurchase({request:{google:
  {skus}},type:'in-app'})`, আর **ফল আসে `purchaseUpdatedListener`-এ,
  ফেরত-মানে নয়**। `verify-play-billing`-এর ⑩ অংশ package.json-এর সংখ্যা
  পড়ে কোডের আকৃতি মেলায়।
- ⛔ **`requestPurchase()`-এর আগে `fetchProducts()` ডাকতেই হয়** — Play-র
  `launchBillingFlow()` ProductDetails ছাড়া চলে না, আর `type:'in-app'` পাঠালে
  লাইব্রেরির নিজের উদ্ধার-পথটিও চলে না (`HybridRnIap.kt`)। বাদ পড়লে Play
  `[developer-error]` দেয় — বিল্ড সফল, পার্স সফল, কেবল কেনা হয় না।
- ⛔ **ক্রম: `ensureReady()` → পাওনা মেটানো → তবেই নতুন ক্রয়।** নইলে
  অ্যাপ নতুন চালু হওয়ার পর প্রথম কেনায় **দু'বার টাকা কাটত**।
- ⛔ **`ask()` পড়ার সঙ্গে সঙ্গে `__myaProduct` মুছে দেয়** — নইলে ₹৫০১-এর
  পর্দা বাতিল করে ₹১০১ কিনলে Play-তে ₹৫০১ কাটত। একক-পথের কোনো পরীক্ষা
  এটা ধরত না।
- ⛔ **`handleBuyOnWeb(msg, inject)` — দ্বিতীয় আর্গুমেন্ট ছাড়া ডাকলে**
  JS কোনো ত্রুটি দেয় না, লগে কিছু লেখে না, আর নীরবে ব্রাউজারে পাঠায়।
- ⚠️ **ওভারলে খুলতে `display` **ও** `opacity` দুটোই** — নইলে DOM-এ আছে,
  পর্দা ফাঁকা।
- ⚠️ **বান্ডলে থাকা আর ওয়েবসাইটে থাকা এক নয়** — বাংলা পাঠক বান্ডল দেখেন,
  তাই পরীক্ষা দু'দিকেই করতে হয়।
- ⚠️ **নীতি:** PDF রিপোর্ট Play-র "Digital items", তাই অ্যাপ থেকে
  ব্রাউজারে পাঠিয়ে Razorpay-তে কেনানো নিষেধের মধ্যে পড়ে। ₹১৫০১-এর
  ১:১ পরামর্শের ছাড় আছে, কিন্তু সঙ্গে PDF যায় বলে বান্ডল হিসেবে নিশ্চিত নয়।
  ভারতে alternative billing **মেপে বাদ** — কমিশন ১৫% → ১১%, বছরে ~₹৪,৯০০,
  আর তার জন্য PCI DSS ও দুটো পেমেন্ট-প্রবাহ।
- 💡 **ওয়েবসাইটে Google একটাও পয়সা নেয় না** — ভারতীয় ক্রেতাকে ওয়েবসাইটেই
  রাখা লাভজনক; অ্যাপের Play Billing মূলত বিদেশি ক্রেতার জন্য।

## R8 / বিল্ড

- ⛔ **"প্লাগিনটা আছে" আর "প্লাগিনটা কাজ করেছে" এক নয়।** `withR8.js`-এর
  regex টেমপ্লেট-আকৃতি চিনত না, তাই নীরবে ফিরে যেত আর প্রতিটি রিলিজ
  minify ছাড়াই যেত (Play Console-এ Obfuscation ১%)। এখন **না চিনলে বিল্ড
  থেমে যায়**।
- ⛔ **আর সেই সংশোধনী আকৃতিও আন্দাজে লেখা ছিল** (২০২৬-০৯-২১, বিল্ড
  ব্যর্থ) — SDK 54 আসলে লেখে `minifyEnabled enableMinifyInReleaseBuilds`
  (উপরে def করা একটা চলক), যা তিনটে আকৃতির একটাও নয়। `verify-r8`
  ৭/৭ সবুজ ছিল, আর EAS-এ prebuild ব্যর্থ — কারণ সে **আমার লেখা
  আকৃতি** পরীক্ষা করত, টেমপ্লেটের আসল লাইনটা নয়। এখন আকৃতি গোনা
  হয় না (গোটা লাইনটাই বদলায়, মিল ঠিক একবার হতে হবে), আর `verify-r8`
  চলে **আসল টেমপ্লেট-ফাইলের উপর**
  (`plugins/__fixtures__/sdk54-app-build.gradle`, npm থেকে নেওয়া)।
  ⚠️ **Expo-র SDK বাড়ালে ফিক্সচারটাও নতুন করে নামান।**
- ⚠️ `shrinkResources` ছোঁয়া হয় না — ওটাই ২০২৬-০৮-০৯-এ বিল্ড ভেঙেছিল।
- ⚠️ `app.json`-এর `versionCode` হলো **ভিত্তি**; `autoIncrement` বিল্ডের
  সময় +১ করে। প্রকাশিত নম্বরের চেয়ে ভিত্তি ছোট হলে Play আপলোড **ত্রিশ
  মিনিটের বিল্ডের শেষে** ফিরিয়ে দেয়। এখন ভিত্তি **২৩**, সংস্করণ **১.২.১** (প্রকাশিত ২৩)।

## বিল্ডের আগে — সব সবুজ কি না

```
npm run check:parse          # ৮০ ফাইল + ১৩ বান্ডল (node --check নয়!)
npm run verify-app-i18n      # ভাষা, t()-এর scope, দুই WebView, webPath
npm run verify-print-bundle  # kundali-print বান্ডল জেনারেটরের সঙ্গে মেলে
npm run verify-play-billing  # API-আকৃতি, ক্রম, চিহ্ন-মোছা, দুই দিক
npm run verify-app-a11y      # কেবল-আইকন বোতামে লেবেল
npm run verify-r8            # minify সত্যিই চালু
npm run verify-panchang-match
npm run verify-hook-order    # React hook-এর ক্রম
npm run check:startup        # চালু হওয়ার পথ
npm run check:sync           # src/engine সাইটের সঙ্গে মেলে
npm run check:engine-drift   # বান্ডলের ইনলাইন ইঞ্জিন কত পিছিয়ে (রেখাচিহ্ন ২)
```

⚠️ **`check:engine-drift`-এর রেখাচিহ্ন ২** — `result.js`-এর `js/main.js` ও
compatibility-renderer, দুটোই ঘোষিত হাতে-প্যাচ করা ফর্ক। **বাড়লে লাল।**

⚠️ **এখনো বাকি (বিল্ড আটকায় না):** `kundali-print.js` ও
`match-making-print.js`-এর ছাপার নকশা ওয়েবসাইটের চেয়ে পিছিয়ে; Play Billing-এর
আসল ক্রয় License testing-এ চালানো (কেবল ডিভাইসে); en/hi নমুনা PDF R2-তে তোলা।

⚠️ **অ্যাপে চেহারা ভাঙা দেখলে আগে একই পাতা ফোনের Chrome-এ খুলুন** — দুই
জায়গায় দুই ফল মানে দোষ বান্ডলে, কোডে নয়। এক প্রশ্নেই ছাপার পাতার চারটে
অভিযোগ মিটেছিল।

## Git / branches

This repo's history shows direct commits landing on `main` (not
feature-branch + merge) — match that pattern unless told otherwise, but
still confirm before pushing anything user-visible/hard-to-reverse (native
builds, Firestore rules changes, OneSignal config).

## Conventions

- Commit messages and in-app strings are Bengali; comments explain *why*
  (a constraint, a past bug, a platform quirk), not *what* — follow that
  pattern rather than adding narrative comments.
