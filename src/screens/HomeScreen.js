import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, Pressable, Dimensions, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPanchangForDate } from '../engine/panchang_full';
import { useUser, RashiLucky, RASHI_NAMES } from '../context/UserContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const LOGO = require('../../assets/logo.png');

const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBN = n => String(n).split('').map(d => BN_DIGITS[+d] ?? d).join('');
const EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const QUICK = [
  { tab: 'Kundali',     icon: 'chart-donut',           label: 'জন্ম কুণ্ডলী'   },
  { tab: 'MatchMaking', icon: 'heart-multiple',         label: 'যোটক বিচার'    },
  { tab: 'Panchang',    icon: 'calendar-month',         label: 'দিন পঞ্জিকা'   },
  { tab: 'Numerology',  icon: 'numeric-9-plus-box',     label: 'সংখ্যাজ্যোতিষ' },
  { tab: 'Rashifal',    icon: 'star-circle',            label: 'রাশিফল'        },
  { tab: 'More',        icon: 'dots-horizontal-circle', label: 'আরও'           },
];

const MENU = [
  { tab: 'Panchang',    icon: 'calendar-month',    label: 'দিন পঞ্জিকা'    },
  { tab: 'Rashifal',    icon: 'star-circle',        label: 'রাশিফল'         },
  { tab: 'Kundali',     icon: 'chart-donut',        label: 'জন্ম কুণ্ডলী'   },
  { tab: 'MatchMaking', icon: 'heart-multiple',     label: 'যোটক বিচার'    },
  { tab: 'Numerology',  icon: 'numeric-9-plus-box', label: 'সংখ্যা জ্যোতিষ' },
  { tab: 'Namakaran',   icon: 'baby-face-outline',  label: 'নামকরণ'         },
  { tab: 'More',        icon: 'dots-horizontal-circle', label: 'আরও'        },
];

