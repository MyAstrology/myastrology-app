// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Linking, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../theme';

// ─── পঞ্জিকা data fetcher ──────────────────────────────────────────────────
async function fetchPanjikaData() {
  try {
    const today = new Date().toISOString().split('T')[0];
    // MyAstrology panjika page থেকে data
    const res = await fetch(`https://www.myastrology.in/panjika.html`);
    // Fallback: parse from rashifal API
    return null;
  } catch { return null; }
}

// ─── Bengali greeting ───────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'সুপ্রভাত 🌅';
  if (h < 17) return 'শুভ অপরাহ্ণ ☀️';
  return 'শুভ সন্ধ্যা 🌙';
}

// ─── Bengali date ───────────────────────────────────────────────────────────
function getBengaliDate() {
  const d = new Date();
  const months = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন',
    'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
  const days = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Rashifal 12 signs ──────────────────────────────────────────────────────
const RASHIS = [
  { name: 'মেষ', icon: '♈', en: 'Aries' },
  { name: 'বৃষ', icon: '♉', en: 'Taurus' },
  { name: 'মিথুন', icon: '♊', en: 'Gemini' },
  { name: 'কর্কট', icon: '♋', en: 'Cancer' },
  { name: 'সিংহ', icon: '♌', en: 'Leo' },
  { name: 'কন্যা', icon: '♍', en: 'Virgo' },
  { name: 'তুলা', icon: '♎', en: 'Libra' },
  { name: 'বৃশ্চিক', icon: '♏', en: 'Scorpio' },
  { name: 'ধনু', icon: '♐', en: 'Sagittarius' },
  { name: 'মকর', icon: '♑', en: 'Capricorn' },
  { name: 'কুম্ভ', icon: '♒', en: 'Aquarius' },
  { name: 'মীন', icon: '♓', en: 'Pisces' },
];

// ─── Quick action buttons ────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: '📅', label: 'পঞ্জিকা', screen: 'Panjika', tab: 'Tools' },
  { icon: '🔯', label: 'কুণ্ডলী', screen: 'Kundali', tab: 'Tools' },
  { icon: '💑', label: 'কুষ্ঠি মিলন', screen: 'MatchMaking', tab: 'Tools' },
  { icon: '🔢', label: 'নিউমেরোলজি', screen: 'Numerology', tab: 'Tools' },
];

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [panjika, setPanjika] = useState({
    tithi: 'লোড হচ্ছে...',
    nakshatra: 'লোড হচ্ছে...',
    yoga: 'লোড হচ্ছে...',
    rahukal: 'লোড হচ্ছে...',
    sunrise: 'ভোর ৫:১৫',
    sunset: 'সন্ধ্যা ৬:২০',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPanjikaData();
    setRefreshing(false);
  };

  const openWhatsApp = () => {
    Linking.openURL('https://wa.me/919333122768?text=নমস্কার Dr. Acharya, আমি App থেকে পরামর্শ নিতে চাই।');
  };

  const goToRashi = (rashi) => {
    const today = new Date().toISOString().split('T')[0];
    navigation.navigate('RashifalDetail', { rashi, date: today });
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
          tintColor={Colors.gold} />
      }
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.date}>{getBengaliDate()}</Text>
        </View>
        <TouchableOpacity style={styles.whatsappBtn} onPress={openWhatsApp}>
          <Text style={styles.whatsappIcon}>💬</Text>
        </TouchableOpacity>
      </View>

      {/* ── Panjika Card ───────────────────────────────────────── */}
      <View style={styles.panjikaCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📅 আজকের পঞ্জিকা</Text>
          <TouchableOpacity onPress={() =>
            navigation.navigate('Tools', { screen: 'ToolsHome' })
          }>
            <Text style={styles.seeAll}>বিস্তারিত →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panjikaGrid}>
          {[
            { label: 'তিথি', value: panjika.tithi, icon: '🌙' },
            { label: 'নক্ষত্র', value: panjika.nakshatra, icon: '⭐' },
            { label: 'সূর্যোদয়', value: panjika.sunrise, icon: '🌅' },
            { label: 'সূর্যাস্ত', value: panjika.sunset, icon: '🌇' },
          ].map((item, i) => (
            <View key={i} style={styles.panjikaItem}>
              <Text style={styles.panjikaIcon}>{item.icon}</Text>
              <Text style={styles.panjikaLabel}>{item.label}</Text>
              <Text style={styles.panjikaValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Rahukal warning */}
        <View style={styles.rahukalRow}>
          <Text style={styles.rahukalIcon}>⚠️</Text>
          <Text style={styles.rahukalText}>রাহুকাল: {panjika.rahukal}</Text>
        </View>
      </View>

      {/* ── Quick Actions ───────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>দ্রুত অ্যাক্সেস</Text>
      <View style={styles.quickActions}>
        {QUICK_ACTIONS.map((action, i) => (
          <TouchableOpacity key={i} style={styles.actionBtn}
            onPress={() => navigation.navigate('Tools', { screen: action.screen })}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Today's Rashifal ────────────────────────────────────── */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>আজকের রাশিফল</Text>
        <Text style={styles.seeAll}>রাশি বেছে নিন</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.rashiScroll} contentContainerStyle={styles.rashiContent}
      >
        {RASHIS.map((rashi, i) => (
          <TouchableOpacity key={i} style={styles.rashiCard}
            onPress={() => goToRashi(rashi)}
          >
            <Text style={styles.rashiIcon}>{rashi.icon}</Text>
            <Text style={styles.rashiName}>{rashi.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Dr. Acharya Quote ───────────────────────────────────── */}
      <View style={styles.quoteCard}>
        <Text style={styles.quoteSymbol}>"</Text>
        <Text style={styles.quoteText}>
          জ্যোতিষ ভাগ্যের দাস নয় — এটি চেতনার আলো যা অন্ধকারে পথ দেখায়।
        </Text>
        <Text style={styles.quoteAuthor}>— ড. প্রদ্যুৎ আচার্য</Text>
      </View>

      {/* ── Consult CTA ─────────────────────────────────────────── */}
      <TouchableOpacity style={styles.consultCTA} onPress={openWhatsApp}>
        <Text style={styles.consultIcon}>🙏</Text>
        <View style={styles.consultText}>
          <Text style={styles.consultTitle}>ব্যক্তিগত পরামর্শ নিন</Text>
          <Text style={styles.consultSubtitle}>
            WhatsApp-এ Dr. Acharya-র সাথে কথা বলুন
          </Text>
        </View>
        <Text style={styles.consultArrow}>→</Text>
      </TouchableOpacity>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  greeting: {
    fontSize: 24, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight,
  },
  date: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, marginTop: 2,
  },
  whatsappBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(37,211,102,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(37,211,102,0.3)',
  },
  whatsappIcon: { fontSize: 20 },

  // Panjika
  panjikaCard: {
    margin: Spacing.md, borderRadius: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.goldBorder,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 16, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight,
  },
  seeAll: { fontSize: 12, color: Colors.gold, fontFamily: 'NotoSerifBengali' },
  panjikaGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  panjikaItem: {
    flex: 1, minWidth: '45%',
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderRadius: 12, padding: Spacing.sm,
    alignItems: 'center',
  },
  panjikaIcon: { fontSize: 20, marginBottom: 4 },
  panjikaLabel: {
    fontSize: 11, color: Colors.textSecondary,
    fontFamily: 'NotoSerifBengali',
  },
  panjikaValue: {
    fontSize: 13, color: Colors.textPrimary,
    fontFamily: 'NotoSerifBengali', fontWeight: '600',
    marginTop: 2, textAlign: 'center',
  },
  rahukalRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: Spacing.sm, padding: Spacing.sm,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  rahukalIcon: { fontSize: 14, marginRight: 8 },
  rahukalText: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: '#ef4444', fontWeight: '600',
  },

  // Quick actions
  sectionTitle: {
    fontSize: 16, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.textPrimary,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  quickActions: {
    flexDirection: 'row', paddingHorizontal: Spacing.md,
    gap: Spacing.sm, marginBottom: Spacing.md,
  },
  actionBtn: {
    flex: 1, alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14, padding: Spacing.sm,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  actionIcon: { fontSize: 22, marginBottom: 4 },
  actionLabel: {
    fontSize: 11, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, textAlign: 'center',
  },

  // Rashifal
  rashiScroll: { marginBottom: Spacing.md },
  rashiContent: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  rashiCard: {
    width: 72, alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14, padding: Spacing.sm,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  rashiIcon: { fontSize: 28, marginBottom: 4 },
  rashiName: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.textPrimary, fontWeight: '600',
  },

  // Quote
  quoteCard: {
    margin: Spacing.md, borderRadius: 16,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
    padding: Spacing.md,
  },
  quoteSymbol: {
    fontSize: 40, color: Colors.purple,
    lineHeight: 40, marginBottom: 4,
  },
  quoteText: {
    fontSize: 15, fontFamily: 'NotoSerifBengali',
    color: Colors.textPrimary, lineHeight: 26,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.gold, marginTop: Spacing.sm,
    fontWeight: '600',
  },

  // Consult CTA
  consultCTA: {
    margin: Spacing.md, borderRadius: 16,
    backgroundColor: 'rgba(37,211,102,0.08)',
    borderWidth: 1, borderColor: 'rgba(37,211,102,0.25)',
    padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  consultIcon: { fontSize: 28 },
  consultText: { flex: 1 },
  consultTitle: {
    fontSize: 15, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: '#25d366',
  },
  consultSubtitle: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, marginTop: 2,
  },
  consultArrow: { fontSize: 20, color: '#25d366' },
});
