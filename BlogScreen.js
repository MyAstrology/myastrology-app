// src/screens/BlogScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../theme';

// Blog list থেকে fetch করা হবে
async function fetchBlogList() {
  try {
    const res = await fetch('https://www.myastrology.in/src/content/blog/list.json');
    const data = await res.json();
    return data;
  } catch {
    // Fallback static list
    return [
      { slug: 'shani-sadesati-ki-hoy-keno-hoy-ki-korben', title: 'শনি সাড়েসাতি — কী করবেন?', category: 'জ্যোতিষ' },
      { slug: 'pitru-dosh-shastriya-byakhya', title: 'পিত্রু দোষ — শাস্ত্রীয় ব্যাখ্যা', category: 'জ্যোতিষ' },
      { slug: 'rahu-ketu-chaya-graha-jibone-prabhab-protikar', title: 'রাহু-কেতু — ছায়া গ্রহের রহস্য', category: 'জ্যোতিষ' },
      { slug: 'hasta-rekha-jivan-manchitra', title: 'হস্তরেখা — জীবন মানচিত্র', category: 'হস্তরেখা' },
      { slug: 'bibaha-rekha-ki-bole-biye-prem-dampattya', title: 'বিবাহ রেখা কী বলে?', category: 'হস্তরেখা' },
      { slug: 'kalsarpa-yog-ki-prabhab-somadhan', title: 'কালসর্প যোগ — প্রভাব ও সমাধান', category: 'যোগ' },
      { slug: 'manglik-yog-ki-prathamik-dharona', title: 'মাঙ্গলিক যোগ — প্রাথমিক ধারণা', category: 'যোগ' },
      { slug: 'samudrik-shastra-ki-mukh-hasta-pada-bishleshan', title: 'সমুদ্রিক শাস্ত্র — মুখ-হাত-পা বিচার', category: 'সমুদ্রিক' },
      { slug: 'bangla-maser-namakarana-nakshatra-purnima-rahasya', title: 'বাংলা মাসের নামকরণ রহস্য', category: 'পঞ্জিকা' },
      { slug: 'mesha-lagna-jataker-swabhab-karma-bibaha-bhagya', title: 'মেষ লগ্ন জাতকের স্বভাব ও কর্ম', category: 'লগ্ন' },
    ];
  }
}

const CATEGORIES = ['সব', 'জ্যোতিষ', 'হস্তরেখা', 'যোগ', 'লগ্ন', 'পঞ্জিকা', 'দর্শন'];

export default function BlogScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('সব');

  useEffect(() => {
    fetchBlogList().then(data => {
      const list = Array.isArray(data) ? data : (data.posts || data.articles || []);
      setPosts(list);
      setFiltered(list);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = posts;
    if (category !== 'সব') {
      result = result.filter(p => p.category === category);
    }
    if (search) {
      result = result.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, category, posts]);

  const renderPost = ({ item }) => (
    <TouchableOpacity style={styles.postCard}
      onPress={() => navigation.navigate('BlogDetail', {
        slug: item.slug, title: item.title,
      })}
    >
      <View style={styles.postMeta}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category || 'ব্লগ'}</Text>
        </View>
      </View>
      <Text style={styles.postTitle}>{item.title}</Text>
      {item.excerpt && (
        <Text style={styles.postExcerpt} numberOfLines={2}>{item.excerpt}</Text>
      )}
      <Text style={styles.readMore}>পড়ুন →</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>📖 ব্লগ পোস্ট</Text>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="ব্লগ খুঁজুন..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Categories */}
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

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item.slug || i.toString()}
          renderItem={renderPost}
          contentContainerStyle={styles.postList}
          showsVerticalScrollIndicator={false}
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
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.goldBorder,
  },
  postMeta: { flexDirection: 'row', marginBottom: Spacing.sm },
  categoryBadge: {
    backgroundColor: Colors.goldGlow, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  categoryText: { fontSize: 11, fontFamily: 'NotoSerifBengali', color: Colors.gold },
  postTitle: {
    fontSize: 15, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.textPrimary, lineHeight: 24,
  },
  postExcerpt: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, lineHeight: 20, marginTop: 4,
  },
  readMore: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.gold, marginTop: Spacing.sm, fontWeight: '600',
  },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
