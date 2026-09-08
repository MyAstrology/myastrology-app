# Play Billing চালু করা — শুধু ফোন দিয়ে

কম্পিউটার ছাড়াই পুরোটা করা যায়। Termux + ফোনের ব্রাউজার (Chrome-এ
"ডেস্কটপ সাইট" চালু করে নেবেন — Play Console ও Google Cloud দুটোই মোবাইল
লেআউটে অনেক বোতাম লুকিয়ে রাখে)।

কোডের দিকটা **সবই তৈরি** — বাকি কেবল লাইব্রেরি বসানো, Play Console-এ
প্রোডাক্ট বানানো, আর একটা চাবি। এই তিনটে না হওয়া পর্যন্ত অ্যাপ আগের মতোই
ব্রাউজারে পাঠায়, অর্থাৎ **কিছু ভাঙবে না**।

---

## ধাপ ১ — লাইব্রেরি বসানো (Termux)

```
cd ~/myastrology-app
npx expo install react-native-iap
git add package.json package-lock.json
git commit -m "Play Billing: react-native-iap"
git push origin HEAD:refs/heads/main
```

⚠️ `npx expo install` নিজে থেকে SDK 54-এর জন্য ঠিক সংস্করণটা বাছে।
`npm install react-native-iap` লিখবেন না — ভুল সংস্করণ বসলে ৩০ মিনিটের
বিল্ডের শেষে ব্যর্থ হবে।

---

## ধাপ ২ — Play Console-এ সাতটা প্রোডাক্ট

Play Console → আপনার অ্যাপ → **Monetize → Products → In-app products →
Create product**। প্রতিটির জন্য: Product ID (হুবহু নিচের লেখাটা), নাম,
বিবরণ, দাম, তারপর **Activate**।

| Product ID | কী | দাম |
|---|---|---|
| `mya_kundali_pdf` | জন্মকুণ্ডলী PDF | ₹১০১ |
| `mya_match_pdf` | কোষ্ঠী মিলন PDF | ₹১০১ |
| `mya_numerology_pdf` | সংখ্যা জ্যোতিষ PDF | ₹৫১ |
| `mya_varshaphala_pdf` | বর্ষফল PDF | ₹৫১ |
| `mya_panjika_pdf` | বার্ষিক পঞ্জিকা PDF | ₹২১ |
| `mya_premium_kundali` | প্রিমিয়াম কুণ্ডলী রিপোর্ট | ₹৫০১ |
| `mya_solution_kundali` | VIP পরামর্শ ও সমাধান | ₹১৫০১ |

⚠️ **Product ID একবার বানালে আর বদলানো যায় না**, আর অক্ষরে অক্ষরে এই
তালিকার সঙ্গে মিলতে হবে — অ্যাপের `src/config/products.js` ও সার্ভারের
`functions/index.js` দুটোতেই একই আইডি লেখা আছে।

⚠️ In-app products পাতা খুলতে হলে আগে অন্তত একটা বিল্ড Play-তে আপলোড করা
থাকতে হয়। আপনার অ্যাপ প্রকাশিত, তাই ওটা আছে।

---

## ধাপ ৩ — যাচাইয়ের চাবি (এটাই একমাত্র ঝামেলার ধাপ)

টাকা কাটার পর সার্ভার Google-কে জিজ্ঞেস করে "ক্রয়টা সত্যি তো?"। তার জন্য
একটা service account লাগে।

**ক) Play Console → Setup → API access** → Google Cloud প্রজেক্টের সঙ্গে
লিংক করুন (না থাকলে "Create new project")।

**খ) Google Cloud Console** (console.cloud.google.com, ডেস্কটপ সাইট) →
IAM & Admin → Service Accounts → **Create service account** → নাম দিন
(যেমন `play-verify`) → Done। তারপর ওই অ্যাকাউন্টে ঢুকে **Keys → Add key →
Create new key → JSON** → ফাইলটা ফোনের Downloads-এ নামবে।

**গ) Play Console-এ অনুমতি:** Setup → API access → ওই service account-এর
পাশে **Grant access** → Permissions-এ **View financial data** ও
**Manage orders and subscriptions** টিক দিন → Invite user।

**ঘ) চাবিটা সার্ভারে বসানো (Termux):**