function PanchangCell({ icon, label, value, timeStart, timeEnd }) {
  const timeStr = (timeStart && timeEnd)
    ? `${timeStart} – ${timeEnd}`
    : timeEnd || timeStart || null;
  return (
    <View style={s.cell}>
      <View style={s.cellHeader}>
        <MaterialCommunityIcons name={icon} size={12} color={colors.primary} />
        <Text style={s.cellLabel}>{label}</Text>
      </View>
      <Text style={s.cellValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {timeStr ? <Text style={s.timeRange} numberOfLines={1} adjustsFontSizeToFit>{timeStr}</Text> : null}
    </View>
  );
}

function RashiLuckyCard({ rashiIdx, onPress }) {
  const lucky = RashiLucky[rashiIdx];
  return (
    <TouchableOpacity style={s.luckyCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.luckyColorDot, { backgroundColor: lucky.color }]} />
      <View style={s.luckyInfo}>
        <Text style={s.luckyRashi}>{RASHI_NAMES[rashiIdx]} রাশি</Text>
        <Text style={s.luckyDetail}>
          শুভ রং: {lucky.colorName}  ·  রত্ন: {lucky.gem}
        </Text>
        <Text style={s.luckyDetail}>
          শুভ সংখ্যা: {lucky.number}  ·  দিক: {lucky.dir}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

function RashiSelectorModal({ visible, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Pressable style={s.rashiModal} onPress={() => {}}>
          <Text style={s.rashiModalTitle}>আপনার জন্মরাশি বেছে নিন</Text>
          <View style={s.rashiGrid}>
            {RASHI_NAMES.map((name, idx) => (
              <TouchableOpacity
                key={idx}
                style={[s.rashiChip, { borderColor: RashiLucky[idx].color + '99' }]}
                onPress={() => onSelect(idx)}
                activeOpacity={0.7}
              >
                <View style={[s.rashiChipDot, { backgroundColor: RashiLucky[idx].color }]} />
                <Text style={s.rashiChipLabel}>{name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function HomeScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [rashiModal, setRashiModal] = useState(false);
  const { user, saveUser } = useUser();

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

  const today    = useMemo(() => new Date(), []);
  const enDateStr = `${today.getDate()} ${EN_MONTHS[today.getMonth()]} ${today.getFullYear()}`;
  const bnDateStr = data.bengaliDay
    ? `${toBN(data.bengaliDay)} ${data.bengaliMonth} ${toBN(data.bengaliYear)} বঙ্গাব্দ`
    : '—';

  function goTo(tab) { setMenuOpen(false); navigation.navigate(tab); }
  function selectRashi(idx) { saveUser({ rashi: idx }); setRashiModal(false); }

  const tabBarH = 58 + insets.bottom;
  const userRashi = user?.rashi ?? null;

  return (
    <>
      <ScrollView
        style={s.container}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: tabBarH + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
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
            <View style={s.dot} />
            <Text style={s.cardTitle}>আজকের পঞ্জিকা</Text>
            <View style={s.dot} />
          </View>

          <Text style={s.bnDate}>{bnDateStr}</Text>

          <View style={s.metaRow}>
            <Text style={s.metaText}>{enDateStr}</Text>
            <View style={s.metaDot} />
            <Text style={s.metaText}>{data.weekday}</Text>
            <View style={s.metaDot} />
            <Text style={s.metaText}>{data.ritu}</Text>
          </View>

          <View style={s.cardDivider} />

          <View style={s.pakshaRow}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={13} color={colors.primary} />
            <Text style={s.pakshaText}>{data.paksha}</Text>
          </View>

          <View style={s.cardDivider} />

          <View style={s.cellGrid}>
            <PanchangCell icon="moon-waning-crescent" label="তিথি"    value={data.tithi}
              timeStart={data.tithiStart}     timeEnd={data.tithiEnd} />
            <View style={s.cellVDiv} />
            <PanchangCell icon="star-four-points"     label="নক্ষত্র" value={data.nakshatra}
              timeStart={data.nakshatraStart} timeEnd={data.nakshatraEnd} />
          </View>
          <View style={s.cardDivider} />
          <View style={s.cellGrid}>
            <PanchangCell icon="infinity"        label="যোগ"      value={data.yoga}
              timeStart={data.yogaStart} timeEnd={data.yogaEnd} />
            <View style={s.cellVDiv} />
            <PanchangCell icon="hexagon-outline" label="করণ"      value={data.karana} />
          </View>
          <View style={s.cardDivider} />
          <View style={s.cellGrid}>
            <PanchangCell icon="weather-sunset-up"   label="সূর্যোদয়" value={data.sunrise} />
            <View style={s.cellVDiv} />
            <PanchangCell icon="weather-sunset-down" label="সূর্যাস্ত" value={data.sunset}  />
          </View>
        </View>

        {/* ── Rashi Lucky Card (from zip) ── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>আমার রাশি</Text>
          <TouchableOpacity onPress={() => setRashiModal(true)}>
            <Text style={s.sectionLink}>পরিবর্তন করুন</Text>
          </TouchableOpacity>
        </View>
        {userRashi !== null ? (
          <RashiLuckyCard rashiIdx={userRashi} onPress={() => setRashiModal(true)} />
        ) : (
          <TouchableOpacity style={s.rashiPrompt} onPress={() => setRashiModal(true)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="zodiac-aries" size={20} color={colors.gold} />
            <Text style={s.rashiPromptText}>আপনার জন্মরাশি নির্বাচন করুন</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* ── Quick Actions ── */}
        <Text style={[s.sectionTitle, { marginHorizontal: spacing.md, marginTop: 14, marginBottom: 8 }]}>
          দ্রুত অ্যাক্সেস
        </Text>
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

      {/* ── Rashi Selector ── */}
      <RashiSelectorModal
        visible={rashiModal}
        onSelect={selectRashi}
        onClose={() => setRashiModal(false)}
      />
    </>
  );
}

const CARD_W = (Dimensions.get('window').width - spacing.md * 2 - 10 * 2) / 3;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.headerBg,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.headerBorder,
  },
  logo: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.gold + 'AA' },
  headerCenter: { flex: 1, alignItems: 'center' },
  brand:   { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  tagline: { fontSize: 9, color: colors.textSecondary, letterSpacing: 1.2, marginTop: 1, fontFamily: 'NotoSerifBengali-Regular' },
  hamBtn:  { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  /* Panchang card — compacted */
  card: {
    margin: spacing.md, backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 3,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6, gap: 8 },
  dot:           { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.gold },
  cardTitle:     { fontSize: 11, color: colors.primary, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'NotoSerifBengali-Bold' },

  bnDate:  { fontSize: 17, color: colors.text, textAlign: 'center', marginBottom: 3, fontFamily: 'NotoSerifBengali-Bold' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  metaText:{ fontSize: 11, color: colors.textSecondary, fontWeight: '500', fontFamily: 'NotoSerifBengali-Regular' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textSecondary, opacity: 0.5 },

  cardDivider: { height: 1, backgroundColor: colors.divider },

  pakshaRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 5 },
  pakshaText: { fontSize: 12, color: colors.text, fontWeight: '600', fontFamily: 'NotoSerifBengali-Bold' },

  cellGrid:   { flexDirection: 'row', alignItems: 'stretch' },
  cell:       { flex: 1, paddingVertical: 6, paddingHorizontal: 4, alignItems: 'center' },
  cellVDiv:   { width: 1, backgroundColor: colors.divider },
  cellHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  cellLabel:  { fontSize: 10, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular' },
  cellValue:  { fontSize: 14, color: colors.text, fontWeight: '700', textAlign: 'center', fontFamily: 'NotoSerifBengali-Bold' },
  timeRange:  { fontSize: 10, color: colors.primary, textAlign: 'center', marginTop: 2, opacity: 0.85 },

  /* Section row */
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.md, marginTop: 4, marginBottom: 8,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'NotoSerifBengali-Bold' },
  sectionLink:  { fontSize: 11, color: colors.gold, fontFamily: 'NotoSerifBengali-Regular' },

  /* Rashi Lucky Card (from zip RashiLucky data) */
  luckyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: spacing.md, marginBottom: 4,
    backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  luckyColorDot: { width: 36, height: 36, borderRadius: 18 },
  luckyInfo:     { flex: 1 },
  luckyRashi:    { fontSize: 14, color: colors.text, fontWeight: '700', marginBottom: 3, fontFamily: 'NotoSerifBengali-Bold' },
  luckyDetail:   { fontSize: 11, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular', lineHeight: 17 },

  rashiPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: spacing.md, marginBottom: 4,
    backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cardBorder, borderStyle: 'dashed',
    paddingHorizontal: 14, paddingVertical: 14,
  },
  rashiPromptText: { flex: 1, fontSize: 13, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular' },

  /* Quick Grid */
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: spacing.md, gap: 10 },
  quickBtn: {
    width: CARD_W, backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', paddingVertical: 14, gap: 7,
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10, shadowRadius: 6, elevation: 2,
  },
  quickLabel: { fontSize: 11, color: colors.text, fontWeight: '600', textAlign: 'center', fontFamily: 'NotoSerifBengali-Regular' },

  infoStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, paddingVertical: 6 },
  infoText:  { fontSize: 11, color: colors.textSecondary },

  /* Drawer */
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', flexDirection: 'row' },
  drawer: {
    width: '72%', backgroundColor: colors.card,
    paddingHorizontal: 18, paddingBottom: 32,
    borderRightWidth: 1, borderRightColor: colors.cardBorder,
    elevation: 16, shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12, shadowRadius: 12,
  },
  drawerHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  drawerTitle:   { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  drawerDivider: { height: 1, backgroundColor: colors.cardBorder, marginBottom: 14 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  menuLabel: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600', fontFamily: 'NotoSerifBengali-Regular' },

  /* Rashi Selector Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  rashiModal: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: colors.cardBorder,
  },
  rashiModalTitle: { fontSize: 15, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 16, fontFamily: 'NotoSerifBengali-Bold' },
  rashiGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  rashiChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5,
    backgroundColor: colors.background,
  },
  rashiChipDot:  { width: 10, height: 10, borderRadius: 5 },
  rashiChipLabel: { fontSize: 13, color: colors.text, fontFamily: 'NotoSerifBengali-Regular' },
});
