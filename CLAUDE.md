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

## ⛔ "১৬টি পরীক্ষা সবুজ" মানে ছিল "আমি ওদিকে তাকাইনি" (2026-09-07)

সহকর্মী জিজ্ঞেস করলেন অ্যাপের ত্রিভাষিক কাজ সত্যিই শেষ কি না। মাপতে
গিয়ে **তিনটে আলাদা ফাঁক** বেরোল, আর তিনটেই পরীক্ষায় সবুজ দেখাচ্ছিল।

### ১. একটামাত্র অ্যাপোস্ট্রফি গোটা ফাইলকে অদৃশ্য করে দিত

`verify-app-i18n` ও `build-app-terms` দুটোই **পুরো ফাইল একবারে** স্ক্যান
করত। বাংলা লেখার ভিতরের একটা অ্যাপোস্ট্রফি (`দু'বার`) LIT regex-এর
উদ্ধৃতি-গণনা সরিয়ে দেয়, ফলে **ওই বিন্দুর পরের সব লেখা** আর ধরা পড়ত না।

মেপে: `PanchangScreen.js`-এ ডজনখানেক বাংলা লেখার মধ্যে **মাত্র ৫টা**
ধরা পড়ত। নতুন বাংলা লাইন যোগ করেও পরীক্ষা সবুজই থাকত।

এখন **লাইন ধরে** স্ক্যান হয় (পুরো-ফাইল পাসের সঙ্গে মিলন) — একটা বেজোড়
চিহ্ন কেবল ওই লাইনটাই নষ্ট করে। ফল: **২৫টি অদৃশ্য বাংলা লেখা** বেরোল,
আর `build-app-terms` অভিধান থেকে ৭৮৮ → **৮০১** নাম আনতে পারল (মাসের
নামগুলো এতদিন আসছিলই না, কারণ extractor ওগুলো দেখতেই পেত না)।

### ২. পঞ্জিকা ও রাশিফল — ভাষা নির্বিশেষে বাংলাই খুলত

`webPath` প্রপটা কেবল `LocalWebView`-এর, আর এই দুটো স্ক্রিন নিজের
WebView/`remoteUrl` চালায় — তাই ভাষা-রুটিং কখনো বসেইনি, অথচ ⑥ অংশ
সবুজ ছিল (সে কেবল webPath-এর তালিকাটা দেখত)।

- `PanchangScreen` — en/hi-তে `myastrology.in/<lang>/panjika`, নেট না
  থাকলে বান্ডলে ফেরা + **দৃশ্যমান নোটিশ**
- `rashifalUrl(i, mode, lang)` — চিরসবুজ ও সাপ্তাহিক, দুটোরই en/hi আছে
- ⚠️ দৈনিক **তারিখ-পাতা** কেবল বাংলায় — ওগুলো অ্যাপ খোলেই না, তাই ৪০৪
  হওয়ার ঝুঁকি নেই

### ৩. WebView-এ ইনজেক্ট করা লেখা module-স্তরে ভাষা জমিয়ে ফেলত

`const INJECTED_JS = buildInjectedJS(APP_CSS)` — একবার তৈরি, চিরকালের
জন্য বাংলা। ভিতরে ছিল ১২টা মাসের নাম, GPS-এর চারটে বার্তা আর একটা
টোস্ট, অর্থাৎ **ইংরেজি পাতাতেও তারিখ-বাছাইয়ের মাস বাংলায়**। এখন
`makeInjectedJS(t)` — কম্পোনেন্টের ভিতরে `useMemo`, ভাষা বদলালেই নতুন।

⚠️ **এটা এই দুই রিপোর সবচেয়ে বেশিবার নথিভুক্ত ভুলের ষষ্ঠ ঘটনা** —
"module-স্তরে ধরা মান ভাষা জমিয়ে ফেলে"।

### ⛔ আর একটা ভাষা-ফাঁদ: ইংরেজি পাতায় ম্যাচার মিলত না

`isBuyMsg()` পাতার টোস্টে **বাংলা** বাক্যাংশ খুঁজত। en/hi পাতায় ওই
টোস্ট অনূদিত হয়ে আসে, তাই শর্তটা মিলত না — ইংরেজি পাঠক টোস্ট দেখতেন,
কেনার প্রস্তাব উঠত না। এখন কেবল `myastrology.in` ঠিকানাটা মেলানো হয়,
যা তিন ভাষাতেই এক। **অনূদিত লেখা পার্স করার সেই পুরনো ফাঁদ, নতুন জায়গায়।**

