# Play Billing চালু করার ধাপ

কোডের দিকটা তৈরি ও যাচাই করা (`npm run verify-play-billing` — ১১টি পরীক্ষা)।
বাকি ধাপগুলো আপনার মেশিনে ও Play Console-এ করতে হবে, এই ক্রমেই।

---

## নীতিটা আসলে কী বলে — Google-এর নিজের পাতা থেকে

সূত্র: <https://support.google.com/googleplay/android-developer/answer/10281818>

**Play Billing লাগে যাতে:** "Digital items … Subscription services … App
functionality or content … Cloud software and services".
→ আমাদের সাতটি PDF/রিপোর্টই এই ঘরে পড়ে।

**Play Billing লাগে না যাতে:** ফিজিক্যাল পণ্য ও সেবা (যাতায়াত, জিম,
খাবার ডেলিভারি), বিমা/শেয়ার/কর-পরামর্শের মতো নিয়ন্ত্রিত সেবা, আর —

> "If your app provides a 1:1 online paid service, you are not required to
> use Google Play's billing system if: the paid service is between two
> individuals [and] the paid service is not available for replay afterwards."

⚠️ **₹১৫০১ ঠিক এই সীমানায়।** ফোনে সরাসরি কথা — ১:১, রেকর্ড করা নয় —
ছাড়ের শর্ত মেটে। কিন্তু সঙ্গে **একটা PDF রিপোর্টও** যায়, আর সেটা পরে
বারবার পড়া যায় ("available for replay")। তাই বান্ডল হিসেবে ছাড়টা
নিশ্চিতভাবে খাটে না — **Play Billing-ই নিরাপদ**, আর সেটাই বসানো আছে।
(Play Billing ব্যবহার করায় কখনো আপত্তি হয় না; না করলেই সমস্যা।)

💡 **একটা ব্যবসায়িক সুযোগ, আপনার সিদ্ধান্ত:** যদি কখনো **কেবল পরামর্শ**
(PDF ছাড়া, শুধু ১:১ কল) আলাদা একটা সেবা হিসেবে বেচেন, সেটা ছাড়ের শর্ত
পুরোপুরি মেটাবে — তখন Play Billing লাগবে না, প্রতি অর্ডারে ~₹১৯৫ বেশি
হাতে থাকবে।

## ⛔ আজকের অ্যাপে একটা নিয়মভঙ্গ আছে

একই পাতায়:

> "Within an app, developers may not lead users to a payment method other
> than Google Play's billing system unless Section 3, 8 or 9 of the
> payments policy applies."

অ্যাপ এখন PDF কেনার বোতামে চাপ দিলে **ব্রাউজারে ওয়েবসাইটে পাঠায়**, সেখানে
Razorpay। PDF হলো "digital items", তাই এটা ওই নিষেধের মধ্যেই পড়ে।
কোডে আগে উল্টোটা লেখা ছিল ("অ্যাপের বাইরের কেনাকাটা সম্পূর্ণ ঠিক") —
সেটা সংশোধন করা হয়েছে।

**অর্থাৎ Play Billing চালু করা উন্নতি নয়, সংশোধন।**

⚠️ তবু হ্যান্ড-অফটা **এখনই তুলবেন না** — Play Billing কাজ করছে দেখার আগে
তুলে দিলে অ্যাপ থেকে কেউ কিছুই কিনতে পারবেন না। ক্রম: বিল্ড → প্রোডাক্ট →
পরীক্ষা → **তারপর** হ্যান্ড-অফ বাদ।

## ভারতে Razorpay + বিদেশে Play Billing — সম্ভব, কিন্তু লাভ নেই

সূত্র: <https://support.google.com/googleplay/android-developer/answer/13306652>

**দুটো জিনিস পাতাটা স্পষ্ট করে বলে:**

১. ব্যবস্থাটা **alongside**, instead নয় —
   > "all developers the ability to offer an alternative billing system
   > **alongside** Google Play's for their mobile and tablet users in India"

   অর্থাৎ ভারতে "শুধু Razorpay" রাখা যায় না; Play Billing **আর** Razorpay
   দুটোই পাশাপাশি দেখাতে হবে, পাঠক বেছে নেবেন।

২. Razorpay দিয়ে টাকা এলেও **Google কমিশন নেয়** —
   > "the Google Play service fee will be **reduced by 4%**"

   অর্থাৎ ১৫% → **১১%**, শূন্য নয়। সঙ্গে Razorpay-র নিজের ~২%।

**কষে দেখা (প্রতি অর্ডারে হাতে যা থাকে):**

| পণ্য | ওয়েবসাইট | অ্যাপ: Play only | অ্যাপ: ভারতে alt | ফারাক |
|---|---|---|---|---|
| ₹১০১ | ₹৯৯ | ₹৮৬ | ₹৮৮ | +₹২ |
| ₹৫০১ | ₹৪৯১ | ₹৪২৬ | ₹৪৩৬ | +₹১০ |
| ₹১৫০১ | ₹১৪৭১ | ₹১২৭৬ | ₹১৩০৬ | +₹৩০ |

মাসে ২০×₹৫০১ + ৫×₹১৫০১ + ৩০×₹১০১ ধরলে বাড়তি সাশ্রয় **বছরে ~₹৪,৯০০**।

**আর তার জন্য যা করতে হয়:**
- PCI DSS কমপ্লায়েন্স সার্টিফিকেশন
- পাঠকের জন্য জালিয়াতি-রিপোর্ট করার ব্যবস্থা
- **প্রতিটি লেনদেন ২৪ ঘণ্টার মধ্যে** alternative billing API দিয়ে Google-কে
  জানানো
- Play Console-এ আলাদা নথিভুক্তি, ToS, পেমেন্ট প্রোফাইল
- অ্যাপে **দুটো** পেমেন্ট-প্রবাহ তৈরি ও রক্ষণাবেক্ষণ

⛔ **সিদ্ধান্ত: করা হয়নি।** বছরে ~₹৪,৯০০-র জন্য PCI DSS সার্টিফিকেশন ও
দ্বিতীয় একটা পেমেন্ট-প্রবাহ রাখা লাভজনক নয়। এই আকার অনেক বড় হলে আবার
হিসাব করা যাবে।

💡 **আসল কথাটা অন্য জায়গায়:** **ওয়েবসাইটে Google একটা পয়সাও নেয় না।**
₹৫০১-এ ওয়েবসাইটে ₹৪৯১, অ্যাপে ₹৪২৬ — ফারাক ₹৬৫। তাই ভারতীয় ক্রেতাকে
ওয়েবসাইটেই রাখা সবচেয়ে লাভজনক, আর অ্যাপের Play Billing মূলত **বিদেশি
ক্রেতার জন্য**, যাঁরা আগে Razorpay-তে টাকাই দিতে পারতেন না।

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
