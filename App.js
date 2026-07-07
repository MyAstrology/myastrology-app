import './src/polyfills';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import { UserProvider } from './src/context/UserContext';
import { AuthProvider } from './src/context/AuthContext';
import { BottomTabs } from './src/navigation/BottomTabs';
import { initOneSignal } from './src/utils/onesignal';

function App() {
  const [fontsLoaded] = useFonts({
    'NotoSerifBengali-Regular': require('./assets/fonts/NotoSerifBengali-Regular.ttf'),
    'NotoSerifBengali-Bold':    require('./assets/fonts/NotoSerifBengali-Bold.ttf'),
  });

  useEffect(() => { initOneSignal(); }, []);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#FAF8F3' }} />;

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
