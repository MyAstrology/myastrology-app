import './src/polyfills';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { UserProvider } from './src/context/UserContext';
import { AuthProvider } from './src/context/AuthContext';
import { BottomTabs } from './src/navigation/BottomTabs';
import { SplashOverlay } from './src/components/SplashOverlay';
import { initOneSignal } from './src/utils/onesignal';

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

  useEffect(() => { initOneSignal(); }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    SplashScreen.hideAsync();
    // ব্র্যান্ডেড ছবিটা অন্তত কিছুক্ষণ পুরোপুরি দেখার সময় দেওয়া, তারপর fade
    const t = setTimeout(() => {
      Animated.timing(splashOpacity, { toValue: 0, duration: 350, useNativeDriver: true })
        .start(() => setShowSplash(false));
    }, 500);
    return () => clearTimeout(t);
  }, [fontsLoaded]);

  return (
    <SafeAreaProvider>
      <UserProvider>
        <AuthProvider>
          {fontsLoaded ? (
            <NavigationContainer>
              <BottomTabs />
            </NavigationContainer>
          ) : (
            <View style={{ flex: 1, backgroundColor: '#FEFAF2' }} />
          )}
        </AuthProvider>
      </UserProvider>
      {showSplash && <SplashOverlay opacity={splashOpacity} />}
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
