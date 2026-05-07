// src/screens/RashifalScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../theme';

const RASHIS = [
  { name: 'মেষ', icon: '♈', en: 'mesh' },
  { name: 'বৃষ', icon: '♉', en: 'brisha' },
  { name: 'মিথুন', icon: '♊', en: 'mithun' },
  { name: 'কর্কট', icon: '♋', en: 'karkat' },
  { name: 'সিংহ', icon: '♌', en: 'singha' },
  { name: 'কন্যা', icon: '♍', en: 'kanya' },
  { name: 'তুলা', icon: '♎', en: 'tula' },
  { name: 'বৃশ্চিক', icon: '♏', en: 'brischik' },
  { name: 'ধনু', icon: '♐', en: 'dhanu' },
  { name: 'মকর', icon: '♑', en: 'makar' },
  { name: 'কুম্ভ', icon: '♒', en: 'kumbha' },
  { name: 'মীন', icon: '♓', en: 'meen' },
];

// রাশিফল data fetch — আপনার existing rashifal pipeline থেকে
async function fetchRashifal(date) {
  try {
    const res = await fetch(`https://www.myastrology.in/rashifal/${date}.html`);
    const html = await res.text();
    // HTML থেকে data parse করা
    return { html, success: true };
  } catch {
    return { html: null, success: false };
  }
}

