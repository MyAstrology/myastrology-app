import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, Pressable, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPanchangForDate } from '../engine/panchang_full';
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
  { tab: 'Kundali',     icon: 'chart-donut',           label: 'জন্ম কুণ্ডলী'    },
  { tab: 'MatchMaking', icon: 'heart-multiple',         label: 'যোটক বিচার'     },
  { tab: 'Panchang',    icon: 'calendar-month',         label: 'দিন পঞ্জিকা'    },
  { tab: 'Numerology',  icon: 'numeric-9-plus-box',     label: 'সংখ্যা জ্যোতিষ'  },
  { tab: 'Rashifal',    icon: 'star-circle',            label: 'রাশিফল'         },
  { tab: 'More',        icon: 'dots-horizontal-circle', label: 'আরও'            },
];

const MENU = [
  { tab: 'Panchang',    icon: 'calendar-month',         label: 'দিন পঞ্জিকা'    },
  { tab: 'Rashifal',    icon: 'star-circle',            label: 'রাশিফল'         },
  { tab: 'Kundali',     icon: 'chart-donut',            label: 'জন্ম কুণ্ডলী'   },
  { tab: 'MatchMaking', icon: 'heart-multiple',         label: 'যোটক বিচার'     },
  { tab: 'Numerology',  icon: 'numeric-9-plus-box',     label: 'সংখ্যা জ্যোতিষ'  },
  { tab: 'Namakaran',   icon: 'baby-face-outline',      label: 'নামকরণ'         },
  { tab: 'More',        icon: 'dots-horizontal-circle', label: 'আরও'            },
];

export function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const data = useMemo(() => {
    try {
      const today = new Date();
      const iso = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      return getPanchangForDate(iso);
    }
    catch (_) { return { tithi: '—', nakshatra: '—', yoga: '—', sunrise: '—', sunset: '—' }; }
  }, []);

  function goTo(tab) {
    setMenuOpen(false);
    navigation.navigate(tab);
  }

  return (
    <>
      <ScrollView
        style={s.container}
        contentContainerStyle={[s.content, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={{ flex: 1 }} />
            <View style={s.headerCenter}>
              <View style={s.headerLine} />
              <Text style={s.brand}>MYASTROLOGY</Text>
              <Text style={s.tagline}>জ্যোতিষ · পঞ্জিকা · কুণ্ডলী</Text>
              <View style={s.headerLine} />
            </View>
            <TouchableOpacity
              style={s.hamBtn}
              onPress={() => setMenuOpen(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="menu" size={26} color={colors.gold} />
            </TouchableOpacity>
          </View>
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
          <PanchangRow icon="moon-waning-crescent" label="তিথি"     value={data.tithi}    />
          <View style={s.divider} />
          <PanchangRow icon="star-four-points"     label="নক্ষত্র"  value={data.nakshatra} />
          <View style={s.divider} />
          <PanchangRow icon="infinity"             label="যোগ"      value={data.yoga}     />
          <View style={s.divider} />
          <PanchangRow icon="weather-sunset-up"    label="সূর্যোদয়" value={data.sunrise}  />
          <View style={s.divider} />
          <PanchangRow icon="weather-sunset-down"  label="সূর্যাস্ত" value={data.sunset}   />
        </View>

        {/* Quick Actions — 6 cards, 3-column */}
        <Text style={s.sectionTitle}>দ্রুত অ্যাক্সেস</Text>
        <View style={s.quickGrid}>
          {QUICK.map(q => (
            <TouchableOpacity
              key={q.tab}
              style={s.quickBtn}
              onPress={() => navigation.navigate(q.tab)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name={q.icon} size={26} color={colors.gold} />
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

      {/* Hamburger Menu Modal */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={s.overlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={[s.drawer, { paddingTop: insets.top + 12 }]} onPress={() => {}}>
            <View style={s.drawerHeader}>
              <Text style={s.drawerTitle}>MYASTROLOGY</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.gold} />
              </TouchableOpacity>
            </View>
            <View style={s.drawerDivider} />
            {MENU.map(item => (
              <TouchableOpacity
                key={item.tab}
                style={s.menuItem}
                onPress={() => goTo(item.tab)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name={item.icon} size={22} color={colors.gold} />
                <Text style={s.menuLabel}>{item.label}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const CARD_W = (Dimensions.get('window').width - spacing.md * 2 - 10 * 2) / 3;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { paddingBottom: 40 },

  header: { backgroundColor: colors.headerBg, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 16 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLine: { width: 56, height: 1.5, backgroundColor: colors.gold, opacity: 0.7, marginVertical: 10 },
  brand:   { fontSize: 26, fontWeight: '800', color: colors.gold, letterSpacing: 4 },
  tagline: { fontSize: 11, color: colors.goldLight, letterSpacing: 2, opacity: 0.85 },
  hamBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  dateBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, backgroundColor: colors.cardBorder + '55',
  },
  dateText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },

  card: {
    margin: spacing.md, backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md,
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, gap: 8 },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  cardTitle:  { fontSize: 13, color: colors.primary, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },

  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  rowLabel:  { flex: 1, fontSize: 14, color: colors.textSecondary, marginLeft: 8 },
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
    width: CARD_W, backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', paddingVertical: 16, gap: 7,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  quickLabel: { fontSize: 12, color: colors.text, fontWeight: '600', textAlign: 'center' },

  infoStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.md, paddingVertical: 8,
  },
  infoText: { fontSize: 12, color: colors.textSecondary },

  /* Modal drawer */
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row',
  },
  drawer: {
    width: '72%', backgroundColor: colors.headerBg,
    paddingHorizontal: 20, paddingBottom: 32,
  },
  drawerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  drawerTitle: { fontSize: 16, fontWeight: '800', color: colors.gold, letterSpacing: 3 },
  drawerDivider: { height: 1, backgroundColor: colors.gold + '44', marginBottom: 16 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.gold + '22',
  },
  menuLabel: { flex: 1, fontSize: 15, color: colors.goldLight, fontWeight: '600' },
});