### ছাড় এখন লেখা ধরে, ফাইল ধরে নয়

`পেজে যান` একটা **CSS সিলেক্টরের** ভিতরে (`[aria-label*="…"]`) — অনুবাদ
করলে সিলেক্টরটাই আর কিছু ধরত না। ফাইল ধরে ছাড় দিলে ওই ফাইলের ভবিষ্যতের
সব লেখাও নীরবে ছাড় পেত, তাই `NO_TRANSLATE_TEXT`-এ **ঠিক ওই লেখাটাই**,
আর সঙ্গে কারণ। ⚠️ **ছাড়টা নিজেও পরীক্ষা করা হয়** — লেখাটা সত্যিই এখনো
ওই সিলেক্টরের ভিতরে আছে কি না; উল্টো দিকে চালিয়ে যাচাই করা।

**ফল: ২০টি পরীক্ষা, ০টি সমস্যা** — আর এবার সংখ্যাটার মানে আছে।

## ₹৫০১/₹১৫০১ — অ্যাপেও নিজে ডাউনলোড (2026-09-07)

অ্যাডমিনের "গ্রাহককে দিন" সুইচ অর্ডারে `status:'ready'` লেখে, আর
"আমার রিপোর্ট" পর্দায় তখনই ডাউনলোডের বোতাম ওঠে।

⛔ **PDF-টা অ্যাপে তৈরি হয় না** — বোতামটা ওয়েবসাইটের `/my-reports`
পাতাটা খোলে, সেখানেই `src/premium-merge.js` দিয়ে ইঞ্জিনের রিপোর্ট ও
বিশ্লেষণ মেশানো হয়। অ্যাপে দ্বিতীয় একটা মেশানোর কোড লিখলে একদিন
অ্যাডমিনের PDF, ওয়েবসাইটের PDF আর অ্যাপের PDF — তিনটে আলাদা হয়ে যেত।

