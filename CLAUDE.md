# MyAstrology app — Expo/React Native repo (`myastrology/myastrology-app`)

Mobile app for the MyAstrology website (myastrology.in). Expo (SDK 54) +
React Native, React Navigation bottom tabs, Firebase (Auth + Firestore),
OneSignal push. Most calculator screens are **not** native React Native UI —
they're a `WebView` (`src/components/LocalWebView.js`) rendering a
JS-bundled copy of the website's calculator pages.

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

## Git / branches

This repo's history shows direct commits landing on `main` (not
feature-branch + merge) — match that pattern unless told otherwise, but
still confirm before pushing anything user-visible/hard-to-reverse (native
builds, Firestore rules changes, OneSignal config).

## Conventions

- Commit messages and in-app strings are Bengali; comments explain *why*
  (a constraint, a past bug, a platform quirk), not *what* — follow that
  pattern rather than adding narrative comments.

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

## অ্যাপ তিন ভাষায় — কী কোথায়, আর কোনটা ছোঁবেন না (2026-09-06)

সেটিংসে ভাষা বাছাই আছে (বাংলা ডিফল্ট, AsyncStorage-এ থাকে)। কাঠামোটা
ওয়েবসাইটের প্রমাণিত ধাঁচেই, কিন্তু নেটিভে:

| ফাইল | কী |
|---|---|
| `src/context/LanguageContext.js` | `lang` · `setLang` · `t()` · `n()` (অঙ্ক) |
| `src/i18n/terms.js` | **তৈরি হয়** — হাতে সম্পাদনা করবেন না |
| `src/i18n/strings.js` | অ্যাপের নিজস্ব ২৮৪টি লেখা, হাতে অনূদিত |
| `src/i18n/Text.js` | ভাষা-সচেতন `<Text>` ও `useAlert()` |
| `scripts/build-app-terms.js` | terms.js বানায় services-এর অভিধান থেকে |
| `scripts/verify-app-i18n.js` | ৯টি পরীক্ষা |

**চাবি বাংলা লেখাটাই।** নতুন চাবি বানালে একটা বানান-ভুল নীরবে গোটা লাইনটাই
মুছে দিত; বাংলা-চাবিতে খারাপ হলে সবচেয়ে বেশি যা হয়, বাংলাটাই দেখা যায়।

### ⚠️ ৭৮৮টি জ্যোতিষ-নাম হাতে লেখা হয়নি — লিখবেনও না

তিথি, নক্ষত্র, যোগ, করণ, রাশি, উৎসবের নাম সবই `services/i18n/{en,hi}/*.json`
থেকে পড়া। **নতুন নাম দরকার হলে আগে ওয়েবসাইটের অভিধানে যোগ করুন, তারপর
`npm run build-app-terms`** — এখানে টাইপ করলে সেটাই দ্বিতীয় কপি, আর একদিন
অ্যাপে এক বানান সাইটে অন্য বানান দেখাবে। `verify-app-i18n`-এর ③ অংশ
প্রতিবার দুটো মিলিয়ে দেখে।

### লেখা যোগ করার নিয়ম

`<Text>` ইতিমধ্যেই মোড়ানো, তাই **নতুন বাংলা লেখা বসালে কিছু করতে হয় না** —
শুধু `npm run verify-app-i18n` চালালে সে বলে দেবে অনুবাদ দুটো লাগবে।
নতুন ফাইলে `<Text>` আনলে `react-native` থেকে নয়, `src/i18n/Text` থেকে
আনতে হবে; ④ অংশ সেটা পাহারা দেয়।

⚠️ **টুকরো বাক্য চলবে না।** `<Text>আজ চন্দ্র <Text>{rashi}</Text> রাশিতে</Text>`
ইংরেজি/হিন্দিতে শব্দক্রম ভেঙে দেয়। গোটা বাক্যটাই একটা চাবি, ভিতরে
`{rashi}` প্লেসহোল্ডার — `RashifalScreen.js` ও `HomeScreen.js`-এ নজির আছে।

⚠️ **ভাষার বোতামের লেবেল অনুবাদ হয় না** (`<Text noTranslate>`)। "বাংলা"
অনূদিত হলে ইংরেজি পাঠক "Bengali" দেখতেন — আর বাংলা পাঠক ফেরার পথ খুঁজে
পেতেন না।

### ক্যালকুলেটর — বাংলায় বান্ডল, en/hi-তে লাইভ পাতা