```
cd ~/myastrology-app
firebase login          # প্রথমবার হলে
firebase functions:secrets:set PLAY_SA_KEY < /sdcard/Download/<ফাইলের-নাম>.json
firebase deploy --only functions:verifyPlayPurchase
```

⛔ **JSON ফাইলটা কখনো git-এ কমিট করবেন না।** ওটা ফোনেই থাক, বা বসানোর পর
মুছে দিন — সিক্রেটে একবার ঢুকলে আর দরকার নেই।

⚠️ চাবি না বসালে ফাংশন **স্পষ্ট ত্রুটি** দেয়, নীরবে "কেনা হয়েছে" বলে না।
এটা ইচ্ছাকৃত — নইলে যাচাই বন্ধ থাকা অবস্থায় সব নকল ক্রয়ও সফল দেখাত।

---

## ধাপ ৪ — নিজের ফোনে বিনামূল্যে পরীক্ষা

Play Console → **Setup → License testing** → আপনার Gmail ঠিকানা যোগ করুন।
ওই অ্যাকাউন্টে টাকা কাটবে না, কিন্তু পুরো প্রবাহটা আসলের মতোই চলবে।

---

## ধাপ ৫ — বিল্ড (Termux)

```
cd ~/myastrology-app
git checkout app.json          # আগের বিল্ডে versionCode বেড়ে থাকলে
git pull origin main
EAS_SKIP_AUTO_FINGERPRINT=1 eas build --platform android --profile production
```

⚠️ `EAS_SKIP_AUTO_FINGERPRINT=1` ছাড়া Termux-এ
`Expected 'concurrency' to be a number from 1 and up` বলে থেমে যায়।
ফিঙ্গারপ্রিন্ট কেবল ক্যাশ মেলানোর কাজে লাগে — তৈরি অ্যাপে কোনো পার্থক্য
হয় না।

⚠️ রিপোর `versionCode` **ভিত্তি**, প্রকাশিত নম্বর নয়: রিলিজ = ভিত্তি + ১।
এখন ভিত্তি **১৫**, তাই পরের বিল্ড হবে **১৬**। ১৬ যদি আগেই প্রকাশ করে
থাকেন, তবে `app.json`-এ ভিত্তি ১৬ করে কমিট করুন — নইলে Play আপলোডটা
৩০ মিনিটের বিল্ডের শেষে ফিরিয়ে দেবে।

---

## ধাপ ৬ — ফোনে যা মিলিয়ে দেখবেন

১. অ্যাপে কুণ্ডলী গণনা → PDF বোতাম → **Google-এর নিজের পেমেন্ট পর্দা**
   ওঠে কি না (Razorpay নয়)
২. কেনার পর PDF সত্যিই তৈরি হয় কি না
৩. বর্ষফল ও সংখ্যা জ্যোতিষেও একইভাবে (এই দুটোতে আগে বোতামই ছিল না)
৪. ইন্টারনেট বন্ধ করে কিনতে গেলে "পরে আবার" জাতীয় বার্তা আসে কি না,
   টাকা কেটে চুপ করে থাকে না

⚠️ কেনা যদি কাজ না করে, অ্যাপ আপনাআপনি **ব্রাউজারে** পাঠাবে — অর্থাৎ
আজকের আচরণ। তাই এই ধাপে কিছু ভাঙলেও গ্রাহক আটকে যাবেন না।

---

## ধাপ ৭ — পরে, সব ঠিকঠাক চললে

ব্রাউজারে পাঠানোর ফলব্যাকটা তখন তুলে দেওয়া যাবে
(`src/utils/buyOnWebBridge.js`)। **তার আগে নয়** — Play Billing সত্যিই
কাজ করছে এটা নিজের ফোনে না দেখা পর্যন্ত ওটাই একমাত্র কেনার পথ।

💡 আর মনে রাখবেন: **ওয়েবসাইটে Google কোনো কমিশন নেয় না।** ভারতীয়
গ্রাহককে ওয়েবসাইটেই রাখা বেশি লাভজনক; অ্যাপের Play Billing মূলত বিদেশি
গ্রাহকের জন্য, যাঁরা Razorpay-তে টাকাই দিতে পারতেন না।
