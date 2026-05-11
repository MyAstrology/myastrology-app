// App.js
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { UserProvider, useUser } from './src/context/UserContext';
import {
  registerForPushNotifications,
  schedulePanjikaNotification,
  scheduleTithiChangeNotification,
  checkNewYouTubeVideo,
  checkNewBlogPost,
} from './src/NotificationService';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const navigationRef = useRef(null);
  const notificationListener = useRef(null);
  const responseListener = useRef(null);
  const { user, loading } = useUser();

  const [fontsLoaded, fontError] = useFonts({
    'NotoSerifBengali': require('./assets/fonts/NotoSerifBengali-Regular.ttf'),
    'NotoSerifBengali-Bold': require('./assets/fonts/NotoSerifBengali-Bold.ttf'),
  });

  const ready = (fontsLoaded || fontError) && !loading;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    registerForPushNotifications();
    schedulePanjikaNotification();
    scheduleTithiChangeNotification();

    checkNewYouTubeVideo().then(video => {
      if (video) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: '🎦 নতুন ভিডিও!',
            body: video.title,
            data: { screen: 'YouTube', url: video.link },
            channelId: 'youtube',
          },
          trigger: null,
        });
      }
    });

    checkNewBlogPost().then(post => {
      if (post) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: '📝 নতুন ব্লগ পোস্ট!',
            body: post.title,
            data: { screen: 'Blog', slug: post.slug },
          },
          trigger: null,
        });
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.screen && navigationRef.current) {
        setTimeout(() => {
          try {
            if (data.screen === 'Panjika') {
              navigationRef.current.navigate('Tools', { screen: 'Panjika' });
            } else if (data.screen === 'Blog' && data.slug) {
              navigationRef.current.navigate('Blog', {
                screen: 'BlogDetail',
                params: { slug: data.slug, title: 'ব্লগ' },
              });
            } else if (data.screen === 'YouTube') {
              navigationRef.current.navigate('YouTube');
            }
          } catch {}
        }, 1000);
      }
    });

    return () => {
      if (notificationListener.current)
        Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current)
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  if (!ready) return null;

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" backgroundColor="#0e0e2a" />
      {user?.onboardingDone ? <AppNavigator /> : <OnboardingScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
