// src/NotificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayPanjika, getNextTithiChange } from './engine/panjika';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    const channels = [
      { id: 'default', name: 'MyAstrology', color: '#c9a84c' },
      { id: 'panjika', name: 'পঞ্জিকা আপডেট', color: '#f97316' },
      { id: 'rashifal', name: 'দৈনিক রাশিফল', color: '#c9a84c' },
      { id: 'youtube', name: 'নতুন ভিডিও', color: '#ff0000' },
      { id: 'blog', name: 'নতুন ব্লগ', color: '#8b5cf6' },
      { id: 'festival', name: 'উৎসব ও পার্বণ', color: '#ec4899' },
    ];
    for (const ch of channels) {
      await Notifications.setNotificationChannelAsync(ch.id, {
        name: ch.name,
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: ch.color,
        sound: 'default',
      });
    }
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: '2678cdd7-fa10-4b80-8aa5-f276b88a51a3',
  });
  await AsyncStorage.setItem('pushToken', token.data);
  return token.data;
}

export async function scheduleRashifalNotification(rashiName = null) {
  await Notifications.cancelScheduledNotificationAsync('rashifal-daily').catch(() => {});

  let title = '🌟 আজকের রাশিফল';
  let body = 'শুভ সকাল! আজকের গ্রহ অবস্থান ও রাশিফল জানুন।';

  if (rashiName) {
    title = `🌟 ${rashiName} রাশিফল`;
    body = `শুভ সকাল! ${rashiName} রাশির আজকের ফল জানুন।`;
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`https://www.myastrology.in/rashifal/${today}.json`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const found = data.find(r => r.rashi === rashiName);
          if (found?.summary) body = found.summary;
        }
      }
    } catch (_) {}
  }

  await Notifications.scheduleNotificationAsync({
    identifier: 'rashifal-daily',
    content: { title, body, data: { screen: 'Rashifal' }, channelId: 'rashifal' },
    trigger: { hour: 7, minute: 0, repeats: true },
  });
}

export async function schedulePanjikaNotification() {
  await Notifications.cancelScheduledNotificationAsync('panjika-daily').catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: 'panjika-daily',
    content: {
      title: 'আজকের পঞ্জিকা',
      body: 'তিথি, নক্ষত্র ও রাহুকাল জানুন।',
      data: { screen: 'Panjika' },
      channelId: 'panjika',
    },
    trigger: { hour: 6, minute: 0, repeats: true },
  });
}

export async function scheduleFestivalNotifications() {
  const now = new Date();
  const festivals = [
    { name: 'দুর্গাপূজা', date: new Date(2026, 9, 1) },
    { name: 'দীপাবলি', date: new Date(2026, 9, 20) },
    { name: 'কালীপূজা', date: new Date(2026, 9, 21) },
    { name: 'সরস্বতী পূজা', date: new Date(2027, 1, 1) },
    { name: 'শিবরাত্রি', date: new Date(2027, 1, 26) },
    { name: 'দোলযাত্রা', date: new Date(2027, 2, 4) },
    { name: 'রথযাত্রা', date: new Date(2027, 5, 27) },
  ];
  for (const f of festivals) {
    const d = new Date(f.date);
    d.setDate(d.getDate() - 1);
    d.setHours(9, 0, 0, 0);
    if (d > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'আগামীকাল ' + f.name,
          body: 'Dr. Acharya-র বিশেষ পরামর্শ নিন।',
          data: { screen: 'Consult' },
          channelId: 'festival',
        },
        trigger: { date: d },
      }).catch(() => {});
    }
  }
}

export async function checkNewYouTubeVideo() {
  try {
    const CHANNEL_ID = 'UCZCq3OfPJXZnleaXyL5bfxA';
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const res = await fetch(apiUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && data.items?.length) {
        const latest = data.items[0];
        const saved = await AsyncStorage.getItem('lastYoutubeVideoId');
        if (saved !== latest.guid) {
          await AsyncStorage.setItem('lastYoutubeVideoId', latest.guid);
          return { title: latest.title, thumbnail: latest.thumbnail, link: latest.link };
        }
        return null;
      }
    }
  } catch (_) {}
  return null;
}

export async function checkNewBlogPost() {
  try {
    const res = await fetch('https://www.myastrology.in/src/content/blog/list.json');
    const data = await res.json();
    const posts = Array.isArray(data) ? data : (data.posts || []);
    if (!posts.length) return null;
    const latest = posts[0];
    const saved = await AsyncStorage.getItem('lastBlogSlug');
    if (saved !== latest.slug) {
      await AsyncStorage.setItem('lastBlogSlug', latest.slug);
      return latest;
    }
    return null;
  } catch { return null; }
}

// তিথি পরিবর্তনের সময় notification schedule করে
export async function scheduleTithiChangeNotification() {
  try {
    await Notifications.cancelScheduledNotificationAsync('tithi-change').catch(() => {});
    const change = getNextTithiChange(new Date());
    if (!change) return;
    const { time, tithiName } = change;
    const panjika = getTodayPanjika();
    await Notifications.scheduleNotificationAsync({
      identifier: 'tithi-change',
      content: {
        title: '🌙 তিথি পরিবর্তন হচ্ছে',
        body: `${panjika.tithi} শেষ হয়ে ${tithiName} তিথি শুরু হবে।`,
        data: { screen: 'Panjika' },
        channelId: 'panjika',
      },
      trigger: { date: time },
    });
  } catch (_) {}
}

export async function cancelAllScheduled() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