মেপে দেখা: **দশটা `web-html/*.js` বান্ডলের একটিতেও অনুবাদ-যন্ত্রপাতি নেই**
(`MyaI18n`/`ENGINE_I18N` শূন্য)। ওভারলে বান্ডলে ঢোকালে একা কুণ্ডলীতেই কাঁচা
১.৪ MB (en) + ২.৯ MB (hi) বাড়ত। তাই `LocalWebView`-এ `webPath` প্রপ:
ভাষা en/hi হলে `https://myastrology.in/<lang>/<webPath>` খোলে, বাংলায়
বান্ডল। কুণ্ডলী স্ক্রিন নিজের WebView চালায়, তাই সেখানে আলাদা করে বসানো।

- ⚠️ **বাংলা পাঠকের কিছুই বদলায়নি** — অফলাইনে আগের মতোই চলে।
- ⚠️ নেট না থাকলে বাংলায় ফেরা হয়, **কিন্তু নীরবে নয়** — নিচে এক লাইনে বলা
  হয়। "ইংরেজি খোলস, বাংলা ভিতর" নীরবে দেখানোটাই এই দুই রিপোর সবচেয়ে
  বেশিবার নথিভুক্ত ব্যর্থতা।
- ⚠️ নতুন `webPath` বসালে সাইটে ওই পথের `/en/` ও `/hi/` ফাইল **থাকতেই হবে**
  — ⑥ অংশ ডিস্কে দেখে নেয়; না থাকলে পাঠক ৪০৪ পেতেন, যা বাংলা দেখানোর
  চেয়েও খারাপ।

### ⛔⛔ `node --check` এই রিপোতে কিছুই যাচাই করে না

ফাইল `import` দিয়ে শুরু হলে Node ওটাকে ESM ধরে নেয় এবং **সিনট্যাক্স
পরীক্ষাটাই এড়িয়ে যায়**। মেপে দেখা: `const a = ((( ;` লেখা একটা ফাইলও
`node --check` exit 0 দেয়। অ্যাপের প্রতিটি স্ক্রিনই `import` দিয়ে শুরু —
অর্থাৎ "node --check দিয়ে যাচাই করেছি" বলাটা এখানে **মিথ্যে সবুজ**।

@babel/core এই স্যান্ডবক্সে নেই, কিন্তু **গ্লোবাল TypeScript-এর পার্সার
আছে** (`/opt/node22/lib/node_modules/typescript`) আর সেটি JSX বোঝে:

```js
const sf = ts.createSourceFile('x.tsx', src, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
if (sf.parseDiagnostics.length) { /* সত্যিকারের সিনট্যাক্স-ত্রুটি */ }
```

কেবল **পার্স** করা হয়, টাইপ মেলানো নয় — তাই react-native-এর টাইপ না
থাকলেও চলে। `scripts/check-parse.js` ও `verify-app-i18n` দুটোই এখন এটাই
ব্যবহার করে (babel থাকলে babel, নইলে এটা)। **JSX-ওয়ালা কোনো ফাইলে
`node --check`-এর উপর ভরসা করবেন না।**

⚠️ `npm run check:panchang` এই স্যান্ডবক্সে চলে না (MODULE_NOT_FOUND) —
আগে থেকেই, এই কাজের সঙ্গে সম্পর্ক নেই।

### প্রথম চালুর ভাষা-পর্দা (2026-09-06)

`src/components/LanguageGate.js` — ঠিক একবার দেখানো হয়, App.js-এ
`<LanguageGate />` হিসেবে বসানো। তিন ভাষার শিরোনামই পাশাপাশি থাকে,
কারণ পাঠক তখনো ভাষাই বাছেননি।

- **ফোনের ভাষা কেবল প্রি-সিলেক্ট, নিজে থেকে বসে না।** বহু বাংলাভাষী
  পাঠকের ফোন ইংরেজিতে সেট করা — নীরবে বদলে দিলে তাঁরা হঠাৎ অন্য ভাষার
  অ্যাপ পেতেন। `src/utils/deviceLang.js` (নতুন dependency ছাড়া)।
- **"বেছেছেন" আলাদা চাবিতে** (`CHOSEN_KEY`) — "বাংলা বেছেছেন" আর "কিছু
  বাছেননি, তাই বাংলা" এক জিনিস নয়। এক চাবিতে রাখলে পর্দাটা হয় বারবার
  আসত, নয় কখনোই আসত না।
