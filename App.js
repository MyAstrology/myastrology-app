import './src/polyfills';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { registerRootComponent } from 'expo';
import { BottomTabs } from './src/navigation/BottomTabs';

function App() {
  return (
    <NavigationContainer>
      <BottomTabs />
    </NavigationContainer>
  );
}

registerRootComponent(App);
