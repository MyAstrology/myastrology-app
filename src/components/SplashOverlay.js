import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// Android 12+ এর নিজস্ব সিস্টেম স্প্ল্যাশ স্ক্রিন শুধু ছোট্ট একটা ছবি কেন্দ্রে
// দেখাতে পারে (পুরো পর্দা জোড়া ডিজাইন না) — তাই App.js OS স্প্ল্যাশ যত দ্রুত
// সম্ভব সরিয়ে দেয়, আর এই ওভারলে-টা বাকি অ্যানিমেশনটা চালায়।
//
// আগে যা ভুল ছিল (২ অগাস্ট ২০২৬-এ ঠিক করা):
//   ১. ওভারলে ছবিটা resizeMode="cover" দিয়ে পুরো পর্দা ভরাত। ছবির অনুপাত
//      ১:১.৫, আর সাধারণ ফোনের পর্দা ১:২.১৭ — অর্থাৎ ছবির **দুপাশ থেকে
//      মোট ৩১% কেটে** যেত। "MYASTROLOGY" লেখাটা প্রায় পুরো চওড়া জুড়ে,
//      তাই প্রথম ও শেষ অক্ষরগুলো কাটা পড়ত। ১.০৮ জুম সেটাকে আরও বাড়াত।
//   ২. OS স্প্ল্যাশ দেখাত ছোট একটা ছবি মাঝখানে, তার ঠিক পরেই ওভারলে দেখাত
//      পুরো পর্দা জোড়া অন্য একটা ছবি — চোখে একটা ধাক্কার মতো লাফ লাগত।
//
// এখন দুটো ধাপেই **একই ছবি, একই মাপে** (contain, ৩০০dp চওড়া) — তাই কোনো
// লাফ নেই, কিছুই কাটা যায় না। তারপর ছবিটা মৃদু বড় হতে হতে মিলিয়ে যায়,
// অ্যাপটা যেন ছবির ভিতর থেকেই খুলছে।

// app.json-এর expo-splash-screen প্লাগইনের imageWidth-এর সাথে হুবহু মিলতে
// হবে — না মিললে OS স্প্ল্যাশ থেকে ওভারলেতে যাওয়ার সময় ছবিটা লাফ দেবে।
export const SPLASH_IMAGE_WIDTH = 300;
// splash-full.png আসল মাপ ৯১১×১৩৬৭ → অনুপাত ১.৫০০৫
const SPLASH_IMAGE_HEIGHT = Math.round(SPLASH_IMAGE_WIDTH * 1367 / 911);

export function SplashOverlay({ opacity, scale }) {
  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, styles.wrap, { opacity }]}
      pointerEvents="none"
    >
      <View style={styles.center}>
        <Animated.Image
          source={require('../../assets/splash-full.png')}
          style={[styles.img, scale ? { transform: [{ scale }] } : null]}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap:   { backgroundColor: '#FEFAF2' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  img:    { width: SPLASH_IMAGE_WIDTH, height: SPLASH_IMAGE_HEIGHT },
});