- এই ফাইলটা `verify-app-i18n`-এর `NO_TRANSLATE` তালিকায় — **আর ছাড়টা
  যাচাইও করা হয়** (⑦): ফাইলে তিন ভাষার লেখা সত্যিই আছে কি না। নইলে
  "ব্যতিক্রম" মানে দাঁড়াত যা খুশি অনূদিত না রাখার ছাড়পত্র।

### ⛔ deep link-এ ভাষা-উপসর্গ

`/en/kundali` বা `/hi/match-making` লিংক কোনো পর্দার সঙ্গে মিলত না —
পাঠক সাধারণ WebPage-এ পড়তেন, ক্যালকুলেটরটাই খুলত না। `linking.js`-এ
উপসর্গ ছাঁটা হয় এখন।

⚠️ **ছাঁটার পর সাধারণ ম্যাচারকেও ছাঁটা ঠিকানাটাই দিতে হয়** —
`getStateFromPath(clean)`, `path` নয়। প্রথম চেষ্টায় আসলটাই দিচ্ছিলাম,
তাতে গোটা ছাঁটাই নীরবে বৃথা যেত।

⚠️ **উপসর্গ দেখে অ্যাপের ভাষা বদলানো হয় না** — একটা লিংকে চাপ দিয়ে
কারো নিজের পছন্দ মুছে যাওয়া উচিত নয়।

### অ্যাপের আকারে তিন ভাষার খরচ — মেপে দেখা

| | |
|---|---|
| ইংরেজি অনুবাদ | ৩২ KB |
| হিন্দি অনুবাদ | ৭০ KB |
| **দুই ভাষা বাদ দিলে বাঁচত** | **১০২ KB — গোটা অ্যাপের ০.৫%** |
| web-html বান্ডল | ১০,৫০৮ KB |
| assets | ৬,৮৮৬ KB |

**অর্থাৎ "এক ভাষা দেখালে অ্যাপ ছোট হবে" — হয় না।** ভাষা বাছাই চলে
রানটাইমে; তিনটে সারণীই APK-তে থাকে। Play-র ভাষা-ভিত্তিক ডেলিভারি কেবল
Android-এর `res/values-xx/strings.xml`-এ কাজ করে, JS বান্ডলের ভিতরের
লেখায় নয়। **আকার কমাতে হলে দেখতে হবে `web-html` (১০.৫ MB) ও assets
(৬.৯ MB)** — অনুবাদ নয়।

## ⛔ Play-র পেমেন্ট-নীতি — কোডে লেখা দাবিটা ভুল ছিল (2026-09-06)

সহকর্মী Google-এর নিজের পাতাটা পাঠান
(`support.google.com/googleplay/android-developer/answer/10281818`), আর
তাতেই ধরা পড়ল `buyOnWebBridge.js`-এ লেখা ছিল:

> "Play-র নিয়মে অ্যাপের বাইরের কেনাকাটা সম্পূর্ণ ঠিক"

**সেটা ভুল।** পাতার নিজের ভাষা:

> "Within an app, developers may not lead users to a payment method other
> than Google Play's billing system unless Section 3, 8 or 9 of the
> payments policy applies."

PDF রিপোর্ট ওই পাতার তালিকায় **"Digital items"**, তাই অ্যাপ থেকে
ব্রাউজারে পাঠিয়ে Razorpay-তে কেনানো নিষেধের মধ্যেই পড়ে। অর্থাৎ
**Play Billing চালু করা উন্নতি নয়, সংশোধন।**

⚠️ তবু হ্যান্ড-অফটা এখনই তোলা যায় না — Play Billing পরীক্ষিত না হওয়া
পর্যন্ত ওটাই অ্যাপ থেকে কেনার একমাত্র পথ। ক্রম: বিল্ড → প্রোডাক্ট →
License testing → **তারপর** ফলব্যাক বাদ।

### ₹১৫০১ — ছাড়ের শর্ত আছে, কিন্তু আমাদের বান্ডলে খাটে না

একই পাতা:

> "If your app provides a 1:1 online paid service, you are not required to
> use Google Play's billing system if: the paid service is between two
> individuals [and] the paid service is not available for replay afterwards."

ফোনে সরাসরি পরামর্শ ১:১ ও রেকর্ড-বিহীন — শর্ত মেটে। **কিন্তু সঙ্গে একটা
PDF রিপোর্টও যায়**, যা পরে বারবার পড়া যায় ("available for replay")।
তাই বান্ডল হিসেবে ছাড়টা নিশ্চিত নয় — Play Billing-ই বসানো আছে।
Play Billing *ব্যবহার* করায় কখনো আপত্তি হয় না; না করলেই সমস্যা।

