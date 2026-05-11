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
const FALLBACK_IMG = 'https://www.myastrology.in/images/fallback-1200x630.webp';

const CATEGORIES = ['সব', 'জ্যোতিষ', 'হস্তরেখা', 'যোগ', 'লগ্ন', 'পঞ্জিকা', 'দর্শন'];

// ── Featured post (hero card) ────────────────────────────
function FeaturedPost({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.featured} activeOpacity={0.85} onPress={onPress}>
      <Image
        source={{ uri: item.image || FALLBACK_IMG }}
        style={styles.featuredImg}
        resizeMode="cover"
      />
      <View style={styles.featuredOverlay}>
        <View style={styles.featuredBadgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category || item.tags?.[0] || 'বিশেষ'}</Text>
          </View>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>নতুন</Text>
          </View>
        </View>
        <Text style={styles.featuredTitle} numberOfLines={3}>{item.title}</Text>
        {item.description && (
          <Text style={styles.featuredDesc} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.featuredMeta}>
          {item.date && <Text style={styles.featuredDate}>{item.date}</Text>}
          <Text style={styles.readMoreFeatured}>পড়ুন →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Regular post card ────────────────────────────────────
function PostCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.postCard} activeOpacity={0.82} onPress={onPress}>
      <Image
        source={{ uri: item.image || FALLBACK_IMG }}
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
            <Text style={styles.readingTime}>⏱ {item.readingTime} মিনিট</Text>
          )}
          <Text style={styles.readMore}>পড়ুন →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ──────────────────────────────────────────

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
    } catch {
      setError('ব্লগ লোড করা যায়নি।');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    let result = posts;
    if (category !== 'সব') {
      result = result.filter(p => (p.category || p.tags?.[0]) === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, category, posts]);

  const navToDetail = useCallback((item) => {
    navigation.navigate('BlogDetail', { slug: item.slug, title: item.title });
  }, [navigation]);

  const featured = filtered[0] || null;
  const rest = filtered.slice(1);

  const renderHeader = () => (
    <>
      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="ব্লগ খুঁজুন..."
            placeholderTextColor={Colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category chips */}
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
            <Text style={[styles.catText, category === item && styles.catTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Featured post */}
      {featured && !search && category === 'সব' && (
        <>
          <Text style={styles.sectionLabel}>📌 বিশেষ নিবন্ধ</Text>
          <FeaturedPost item={featured} onPress={() => navToDetail(featured)} />
          {rest.length > 0 && <Text style={styles.sectionLabel}>📚 সব পোস্ট</Text>}
        </>
      )}
    </>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, styles.centered]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchPosts}>
          <Text style={styles.retryBtnText}>আবার চেষ্টা করুন</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const listData = (search || category !== 'সব') ? filtered : rest;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>📖 ব্লগ</Text>
      <FlatList
        data={listData}
        keyExtractor={(item, i) => item.slug || i.toString()}
        renderItem={({ item }) => (
          <PostCard item={item} onPress={() => navToDetail(item)} />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.postList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>কোনো পোস্ট পাওয়া যায়নি।</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header: {
    fontSize: 22, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 4,
  },

  searchRow:      { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 12, paddingHorizontal: Spacing.sm,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  searchIcon:  { fontSize: 14, marginRight: 4 },
  searchInput: {
    flex: 1, padding: Spacing.sm,
    color: Colors.textPrimary, fontFamily: 'NotoSerifBengali', fontSize: 14,
  },
  clearBtn:    { fontSize: 14, color: Colors.textMuted, padding: 4 },

  catList:       { paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.sm },
  catBtn:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.goldBorder, backgroundColor: Colors.bgCard },
  catBtnActive:  { backgroundColor: Colors.goldGlow, borderColor: Colors.gold },
  catText:       { fontSize: 12, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary },
  catTextActive: { color: Colors.goldLight, fontWeight: '700' },

  sectionLabel: {
    fontSize: 13, fontFamily: 'NotoSerifBengali', fontWeight: '700',
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 6,
  },

  // Featured
  featured:        { marginHorizontal: Spacing.md, borderRadius: 18, overflow: 'hidden', marginBottom: Spacing.sm },
  featuredImg:     { width: '100%', height: 220, backgroundColor: Colors.bgCard },
  featuredOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'transparent',
    backgroundColor: 'rgba(14,14,42,0.82)',
    padding: Spacing.md,
    borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
  },
  featuredBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  newBadge:         { backgroundColor: Colors.mars, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  newBadgeText:     { fontSize: 10, fontFamily: 'NotoSerifBengali', color: '#fff', fontWeight: '700' },
  featuredTitle:    { fontSize: 17, fontFamily: 'NotoSerifBengali', fontWeight: '700', color: '#fff', lineHeight: 24, marginBottom: 4 },
  featuredDesc:     { fontSize: 12, fontFamily: 'NotoSerifBengali', color: 'rgba(255,255,255,0.75)', lineHeight: 17, marginBottom: 6 },
  featuredMeta:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featuredDate:     { fontSize: 11, fontFamily: 'NotoSerifBengali', color: 'rgba(255,255,255,0.55)' },
  readMoreFeatured: { fontSize: 13, fontFamily: 'NotoSerifBengali', color: Colors.goldLight, fontWeight: '700' },

  // Regular cards
  postList: { paddingHorizontal: Spacing.md, paddingBottom: 32, gap: Spacing.sm },
  postCard: {
    backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.goldBorder,
    flexDirection: 'row', overflow: 'hidden',
  },
  thumbnail: { width: 110, height: 110, backgroundColor: Colors.bgCard },
  cardContent: { flex: 1, padding: Spacing.sm },
  postMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  categoryBadge: { backgroundColor: Colors.goldGlow, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: Colors.goldBorder },
  categoryText:  { fontSize: 10, fontFamily: 'NotoSerifBengali', color: Colors.gold },
  postDate:      { fontSize: 10, fontFamily: 'NotoSerifBengali', color: Colors.textMuted },
  postTitle:     { fontSize: 14, fontFamily: 'NotoSerifBengali', fontWeight: '700', color: Colors.textPrimary, lineHeight: 20, marginBottom: 3 },
  postExcerpt:   { fontSize: 12, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary, lineHeight: 17, marginBottom: 6 },
  cardFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readingTime:   { fontSize: 10, fontFamily: 'NotoSerifBengali', color: Colors.textMuted },
  readMore:      { fontSize: 12, fontFamily: 'NotoSerifBengali', color: Colors.gold, fontWeight: '600' },

  errorIcon:    { fontSize: 48, marginBottom: 12 },
  errorText:    { fontSize: 16, fontFamily: 'NotoSerifBengali', color: Colors.danger, textAlign: 'center', marginBottom: 16 },
  retryBtn:     { backgroundColor: Colors.goldGlow, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: Colors.goldBorder },
  retryBtnText: { fontSize: 14, fontFamily: 'NotoSerifBengali', color: Colors.goldLight, fontWeight: '600' },
  emptyText:    { fontSize: 15, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary, textAlign: 'center' },
});
