# MyAstrology App 🔮

ড. প্রদ্যুৎ আচার্যের জন্য তৈরি Bengali-first Vedic Astrology App।

## Tech Stack
- **Framework**: React Native + Expo
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **AI**: Claude API (Anthropic)
- **Payment**: Razorpay
- **Language**: বাংলা (Bengali-first)

## Project Structure

```
MyAstrologyApp/
├── App.js                          ← Root
├── app.json                        ← Expo config
├── package.json                    ← Dependencies
└── src/
    ├── theme/index.js              ← Design system
    ├── navigation/AppNavigator.js  ← Tab + Stack navigation
    └── screens/
        ├── HomeScreen.js           ← হোম (পঞ্জিকা + রাশিফল)
        ├── ToolsScreen.js          ← টুলস হাব
        ├── KundaliScreen.js        ← জন্মকুষ্ঠি
        ├── MatchMakingScreen.js    ← কুষ্ঠি মিলন
        ├── NumerologyScreen.js     ← নিউমেরোলজি
        ├── PanjikaScreen.js        ← বাংলা পঞ্জিকা
        ├── AIChatScreen.js         ← AI সহায়ক
        ├── BlogScreen.js           ← ব্লগ তালিকা
        ├── BlogDetailScreen.js     ← ব্লগ পোস্ট
        ├── RashifalScreen.js       ← দৈনিক রাশিফল
        └── ConsultScreen.js        ← পরামর্শ বুকিং
```

## Setup — ধাপে ধাপে

### ১. Node.js ও Expo CLI install করুন
```bash
# Node.js: https://nodejs.org (v18+)
npm install -g expo-cli eas-cli
```

### ২. Project তৈরি করুন
```bash
npx create-expo-app MyAstrology --template blank
cd MyAstrology
```

### ৩. এই সব file replace করুন
উপরের সব file যথাযথ folder-এ রাখুন।

### ৪. Dependencies install করুন
```bash
npm install
```

### ৫. Dev-এ চালান
```bash
npx expo start
# Android: 'a' press করুন
# Expo Go App দিয়ে QR scan করুন
```

### ৬. Android APK বানান (Play Store-এর আগে)
```bash
eas build --platform android --profile preview
```

### ৭. Play Store-এ submit করুন
```bash
eas build --platform android --profile production
eas submit --platform android
```

## পরবর্তী কাজ (Phase 2)

- [ ] Push notifications (daily rashifal)
- [ ] Offline panjika cache
- [ ] Native kundali chart rendering
- [ ] Razorpay payment integration
- [ ] User profile & saved rashifals
- [ ] iOS App Store submission

## যোগাযোগ

**ড. প্রদ্যুৎ আচার্য**
নাসরা মাগুর খালি, রাণাঘাট, নদিয়া
WhatsApp: +91 93331 22768
Website: https://www.myastrology.in
