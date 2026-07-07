import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet,
  Modal, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { getPanchangForDate } from '../engine/panchang_full';
import { useUser, RashiLucky, RASHI_NAMES } from '../context/UserContext';
import { QUICK_ACCESS_ITEMS } from '../navigation/menuItems';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { shadows } from '../theme/shadows';
import { typography } from '../theme/typography';

const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBN = n => String(n).split('').map(d => BN_DIGITS[+d] ?? d).join('');
const EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

function QuickTile({ icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.quickBtn, pressed && s.quickBtnPressed]}
    >
      <MaterialCommunityIcons name={icon} size={26} color={colors.gold} />
      <Text style={s.quickLabel}>{label}</Text>
    </Pressable>
  );
}

export function HomeScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
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

  function selectRashi(idx) { saveUser({ rashi: idx }); setRashiModal(false); }

  const tabBarH = 58 + insets.bottom;
  const userRashi = user?.rashi ?? null;

  return (
    <>
      <View style={s.container}>
        <AppHeader />
        <ScrollView
          contentContainerStyle={{ paddingBottom: tabBarH + 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Panchang Hero Card ── */}
          <LinearGradient
            colors={[colors.goldWash, 'transparent']}
            style={s.heroWash}
          >
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
          </LinearGradient>

          {/* ── Rashi Lucky Card ── */}
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
            {QUICK_ACCESS_ITEMS.map(q => (
              <QuickTile
                key={q.tab}
                icon={q.icon}
                label={q.label}
                onPress={() => navigation.navigate(q.tab)}
              />
            ))}
          </View>

          <View style={s.infoStrip}>
            <MaterialCommunityIcons name="information-outline" size={13} color={colors.primary} />
            <Text style={s.infoText}>  গণনা সম্পূর্ণ অফলাইনে · Kolkata (IST)</Text>
          </View>
        </ScrollView>
      </View>

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

  /* Panchang hero */
  heroWash: { paddingTop: 4 },
  card: {
    margin: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    ...shadows.raised,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6, gap: 8 },
  dot:           { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.gold },
  cardTitle:     { ...typography.sectionTitle, color: colors.primary },

  bnDate:  { ...typography.heading, fontSize: 17, color: colors.text, textAlign: 'center', marginBottom: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  metaText:{ ...typography.label, color: colors.textSecondary, fontWeight: '500' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textSecondary, opacity: 0.5 },

  cardDivider: { height: 1, backgroundColor: colors.divider },

  pakshaRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 5 },
  pakshaText: { ...typography.value, fontSize: 12, color: colors.text },

  cellGrid:   { flexDirection: 'row', alignItems: 'stretch' },
  cell:       { flex: 1, paddingVertical: 6, paddingHorizontal: 4, alignItems: 'center' },
  cellVDiv:   { width: 1, backgroundColor: colors.divider },
  cellHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  cellLabel:  { ...typography.caption, color: colors.textSecondary },
  cellValue:  { ...typography.value, textAlign: 'center' },
  timeRange:  { fontSize: 10, color: colors.primary, textAlign: 'center', marginTop: 2, opacity: 0.85 },

  /* Section row */
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.md, marginTop: 4, marginBottom: 8,
  },
  sectionTitle: { ...typography.sectionTitle, color: colors.textSecondary },
  sectionLink:  { ...typography.label, color: colors.gold },

  /* Rashi Lucky Card */
  luckyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: spacing.md, marginBottom: 4,
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: 14, paddingVertical: 12,
    ...shadows.card,
  },
  luckyColorDot: { width: 36, height: 36, borderRadius: radii.pill },
  luckyInfo:     { flex: 1 },
  luckyRashi:    { ...typography.value, fontSize: 14, marginBottom: 3 },
  luckyDetail:   { ...typography.label, color: colors.textSecondary, lineHeight: 17 },

  rashiPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: spacing.md, marginBottom: 4,
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder, borderStyle: 'dashed',
    paddingHorizontal: 14, paddingVertical: 14,
  },
  rashiPromptText: { ...typography.body, flex: 1, color: colors.textSecondary },

  /* Quick Grid */
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: spacing.md, gap: 10 },
  quickBtn: {
    width: CARD_W, backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', paddingVertical: 14, gap: 7,
    ...shadows.card,
  },
  quickBtnPressed: {
    backgroundColor: colors.goldWash, borderColor: colors.goldBorder, transform: [{ scale: 0.96 }],
  },
  quickLabel: { ...typography.label, color: colors.text, fontWeight: '600', textAlign: 'center' },

  infoStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, paddingVertical: 6 },
  infoText:  { ...typography.label, color: colors.textSecondary },

  /* Rashi Selector Modal */
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  rashiModal: {
    backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: colors.cardBorder,
  },
  rashiModalTitle: { ...typography.heading, fontSize: 15, textAlign: 'center', marginBottom: 16 },
  rashiGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  rashiChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: radii.pill, borderWidth: 1.5,
    backgroundColor: colors.background,
  },
  rashiChipDot:  { width: 10, height: 10, borderRadius: 5 },
  rashiChipLabel: { ...typography.body, fontSize: 13 },
});
