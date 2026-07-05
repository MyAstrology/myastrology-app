import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, Pressable, Dimensions, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPanchangForDate } from '../engine/panchang_full';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const LOGO = require('../../assets/logo.png');

const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBN = n => String(n).split('').map(d => BN_DIGITS[+d] ?? d).join('');

const EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const EN_DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const QUICK = [
  { tab: 'Kundali',     icon: 'chart-donut',           label: 'জন্ম কুণ্ডলী'   },
  { tab: 'MatchMaking', icon: 'heart-multiple',         label: 'যোটক বিচার'    },
  { tab: 'Panchang',    icon: 'calendar-month',         label: 'দিন পঞ্জিকা'   },
  { tab: 'Numerology',  icon: 'numeric-9-plus-box',     label: 'সংখ্যাজ্যোতিষ' },
  { tab: 'Rashifal',    icon: 'star-circle',            label: 'রাশিফল'        },
  { tab: 'More',        icon: 'dots-horizontal-circle', label: 'আরও'           },
];

const MENU = [
  { tab: 'Panchang',    icon: 'calendar-month',         label: 'দিন পঞ্জিকা'   },
  { tab: 'Rashifal',    icon: 'star-circle',            label: 'রাশিফল'        },
  { tab: 'Kundali',     icon: 'chart-donut',            label: 'জন্ম কুণ্ডলী'  },
  { tab: 'MatchMaking', icon: 'heart-multiple',         label: 'যোটক বিচার'   },
  { tab: 'Numerology',  icon: 'numeric-9-plus-box',     label: 'সংখ্যা জ্যোতিষ' },
  { tab: 'Namakaran',   icon: 'baby-face-outline',      label: 'নামকরণ'        },
  { tab: 'More',        icon: 'dots-horizontal-circle', label: 'আরও'           },
];

