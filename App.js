import './src/polyfills';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { UserProvider } from './src/context/UserContext';
import { AuthProvider } from './src/context/AuthContext';
import { BottomTabs } from './src/navigation/BottomTabs';
import { linking } from './src/navigation/linking';
import { SplashOverlay } from './src/components/SplashOverlay';
import { initOneSignal } from './src/utils/onesignal';
import { logScreenView } from './src/utils/analytics';

// Android 12+ এ OS নিজেই শুধু ছোট আইকন স্প্ল্যাশ দেখাতে পারে, পুরো ব্র্যান্ডেড
// ছবি না — তাই সেটা যত দ্রুত সম্ভব সরিয়ে (fade ছাড়াই) দেওয়া হয়, আর এর বদলে
// App.js নিজে একটা পূর্ণ-স্ক্রিন <SplashOverlay> দেখায় যেটা আসল ডিজাইন করা
// স্প্ল্যাশ ছবিটা (assets/splash-full.png) সম্পূর্ণ দেখিয়ে তারপর ফেড-আউট হয়।
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 0, fade: false });

function App() {
  const [fontsLoaded] = useFonts({
    'NotoSerifBengali-Regular': require('./assets/fonts/NotoSerifBengali-Regular.ttf'),
    'NotoSerifBengali-Bold':    require('./assets/fonts/NotoSerifBengali-Bold.ttf'),
  });
  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const splashScale   = useRef(new Animated.Value(1)).current;
  const routeNameRef = useRef();
  const navigationRef = useRef();

  useEffect(() => { initOneSignal(); }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    SplashScreen.hideAsync();
    // ছবিটা OS স্প্ল্যাশের ঠিক যে মাপে ছিল সেখান থেকেই শুরু হয় (কোনো লাফ নেই),
    // তারপর ধীরে বড় হতে হতে মিলিয়ে যায় — যেন অ্যাপটা ছবির ভিতর থেকে খুলছে।
    // Easing.out(cubic): শুরুতে দ্রুত, শেষে ধীর — হঠাৎ থেমে যাওয়ার বদলে
    // স্বাভাবিক গতি। মোট সময় আগের মতোই (~৮৫০ms), অপেক্ষা বাড়েনি।
    Animated.timing(splashScale, {
      toValue: 1.18, duration: 880,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
    const t = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0, duration: 380,
        easing: Easing.in(Easing.quad), useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }, 500);
    return () => clearTimeout(t);
  }, [fontsLoaded]);

  return (
    <SafeAreaProvider>
      <UserProvider>
        <AuthProvider>
          {fontsLoaded ? (
            <NavigationContainer
              ref={navigationRef}
              linking={linking}
              onReady={() => {
                routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
              }}
              onStateChange={() => {
                const previousRouteName = routeNameRef.current;
                const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
                if (currentRouteName && previousRouteName !== currentRouteName) {
                  logScreenView(currentRouteName);
                }
                routeNameRef.current = currentRouteName;
              }}
            >
              <BottomTabs />
            </NavigationContainer>
          ) : (
            <View style={{ flex: 1, backgroundColor: '#FEFAF2' }} />
          )}
        </AuthProvider>
      </UserProvider>
      {showSplash && <SplashOverlay opacity={splashOpacity} scale={splashScale} />}
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
