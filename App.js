import './src/polyfills';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { UserProvider } from './src/context/UserContext';
import { AuthProvider } from './src/context/AuthContext';
import { BottomTabs } from './src/navigation/BottomTabs';
import { initOneSignal } from './src/utils/onesignal';

// অ্যাপ চালু হওয়ার সময় ফন্ট লোড না হওয়া পর্যন্ত নেটিভ স্প্ল্যাশ স্ক্রিন ধরে
// রাখা (আগে ফন্ট লোড হওয়ার আগেই স্প্ল্যাশ সরে গিয়ে একটা খালি/আলাদা রঙের
// পর্দা দেখাতো), এবং সরার সময় হঠাৎ কাট না করে হালকা fade — এটাই এখন একমাত্র
// "অ্যানিমেশন" (আইকন/স্প্ল্যাশ ছবি নিজে স্থির, লোগো-অ্যানিমেশন না)।
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 150, fade: true });

function App() {
  const [fontsLoaded] = useFonts({
    'NotoSerifBengali-Regular': require('./assets/fonts/NotoSerifBengali-Regular.ttf'),
    'NotoSerifBengali-Bold':    require('./assets/fonts/NotoSerifBengali-Bold.ttf'),
  });

  useEffect(() => { initOneSignal(); }, []);
  useEffect(() => { if (fontsLoaded) SplashScreen.hideAsync(); }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#FEFAF2' }} />;

  return (
    <SafeAreaProvider>
      <UserProvider>
        <AuthProvider>
          <NavigationContainer>
            <BottomTabs />
          </NavigationContainer>
        </AuthProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
