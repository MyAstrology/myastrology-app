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
      { id: 'default',  name: 'MyAstrology',       color: '#c9a84c' },
      { id: 'panjika',  name: 'পঞ্জিকা আপডেট',    color: '#f97316' },
      { id: 'rashifal', name: 'দৈনিক রাশিফল',     color: '#c9a84c' },
      { id: 'youtube',  name: 'নতুন ভিডিও',        color: '#ff0000' },
      { id: 'blog',     name: 'নতুন ব্লগ',         color: '#8b5cf6' },
      { id: 'festival', name: 'উৎসব ও পার্বণ',     color: '#ec4899' },
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

// 2026–2027 সম্পূর্ণ উৎসব তালিকা
const FESTIVALS_2026_2027 = [
  // 2026
  { name: 'মহাশিবরাত্রি',    date: [2026,  2, 17] },
  { name: 'দোলযাত্রা',       date: [2026,  3,  3] },
  { name: 'রামনবমী',          date: [2026,  3, 29] },
  { name: 'অক্ষয় তৃতীয়া',   date: [2026,  4, 21] },
  { name: 'রথযাত্রা',         date: [2026,  6, 24] },
  { name: 'জন্মাষ্টমী',      date: [2026,  8, 15] },
  { name: 'মহালয়া',          date: [2026,  9, 17] },
  { name: 'দুর্গাষষ্ঠী',     date: [2026,  9, 22] },
  { name: 'দুর্গাসপ্তমী',    date: [2026,  9, 23] },
  { name: 'দুর্গাঅষ্টমী',    date: [2026,  9, 24] },
  { name: 'দুর্গানবমী',      date: [2026,  9, 25] },
  { name: 'দুর্গাদশমী/বিজয়া',date: [2026,  9, 26] },
  { name: 'লক্ষ্মীপূজা',    date: [2026, 10,  2] },
  { name: 'কালীপূজা/দীপাবলি',date: [2026, 10, 20] },
  { name: 'ভাইফোঁটা',        date: [2026, 10, 22] },
  { name: 'জগদ্ধাত্রী পূজা', date: [2026, 11,  1] },
  { name: 'কার্তিক পূজা',    date: [2026, 11, 14] },
  { name: 'ইতু পূজা',        date: [2026, 11, 22] },
  // 2027
  { name: 'মকর সংক্রান্তি', date: [2027,  1, 14] },
  { name: 'সরস্বতী পূজা',   date: [2027,  1, 31] },
  { name: 'শিবরাত্রি',       date: [2027,  2,  6] },
  { name: 'দোলযাত্রা',       date: [2027,  3, 22] },
  { name: 'চৈত্রসংক্রান্তি', date: [2027,  4, 13] },
  { name: 'বাংলা নববর্ষ',   date: [2027,  4, 14] },
  { name: 'রথযাত্রা',        date: [2027,  7, 13] },
];

export async function scheduleFestivalNotifications() {
  const now = new Date();
  for (const f of FESTIVALS_2026_2027) {
    const [yr, mo, dy] = f.date;
    const festDay = new Date(yr, mo - 1, dy);
    // Notify the evening before at 8pm
    const notifyAt = new Date(yr, mo - 1, dy - 1, 20, 0, 0, 0);
    if (notifyAt > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🪔 আগামীকাল ${f.name}`,
          body: 'Dr. Acharya-র বিশেষ পরামর্শ নিন। শুভ অনুষ্ঠানের জন্য প্রস্তুতি নিন।',
          data: { screen: 'Consult' },
          channelId: 'festival',
        },
        trigger: { date: notifyAt },
      }).catch(() => {});
    }
    // Day-of notification at 7am
    const morningNotify = new Date(yr, mo - 1, dy, 7, 0, 0, 0);
    if (morningNotify > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🙏 আজ ${f.name}`,
          body: 'শুভেচ্ছা! পঞ্জিকা ও মুহূর্ত দেখুন।',
          data: { screen: 'Panjika' },
          channelId: 'festival',
        },
        trigger: { date: morningNotify },
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
      return latest; // includes .image, .title, .slug
    }
    return null;
  } catch { return null; }
}

export async function notifyNewBlogPost(post) {
  if (!post?.title) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📝 নতুন ব্লগ পোস্ট',
      body: post.title,
      data: {
        screen: 'BlogDetail',
        slug: post.slug,
        title: post.title,
        imageUrl: post.image || null,
      },
      channelId: 'blog',
      ...(post.image ? { attachments: [{ url: post.image }] } : {}),
    },
    trigger: null, // immediate
  }).catch(() => {});
}

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
