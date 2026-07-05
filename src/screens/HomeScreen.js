import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../theme';

const v = require('../vsop87-planets');

const WEEKDAY = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];
const TITHI = ['প্রতিপদা','দ্বিতীয়া','তৃতীয়া','চতুর্থী','পঞ্চমী','ষষ্ঠী','সপ্তমী','অষ্টমী','নবমী','দশমী','একাদশী','দ্বাদশী','ত্রয়োদশী','চতুর্দশী','পূর্ণিমা','প্রতিপদা','দ্বিতীয়া','তৃতীয়া','চতুর্থী','পঞ্চমী','ষষ্ঠী','সপ্তমী','অষ্টমী','নবমী','দশমী','একাদশী','দ্বাদশী','ত্রয়োদশী','চতুর্দশী','অমাবস্যা'];
const NAKSHATRA = ['অশ্বিনী','ভরণী','কৃত্তিকা','রোহিণী','মৃগশিরা','আর্দ্রা','পুনর্বসু','পুষ্যা','আশ্লেষা','মঘা','পূর্বফাল্গুনী','উত্তরফাল্গুনী','হস্তা','চিত্রা','স্বাতী','বিশাখা','অনুরাধা','জ্যেষ্ঠা','মূলা','পূর্বাষাঢ়া','উত্তরাষাঢ়া','শ্রবণা','ধনিষ্ঠা','শতভিষা','পূর্বভাদ্রপদ','উত্তরভাদ্রপদ','রেবতী'];
const MONTH = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

function bn(n) {
  return String(n).split('').map(d => '০১২৩৪৫৬৭৮৯'[+d] ?? d).join('');
}

const TOOLS = [
  { name: 'কুণ্ডলী',  icon: 'planet-outline',    tab: 'কুণ্ডলী', desc: 'জন্মকুণ্ডলী বিশ্লেষণ' },
  { name: 'পঞ্জিকা',  icon: 'calendar-outline',  tab: 'পঞ্জিকা', desc: 'দৈনিক পঞ্চাঙ্গ'       },
  { name: 'রাশিফল',  icon: 'star-outline',       tab: 'রাশিফল', desc: 'রাশিচক্র ভবিষ্যৎ'     },
  { name: 'আরও সেবা', icon: 'apps-outline',       tab: 'আরও',    desc: 'মিলাপ, নামকরণ ও আরও' },
];

export default function HomeScreen({ navigation }) {
  const { weekday, tithi, nakshatra, paksha, dateStr } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
    const p = v.getDailyPanchang(y, m, d, 22.5726, 88.3639);
    return {
      weekday:   WEEKDAY[p.date.weekday],
      tithi:     TITHI[p.tithi.index],
      nakshatra: NAKSHATRA[p.nakshatra.index],
      paksha:    p.tithi.index <= 14 ? 'শুক্লপক্ষ' : 'কৃষ্ণপক্ষ',
      dateStr:   `${bn(new Date().getDate())} ${MONTH[new Date().getMonth()]} ${bn(new Date().getFullYear())}`,
    };
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <Text style={s.logo}>MyAstrology</Text>
          <View style={s.goldLine} />
          <Text style={s.dateStr}>{weekday}, {dateStr}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardLabel}>আজকের পঞ্চাঙ্গ</Text>
          <View style={s.hdivider} />
          <View style={s.panchangRow}>
            <PItem label="তিথি"    value={tithi}     />
            <View style={s.vdivider} />
            <PItem label="নক্ষত্র"  value={nakshatra} />
            <View style={s.vdivider} />
            <PItem label="পক্ষ"    value={paksha}    />
          </View>
        </View>

        <Text style={s.sectionTitle}>জ্যোতিষ সেবা</Text>
        <View style={s.grid}>
          {TOOLS.map(t => (
            <TouchableOpacity key={t.name} style={s.tile} onPress={() => navigation.navigate(t.tab)}>
              <View style={s.tileIcon}>
                <Ionicons name={t.icon} size={22} color={COLORS.gold} />
              </View>
              <Text style={s.tileName}>{t.name}</Text>
              <Text style={s.tileDesc}>{t.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function PItem({ label, value }) {
  return (
    <View style={s.pItem}>
      <Text style={s.pLabel}>{label}</Text>
      <Text style={s.pValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.cream },
  header:      { alignItems: 'center', paddingTop: SPACING.xl, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.lg },
  logo:        { fontSize: 26, fontWeight: '700', color: COLORS.gold, letterSpacing: 1.5 },
  goldLine:    { height: 1, width: 48, backgroundColor: COLORS.gold, marginVertical: SPACING.sm, opacity: 0.5 },
  dateStr:     { fontSize: 14, color: COLORS.muted, letterSpacing: 0.2 },
  card:        { marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, elevation: 2, shadowColor: '#1C1C2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  cardLabel:   { fontSize: 11, fontWeight: '600', color: COLORS.gold, letterSpacing: 1.4, textTransform: 'uppercase' },
  hdivider:    { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.sm },
  panchangRow: { flexDirection: 'row' },
  pItem:       { flex: 1, alignItems: 'center' },
  pLabel:      { fontSize: 11, color: COLORS.muted, marginBottom: 4 },
  pValue:      { fontSize: 14, fontWeight: '600', color: COLORS.charcoal, textAlign: 'center' },
  vdivider:    { width: 1, backgroundColor: COLORS.divider },
  sectionTitle:{ fontSize: 11, fontWeight: '600', color: COLORS.muted, letterSpacing: 1.4, textTransform: 'uppercase', marginHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.xl },
  tile:        { width: '47.5%', backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, elevation: 1, shadowColor: '#1C1C2E', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  tileIcon:    { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.goldLight, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  tileName:    { fontSize: 15, fontWeight: '600', color: COLORS.charcoal, marginBottom: 2 },
  tileDesc:    { fontSize: 12, color: COLORS.muted },
});
