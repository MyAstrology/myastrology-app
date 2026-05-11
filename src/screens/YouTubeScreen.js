// src/screens/YouTubeScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, Linking, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';

const CHANNEL_ID  = 'UCZCq3OfPJXZnleaXyL5bfxA';
const CHANNEL_URL = 'https://www.youtube.com/@myastrology';
const RSS_URL     = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const RSS_API     = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;
const SITEMAP_URL = 'https://www.myastrology.in/video-sitemap.xml';

// RSS2JSON response থেকে video list তৈরি
function parseRSS(data) {
  if (data.status !== 'ok' || !data.items?.length) return [];
  return data.items.map(item => ({
    title:     item.title,
    link:      item.link,
    guid:      item.guid,
    thumbnail: item.thumbnail || getThumbnailFromURL(item.link),
    pubDate:   item.pubDate,
  }));
}

// video-sitemap.xml parse করে fallback video list তৈরি
function parseSitemapXML(xml) {
  const videos = [];
  const blocks = xml.split('<video:video>').slice(1);
  for (const block of blocks) {
    const titleM   = block.match(/<video:title><!\[CDATA\[([\s\S]*?)\]\]><\/video:title>/);
    const contentM = block.match(/<video:content_loc>([\s\S]*?)<\/video:content_loc>/);
    const thumbM   = block.match(/<video:thumbnail_loc>([\s\S]*?)<\/video:thumbnail_loc>/);
    if (!titleM || !contentM) continue;
    const link = contentM[1].trim();
    videos.push({
      title:     titleM[1].trim(),
      link,
      guid:      link,
      thumbnail: thumbM ? thumbM[1].trim() : getThumbnailFromURL(link),
      pubDate:   null,
    });
  }
  return videos;
}

function getThumbnailFromURL(url) {
  const id = url?.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/)?.[1];
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const months = ['জানু','ফেব্রু','মার্চ','এপ্রিল','মে','জুন',
    'জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function VideoCard({ item, onPress }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <TouchableOpacity style={styles.videoCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.thumbnailWrap}>
        {item.thumbnail && imgOk ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail}
            resizeMode="cover" onError={() => setImgOk(false)} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={{ fontSize: 36 }}>🎬</Text>
          </View>
        )}
        <View style={styles.playBtn}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
        <View style={styles.ytBadge}>
          <Text style={styles.ytBadgeText}>YouTube</Text>
        </View>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.videoMeta}>
          {item.pubDate
            ? <Text style={styles.videoDate}>📅 {formatDate(item.pubDate)}</Text>
            : <View />}
          <View style={styles.watchBtn}>
            <Text style={styles.watchBtnText}>দেখুন →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function YouTubeScreen() {
  const insets = useSafeAreaInsets();
  const [videos, setVideos]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);

  const fetchVideos = useCallback(async () => {
    setError(null);
    try {
      // Primary: RSS2JSON API — সঠিক channel ID দিয়ে, date সহ
      const res = await fetch(RSS_API);
      if (res.ok) {
        const data = await res.json();
        const items = parseRSS(data);
        if (items.length > 0) {
          setVideos(items);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }
    } catch (_) {}

    try {
      // Fallback: video-sitemap.xml থেকে parse
      const res = await fetch(SITEMAP_URL);
      if (res.ok) {
        const xml = await res.text();
        const items = parseSitemapXML(xml);
        if (items.length > 0) {
          setVideos(items);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }
    } catch (_) {}

    setError('ভিডিও এখন লোড হচ্ছে না। পরে আবার চেষ্টা করুন।');
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVideos();
  }, [fetchVideos]);

  if (loading) return (
    <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color={Colors.gold} />
      <Text style={styles.loadingText}>ভিডিও লোড হচ্ছে...</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🎬 ভিডিও</Text>
          <Text style={styles.subtitle}>Dr. Prodyut Acharya · MyAstrology</Text>
        </View>
        <TouchableOpacity style={styles.channelBtn}
          onPress={() => Linking.openURL(CHANNEL_URL)}>
          <Text style={styles.channelBtnText}>Channel →</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.subscribeBanner}
        onPress={() => Linking.openURL(CHANNEL_URL)}>
        <Text style={{ fontSize: 24 }}>📺</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.subscribeTitle}>@myastrology — ২,২৪,১৫০+ Subscribers</Text>
          <Text style={styles.subscribeSub}>Subscribe করুন · নতুন ভিডিও notification পান</Text>
        </View>
        <View style={styles.subscribeBtn}>
          <Text style={styles.subscribeBtnText}>Subscribe</Text>
        </View>
      </TouchableOpacity>

      {error ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>😔</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchVideos}>
            <Text style={styles.retryText}>🔄 আবার চেষ্টা করুন</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ytDirectBtn}
            onPress={() => Linking.openURL(CHANNEL_URL)}>
            <Text style={styles.ytDirectText}>🎬 YouTube-এ দেখুন</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item, i) => item.guid || String(i)}
          renderItem={({ item }) => (
            <VideoCard item={item} onPress={() => Linking.openURL(item.link)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={Colors.gold} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={styles.errorText}>কোনো ভিডিও পাওয়া যায়নি</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.goldLight },
  subtitle: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  channelBtn: {
    backgroundColor: 'rgba(255,0,0,0.15)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,0,0,0.3)',
  },
  channelBtnText: { fontSize: 12, color: '#ff5555', fontWeight: '700' },
  subscribeBanner: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 14,
    backgroundColor: 'rgba(255,0,0,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,0,0,0.2)',
    padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  subscribeTitle: { fontSize: 13, fontWeight: '700', color: '#ff7070' },
  subscribeSub: { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  subscribeBtn: {
    backgroundColor: '#cc0000', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  subscribeBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 16 },
  videoCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.goldBorder,
  },
  thumbnailWrap: { width: '100%', height: 200, position: 'relative' },
  thumbnail: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    width: '100%', height: '100%', backgroundColor: Colors.headerGrad1,
    alignItems: 'center', justifyContent: 'center',
  },
  playBtn: {
    position: 'absolute', top: '50%', left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)',
  },
  playIcon: { color: '#fff', fontSize: 16, marginLeft: 3 },
  ytBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: '#cc0000', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  ytBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  videoInfo: { padding: 14 },
  videoTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, lineHeight: 22, marginBottom: 10 },
  videoMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  videoDate: { fontSize: 12, color: Colors.textSub },
  watchBtn: {
    backgroundColor: Colors.goldGlow, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  watchBtnText: { fontSize: 12, color: Colors.gold, fontWeight: '700' },
  loadingText: { color: Colors.textSub, marginTop: 12, fontSize: 14 },
  errorText: { color: Colors.textSub, fontSize: 14, textAlign: 'center', marginTop: 12 },
  retryBtn: {
    marginTop: 16, backgroundColor: Colors.goldGlow, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: Colors.goldBorder,
  },
  retryText: { color: Colors.goldLight, fontWeight: '700' },
  ytDirectBtn: {
    marginTop: 10, backgroundColor: 'rgba(255,0,0,0.15)', borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,0,0,0.3)',
  },
  ytDirectText: { color: '#ff7070', fontWeight: '700' },
});
