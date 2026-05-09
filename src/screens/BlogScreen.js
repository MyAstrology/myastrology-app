// src/screens/BlogScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput,
  RefreshControl, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../theme';

const API_URL = 'https://www.myastrology.in/src/content/blog/list.json';

const CATEGORIES = ['সব', 'জ্যোতিষ', 'হস্তরেখা', 'যোগ', 'লগ্ন', 'পঞ্জিকা', 'দর্শন', 'দর্শন'];

// হেল্পার: পোস্টের কন্টেন্ট থেকে আনুমানিক পড়ার সময় বের করে (মিনিটে)
const getReadingTime = (content) => {
  if (!content || content.length === 0) return 1;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200)); // গড় ২০০ শব্দ/মিনিট
};

export default function BlogScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('সব');

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.posts || data.articles || []);
      setPosts(list);
      setFiltered(list);
    } catch (err) {
      setError('ব্লগ লোড করা যায়নি।');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    let result = posts;
    if (category !== 'সব') {
      result = result.filter(p => (p.category || p.tags?.[0]) === category);
    }
    if (search) {
      result = result.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, category, posts]);

  const renderPost = ({ item }) => (
    <TouchableOpacity style={styles.postCard} activeOpacity={0.8}
      onPress={() => navigation.navigate('BlogDetail', {
        slug: item.slug, title: item.title,
      })}
    >
      <View style={styles.cardRow}>
        <Image
          source={{ uri: item.image || 'https://www.myastrology.in/images/fallback-1200x630.webp' }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <View style={styles.postMeta}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category || item.tags?.[0] || 'ব্লগ'}</Text>
            </View>
            {item.date && <Text style={styles.postDate}>{item.date}</Text>}
          </View>
          <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
          {item.description && (
            <Text style={styles.postExcerpt} numberOfLines={2}>{item.description}</Text>
          )}
          <View style={styles.cardFooter}>
            {item.readingTime && (
              <Text style={styles.readingTime}>{item.readingTime} মিনিট</Text>
            )}
            <Text style={styles.readMore}>পড়ুন →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>📖 ব্লগ</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="ব্লগ খুঁজুন..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <FlatList
        horizontal data={CATEGORIES}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catList}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catBtn, category === item && styles.catBtnActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.catText, category === item && styles.catTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPosts}>
            <Text style={styles.retryBtnText}>আবার চেষ্টা করুন</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item.slug || i.toString()}
          renderItem={renderPost}
          contentContainerStyle={styles.postList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>কোনো ব্লগ পোস্ট পাওয়া যায়নি।</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    fontSize: 22, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight,
    padding: Spacing.md, paddingBottom: Spacing.sm,
  },
  searchRow: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  searchInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12, padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontFamily: 'NotoSerifBengali',
    borderWidth: 1, borderColor: Colors.goldBorder,
    fontSize: 14,
  },
  catList: { paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.sm },
  catBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.goldBorder,
    backgroundColor: Colors.bgCard,
  },
  catBtnActive: { backgroundColor: Colors.goldGlow, borderColor: Colors.gold },
  catText: { fontSize: 12, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary },
  catTextActive: { color: Colors.goldLight, fontWeight: '700' },
  postList: { padding: Spacing.md, gap: Spacing.md },
  postCard: {
    backgroundColor: Colors.bgCard, borderRadius: 14,
    padding: 0, borderWidth: 1, borderColor: Colors.goldBorder,
    overflow: 'hidden',
  },
  cardRow: { flexDirection: 'row' },
  thumbnail: {
    width: 100, height: '100%',
    backgroundColor: Colors.goldGlow,
  },
  cardContent: { flex: 1, padding: Spacing.md },
  postMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  categoryBadge: {
    backgroundColor: Colors.goldGlow, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  categoryText: { fontSize: 11, fontFamily: 'NotoSerifBengali', color: Colors.gold },
  postDate: { fontSize: 11, fontFamily: 'NotoSerifBengali', color: Colors.textMuted },
  postTitle: {
    fontSize: 15, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.textPrimary, lineHeight: 22, marginBottom: 4,
  },
  postExcerpt: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, lineHeight: 18, marginBottom: 8,
  },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readingTime: { fontSize: 11, fontFamily: 'NotoSerifBengali', color: Colors.textMuted },
  readMore: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.gold, fontWeight: '600',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorText: {
    fontSize: 16, fontFamily: 'NotoSerifBengali',
    color: Colors.danger, textAlign: 'center', marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: Colors.goldGlow, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.goldBorder,
  },
  retryBtnText: {
    fontSize: 14, fontFamily: 'NotoSerifBengali',
    color: Colors.goldLight, fontWeight: '600',
  },
  emptyText: {
    fontSize: 15, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, textAlign: 'center',
  },
});
