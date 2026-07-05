import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor="#F8F5EF" />
      <AppNavigator />
    </NavigationContainer>
  );
}