💡 কেবল-পরামর্শ (PDF ছাড়া) আলাদা সেবা হিসেবে বেচলে ছাড়টা পুরোপুরি
খাটত — প্রতি অর্ডারে ~₹১৯৫ বেশি। সেটা সহকর্মীর ব্যবসায়িক সিদ্ধান্ত।

⚠️ **সাধারণ শিক্ষা, আর এটাই এই ফাইলের সবচেয়ে পুরনো নিয়মের নতুন রূপ:**
কোডের মন্তব্যে লেখা একটা **নীতি-দাবিও** যাচাই করতে হয়। এটা কারো
অনুমান থেকে কোডে ঢুকেছিল, বছরখানেক টিকে ছিল, আর আমি নিজেও একবার সেটা
সহকর্মীকে বলে ফেলেছিলাম — মূল সূত্র না দেখে।

### ভারতে alternative billing — সম্ভব, কিন্তু হিসাব কষে বাদ (2026-09-06)

সহকর্মী জানতে চান ভারতে Razorpay ও বিদেশে Play Billing রাখা যায় কি না,
আর Razorpay হলে Google কমিশন নেয় কি না। Google-এর নিজের পাতা
(`answer/13306652`) দুটোরই উত্তর দেয়:

- ব্যবস্থাটা **alongside**, instead নয় — ভারতে "শুধু Razorpay" রাখা যায় না,
  দুটোই পাশাপাশি দেখাতে হয়।
- **কমিশন থাকেই**, কেবল "reduced by 4%" — ১৫% → ১১%, শূন্য নয়।

প্রতি অর্ডারে বাড়তি: ₹১০১-এ ₹২ · ₹৫০১-এ ₹১০ · ₹১৫০১-এ ₹৩০।
বর্তমান বিক্রির অনুমানে **বছরে ~₹৪,৯০০** — আর তার জন্য লাগে PCI DSS
সার্টিফিকেশন, জালিয়াতি-রিপোর্টের ব্যবস্থা, প্রতিটি লেনদেন ২৪ ঘণ্টায়
API দিয়ে Google-কে জানানো, আর অ্যাপে দুটো পেমেন্ট-প্রবাহ।

⛔ **করা হয়নি** — এই আকারে লাভজনক নয়। বিক্রি অনেক বড় হলে আবার কষা যাবে।

💡 আর আসল কথাটা: **ওয়েবসাইটে Google একটাও পয়সা নেয় না।** ₹৫০১-এ
ওয়েবসাইটে ₹৪৯১ বনাম অ্যাপে ₹৪২৬। তাই ভারতীয় ক্রেতাকে ওয়েবসাইটেই রাখা
সবচেয়ে লাভজনক; অ্যাপের Play Billing মূলত **বিদেশি ক্রেতার জন্য**, যাঁরা
আগে Razorpay-তে টাকাই দিতে পারতেন না।

## Play Billing — কেনা ও ডেলিভারি একই পথে (2026-09-07)

`handleBuyOnWeb(msg, inject)` এখন দুই পথের যেকোনো একটাতে যায়, তৃতীয় পথ
নেই: **আনলক জানা আছে ও লাইব্রেরি আছে → Play Billing; নইলে আগের মতো
ব্রাউজার।** শর্তটা `UNLOCK_JS[product] && billing.isAvailable()` —
অর্থাৎ *টাকা নেওয়ার আগে ডেলিভারির পথটা জানা আছে কি না*, সেটাই একমাত্র
প্রশ্ন। জানা না থাকলে টাকাই নেওয়া হয় না।

| ফাইল | কী |
|---|---|
| `src/config/products.js` | ৭টি consumable, চাবি ওয়েবসাইটের `pricing/config`-এর হুবহু এক |
| `src/utils/billing.js` | Play-র সঙ্গে কথা, সার্ভার-যাচাই, `ensureReady()` |
| `src/utils/billingUnlock.js` | কেনার পরে পাতাকে যা বলা হয় |
| `src/utils/billingPending.js` | টাকা কাটার পরেও ডেলিভারি বাকি থাকলে |
| `scripts/verify-play-billing.js` | ২৩টি পরীক্ষা |

⚠️ **আনলকের লাইনগুলো নতুন লেখা হয়নি** — ওয়েবসাইটের নিজের
`handler:function(){…}` থেকে তোলা। দ্বিতীয় ডেলিভারি-পথ বানালে একদিন
সাইটে এক জিনিস আর অ্যাপে অন্য জিনিস যেত।

