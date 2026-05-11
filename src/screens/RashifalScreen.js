// src/screens/RashifalScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../theme';

const RASHIS = [
  { name: 'মেষ', symbol: '♈' },
  { name: 'বৃষ', symbol: '♉' },
  { name: 'মিথুন', symbol: '♊' },
  { name: 'কর্কট', symbol: '♋' },
  { name: 'সিংহ', symbol: '♌' },
  { name: 'কন্যা', symbol: '♍' },
  { name: 'তুলা', symbol: '♎' },
  { name: 'বৃশ্চিক', symbol: '♏' },
  { name: 'ধনু', symbol: '♐' },
  { name: 'মকর', symbol: '♑' },
  { name: 'কুম্ভ', symbol: '♒' },
  { name: 'মীন', symbol: '♓' },
];

// হেল্পার ফাংশন – বাংলা সংখ্যা
const BD = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBn = (n) => String(Math.abs(Math.round(n))).replace(/[0-9]/g, d => BD[+d] || d);

// তারা দেখানোর জন্য
const renderStars = (score) => '★'.repeat(score) + '☆'.repeat(5 - score);

export default function RashifalScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().split('T')[0];

  // HomeScreen থেকে selected rashi আসতে পারে
  const paramRashi = route?.params?.rashi;
  const initIndex = paramRashi
    ? RASHIS.findIndex(r => r.name === paramRashi.name)
    : 0;

  const [rashifalData, setRashifalData] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(initIndex < 0 ? 0 : initIndex);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchRashifalData = useCallback(async () => {
    try {
      setError(null);
      const url = `https://www.myastrology.in/rashifal/${today}.json`;
      const response = await fetch(url, { timeout: 8000 });
      if (!response.ok) throw new Error('Server error');
      const json = await response.json();
      if (Array.isArray(json) && json.length === 12) {
        setRashifalData(json);
      } else {
        throw new Error('Invalid data');
      }
    } catch (err) {
      setError('রাশিফল এখন পাওয়া যাচ্ছে না।');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [today]);

  useEffect(() => {
    fetchRashifalData();
  }, [fetchRashifalData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRashifalData();
  }, [fetchRashifalData]);

  const currentRashi = rashifalData ? rashifalData[selectedIndex] : null;

  // বাংলা তারিখ (ইংরেজি মাস)
  const getBengaliDate = () => {
    const d = new Date();
    const months = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন',
      'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🪐 দৈনিক রাশিফল</Text>
        <Text style={styles.date}>{getBengaliDate()}</Text>
      </View>

      {/* রাশি সিলেক্টর */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rashiList}
      >
        {RASHIS.map((rashi, index) => (
          <TouchableOpacity key={index}
            style={[styles.rashiBtn, selectedIndex === index && styles.rashiBtnActive]}
            onPress={() => setSelectedIndex(index)}
            activeOpacity={0.7}
          >
            <Text style={styles.rashiSymbol}>{rashi.symbol}</Text>
            <Text style={[styles.rashiNameText, selectedIndex === index && styles.rashiNameActive]}>
              {rashi.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* লোডিং / এরর / কন্টেন্ট */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>রাশিফল আনা হচ্ছে...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>🌙</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchRashifalData}>
            <Text style={styles.retryBtnText}>🔄 আবার চেষ্টা করুন</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.retryBtn, { marginTop: 10, backgroundColor: 'rgba(201,168,76,0.15)', borderColor: Colors.gold }]}
            onPress={() => Linking.openURL('https://www.myastrology.in/rashifal.html')}
          >
            <Text style={[styles.retryBtnText, { color: Colors.gold }]}>🌐 ওয়েবসাইটে দেখুন</Text>
          </TouchableOpacity>
        </View>
      ) : currentRashi ? (
        <>
          {/* রাশির নাম ও পরিচিতি */}
          <View style={styles.selectedCard}>
            <Text style={styles.selectedSymbol}>
              {RASHIS[selectedIndex]?.symbol}
            </Text>
            <Text style={styles.selectedName}>{currentRashi.rashi} রাশি</Text>
            <Text style={styles.selectedSub}>{currentRashi.rashiInfo}</Text>
            <View style={styles.chipsRow}>
              <View style={[styles.chip, styles.chipOverall]}>
                <Text style={styles.chipText}>
                  ⭐ {['','কঠিন','সাধারণ','মধ্যম','ভালো','অতি শুভ'][Math.round((currentRashi.score.love+currentRashi.score.work+currentRashi.score.health+currentRashi.score.finance)/4)]}
                </Text>
              </View>
              <View style={[styles.chip, { borderColor: currentRashi.tagCol, backgroundColor: currentRashi.tagCol + '22' }]}>
                <Text style={[styles.chipText, { color: currentRashi.tagCol }]}>
                  🌙 {currentRashi.gocharLabel}
                </Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>💎 {currentRashi.gem}</Text>
              </View>
            </View>
          </View>

          {/* চন্দ্র গোচর সারাংশ */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🌙 চন্দ্র গোচর বিচার</Text>
            <Text style={styles.cardSubtitle}>{currentRashi.gocharLabel}</Text>
            <Text style={styles.cardText}>{currentRashi.summary}</Text>
          </View>

          {/* স্কোর কার্ড */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 আজকের স্কোর</Text>
            {['love','work','health','finance'].map(key => {
              const val = currentRashi.score[key];
              const label = {love:'প্রেম', work:'কর্ম', health:'স্বাস্থ্য', finance:'অর্থ'}[key];
              return (
                <View key={key} style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>{label}</Text>
                  <View style={styles.scoreBarBg}>
                    <View style={[styles.scoreBarFill, { width: `${val * 20}%`, backgroundColor: val >= 4 ? Colors.success : val >= 3 ? Colors.gold : Colors.danger }]} />
                  </View>
                  <Text style={styles.scoreStars}>{renderStars(val)}</Text>
                </View>
              );
            })}
          </View>

          {/* প্রেম, কর্ম, স্বাস্থ্য, অর্থ - বিস্তারিত */}
          {['love','work','health','finance'].map(key => {
            const data = currentRashi[key];
            if (!data) return null;
            const icons = {love:'💑', work:'💼', health:'🌿', finance:'💰'};
            const titles = {love:'প্রেম ও সম্পর্ক', work:'কর্ম ও ব্যবসা', health:'স্বাস্থ্য', finance:'আর্থিক অবস্থা'};
            return (
              <View key={key} style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>{icons[key]}</Text>
                  <Text style={styles.sectionTitle}>{titles[key]}</Text>
                </View>
                <Text style={styles.sectionShort}>{data.short}</Text>
                <Text style={styles.sectionDetail}>{data.detailed}</Text>
                <View style={styles.adviceBox}>
                  <Text style={styles.adviceText}>💡 {data.advice}</Text>
                </View>
              </View>
            );
          })}

          {/* সতর্কতা */}
          {currentRashi.caution && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>⚠️</Text>
                <Text style={styles.sectionTitle}>আজকের সতর্কতা</Text>
              </View>
              {currentRashi.caution.map((c, i) => (
                <Text key={i} style={styles.cautionItem}>• {c}</Text>
              ))}
            </View>
          )}

          {/* মন্ত্র */}
          {currentRashi.mantra && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔔 আজকের দৈনিক মন্ত্র</Text>
              <Text style={styles.mantraText}>{currentRashi.mantra.text}</Text>
              <Text style={styles.mantraMeaning}>{currentRashi.mantra.meaning}</Text>
              <Text style={styles.mantraCount}>{currentRashi.mantra.count} জপ করুন</Text>
            </View>
          )}

          {/* আধ্যাত্মিক বার্তা */}
          {currentRashi.spiritual && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🕉️ আধ্যাত্মিক বার্তা</Text>
              <Text style={styles.cardText}>{currentRashi.spiritual}</Text>
            </View>
          )}

          {/* ভাগ্য সংখ্যা, রং, সময় */}
          {currentRashi.lucky && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🍀 ভাগ্য সংকেত</Text>
              <View style={styles.luckyGrid}>
                {[
                  { label: 'সংখ্যা', value: currentRashi.lucky.nums },
                  { label: 'রং', value: currentRashi.lucky.colors },
                  { label: 'শুভ সময়', value: currentRashi.lucky.goodTime },
                  { label: 'অশুভ সময়', value: currentRashi.lucky.badTime },
                  { label: 'দিক', value: currentRashi.lucky.dir },
                ].map((item, i) => (
                  <View key={i} style={styles.luckyItem}>
                    <Text style={styles.luckyLabel}>{item.label}</Text>
                    <Text style={styles.luckyValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* গ্রহ গোচর টেবিল (সংক্ষিপ্ত) */}
          {currentRashi.planets && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🪐 গ্রহ গোচর</Text>
              {currentRashi.planets.slice(0, 4).map((p, i) => (
                <View key={i} style={styles.planetRow}>
                  <Text style={styles.planetIcon}>{p.ico}</Text>
                  <View style={styles.planetInfo}>
                    <Text style={styles.planetName}>{p.name} {p.retro ? '⤺' : ''}</Text>
                    <Text style={styles.planetHouse}>{p.houseLabel} – {p.tag}</Text>
                  </View>
                  <Text style={[styles.planetStatus, { color: p.status === 'good' ? Colors.success : p.status === 'bad' ? Colors.danger : Colors.gold }]}>
                    {p.statusLabel}
                  </Text>
                </View>
              ))}
              {currentRashi.planets.length > 4 && (
                <Text style={styles.moreText}>আরও {currentRashi.planets.length - 4} টি গ্রহ...</Text>
              )}
            </View>
          )}

          {/* সাড়েসাতি / ঢাইয়া */}
          {currentRashi.sadeSati && (
            <View style={[styles.card, { borderLeftColor: currentRashi.sadeSati.col, borderLeftWidth: 3 }]}>
              <Text style={styles.cardTitle}>{currentRashi.sadeSati.icon} {currentRashi.sadeSati.type}</Text>
              <Text style={styles.cardSubtitle}>{currentRashi.sadeSati.phase}</Text>
              <Text style={styles.cardText}>{currentRashi.sadeSati.desc}</Text>
              {currentRashi.sadeSati.remedies && (
                <View style={styles.remediesBox}>
                  <Text style={styles.remediesTitle}>প্রতিকার:</Text>
                  {currentRashi.sadeSati.remedies.map((r, i) => (
                    <Text key={i} style={styles.remedyItem}>• {r}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* পরামর্শ CTA */}
          <TouchableOpacity style={styles.cta} onPress={() => navigation.navigate('Consult')}>
            <Text style={styles.ctaText}>
              🔮 ব্যক্তিগত পরামর্শের জন্য WhatsApp করুন
            </Text>
            <Text style={styles.ctaArrow}>→</Text>
          </TouchableOpacity>
        </>
      ) : null}

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
  rashiSymbol: { fontSize: 24 },
  rashiNameText: {
    fontSize: 11, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, marginTop: 4,
  },
  rashiNameActive: { color: Colors.goldLight, fontWeight: '700' },
  selectedCard: {
    alignItems: 'center', padding: Spacing.md,
    margin: Spacing.md, borderRadius: 16,
    backgroundColor: Colors.goldGlow, borderWidth: 1, borderColor: Colors.goldBorder,
  },
  selectedSymbol: { fontSize: 48 },
  selectedName: {
    fontSize: 20, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight, marginTop: 8,
  },
  selectedSub: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, marginTop: 4,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, justifyContent: 'center' },
  chip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.goldBorder,
    backgroundColor: Colors.bgCard,
  },
  chipOverall: { borderColor: Colors.gold, backgroundColor: Colors.gold + '22' },
  chipText: { fontSize: 11, fontFamily: 'NotoSerifBengali', color: Colors.textPrimary },
  card: {
    margin: Spacing.md, marginBottom: Spacing.sm,
    borderRadius: 14, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.goldBorder, padding: Spacing.md,
  },
  cardTitle: {
    fontSize: 16, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight, marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, marginBottom: 8,
  },
  cardText: {
    fontSize: 14, fontFamily: 'NotoSerifBengali',
    color: Colors.textPrimary, lineHeight: 24,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  scoreLabel: {
    width: 54, fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary,
  },
  scoreBarBg: {
    flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4, overflow: 'hidden',
  },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  scoreStars: {
    width: 72, fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.gold, textAlign: 'right',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 10 },
  sectionIcon: { fontSize: 20 },
  sectionTitle: {
    fontSize: 15, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight,
  },
  sectionShort: {
    fontSize: 14, fontFamily: 'NotoSerifBengali',
    color: Colors.textPrimary, fontWeight: '600', marginBottom: 6,
  },
  sectionDetail: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, lineHeight: 22, marginBottom: 10,
  },
  adviceBox: {
    backgroundColor: Colors.gold + '18', borderRadius: 8,
    padding: 10, marginTop: 4,
  },
  adviceText: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.goldLight, lineHeight: 20,
  },
  cautionItem: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.danger, lineHeight: 22, marginBottom: 4,
  },
  mantraText: {
    fontSize: 16, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight, textAlign: 'center', marginBottom: 6,
  },
  mantraMeaning: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, textAlign: 'center', marginBottom: 8,
  },
  mantraCount: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.gold, textAlign: 'center', fontWeight: '600',
  },
  luckyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  luckyItem: {
    flex: 1, minWidth: 80, backgroundColor: Colors.gold + '0F',
    borderRadius: 10, padding: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  luckyLabel: {
    fontSize: 11, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, marginBottom: 4, textTransform: 'uppercase',
  },
  luckyValue: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight,
  },
  planetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.gold + '22',
  },
  planetIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  planetInfo: { flex: 1 },
  planetName: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.textPrimary,
  },
  planetHouse: {
    fontSize: 11, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, marginTop: 2,
  },
  planetStatus: {
    fontSize: 11, fontFamily: 'NotoSerifBengali',
    fontWeight: '700',
  },
  moreText: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, textAlign: 'center', marginTop: 8,
  },
  remediesBox: {
    marginTop: 10, padding: 10, backgroundColor: Colors.gold + '0F',
    borderRadius: 8, borderWidth: 1, borderColor: Colors.goldBorder,
  },
  remediesTitle: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.gold, marginBottom: 6,
  },
  remedyItem: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, lineHeight: 20,
  },
  centered: {
    padding: 40, alignItems: 'center', justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, marginTop: 12,
  },
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
