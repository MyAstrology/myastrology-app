# Firebase সেটআপ গাইড (Google Sign-In + Login কাজ করানোর জন্য)

এই ধাপগুলো একবারই করতে হবে। ধাপে ধাপে করুন, কোনো ধাপ স্কিপ করবেন না।

## ধাপ ১ — Firebase প্রজেক্ট তৈরি

1. ব্রাউজারে যান: https://console.firebase.google.com
2. আপনার Google (Gmail) অ্যাকাউন্ট দিয়ে সাইন-ইন করুন
3. **"Add project" / "প্রজেক্ট যোগ করুন"** বাটনে ক্লিক করুন
4. নাম দিন: `MyAstrology` (বা যেকোনো নাম)
5. Google Analytics-এর প্রশ্ন আসলে — চাইলে বন্ধ (disable) করে দিতে পারেন, এটা ঐচ্ছিক
6. **Create project** ক্লিক করুন, তৈরি হওয়া পর্যন্ত অপেক্ষা করুন

## ধাপ ২ — Web App যোগ করুন (কনফিগ পাওয়ার জন্য)

1. প্রজেক্ট ড্যাশবোর্ডে, উপরে বাঁ দিকে **⚙️ (গিয়ার আইকন) → Project settings** ক্লিক করুন
2. নিচে স্ক্রল করে **"Your apps"** সেকশনে যান
3. **`</>`  (Web)** আইকনে ক্লিক করুন
4. অ্যাপের নাম দিন (যেমন `MyAstrology App`), **Register app** ক্লিক করুন
5. এখন একটা `firebaseConfig` অবজেক্ট দেখাবে, এরকম:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "myastrology-xxxxx.firebaseapp.com",
     projectId: "myastrology-xxxxx",
     storageBucket: "myastrology-xxxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
6. এই পুরো অবজেক্টটা কপি করে রাখুন (স্ক্রিনশট নিয়ে রাখতে পারেন)

## ধাপ ৩ — Google Sign-In চালু করুন

1. বাঁ দিকের মেনু থেকে **Build → Authentication** ক্লিক করুন
2. **Get started** ক্লিক করুন
3. **Sign-in method** ট্যাবে যান
4. তালিকা থেকে **Google** ক্লিক করুন
5. **Enable** টগল অন করুন
6. **Project support email** — আপনার ইমেইল বেছে নিন
7. **Save** ক্লিক করুন
8. এবার আবার Google-এর ওপর ক্লিক করে খুলুন — নিচে **"Web SDK configuration"** অংশে একটা **"Web client ID"** দেখাবে (এরকম: `123456789-abc...apps.googleusercontent.com`) — এটাও কপি করে রাখুন

## ধাপ ৪ — Firestore Database চালু করুন (ইউজারের তথ্য রাখার জায়গা)

1. বাঁ দিকের মেনু থেকে **Build → Firestore Database** ক্লিক করুন
2. **Create database** ক্লিক করুন
3. Location হিসেবে **asia-south1 (Mumbai)** বেছে নিন (ভারতের সবচেয়ে কাছের)
4. **Start in production mode** বেছে নিয়ে **Create** ক্লিক করুন
5. তৈরি হওয়ার পর, **Rules** ট্যাবে যান, বর্তমান লেখা সব মুছে এটা পেস্ট করুন:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
6. **Publish** ক্লিক করুন

## ধাপ ৫ — কপি করা মানগুলো কোডে বসান

`expo-poc/src/config/firebase.js` ফাইলটা খুলুন (GitHub-এ বা আপনার এডিটরে), এবং `REPLACE_ME` লেখা প্রতিটা জায়গায় ধাপ ২ ও ৩-এ কপি করা মান বসান:

```js
const firebaseConfig = {
  apiKey:           'ধাপ ২-এর apiKey',
  authDomain:       'ধাপ ২-এর authDomain',
  projectId:        'ধাপ ২-এর projectId',
  storageBucket:    'ধাপ ২-এর storageBucket',
  messagingSenderId:'ধাপ ২-এর messagingSenderId',
  appId:            'ধাপ ২-এর appId',
};

export const GOOGLE_WEB_CLIENT_ID = 'ধাপ ৩-এর Web client ID';
```

`GOOGLE_ANDROID_CLIENT_ID` এখনই বসাতে হবে না — এটা EAS dev-build বানানোর পরের ধাপ (নিচে দেখুন)।

## ধাপ ৬ — নিজের ইমেইলকে অ্যাডমিন বানান (ঐচ্ছিক)

আপনি নিজে অ্যাপে "অ্যাডমিন প্যানেল" দেখতে চাইলে, `expo-poc/src/config/adminEmails.js` ফাইলে নিজের Gmail যোগ করুন:
```js
export const ADMIN_EMAILS = [
  'আপনার.ইমেইল@gmail.com',
];
```

## ধাপ ৭ — পরে করার জন্য (Android Client ID)

যখন dev-client build (EAS Build) রেডি হয়ে যাবে (OneSignal টেস্টিং-এর জন্যও এটা লাগছিল), তখন:
1. https://console.cloud.google.com — একই প্রজেক্ট বেছে নিন
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
3. Application type: **Android**
4. Package name: `in.myastrology.app`
5. SHA-1: `eas credentials` কমান্ড চালিয়ে বের করতে হবে (এটা তখন সাহায্য করে দেব)
6. তৈরি হওয়া client ID-টা `GOOGLE_ANDROID_CLIENT_ID`-তে বসাবেন

---

এই ৬টা ধাপ (৭ম টা পরে) শেষ করলেই Settings-এর "Google দিয়ে সাইন-ইন করুন" বাটন কাজ করা শুরু করবে। কোনো ধাপে আটকালে, ঠিক কোন ধাপে কী দেখাচ্ছে তার স্ক্রিনশট পাঠান।
