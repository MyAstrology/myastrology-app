# MyAstrology অ্যাপ — প্রকাশের চেকলিস্ট

> সর্বশেষ হালনাগাদ: ২ অগাস্ট ২০২৬
> অ্যাপ: **MyAstrology** · প্যাকেজ: `in.myastrology.app`
> Internal testing-এ আছে **versionCode 4 / v1.0.2** (১ অগাস্টের বিল্ড)
> রেপোতে প্রস্তুত **versionCode 4 → পরের বিল্ডে 5 / v1.0.3**
>
> ⚠️ **versionCode নিয়ে সতর্কতা:** EAS `autoIncrement` app.json-এর মান থেকে
> ১ বাড়ায়। ফোনে বিল্ড করলে EAS ওখানকার app.json বদলায়, কিন্তু সেটা রেপোতে
> ফিরে আসে না — ফলে রেপো পিছিয়ে থাকে এবং পরের বিল্ড **একই নম্বর** পেয়ে
> Play Console-এ বাতিল হয়। তাই প্রতিটা সফল বিল্ডের পর রেপোর app.json-এ
> ব্যবহৃত নম্বরটা বসিয়ে রাখুন (২ অগাস্ট ঠিক এই কারণেই 3 → 4 করা হলো)।


---

## 🆕 v1.0.3 (versionCode 5) — এই বিল্ডে ফোনে যা যাচাই করবেন

২ অগাস্টের সংশোধনগুলো। প্রতিটার পাশে টিক দিন।

**আগের বিল্ডে যা কাজ করেনি — এবার বিশেষভাবে দেখুন:**
- ⬜ **হোম ও পঞ্জিকার সূর্যোদয় এক** (আগে ৫:১০ vs ৫:১২:০৭ ছিল) ← সবচেয়ে জরুরি
- ⬜ ₹৫১ PDF বোতামে **ওয়েবসাইটে যাওয়ার প্রস্তাব** আসে (আগে কিছুই হতো না)

**নতুন কাজ:**
- ⬜ অ্যাপ খোলার সময় ছবিটা **মৃদু বড় হয়** (animation)
- ⬜ হোমে **১২টা কার্ড**, হস্তরেখা সহ · আইকনের পিছনে ফ্যাকাশে চৌকো নেই
- ⬜ তিথি/যোগ/করণে **"→ শেষ সময়"** দেখায় (উল্টো সময় আর নেই)
- ⬜ পঞ্জিকায় **"উৎসব খোঁজা"** ট্যাব — "দুর্গা পুজো 2028" লিখে দেখুন
- ⬜ পঞ্জিকার ট্যাবগুলো **pill আকারে**, নির্বাচিতটা স্পষ্ট
- ⬜ নামকরণে **ছবিসহ হিরো** (গাঢ় নেভি নয়) · নিচে **শেয়ার বোতাম**
- ⬜ সংখ্যাজ্যোতিষ ফলাফলে **শেয়ার/কপি** কাজ করে
- ⬜ সংখ্যাজ্যোতিষ ফর্মে **আসল আইকন** (ইমোজি নয়)
- ⬜ প্রশ্ন জ্যোতিষ ফলাফল **রঙিন ও গোছানো**
- ⬜ বর্ষফল/যোটক/নামকরণে গণনার পর **ব্যাক চাপলে ফর্মে ফেরে**
- ⬜ সেটিংসে **"পঞ্চাঙ্গের অবস্থান"** ও **বিল্ড নম্বর ৫** দেখায়
- ⬜ ইন্টারনেট বন্ধ করে রাশিফল — **বাংলা** বার্তা

**যেগুলো ইন্টারনেট ছাড়া চলবে না (স্বাভাবিক):**
উৎসব খোঁজার ট্যাব · নামকরণের হিরো ছবি · রাশিফলের বিস্তারিত

---

## ⛔ এই মুহূর্তে যা করবেন না

Play Console → Dashboard → "Create and publish a release" তালিকার
**বাকি ৩টি ধাপ এখন করবেন না**:

- ⬜ Preview and confirm the release
- ⬜ Send the release to Google for review
- ⬜ Publish your app on Google Play

