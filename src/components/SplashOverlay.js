import React from 'react';
import { Animated, Image, StyleSheet } from 'react-native';

// Android 12+ এর নিজস্ব সিস্টেম স্প্ল্যাশ স্ক্রিন শুধু ছোট্ট একটা আইকন কেন্দ্রে
// দেখাতে পারে (সম্পূর্ণ ডিজাইন করা ব্র্যান্ডেড ছবি না) — তাই App.js OS স্প্ল্যাশ
// যত দ্রুত সম্ভব সরিয়ে দেয়, আর এই পুরো-স্ক্রিন ওভারলে-টা সম্পূর্ণ ব্র্যান্ডেড
// ছবিটা (assets/splash-full.png) দেখিয়ে তারপর ফেড-আউট হয়ে আসল অ্যাপে চলে যায়।
// ছবিটা ধীরে ধীরে সামান্য বড় হয় (১ → ১.০৮) আর শেষে মিলিয়ে যায় — স্থির ছবি
// হঠাৎ উধাও হওয়ার চেয়ে এটা অনেক বেশি "অ্যাপ খুলছে" অনুভূতি দেয়। জুমটা
// ওভারলের সাথেই শেষ হয়, তাই অপেক্ষার সময় এক বিন্দুও বাড়ে না।
export function SplashOverlay({ opacity, scale }) {
  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, styles.wrap, { opacity }]}
      pointerEvents="none"
    >
      <Animated.Image
        source={require('../../assets/splash-full.png')}
        style={[StyleSheet.absoluteFillObject, scale ? { transform: [{ scale }] } : null]}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#FEFAF2' },
});
