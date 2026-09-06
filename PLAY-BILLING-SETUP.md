# Play Billing চালু করার ধাপ

কোডের দিকটা তৈরি ও যাচাই করা (`npm run verify-play-billing` — ১১টি পরীক্ষা)।
বাকি ধাপগুলো আপনার মেশিনে ও Play Console-এ করতে হবে, এই ক্রমেই।

---

## ০. কেন এই ক্রম

⚠️ **Play Console-এ ইন-অ্যাপ প্রোডাক্ট তৈরি করা যায় না যতক্ষণ না Billing
Library-সহ একটা বিল্ড কোনো ট্র্যাকে আপলোড হয়েছে।** "প্রোডাক্ট বানানো
যাচ্ছে না" — কারণ এটাই। তাই আগে বিল্ড, পরে প্রোডাক্ট।

---

## ১. লাইব্রেরি যোগ ও বিল্ড (আপনার মেশিনে)

```bash
npx expo install react-native-iap
npx eas build --profile preview --platform android
```

তারপর ওই AAB/APK **Internal testing** ট্র্যাকে আপলোড করুন।
(এখনো কিছু বিক্রি হবে না — লাইব্রেরি না থাকলে অ্যাপ আগের মতোই ওয়েবসাইটে
পাঠায়, `billing.js`-এর `isAvailable()` দেখুন।)

## ২. Play Console → Monetize → In-app products

সাতটি **consumable** প্রোডাক্ট বানান। আইডি হুবহু এইগুলোই —
`src/config/products.js` ও `functions/index.js` দুটোতেই এই নামই লেখা,
আর `verify-play-billing` দুটো মিলিয়ে দেখে।

| প্রোডাক্ট আইডি | কী | রেফারেন্স দাম |
|---|---|---|
| `mya_kundali_pdf` | জন্মকুণ্ডলী PDF | ₹১০১ |
| `mya_match_pdf` | কোষ্ঠী মিলন PDF | ₹১০১ |
| `mya_numerology_pdf` | সংখ্যা জ্যোতিষ PDF | ₹৫১ |
| `mya_varshaphala_pdf` | বর্ষফল PDF | ₹৫১ |
| `mya_panjika_pdf` | বার্ষিক পঞ্জিকা PDF | ₹২১ |
| `mya_premium_kundali` | প্রিমিয়াম কুণ্ডলী রিপোর্ট | ₹৫০১ |
| `mya_solution_kundali` | VIP পরামর্শ ও সমাধান | ₹১৫০১ |

⚠️ দামগুলো **রেফারেন্স** — Play-তে প্রতিটি দেশের দাম আলাদা করে বসাতে হয়,
আর অ্যাপ কখনো নিজের ₹ সংখ্যা দেখায় না, Play-র নিজের দামই দেখায়।
⚠️ Play ১৫% কমিশন নেয়। ₹৫০১-এ হাতে আসবে ~₹৪২৬। দাম ঠিক করার সময় ধরে নেবেন।

## ৩. Service account (যাচাইয়ের জন্য)

Play Console → **Setup → API access** → একটা service account বানান →
Google Cloud-এ ওটার JSON কী নামান → Play Console-এ ওই অ্যাকাউন্টকে
**View financial data** ও **Manage orders** অনুমতি দিন।

তারপর কী-টা Firebase-এর সিক্রেটে রাখুন (রিপোতে কখনো নয়):

```bash
firebase functions:secrets:set PLAY_SA_KEY
# JSON ফাইলের পুরো লেখাটা পেস্ট করুন
```

⚠️ কী না থাকলে ফাংশন **স্পষ্ট ত্রুটি** দেয়, নীরবে "কেনা হয়েছে" বলে না।

## ৪. ফাংশন ডিপ্লয়

```bash
cd functions && npm install && cd ..
firebase deploy --only functions:verifyPlayPurchase,firestore:rules
```

## ৫. পরীক্ষা (আসল টাকা ছাড়া)

Play Console → **Setup → License testing**-এ নিজের Gmail যোগ করুন।
ওই অ্যাকাউন্টে Internal testing ট্র্যাক থেকে অ্যাপ ইনস্টল করে কিনলে
টাকা কাটে না, কিন্তু বাকি সবটাই আসলের মতো চলে।

যা মিলিয়ে দেখবেন:
- কেনার পরে Firestore → `entitlements/<uid>/items/` — নতুন ডকুমেন্ট এসেছে
- একই জিনিস **দ্বিতীয়বার** কেনা যাচ্ছে (consumable ঠিক আছে)
- মাঝপথে অ্যাপ বন্ধ করে আবার খুললে আটকে থাকা ক্রয়টা নিজে থেকে শেষ হয়

---

## যা এখনো বাকি (আলাদা কাজ)

- **₹৫০১ ও ₹১৫০১ রিপোর্টের স্বয়ংক্রিয় তৈরি।** এখন ওগুলো অ্যাডমিন পাতা
  থেকে হাতে বানানো হয়। Play Billing ওটা বদলায় না — কেনার ব্যবস্থা আর
  রিপোর্ট বানানোর ব্যবস্থা দুটো আলাদা জিনিস। (জেমিনাইয়ের নথি দুটোকে এক
  করে ফেলেছিল।)
- **₹১৫০১-এর বুকিং ফর্ম** — কেনার পরে হোয়াটসঅ্যাপ নম্বর ও পছন্দের সময়
  নেওয়া।
- **ওয়েবসাইটের Razorpay অপরিবর্তিত** — ব্রাউজারে আগের মতোই চলে। Play
  Billing কেবল অ্যাপের ভিতরের বিক্রির জন্য।