⚠️ **সাইন-ইন সেতুটা এতদিন যেকোনো `remoteUrl`-এ বন্ধ ছিল** ("mya-auth.js
শুধু বান্ডলে আছে")। কিন্তু আমাদের নিজের সাইটের পাতাগুলোতেও ওটা আছে, আর
সাইন-ইন ছাড়া `/my-reports` ক্রেতার কোনো অর্ডারই দেখাতে পারত না। এখন
সেতুটা `https://myastrology.in/` ঠিকানার জন্যও চলে — বাইরের কোথাও টোকেন
যায় না, আর পাতায় `myaAuth` না থাকলে স্ক্রিপ্টটা চুপচাপ থেমে যায়।

### ⛔ extractor বহু-লাইনের JSX লেখা দেখতেই পেত না

`<Text …>` আর লেখাটা আলাদা লাইনে থাকলে `JSXTXT` (`}?>([^<>{}\n]*)<`)
কখনো মিলত না — `\n` বাদ দেওয়া আছে। ফলে নতুন একটা বাংলা লাইন যোগ করেও
`verify-app-i18n` **সবুজ থাকছিল**, আর লেখাটা নীরবে অনূদিত না-হয়ে যেত।

দ্বিতীয় প্যাটার্ন (`>\s*\n\s*(…)\s*\n\s*<`) যোগ করার পর সঙ্গে সঙ্গে
`দ্রুত অ্যাক্সেস` (HomeScreen) বেরোল — অনেক দিনের অদৃশ্য একটা ফাঁক।
`build-app-terms`-এও একই সংশোধন, নইলে দুটো স্ক্যানার দু'রকম দেখত।

**এই সেশনে extractor-এর এটি দ্বিতীয় অন্ধ দিক** (প্রথমটি: একটামাত্র
অ্যাপোস্ট্রফি গোটা ফাইল অদৃশ্য করে দিত)। **নতুন কোনো আকৃতিতে লেখা
বসালে extractor সেটা দেখে কি না — উল্টো দিকে চালিয়ে দেখে নিন।**


## আন্তর্জাতিক মান — দুটো ফাঁক মেপে ধরা পড়ল (2026-09-07)

### ⛔ ১. রেন্ডার-ত্রুটি হলে পর্দা **সাদা** হয়ে যেত

`grep -rn "componentDidCatch\|ErrorBoundary"` → **শূন্য**। অর্থাৎ কোনো
পর্দা রেন্ডারে ভাঙলে React গোটা গাছ খুলে ফেলত আর পাঠক একটা সাদা পর্দা
দেখতেন — বার্তা নেই, বেরোনোর পথ নেই।

⚠️ **আর Play Console-এ এটা crash হিসেবেও গোনা হয় না** (প্রক্রিয়াটা তো
বেঁচেই আছে), তাই আমরা কোনোদিন জানতেও পারতাম না — শুধু এক-তারা রিভিউ আসত।

`src/components/ErrorBoundary.js` — বার্তা + **"আবার চেষ্টা করুন"** বোতাম,
আর `logEvent('app_error', …)` দিয়ে কোন কম্পোনেন্টে ভাঙল তা Analytics-এ।

- ⚠️ `App.js`-এ এটা **`LanguageProvider`-এরও বাইরে**, যাতে Provider নিজে
  ভাঙলেও ধরা পড়ে। তাই লেখার জন্য `src/i18n/Text` (তার `FALLBACK` আছে,
  Provider ছাড়াও চলে) — কাঁচা `react-native` Text নয়, নইলে ইংরেজি
  পাঠক হঠাৎ বাংলায় ক্ষমা-প্রার্থনা পড়তেন।
- ⚠️ `componentDidCatch` পুরোটা `try/catch`-এ — সেখানে ভাঙলে ত্রুটি-পর্দাটাই
  ভেঙে যেত, অর্থাৎ আবার সেই সাদা পর্দা।

### ⛔ ২. ৪৭টি ছোঁয়ার জায়গার ১১টিতে স্ক্রিন-রিডার কিছুই পড়ত না

কেবল-আইকন বোতাম (মেনু · বিজ্ঞপ্তি · অবতার · শহর · ড্রয়ারের ব্যাকড্রপ ও
বন্ধ-বোতাম) — ভিতরে লেখা নেই, `accessibilityLabel`-ও নেই। TalkBack
ওগুলোকে শুধু "button" বলত। এগারোটিতেই `accessibilityRole` + অনূদিত
`accessibilityLabel` বসানো হলো (ছ'টি নতুন লেখা, তিন ভাষাতেই)।

`npm run verify-app-a11y` — ৬টি পরীক্ষা, দু-দিকেই উল্টো চালিয়ে যাচাই করা।

⚠️ **প্রথম সংস্করণটা সাতটা ঠিক বোতামকেও "ভুল" বলেছিল।** কারণ খোলার
ট্যাগের শেষ `>` খুঁজতে গিয়ে `onPress={() => …}`-এর **তিরচিহ্নের** `>`-টাই
ধরা পড়ত, ফলে পরের লাইনের `accessibilityLabel` চোখেই পড়ত না। এখন
`{...}`-এর ভিতরটা বাদ দিয়ে গোনা হয়। **এই রিপোর পুরনো নিয়মটাই আবার:
পরীক্ষা লাল হলে আগে পরীক্ষাটাকে সন্দেহ করুন।**

⚠️ ভিতরে `<Text>` থাকলে লেবেল **চাওয়া হয় না** — রিডার ওই লেখাটাই পড়ে।
তাই গোটা এলিমেন্ট-ব্লক দেখা হয়, শুধু খোলার ট্যাগ নয়।

⚠️ **যা এখান থেকে মাপাই যায় না:** আসল TalkBack, রঙের কনট্রাস্ট, বড়
ফন্টে লেআউট, ছোঁয়ার জায়গার আসল মাপ — সবেতেই ডিভাইস লাগে। এই পরীক্ষা
"সবচেয়ে সাধারণ ত্রুটিটা নেই" বলে, "প্রবেশযোগ্য" বলে না।

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

## ⛔ প্রবেশযোগ্যতার লেবেল বসাতে গিয়ে অ্যাপ ভেঙে ফেলা (2026-09-07)

সহকর্মী রিপোর্ট করলেন: **হোম স্ক্রিনে রাশি বাছলেই** ত্রুটি-পর্দা। কারণ
আগের দিনেরই আমার বদল —

```js
function RashiHeroRow({ … }) {          // ← আলাদা কম্পোনেন্ট
  …
  <Pressable accessibilityLabel={t('রাশি পরিবর্তন করুন')}>   // ← t এখানে নেই!
```

`t` আছে `HomeScreen`-এ, `RashiHeroRow`-এ নয়। সারিটা **কেবল রাশি বাছা
থাকলেই** আঁকা হয়, তাই ইনস্টল করে খুললে কিছুই বোঝা যেত না।

⚠️ **`check-parse` এটা ধরতে পারে না** — সিনট্যাক্স নিখুঁত, ভুলটা কেবল
চালানোর সময়ে। `verify-app-i18n`-এর ⑨ অংশ এখন প্রতিটি `t()` ডাকার ঘেরা
ফাংশনে `t` সত্যিই আছে কি না দেখে; উল্টো দিকে চালিয়ে যাচাই করা
(ঠিক এই লাইনটাই নাম ধরে ধরা পড়ে)।

⚠️ দুটো মিথ্যে-লাল সরাতে হয়েছে: এই রিপোর **মন্তব্য বাংলায়** আর তাতে
`t()` উদ্ধৃত থাকে; আর WebView-এ ইনজেক্ট করা স্ক্রিপ্ট নিজের
`function t(){}` বানায়। দুটোই বৈধ।

### ⛔ ত্রুটির বার্তাটাই ভুল ভাষায় ছিল

`ErrorBoundary` বসানো হয়েছিল **`LanguageProvider`-এর বাইরে**, তাই
`useLanguage()` FALLBACK ফেরাত আর ইংরেজি/হিন্দি পাঠকও **বাংলায়** ক্ষমা-
প্রার্থনা পড়তেন। এখন ভিতরে। Provider নিজে ভাঙার আশঙ্কার চেয়ে ভুল ভাষায়
বার্তা দেখানোটা অনেক বেশি সম্ভাব্য ক্ষতি।

### ⛔ একই কার্ডে দুই ভাষা — `setCurrentLang` চলত রেন্ডারের **পরে**

হোম কার্ডে লেবেল বাংলা, অথচ সময় **"Morning 5:24"** আর অঙ্ক ল্যাটিন।
কারণ `t` আসে context থেকে (সঙ্গে সঙ্গে বদলায়) আর `tGlobal`/`numText`
আসে মডিউল-চলক `_current` থেকে, যেটা বসত `useEffect`-এ — অর্থাৎ **এক
রেন্ডার পিছিয়ে**, আর effect বাদ পড়লে চিরকালের জন্য পিছিয়ে।

`setCurrentLang(lang)` এখন Provider-এর **রেন্ডারেই** চলে। একই মডিউল-
চলকে একই মান বসানো idempotent, তাই এটা নিরাপদ।

⚠️ **এই রিপোর সবচেয়ে বেশিবার নথিভুক্ত ভুলের সপ্তম ঘটনা** — "মডিউল-স্তরে
ধরা মান ভাষা জমিয়ে ফেলে"। এবার নতুন মোড়ে: মানটা ধরা ছিল না, **দেরিতে
বসত**।

## ভাষা-বদলের সারি অ্যাপে দেখানো হয় না (2026-09-07)

সহকর্মী: *"ভাষা পরিবর্তনের অপশন শুধু মাত্র সেটিংসে থাকা উচিৎ, সমস্ত
স্ক্রিনে নয়।"* — ঠিক, আর কারণটা নিছক সৌন্দর্যের নয়: অ্যাপে ভাষা ঠিক হয়
Settings থেকে, কিন্তু পাতার নিজের সারিটা **অ্যাপকে না জানিয়েই** ঠিকানা
বদলে দেয়। ফলে অ্যাপ ভাবে বাংলা, পাতা দেখায় ইংরেজি — দুটো আলাদা হয়ে যায়।

`src/utils/hideWebChrome.js` — একটাই CSS নিয়ম, `[class*="mya-lang"]`,
কারণ সুইচারটা পাতাভেদে তিন নামে আসে (`mya-lang`, `-links`, `-float`)।

- ⚠️ **ওয়েবসাইটে সারিটা মোছা হয়নি** — ওগুলো আসল `<a href>`, আর
  `verify-seo` প্রতিটি পাতায় ভাষা-লিংক গোনে। কেবল অ্যাপে ঢাকা।
- ⚠️ **দুই জায়গায় বসাতে হয়** — `LocalWebView` (সব স্ক্রিন) **ও**
  `KundaliScreen` (নিজের WebView চালায়)। `verify-app-i18n`-এর ⑩ অংশ
  দুটোই দেখে।

## ⛔ অ্যাপের ছাপার পাতাটা ওয়েবসাইটের ৬৪% — এক কারণে তিনটে অভিযোগ (2026-09-07)

মেপে দেখা:

| | অক্ষর | `MyaI18n` |
|---|---|---|
| ওয়েবসাইটের `kundali-print.html` | **169,813** | ৬ বার |
| অ্যাপের `src/web-html/kundali-print.js` | **108,710** | **০ বার** |

এই এক ফাঁক থেকেই সহকর্মীর তিনটে আলাদা অভিযোগ:

1. **"ইংরেজি PDF-এ বাংলা"** — বান্ডলে অনুবাদ-যন্ত্রপাতি **নেই**, তাই
   অ্যাপ যে ভাষাতেই থাক, PDF সবসময় বাংলা।
2. **"পেজ সংখ্যা ওয়েবসাইটের তুলনায় কম"** — কপিটা ৩৬% ছোট।
3. **জন্মসময় · জন্মস্থান · সূর্যোদয় · সূর্যাস্ত · বর্ণ = "—"** — ৩০/৮-এর
   `dobRaw`/`tobRaw`/`placeRaw` সংশোধনটা এই কপিতে পৌঁছয়নি (`grep` → ০),
   তাই সে এখনো **পর্দার বাংলা লেখা** থেকে মান তুলতে চায় আর ইংরেজি পাতায়
   কিছুই পায় না।

⚠️ **এটাই দুই-রিপো কাঠামোর সবচেয়ে দামি ঝুঁকি**, আর এবার সবচেয়ে বড় আকারে:
একটা গোটা পাতা মাসের পর মাস পিছিয়ে ছিল আর কোনো পরীক্ষা সেটা দেখেনি।
সারানোর পর **দুই কপির আকার ও `MyaI18n`-এর উপস্থিতি মেলানো একটা পরীক্ষা
দরকার** — নইলে আবার নীরবে পিছিয়ে পড়বে।

## ⛔ বাংলা পরামর্শ-কার্ডটা অ্যাপ নিজেই বসাত (2026-09-07)

সহকর্মী `/en/match-making`-এ একটা পুরো বাংলা কার্ডের ছবি পাঠান। কিন্তু
লেখাটা **ওয়েবসাইটের কোনো পাতাতেই নেই** — লাইভ পাতা curl করে, আর
match-making বান্ডল ঘেঁটেও শূন্য। খুঁজে পাওয়া গেল
`src/components/LocalWebView.js`-এ: ফলাফল দেখা গেলে **অ্যাপ নিজেই** একটা
পরামর্শ-বুকিং কার্ড DOM-এ ঢুকিয়ে দেয়, আর লেখা তিনটে হার্ডকোড বাংলায়।

`RESULTS_TRACKER_JS` ছিল **মডিউল-স্তরের ধ্রুবক** — একবার তৈরি, চিরকাল
বাংলা। এখন `makeResultsTrackerJS(t)` + `useMemo`।

⚠️ **এটি "মডিউল-স্তরে ধরা মান ভাষা জমিয়ে ফেলে" ভুলের অষ্টম ঘটনা।**
নতুন শিক্ষা: **পাতায় কোনো লেখা বাংলা দেখলে আগে ধরে নেবেন না যে সেটা
ওয়েবসাইটের** — অ্যাপ নিজেও DOM-এ লেখা ঢোকায়। দুই রিপোতেই খুঁজতে হয়।

⚠️ খোলা প্রশ্ন: ওয়েবসাইটের নিজের পরামর্শ-কার্ড ("Dr. Prodyut Acharya,
PhD · WhatsApp consultation") ঠিক এর উপরেই বসে — অর্থাৎ অ্যাপে **দুটো
পরামর্শ-কার্ড পাশাপাশি**। একটা তুলে দেওয়া উচিত কি না, সেটা সহকর্মীর
সিদ্ধান্ত।

## ⛔ দাম-বারের `top:66px` — সাইটের হেডারের মাপ, অ্যাপের নয়

`#tabNav` ওয়েবসাইটে `position:fixed;top:66px`, আর ওই ৬৬px হলো সাইটের
নিজের হেডারের উচ্চতা। অ্যাপে সেই হেডার লুকোনো, তাই ফাঁকটা অর্থহীন হয়ে
দাম-বারটা চার্টের উপর বসে যেত। `#tabNav{top:0!important;}`।

⚠️ **আর সেটা বসাতে গিয়ে মন্তব্যে backtick লিখে `APP_CSS`-এর template
literal ভেঙে ফেলেছিলাম** — এই ফাইলেই নথিভুক্ত ফাঁদ, তবু পা পড়ল, আর
ভাঙা অবস্থায় একটা কমিট পুশও হয়ে গিয়েছিল (পরের কমিটে সারানো)।
**`check-parse` কমিটের আগে চালান, পরে নয়।**

### অ্যাপের ভিতরে Play-স্টোরের বিজ্ঞাপনও ঢাকা (2026-09-07)

সহকর্মী: *"Application এর স্কিনে বা ফুটারে প্লে স্টোর বিজ্ঞাপন প্রয়োজন
আছে?"* — নেই। পাঠক তো অ্যাপেই আছেন।

একই `hideWebChrome.js`-এ দুটো নিয়ম যোগ: `.rf-app-card,.blog-app-card`
(রাশিফল ও ব্লগের কার্ড) আর `a[href*="play.google.com"]` (ফুটারের ব্যাজ
সহ যেখানেই থাক)।

⚠️ **ওয়েবসাইটে অক্ষত** — ওখানেই কার্ডটা ইনস্টল আনে (২০২৬-০৮-৩১-এ মেপে
বসানো, `utm_medium=rashifal` দিয়ে উৎস গোনা হয়)।

## ⛔ কুণ্ডলী → ব্যাক → আবার কুণ্ডলী = সম্পূর্ণ ফাঁকা পর্দা (2026-09-07)

পাতাগুলো গণনার সময় ফলাফল দেখায় **আর ফর্মটাও `display:none`** করে দেয়।
ব্যাক চাপলে কেবল ফলাফলটা লুকোলে দুটোই লুকানো থেকে যায় — হেডার আর
নিচের ট্যাব-বার ছাড়া কিছুই থাকে না।

`LocalWebView`-এ এই সংশোধনটা **আগেই ছিল** (তার মন্তব্যেও লেখা), কিন্তু
`KundaliScreen` নিজের WebView চালায় আর তার ব্যাক-হ্যান্ডলার সোজা
`goBack()` ডাকত — তাই ওখানে পৌঁছয়নি।

দুটো id-তালিকা ও পুনরুদ্ধারের কোড এখন `src/utils/hideWebChrome.js`-এ
**এক উৎসে** (`RESULTS_CONTAINER_IDS`, `FORM_CONTAINER_IDS`,
`makeHideResultsJS`), আর দুই WebView-ই সেটাই পড়ে।

⚠️ **সাধারণ শিক্ষা, আর এটা আজ চতুর্থ বার: `KundaliScreen` নিজের WebView
চালায়, তাই `LocalWebView`-এর প্রতিটি সংশোধন ওখানে আলাদা করে বসাতে হয়।**
আজ একই কারণে চারটে জিনিস বাদ পড়েছিল — ভাষা-রুটিং, ভাষা-সারি ঢাকা,
Play-বিজ্ঞাপন ঢাকা, আর এই ব্যাক-পুনরুদ্ধার। `verify-app-i18n` এখন
প্রতিটির জন্যই **দুটো ফাইলই** দেখে।

### দুটো পরামর্শ-কার্ড — লিংক দেখে সিদ্ধান্ত, লেখা দেখে নয় (2026-09-07)

কুণ্ডলী ও যোটক-বিচারের ফলাফলে ওয়েবসাইটের নিজের পরামর্শ-কার্ড আছে
("WhatsApp consultation"), আর তার ঠিক নিচে অ্যাপ **আরেকটা** বসাত।

⚠️ ওয়েবসাইটের কার্ডটার কোনো class/id নেই (সবই inline style), তাই নাম
ধরে ঢাকা ভঙ্গুর হতো। বদলে **অ্যাপ নিজেই আর দ্বিতীয়টা বসায় না** — বসানোর
আগে দেখে নেয় ফলাফলের ভিতরে পরামর্শের WhatsApp লিংক আছে কি না।

⚠️ **লেখা নয়, লিংক দেখা হয়** — লেখা তিন ভাষায় বদলায়, ঠিকানা বদলায় না।
আর শেয়ার-বোতামের `wa.me/?text=…` ধরা পড়ে না, কারণ পরামর্শের লিংকে
`wa.me/`-র পরেই ফোন নম্বরের অঙ্ক থাকে (`wa.me/9…`)।

যে পাতায় ওয়েবসাইটের কার্ড নেই, সেখানে অ্যাপেরটা আগের মতোই বসে — অর্থাৎ
প্রতিটি পাতাতেই ঠিক **একটি** পরামর্শের পথ থাকে।
