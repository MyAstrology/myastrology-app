import './src/polyfills';
import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import { BottomTabs } from './src/navigation/BottomTabs';

function App() {
  const [fontsLoaded] = useFonts({
    'NotoSerifBengali-Regular': require('./assets/fonts/NotoSerifBengali-Regular.ttf'),
    'NotoSerifBengali-Bold':    require('./assets/fonts/NotoSerifBengali-Bold.ttf'),
  });

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#FAF8F3' }} />;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <BottomTabs />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
