import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getTodayPanchang } from '../engine/panjika';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const BN_MONTHS = [
  'জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন',
  'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর',
];
const BN_DAYS = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];
const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBN = n => String(n).split('').map(d => BN_DIGITS[d] || d).join('');

function todayLabel() {
  const d = new Date();
  return `${BN_DAYS[d.getDay()]}, ${toBN(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${toBN(d.getFullYear())}`;
}

function PanchangRow({ icon, label, value }) {
  return (
    <View style={s.row}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.primary} style={{ width: 24 }} />
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

const QUICK = [
  { tab: 'Panchang', icon: 'calendar-month',       label: 'পঞ্জিকা'   },
  { tab: 'Rashifal', icon: 'star-circle',           label: 'রাশিফল'   },
  { tab: 'Kundali',  icon: 'chart-donut',           label: 'কুণ্ডলী'  },
  { tab: 'More',     icon: 'dots-horizontal-circle',label: 'আরও'      },
];

export function HomeScreen() {
  const navigation = useNavigation();
  const data = useMemo(() => {
    try { return getTodayPanchang(); }
    catch (_) { return { date: '', tithi: '—', nakshatra: '—', yoga: '—', sunrise: '—', sunset: '—' }; }
  }, []);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLine} />
        <Text style={s.brand}>MYASTROLOGY</Text>
        <Text style={s.tagline}>জ্যোতিষ · পঞ্জিকা · কুণ্ডলী</Text>
        <View style={s.headerLine} />
      </View>

      {/* Date banner */}
      <View style={s.dateBanner}>
        <MaterialCommunityIcons name="calendar-today" size={16} color={colors.primary} />
        <Text style={s.dateText}> {todayLabel()}</Text>
      </View>

      {/* Panchang Card */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.dot} />
          <Text style={s.cardTitle}>আজকের পঞ্জিকা</Text>
          <View style={s.dot} />
        </View>
        <PanchangRow icon="moon-waning-crescent" label="তিথি"    value={data.tithi}     />
        <View style={s.divider} />
        <PanchangRow icon="star-four-points"     label="নক্ষত্র" value={data.nakshatra}  />
        <View style={s.divider} />
        <PanchangRow icon="infinity"             label="যোগ"     value={data.yoga}      />
        <View style={s.divider} />
        <PanchangRow icon="weather-sunset-up"    label="সূর্যোদয়" value={data.sunrise}  />
        <View style={s.divider} />
        <PanchangRow icon="weather-sunset-down"  label="সূর্যাস্ত" value={data.sunset}  />
      </View>

      {/* Quick Actions */}
      <Text style={s.sectionTitle}>দ্রুত অ্যাক্সেস</Text>
      <View style={s.quickGrid}>
        {QUICK.map(q => (
          <TouchableOpacity
            key={q.tab}
            style={s.quickBtn}
            onPress={() => navigation.navigate(q.tab)}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name={q.icon} size={28} color={colors.gold} />
            <Text style={s.quickLabel}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Info strip */}
      <View style={s.infoStrip}>
        <MaterialCommunityIcons name="information-outline" size={15} color={colors.primary} />
        <Text style={s.infoText}>  গণনা সম্পূর্ণ অফলাইনে · Kolkata (IST)</Text>
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { paddingBottom: 40 },

  header: { backgroundColor: colors.headerBg, paddingTop: 52, paddingBottom: 20, alignItems: 'center' },
  headerLine: { width: 56, height: 1.5, backgroundColor: colors.gold, opacity: 0.7, marginVertical: 12 },
  brand:   { fontSize: 28, fontWeight: '800', color: colors.gold, letterSpacing: 4 },
  tagline: { fontSize: 12, color: colors.goldLight, letterSpacing: 2, opacity: 0.85 },

  dateBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, backgroundColor: colors.cardBorder + '55',
  },
  dateText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },

  card: {
    margin: spacing.md, backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.md,
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, gap: 8 },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  cardTitle:  { fontSize: 13, color: colors.primary, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  rowLabel: { flex: 1, fontSize: 14, color: colors.textSecondary, marginLeft: 8 },
  rowValue:  { fontSize: 15, color: colors.text, fontWeight: '700' },
  divider:   { height: 1, backgroundColor: colors.divider },

  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginHorizontal: spacing.md, marginTop: spacing.sm, marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: spacing.md, gap: 10,
  },
  quickBtn: {
    width: '47%', backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', paddingVertical: 18, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  quickLabel: { fontSize: 14, color: colors.text, fontWeight: '600' },

  infoStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.md, paddingVertical: 8,
  },
  infoText: { fontSize: 12, color: colors.textSecondary },
});