**কারণ:** ড্রাফটে থাকা বান্ডলটা (versionCode 3 / v1.0.1) ১২ জুলাইয়ের।
তাতে নিচের কোনো কাজই নেই — বিশেষ করে **অ্যাকাউন্ট মোছার ব্যবস্থা**, যেটা
ছাড়া Google Play নীতি অনুযায়ী রিভিউতে আটকে যেতে পারে।

ড্রাফটটা যেমন আছে তেমনই থাকুক। ১ আগস্টে নতুন বিল্ড হলে তখন
"Discard draft release" দিয়ে বাতিল করে নতুন করে শুরু করবেন।

---

## ✅ ধাপ ১ — **সম্পন্ন (২৮ জুলাই ২০২৬)** — আবার করার দরকার নেই

> Data safety প্রশ্নমালা পূরণ করে Save ও "Submit 1 change for review"
> করা হয়েছে। Preview-তে যাচাই হয়েছে: No data shared with third parties ·
> Personal info (Name, Email, User IDs, Other info) · Location
> (Approximate, Precise) · App activity (App interactions) · Device or
> other IDs · Delete app account ও Manage app data দুটো URL-ই বসেছে ·
> Data is encrypted in transit।
>
> নিচের বিবরণটা রেফারেন্স হিসেবে রইল — ভবিষ্যতে অ্যাপে নতুন কোনো তথ্য
> সংগ্রহ যোগ হলে (যেমন Crashlytics বসালে Crash logs) এই ঘোষণা হালনাগাদ
> করতে হবে।

### Play Console → App content → **Data safety** → Manage

বর্তমানে ভুল ঘোষণা করা আছে: *"App doesn't collect or share data"* ও
*"Data isn't encrypted"*। বাস্তবে অ্যাপ তথ্য সংগ্রহ করে (সাইন-ইন করলে
নাম/ইমেইল Firestore-এ যায়), আর সবই HTTPS/TLS দিয়ে যায়।
**ভুল ঘোষণা Play-তে অ্যাপ সরিয়ে দেওয়ার কারণ হতে পারে।**

প্রশ্নমালাটা ৫ ধাপের। ধাপে ধাপে হুবহু কী দেবেন —

### ধাপ ১/৫ — Overview

শুধু পড়ার পাতা, ভরার কিছু নেই। **Next** চাপুন।

### ধাপ ২/৫ — Data collection and security

| প্রশ্ন | উত্তর |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** |

তারপর **"Which of the following methods of account creation does your
app support?"** — শুধু ☑ **OAuth** টিক দিন (Google সাইন-ইন = OAuth;
ইউজারনেম-পাসওয়ার্ড ব্যবস্থা নেই)। "My app does not allow users to create
an account" বাছবেন না — অ্যাকাউন্ট তৈরি হয়ই।

OAuth টিক দিলে **Delete account URL**-এর ঘর খুলবে →
`https://www.myastrology.in/account-deletion`

শেষে একটা ঐচ্ছিক প্রশ্ন: *"Do you provide a way for users to request that
some or all of their data be deleted, **without requiring them to delete
their account**?"* → **Yes**

Yes দিলে আরেকটা **Delete data URL**-এর ঘর খুলবে (উপরের Delete account
URL থেকে আলাদা ঘর) → এখানে দেবেন:
`https://www.myastrology.in/account-deletion#data`