⛔ **ক্রম: `ensureReady()` → পাওনা মেটানো → তবেই নতুন ক্রয়।**
`flushPending()` চলে `connect()`-এর ভিতরে, আর `connect()` চলে `buy()`-এর
ভিতরে — তাই আগে না ডাকলে আটকে থাকা পুরনো ক্রয়টা উদ্ধার হতো
`requestPurchase()`-এর *পরে*, অর্থাৎ অ্যাপ নতুন চালু হওয়ার পর প্রথম
কেনায় পাঠকের **দু'বার টাকা কাটত**।

⚠️ **ওভারলে খুলতে `display` **ও** `opacity` — দুটোই।** ₹৫০১/₹১৫০১-এর
ওভারলের CSS-এ `opacity:0` ও transition আছে; কেবল `display='flex'` করলে
ব্লকটা DOM-এ থাকত অথচ পর্দা ফাঁকা — টাকা দিয়ে কিছুই না দেখার ক্লাসিক
রূপ। এই রিপোর "DOM-এ আছে, চোখে নেই" শিক্ষারই পুনরাবৃত্তি।

⛔ **বান্ডলে থাকা আর ওয়েবসাইটে থাকা এক নয়।** `verify-play-billing`
প্রথমে কেবল ওয়েবসাইটের পাতা দেখত এবং **সবুজ ছিল** — অথচ মেপে দেখা গেল
`varshaphala.js` ও `result.js` বান্ডলে `vpClosePdfPay`/`_vpPrint` ও
`nuClosePdfPay`/`_nuPrint` **নেই**। বাংলা পাঠক বান্ডল দেখেন, তাই ওই দুটো
PDF অ্যাপে কেনাই যায় না (টাকা নেওয়ার ঝুঁকি নেই — শুধু পাওয়া যায় না)।
এখন দু'দিকেই দেখা হয়, আর ফাঁক দুটো `OPEN_BUNDLE`-এ ঘোষিত: চেক প্রতিবার
সেটা ছাপে, নীরবে সবুজ হয় না।

### ⚠️ উল্টো দিকে না চালালে দুটো পরীক্ষা মিথ্যে সবুজ ছিল

দুটোই লেখার পরেই ধরা পড়ে, ভাঙা কোডে চালিয়ে:

1. `/addPending/.test(bill)` — **import লাইনেই** নামটা আছে, তাই ফাংশন
   থেকে ডাকটা তুলে দিলেও সবুজ থাকত। এখন `flushPending()`-এর **ভিতরটা**
   কেটে নিয়ে দেখা হয়।
2. ক্রম-পরীক্ষা `indexOf('ensureReady')` — এই রিপোর মন্তব্য বাংলায়, আর
   মন্তব্যেই ফাংশনের নাম উদ্ধৃত। মন্তব্য বাদ দিয়ে তবেই ক্রম দেখা হয়।

**নতুন assert লেখার পর ভাঙা কোডে চালিয়ে লাল হওয়া দেখুন** — নইলে
"পরীক্ষা আছে" আর "পরীক্ষা কাজ করে" এক ধরে নেওয়া হয়।

### `scripts/bn-scan.js`-এর `strip()` লেজের মন্তব্য কাটত না

`list.push(key);   // একই জিনিস দু'বার কিনলে…` — অ্যাপোস্ট্রফি দুটোর
মাঝের অংশটা "স্ট্রিং" হিসেবে ধরা পড়ে `verify-app-i18n` অনুবাদ চাইত।
নিজের লাইনে থাকা মন্তব্যই কেবল বাদ পড়ত। এখন লেজের মন্তব্যও কাটা হয়,
**শর্তসাপেক্ষে** — আগে ফাঁকা থাকতে হবে, আগের অক্ষর `:` নয় (`https://`),
আর ওই বিন্দুর আগে উদ্ধৃতি-চিহ্নের সংখ্যা জোড়। সন্দেহ হলে কাটা হয় না:
বেশি কাটলে সত্যিকারের লেখা অদৃশ্য হয়ে **মিথ্যে সবুজ** হতো, যা ভুয়া
চাবির চেয়ে খারাপ।

⚠️ **এখনো পরীক্ষা করা যায়নি** — এই স্যান্ডবক্সে `node_modules` নেই,
ডিভাইস নেই, Play অ্যাকাউন্ট নেই। সবটাই পার্স ও কাঠামোগত যাচাই।
আসল ক্রয় License testing-এ না চালানো পর্যন্ত ব্রাউজার-ফলব্যাক তোলা
যাবে না।