function getBengaliDate(date) {
  const d = new Date(date);
  const months = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন',
    'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function RashifalScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const initialRashi = route.params?.rashi || RASHIS[0];
  const today = new Date().toISOString().split('T')[0];

  const [selectedRashi, setSelectedRashi] = useState(initialRashi);
  const [date] = useState(today);
  const [rashifalData, setRashifalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRashifal();
  }, [selectedRashi]);

  const loadRashifal = async () => {
    setLoading(true);
    const data = await fetchRashifal(date);
    setRashifalData(data);
    setLoading(false);
  };

  // Score bars (আপনার rashifal data থেকে নেওয়া হবে)
  const scores = {
    career: 75, love: 60, health: 80, finance: 55, family: 70, luck: 65,
  };
  const scoreLabels = {
    career: 'কর্ম', love: 'প্রেম', health: 'স্বাস্থ্য',
    finance: 'অর্থ', family: 'পরিবার', luck: 'ভাগ্য',
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🪐 দৈনিক রাশিফল</Text>
        <Text style={styles.date}>{getBengaliDate(date)}</Text>
      </View>

      {/* Rashi selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rashiList}
      >
        {RASHIS.map((rashi, i) => (
          <TouchableOpacity key={i}
            style={[styles.rashiBtn, selectedRashi.name === rashi.name && styles.rashiBtnActive]}
            onPress={() => setSelectedRashi(rashi)}
          >
            <Text style={styles.rashiIcon}>{rashi.icon}</Text>
            <Text style={[styles.rashiName,
              selectedRashi.name === rashi.name && styles.rashiNameActive
            ]}>{rashi.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selected rashi display */}
      <View style={styles.selectedCard}>
        <Text style={styles.selectedIcon}>{selectedRashi.icon}</Text>
        <Text style={styles.selectedName}>{selectedRashi.name} রাশি</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loaderText}>রাশিফল গণনা হচ্ছে...</Text>
        </View>
      ) : (
        <>
          {/* Score bars */}
          <View style={styles.scoresCard}>
            <Text style={styles.scoresTitle}>আজকের স্কোর</Text>
            {Object.entries(scores).map(([key, val]) => (
              <View key={key} style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>{scoreLabels[key]}</Text>
                <View style={styles.scoreBarBg}>
                  <View style={[styles.scoreBarFill, {
                    width: `${val}%`,
                    backgroundColor: val >= 70 ? Colors.success : val >= 50 ? Colors.gold : Colors.danger,
                  }]} />
                </View>
                <Text style={styles.scoreNum}>{val}</Text>
              </View>
            ))}
          </View>

          {/* Rashifal sections */}
          {[
            { icon: '💼', title: 'কর্মজীবন', text: 'আজ কর্মক্ষেত্রে নতুন সুযোগ আসতে পারে। উর্ধ্বতনের সাথে সম্পর্ক ভালো থাকবে। নতুন প্রকল্পে মনোযোগ দিন।' },
            { icon: '❤️', title: 'প্রেম ও সম্পর্ক', text: 'পারস্পরিক বোঝাপড়া ভালো থাকবে। বিবাহিতদের জন্য দিনটি শুভ। অবিবাহিতরা সতর্ক থাকুন।' },
            { icon: '💰', title: 'অর্থ', text: 'অপ্রয়োজনীয় ব্যয় এড়িয়ে চলুন। বিনিয়োগের ক্ষেত্রে সতর্কতা প্রয়োজন।' },
            { icon: '🌿', title: 'স্বাস্থ্য', text: 'শরীর সুস্থ থাকবে। মানসিক শান্তির জন্য ধ্যান করুন। পর্যাপ্ত বিশ্রাম নিন।' },
            { icon: '✨', title: 'শুভ সংখ্যা ও রং', text: 'শুভ সংখ্যা: ৩, ৭ | শুভ রং: হলুদ, সবুজ | শুভ সময়: সকাল ১০-১২টা' },
          ].map((section, i) => (
            <View key={i} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>{section.icon}</Text>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Text style={styles.sectionText}>{section.text}</Text>
            </View>
          ))}

          {/* Upay (remedy) */}
          <View style={styles.upayCard}>
            <Text style={styles.upayTitle}>🙏 আজকের উপায়</Text>
            <Text style={styles.upayText}>
              আজ সকালে সূর্যকে জল দিন। হলুদ রংয়ের পোশাক পরুন।
              গুরুজনদের আশীর্বাদ নিন।
            </Text>
          </View>

          {/* Consult CTA */}
          <TouchableOpacity style={styles.cta}
            onPress={() => navigation.navigate('Consult')}
          >
            <Text style={styles.ctaText}>
              🔮 ব্যক্তিগত রাশিফল ও পরামর্শের জন্য Dr. Acharya-র সাথে যোগাযোগ করুন
            </Text>
            <Text style={styles.ctaArrow}>→</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.md, paddingBottom: Spacing.sm },
  title: {
    fontSize: 22, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight,
  },
  date: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, marginTop: 2,
  },
  rashiList: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.sm },
  rashiBtn: {
    alignItems: 'center', padding: Spacing.sm,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.goldBorder,
    backgroundColor: Colors.bgCard, minWidth: 64,
  },
  rashiBtnActive: { backgroundColor: Colors.goldGlow, borderColor: Colors.gold },
  rashiIcon: { fontSize: 24 },
  rashiName: {
    fontSize: 11, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, marginTop: 4,
  },
  rashiNameActive: { color: Colors.goldLight, fontWeight: '700' },
  selectedCard: {
    alignItems: 'center', padding: Spacing.md,
    margin: Spacing.md, borderRadius: 16,
    backgroundColor: Colors.goldGlow, borderWidth: 1, borderColor: Colors.goldBorder,
  },
  selectedIcon: { fontSize: 48 },
  selectedName: {
    fontSize: 20, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight, marginTop: 8,
  },
  loader: { padding: Spacing.xl, alignItems: 'center', gap: 12 },
  loaderText: {
    fontSize: 14, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary,
  },
  scoresCard: {
    margin: Spacing.md, borderRadius: 16,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.goldBorder,
    padding: Spacing.md, gap: 10,
  },
  scoresTitle: {
    fontSize: 16, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.textPrimary, marginBottom: 4,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  scoreLabel: {
    width: 54, fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary,
  },
  scoreBarBg: {
    flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4, overflow: 'hidden',
  },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  scoreNum: {
    width: 28, fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.gold, textAlign: 'right',
  },
  sectionCard: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    borderRadius: 14, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.goldBorder, padding: Spacing.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 8 },
  sectionIcon: { fontSize: 20 },
  sectionTitle: {
    fontSize: 15, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight,
  },
  sectionText: {
    fontSize: 14, fontFamily: 'NotoSerifBengali',
    color: Colors.textPrimary, lineHeight: 24,
  },
  upayCard: {
    margin: Spacing.md, borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
    padding: Spacing.md,
  },
  upayTitle: {
    fontSize: 15, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: '#a78bfa', marginBottom: 8,
  },
  upayText: {
    fontSize: 14, fontFamily: 'NotoSerifBengali',
    color: Colors.textPrimary, lineHeight: 24,
  },
  cta: {
    margin: Spacing.md, borderRadius: 14,
    backgroundColor: Colors.goldGlow,
    borderWidth: 1, borderColor: Colors.goldBorder,
    padding: Spacing.md, flexDirection: 'row',
    alignItems: 'center', gap: Spacing.sm,
  },
  ctaText: {
    flex: 1, fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.goldLight, lineHeight: 22,
  },
  ctaArrow: { fontSize: 20, color: Colors.gold },
});