> কেন `#data` অ্যাঙ্করসহ আলাদা URL: Google দুটো ভিন্ন জিনিস চায় — পুরো
> অ্যাকাউন্ট মোছা বনাম অ্যাকাউন্ট রেখে শুধু কিছু ডেটা মোছা। একই পাতার
> `#data`-চিহ্নিত অংশে (account-deletion.html-এর "৪. Delete only some
> data") গেলে সেই ধাপগুলো দেখায়, তাই দুটো আলাদা URL না বানিয়ে একই পাতায়
> অ্যাঙ্কর দিয়ে সমাধান করা হয়েছে।
>
> কেন Yes: কুণ্ডলী ও কুণ্ডলী মিলন পাতায় "সেভ করা প্রোফাইল" তালিকার প্রতিটা
> প্রোফাইলের পাশে ✕ "মুছুন" বোতাম আছে (`js/mya-profiles.js`), আর মুছলে
> `mya-cloud-sync.js` সেটা Firestore-এর `users/{uid}/data/kundaliProfiles`
> থেকেও সরিয়ে দেয়। অ্যাপের বান্ডলেও এটা আছে — যাচাই করা।
> "No, but user data is automatically deleted within 90 days" **নয়** —
> স্বয়ংক্রিয় মেয়াদ-ভিত্তিক মোছা নেই।

**Additional badges** (Independent security review · UPI payments verified)
— দুটোই ঐচ্ছিক ও অপ্রযোজ্য, খালি রাখুন।

### ধাপ ৩/৫ — Data types

লম্বা চেকবক্স-তালিকা। **শুধু এই ৭টা** টিক দিন, বাকি সব খালি:

**Location** — ☑ Approximate location · ☑ Precise location
**Personal info** — ☑ Name · ☑ Email address · ☑ User IDs · ☑ Other info
**App activity** — ☑ App interactions
**Device or other IDs** — ☑ Device or other IDs

> ❌ টিক দেবেন না: Financial info · Health and fitness · Messages ·
> Photos and videos · Audio · Files and docs · Calendar · Contacts ·
> Web browsing · App info and performance · Phone number · Address
> (Crashlytics ইনস্টল করা নেই, তাই Crash logs/Diagnostics-ও নয়)

### ধাপ ৪/৫ — Data usage and handling

প্রতিটা টিক-করা টাইপের জন্য আলাদা বাক্স খুলবে। **সবগুলোতেই একই:**

- ☑ **Collected**
- ☐ **Shared** — টিক দেবেন **না**
- Processed ephemerally? → **No**
- Is this data required? → **Users can choose whether this data is collected**

শুধু **Purpose** আলাদা:

| ডেটা টাইপ | Purpose |
|---|---|
| Name | App functionality · Account management |
| Email address | App functionality · Account management |
| User IDs | App functionality · Account management |
| Other info | App functionality |
| Approximate location | App functionality |
| Precise location | App functionality |
| App interactions | **Analytics** |
| Device or other IDs | App functionality · Analytics |

> ⚠️ **Advertising or marketing** কোথাও টিক দেবেন না।

### ধাপ ৫/৫ — Preview

সারসংক্ষেপ মিলিয়ে নিয়ে **Save**।

> **Advertising ID ঘোষণা বদলাবেন না** — "doesn't use advertising ID"-ই
> থাকুক। কোডে `plugins/withDisableAdId.js` যোগ করা হয়েছে যাতে ঘোষণাটা
> সত্যি হয়। নতুন বিল্ডের পর এটা কার্যকর হবে।

---

## 📦 ধাপ ২ — ১ আগস্ট, কোটা রিসেট হলে

কোটা সীমিত, তাই **একটাই বিল্ড** করে যাচাই ও প্রকাশ দুটোই সারবেন।

```bash
eas build --profile production --platform android
```

`eas.json`-এ `autoIncrement: true` আছে, রেপোতে versionCode 3 বসানো —
তাই নতুন বিল্ড **versionCode 4 / v1.0.2** হবে (Play ৩ আগেই ব্যবহার করেছে,
তাই ৩ দিলে আপলোড প্রত্যাখ্যাত হতো)।

### বিল্ড শেষ হলে

1. তৈরি হওয়া `.aab` ফাইলটা **Internal testing** ট্র্যাকে আপলোড করুন
   (**Production-এ নয়**)
2. Testers-এ নিজের Gmail যোগ করুন
3. পাওয়া লিংক থেকে ফোনে ইনস্টল করুন — Internal testing রিভিউ ছাড়াই
   কয়েক মিনিটে চালু হয়

---

## 📱 ধাপ ৩ — ফোনে যা যা মিলিয়ে দেখবেন

### ক) অ্যাকাউন্ট মোছা (সবচেয়ে জরুরি — এটাই নতুন)

- [ ] সেটিংস → **Google দিয়ে সাইন-ইন করুন** কাজ করছে
- [ ] সেটিংস → অ্যাকাউন্ট অংশে **"অ্যাকাউন্ট মুছে ফেলুন"** সারিটা দেখা যাচ্ছে (লাল)
- [ ] চাপলে দুই ধাপের নিশ্চিতকরণ আসছে
- [ ] মোছার পর Firebase Console-এ মিলিয়ে দেখুন —
      **Authentication** থেকে ব্যবহারকারী গেছে, **Firestore → users/{uid}** ডকও গেছে
- [ ] সেটিংস → "অ্যাকাউন্ট মোছার নিয়ম" চাপলে ওয়েব পাতাটা খুলছে

> Firebase পুরনো সেশনে মুছতে দেয় না — মোছার আগে আবার সাইন-ইন করতে বলা
> হতে পারে। **এটা স্বাভাবিক**, ত্রুটি নয়।

### খ) সব স্ক্রিন খুলে দেখা (lazy-loading পরিবর্তনের কারণে)

স্ক্রিনগুলো এখন প্রথম ট্যাপে লোড হয়, আগের মতো চালুর সময় নয়।
**প্রতিটা ট্যাব ও মেনু-আইটেম একবার খুলে সাদা পর্দা আসছে কিনা দেখুন:**

- [ ] হোম · পঞ্জিকা · রাশিফল · কুণ্ডলী · আরও (৫টি ট্যাব)
- [ ] কুণ্ডলী মিলন · নামকরণ · বর্ষফল · প্রশ্ন জ্যোতিষ · সংখ্যাতত্ত্ব
- [ ] ব্লগ · খবর · বুকিং · হস্তরেখা · বাস্তু · শিক্ষা · রত্ন · ভিডিও
- [ ] সেটিংস · জ্যোতিষী সম্পর্কে

### গ) তারিখ/সময় ঘর

- [ ] কুণ্ডলী/মিলন/নামকরণ/বর্ষফল — তারিখ ও সময়ের ঘর **পাশাপাশি** আছে
- [ ] রিফ্রেশের সময় "দিন/মাস/বছর" ড্রপডাউনের ঝলকানি **আর নেই**

### ঘ) সাধারণ

- [ ] অ্যাপ চালু হতে আগের চেয়ে দ্রুত লাগছে
- [ ] নোটিফিকেশন টগল কাজ করছে
- [ ] হোম স্ক্রিনের "আজকের বিশেষ দিন" কার্ডের ছবি ঠিক অনুপাতে দেখাচ্ছে

---

## 🚀 ধাপ ৪ — কয়েকদিন ব্যবহারের পর প্রকাশ

সব ঠিক থাকলে:

1. Play Console → Production → পুরনো ড্রাফট থাকলে **Discard draft release**
2. Internal testing ট্র্যাক থেকে ওই **একই বান্ডল Production-এ Promote** করুন
3. Release notes লিখে **Send for review**

> **Promote করতে নতুন বিল্ড লাগে না** — তাই এক কোটাতেই সব হয়ে যায়।

---

## 🙈 যেগুলো উপেক্ষা করবেন

| স্ক্রিন | বার্তা | কেন উপেক্ষা |
|---|---|---|
| Expert Approved | "Not eligible" | এটা **শিশুদের অ্যাপের** প্রোগ্রাম। আপনার টার্গেট বয়স 18+, তাই প্রযোজ্য নয়। ভুল নয়। |
| Create production release | "There is no deobfuscation file…" | R8/ProGuard চালুই নেই (যাচাই করা), তাই ম্যাপিং ফাইল দরকার নেই। Google প্রতিটা AAB-তে এই বার্তা দেখায়। |
| Dashboard | "Production: Inactive" | এখনো কিছু লাইভ হয়নি — প্রত্যাশিত। |

---

## 📝 এই বিল্ডে যা যা বদলেছে

### অ্যাপ (`myastrology-app`)

| কমিট | কী |
|---|---|
| তারিখ/সময় ফিক্স পোর্ট | চারটি WebView বান্ডলে লেআউট-শিফট শূন্য |
| স্ক্রিন lazy লোড | চালুর সময় ~১০.২MB আর হিপে ওঠে না (`BottomTabs.js`) |
| versionCode 2 → 3 | পরের বিল্ড 4 হবে, Play প্রত্যাখ্যান এড়াতে |
| অ্যাকাউন্ট মোছা + AdId বন্ধ | Play নীতির দুই শর্ত পূরণ |

নতুন যাচাই-স্ক্রিপ্ট: `npm run check:lazy`
(নতুন স্ক্রিন ভুলে static import করলে ধরবে)

### ওয়েবসাইট (`services`)

| কমিট | কী |
|---|---|
| তারিখ/সময় CLS ফিক্স | kundali 0.0996→0.0005 · match-making 0.1426→0.0077 · namakaran 0.0533→0.0011 · varshaphala 0.1139→0.0184 |
| account-deletion পাতা | Play-র বাধ্যতামূলক পাবলিক URL |

নতুন যাচাই-স্ক্রিপ্ট: `npm run test:dt-layout`

### পঞ্জিকা `panjika.js` bundle — ২৯-৩০ জুলাই সংশোধন (এই বিল্ডে প্রথমবার যাচ্ছে)

এই কমিটগুলো ওয়েবসাইট রেপোর `panjika.html`-এর সাথে মিলিয়ে bundle-এ পোর্ট
করা হয়েছে — অ্যাপের পঞ্জিকা ট্যাব ও বছর-PDF এই বিল্ডেই প্রথম এই সংশোধিত
হিসাব পাবে:

| কমিট | কী |
|---|---|
| চান্দ্রমাস নির্ণয় সংক্রান্তি-ধারণ নিয়মে | মলমাসের বছরে উৎসব দুবার দেখানো বন্ধ (২০২০-এর দুর্গাপূজা, ২০২৩-এর জন্মাষ্টমী/রাখী দুবার দেখাত) |
| মলমাস তালিকার ভুল সংশোধন | ২০২৯-এর গোটা দুর্গাপূজা ও ২০২৮-এর অগ্রহায়ণ ফিরল |
| ভুল উৎসব-ছবি সরানো + ৭টি নতুন ছবি | নবান্ন, জগদ্ধাত্রী, শীতলা ষষ্ঠী, গোবর্ধন পূজা, রাধাষ্টমী, নৃসিংহ চতুর্দশী, মহাবীর জয়ন্তী |
| পঞ্জিকা → `/utsab` লিংক | আজকের বিশেষ দিন ও মাসের তালিকায় "বিস্তারিত →" লিংক |

**ধাপ ৩-এর যাচাইয়ে যোগ করুন:**
- [ ] পঞ্জিকা ট্যাবে আজকের/মাসের কোনো উৎসবে ডবল-এন্ট্রি নেই
- [ ] বছর-PDF ডাউনলোড করে একটা মলমাসের মাস (যেমন ২০২৯-এর চৈত্র) চেক করুন —
      ব্যানারে "মলমাস" ঠিকভাবে দেখাচ্ছে, উৎসব দুবার নেই

---

## 🔮 পরে করার মতো (এখন জরুরি নয়)

- **R8/ProGuard চালু করা** — অ্যাপের সাইজ কমত (এখন 34.7MB), কিন্তু
  Firebase + OneSignal + Google Sign-In একসাথে থাকায় নিয়ম ঠিক না হলে
  **কেবল রিলিজ বিল্ডেই** ক্র্যাশ হয়। আলাদা internal testing রাউন্ড দরকার।
- **WebView-এ নেভিগেশন myastrology.in-এ সীমাবদ্ধ করা** — নিরাপত্তা-কড়াকড়ি,
  বর্তমান আচরণে বাগ নেই।
- **`result.js`-এর ৬৭১KB base64 ছবি** ফাইলে সরানো — lazy-loading-এর পর
  চালুর সময় আর লোডই হয় না, তাই লাভ কম।
- **ওয়েবসাইটে `font-display: swap`** — অবশিষ্ট CLS ~0.036, সব পাতাই এখন সবুজ।