function PanchangCell({ icon, label, value }) {
  return (
    <View style={s.cell}>
      <View style={s.cellHeader}>
        <MaterialCommunityIcons name={icon} size={13} color={colors.primary} />
        <Text style={s.cellLabel}>{label}</Text>
      </View>
      <Text style={s.cellValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const data = useMemo(() => {
    try {
      const today = new Date();
      const iso = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      return getPanchangForDate(iso);
    } catch (_) {
      return { tithi:'—', nakshatra:'—', yoga:'—', karana:'—', sunrise:'—', sunset:'—',
               weekday:'—', weekdayNum:0, paksha:'—', bengaliDay:null,
               bengaliMonth:'—', bengaliYear:null, ritu:'—' };
    }
  }, []);

  const today = useMemo(() => new Date(), []);
  const enDateStr = `${today.getDate()} ${EN_MONTHS[today.getMonth()]} ${today.getFullYear()}`;
  const bnDateStr = data.bengaliDay
    ? `${toBN(data.bengaliDay)} ${data.bengaliMonth} ${toBN(data.bengaliYear)} বঙ্গাব্দ`
    : '—';

  function goTo(tab) {
    setMenuOpen(false);
    navigation.navigate(tab);
  }

  const tabBarH = 58 + insets.bottom;

  return (
    <>
      <ScrollView
        style={s.container}
        contentContainerStyle={[s.content, { paddingTop: insets.top, paddingBottom: tabBarH + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Compact Header ── */}
        <View style={s.header}>
          <Image source={LOGO} style={s.logo} />
          <View style={s.headerCenter}>
            <Text style={s.brand}>MYASTROLOGY</Text>
            <Text style={s.tagline}>জ্যোতিষ · পঞ্জিকা · কুণ্ডলী</Text>
          </View>
          <TouchableOpacity style={s.hamBtn} onPress={() => setMenuOpen(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="menu" size={24} color={colors.gold} />
          </TouchableOpacity>
        </View>

        {/* ── Panchang Card ── */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <View style={s.dot} /><Text style={s.cardTitle}>আজকের পঞ্জিকা</Text><View style={s.dot} />
          </View>

          <Text style={s.bnDate}>{bnDateStr}</Text>

          <View style={s.metaRow}>
            <Text style={s.metaText}>{enDateStr}</Text>
            <View style={s.metaDot} />
            <Text style={s.metaText}>{EN_DAYS[today.getDay()]}</Text>
            <View style={s.metaDot} />
            <Text style={s.metaText}>{data.ritu}</Text>
          </View>

          <View style={s.cardDivider} />

          <View style={s.pakshaRow}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={14} color={colors.primary} />
            <Text style={s.pakshaText}>{data.paksha}</Text>
          </View>

          <View style={s.cardDivider} />

          <View style={s.cellGrid}>
            <PanchangCell icon="moon-waning-crescent"  label="তিথি"     value={data.tithi}    />
            <View style={s.cellVDiv} />
            <PanchangCell icon="star-four-points"      label="নক্ষত্র"  value={data.nakshatra} />
          </View>
          <View style={s.cardDivider} />
          <View style={s.cellGrid}>
            <PanchangCell icon="infinity"              label="যোগ"      value={data.yoga}     />
            <View style={s.cellVDiv} />
            <PanchangCell icon="hexagon-outline"       label="করণ"      value={data.karana}   />
          </View>
          <View style={s.cardDivider} />
          <View style={s.cellGrid}>
            <PanchangCell icon="weather-sunset-up"     label="সূর্যোদয়" value={data.sunrise}  />
            <View style={s.cellVDiv} />
            <PanchangCell icon="weather-sunset-down"   label="সূর্যাস্ত" value={data.sunset}   />
          </View>
        </View>

        {/* ── Quick Actions ── */}
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

        <View style={s.infoStrip}>
          <MaterialCommunityIcons name="information-outline" size={13} color={colors.primary} />
          <Text style={s.infoText}>  গণনা সম্পূর্ণ অফলাইনে · Kolkata (IST)</Text>
        </View>
      </ScrollView>

      {/* ── Hamburger Drawer ── */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={[s.drawer, { paddingTop: insets.top + 12 }]} onPress={() => {}}>
            <View style={s.drawerHeader}>
              <Text style={s.drawerTitle}>MYASTROLOGY</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.gold} />
              </TouchableOpacity>
            </View>
            <View style={s.drawerDivider} />
            {MENU.map(item => (
              <TouchableOpacity key={item.tab} style={s.menuItem} onPress={() => goTo(item.tab)} activeOpacity={0.7}>
                <MaterialCommunityIcons name={item.icon} size={20} color={colors.gold} />
                <Text style={s.menuLabel}>{item.label}</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
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
  content:   {},

  /* Compact header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.headerBg,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.gold + '33',
  },
  logo:         { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.gold + '88' },
  headerCenter: { flex: 1, alignItems: 'center' },
  brand:   { fontSize: 16, fontWeight: '800', color: colors.gold, letterSpacing: 3 },
  tagline: { fontSize: 9,  color: colors.goldLight, letterSpacing: 1.5, opacity: 0.8, marginTop: 1 },
  hamBtn:  { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  /* Panchang card */
  card: {
    margin: spacing.md, backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 4,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10, gap: 8 },
  dot:           { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.gold },
  cardTitle:     { fontSize: 11, color: colors.primary, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },

  bnDate:  { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  metaText:{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textSecondary, opacity: 0.5 },

  cardDivider: { height: 1, backgroundColor: colors.divider },

  pakshaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  pakshaText:{ fontSize: 13, color: colors.text, fontWeight: '600' },

  cellGrid:  { flexDirection: 'row', alignItems: 'stretch' },
  cell:      { flex: 1, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  cellVDiv:  { width: 1, backgroundColor: colors.divider },
  cellHeader:{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
  cellLabel: { fontSize: 11, color: colors.textSecondary },
  cellValue: { fontSize: 15, color: colors.text, fontWeight: '700', textAlign: 'center' },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginHorizontal: spacing.md, marginTop: 4, marginBottom: 8,
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: spacing.md, gap: 10 },
  quickBtn: {
    width: CARD_W, backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', paddingVertical: 16, gap: 7,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  quickLabel: { fontSize: 11, color: colors.text, fontWeight: '600', textAlign: 'center' },

  infoStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.md, paddingVertical: 6,
  },
  infoText: { fontSize: 11, color: colors.textSecondary },

  /* Drawer */
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row' },
  drawer:       { width: '72%', backgroundColor: colors.headerBg, paddingHorizontal: 18, paddingBottom: 32 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  drawerTitle:  { fontSize: 15, fontWeight: '800', color: colors.gold, letterSpacing: 3 },
  drawerDivider:{ height: 1, backgroundColor: colors.gold + '44', marginBottom: 14 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.gold + '22',
  },
  menuLabel: { flex: 1, fontSize: 14, color: colors.goldLight, fontWeight: '600' },
});
