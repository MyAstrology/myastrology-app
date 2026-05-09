// App.js — MyAstrology Final Version
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import {
  registerForPushNotifications,
  schedulePanjikaNotification,
  checkNewYouTubeVideo,
  checkNewBlogPost,
} from './src/services/NotificationService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const navigationRef = useRef(null);
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  // Font loading
  const [fontsLoaded, fontError] = useFonts({
    'NotoSerifBengali': require('./assets/fonts/NotoSerifBengali-Regular.ttf'),
    'NotoSerifBengali-Bold': require('./assets/fonts/NotoSerifBengali-Bold.ttf'),
  });

  const ready = fontsLoaded || fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    // Push notification setup
    registerForPushNotifications();

    // Daily panjika notification
    schedulePanjikaNotification('আজকের তিথি');

    // Check new YouTube video
    checkNewYouTubeVideo().then(video => {
      if (video) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: '🎬 নতুন ভিডিও!',
            body: video.title,
            data: { screen: 'YouTube', url: video.link },
            channelId: 'youtube',
          },
          trigger: null,
        });
      }
    });

    // Check new blog post
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

    // Notification tap handler
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="light" backgroundColor="#070e1a" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
