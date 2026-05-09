// src/screens/YouTubeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, Linking, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../theme';

const CHANNEL_HANDLE = '@myastrology';
const RSS_API = 'https://api.rss2json.com/v1/api.json?rss_url=';
const YOUTUBE_RSS = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCZCq3OfPJXZnleaXyL5bfxA';

// YouTube thumbnail from video ID
function getThumbnail(url) {
  const match = url?.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = ['জানু','ফেব্রু','মার্চ','এপ্রিল','মে','জুন',
    'জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function VideoCard({ item, onPress }) {
  const thumbnail = getThumbnail(item.link) || item.thumbnail;
  return (
    <TouchableOpacity style={styles.videoCard} onPress={onPress} activeOpacity={0.85}>
      {thumbnail ? (
        <View style={styles.thumbnailWrap}>
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} resizeMode="cover" />
          <View style={styles.playBtn}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
          <View style={styles.ytBadge}>
            <Text style={styles.ytBadgeText}>YouTube</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.thumbnailWrap, styles.thumbnailPlaceholder]}>
          <Text style={{ fontSize: 40 }}>🎬</Text>
        </View>
      )}
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.videoMeta}>
          <Text style={styles.videoDate}>📅 {formatDate(item.pubDate)}</Text>
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
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchVideos = async () => {
    try {
      // RSS2JSON API দিয়ে YouTube feed fetch
      const url = `${RSS_API}${encodeURIComponent(YOUTUBE_RSS)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'ok' && data.items) {
        setVideos(data.items);
        setError(null);
      } else {
        // Fallback: myastrology.in/video.html থেকে
        setError('YouTube feed লোড হচ্ছে না');
      }
    } catch (e) {
      setError('Internet সংযোগ নেই');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchVideos(); };

  const openVideo = (url) => Linking.openURL(url);
  const openChannel = () => Linking.openURL('https://youtube.com/@myastrology');

  if (loading) return (
    <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color={Colors.gold} />
      <Text style={styles.loadingText}>ভিডিও লোড হচ্ছে...</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🎬 ভিডিও</Text>
          <Text style={styles.subtitle}>MyAstrology YouTube Channel</Text>
        </View>
        <TouchableOpacity style={styles.channelBtn} onPress={openChannel}>
          <Text style={styles.channelBtnText}>Channel →</Text>
        </TouchableOpacity>
      </View>

      {/* Subscribe banner */}
      <TouchableOpacity style={styles.subscribeBanner} onPress={openChannel}>
        <Text style={{ fontSize: 24 }}>📺</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.subscribeTitle}>@myastrology Subscribe করুন</Text>
          <Text style={styles.subscribeSub}>নতুন ভিডিও notification পান</Text>
        </View>
        <View style={styles.subscribeBtn}>
          <Text style={styles.subscribeBtnText}>Subscribe</Text>
        </View>
      </TouchableOpacity>

      {error ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>😔</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchVideos}>
            <Text style={styles.retryText}>আবার চেষ্টা করুন</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ytDirectBtn} onPress={openChannel}>
            <Text style={styles.ytDirectText}>🎬 YouTube-এ দেখুন</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item, i) => item.guid || i.toString()}
          renderItem={({ item }) => (
            <VideoCard item={item} onPress={() => openVideo(item.link)} />
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
    backgroundColor: 'rgba(255,0,0,0.15)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,0,0,0.3)',
  },
  channelBtnText: { fontSize: 12, color: '#ff4444', fontWeight: '700' },
  subscribeBanner: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, backgroundColor: 'rgba(255,0,0,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,0,0,0.2)',
    padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  subscribeTitle: { fontSize: 14, fontWeight: '700', color: '#ff6666' },
  subscribeSub: { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  subscribeBtn: {
    backgroundColor: '#ff0000', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  subscribeBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  list: { padding: 16, gap: 16 },
  videoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  thumbnailWrap: {
    width: '100%', height: 200,
    position: 'relative', overflow: 'hidden',
  },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailPlaceholder: {
    backgroundColor: '#0d1f35',
    alignItems: 'center', justifyContent: 'center',
  },
  playBtn: {
    position: 'absolute', top: '50%', left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  playIcon: { color: '#fff', fontSize: 16, marginLeft: 3 },
  ytBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: '#ff0000', borderRadius: 6,
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
    marginTop: 16, backgroundColor: Colors.goldGlow,
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  retryText: { color: Colors.goldLight, fontWeight: '700' },
  ytDirectBtn: {
    marginTop: 10, backgroundColor: 'rgba(255,0,0,0.15)',
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,0,0,0.3)',
  },
  ytDirectText: { color: '#ff6666', fontWeight: '700' },
});
