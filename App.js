// App.js — MyAstrology Root (Updated)
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen'; 
import { 
  useFonts, 
  NotoSerifBengali_400Regular, 
  NotoSerifBengali_700Bold 
} from '@expo-google-fonts/noto-serif-bengali';

import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/theme';

// স্প্ল্যাশ স্ক্রিন ধরে রাখা
SplashScreen.preventAutoHideAsync();

export default function App() {
  // ফন্ট লোড করার সিস্টেম যোগ করা হলো
  const [fontsLoaded] = useFonts({
    'NotoSerifBengali': NotoSerifBengali_400Regular,
    'NotoSerifBengali-Bold': NotoSerifBengali_700Bold,
  });

  useEffect(() => {
    async function hideSplash() {
      if (fontsLoaded) {
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [fontsLoaded]);

  // ফন্ট লোড না হওয়া পর্যন্ত অ্যাপ সাদা স্ক্রিন দেখাবে না
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={Colors.bg} />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
