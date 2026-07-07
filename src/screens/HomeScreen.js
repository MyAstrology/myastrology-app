import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions, Image, Modal, ImageBackground,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { getPanchangForDate } from '../engine/panchang_full';
import { getFestivalsForMonth } from '../engine/bengali_festivals';
import PANJIKA_IMAGES from '../engine/panjika-images';
import { useUser, RashiLucky, RASHI_NAMES } from '../context/UserContext';
import { QUICK_ACCESS_ITEMS } from '../navigation/menuItems';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { shadows } from '../theme/shadows';
import { typography } from '../theme/typography';
import { haptics } from '../utils/haptics';

const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBN = n => String(n).split('').map(d => BN_DIGITS[+d] ?? d).join('');
const EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const ZODIAC_ICONS = [
  'zodiac-aries', 'zodiac-taurus', 'zodiac-gemini', 'zodiac-cancer',
  'zodiac-leo', 'zodiac-virgo', 'zodiac-libra', 'zodiac-scorpio',
  'zodiac-sagittarius', 'zodiac-capricorn', 'zodiac-aquarius', 'zodiac-pisces',
];
const HERO_BG = require('../../assets/panchang-hero-bg.webp');
const BLOG_LIST_URL = 'https://myastrology.in/src/content/blog/list.json';
const formatBlogDate = (iso) => {
  const [y, m, d] = (iso || '').split('-').map(Number);
  return (y && m && d) ? `${d} ${EN_MONTHS[m - 1]} ${y}` : '';
};

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

function MuhurtaRow({ icon, label, sub, time, tone, isLast }) {
  const bad = tone === 'bad';
  return (
    <View style={[s.muhurtaRow, !isLast && s.muhurtaRowDivider]}>
      <View style={[s.muhurtaIconWrap, bad ? s.muhurtaIconWrapBad : s.muhurtaIconWrapGood]}>
        <MaterialCommunityIcons name={icon} size={16} color={bad ? '#B71C1C' : '#2E7D32'} />
      </View>
      <View style={s.muhurtaTextWrap}>
        <Text style={s.muhurtaLabel}>{label}</Text>
        <Text style={[s.muhurtaSub, { color: bad ? '#B71C1C' : '#2E7D32' }]}>{sub}</Text>
      </View>
      <Text style={s.muhurtaTime}>{time}</Text>
    </View>
  );
}

function RashiLuckyCard({ rashiIdx, onChangePress, onRashifalPress }) {
  const lucky = RashiLucky[rashiIdx];
  return (
    <View style={s.rashiCard}>
      <Pressable onPress={onChangePress} style={[s.rashiAvatar, { backgroundColor: lucky.color }]}>
        <MaterialCommunityIcons name={ZODIAC_ICONS[rashiIdx]} size={22} color={colors.white} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={s.rashiName}>{RASHI_NAMES[rashiIdx]} রাশি</Text>
        <Text style={s.rashiDetail} numberOfLines={1}>শুভ রং: {lucky.colorName} · রত্ন: {lucky.gem}</Text>
        <Text style={s.rashiDetail} numberOfLines={1}>শুভ সংখ্যা: {lucky.number} · দিক: {lucky.dir}</Text>
      </View>
      <Pressable onPress={onRashifalPress} style={s.rashiCta}>
        <Text style={s.rashiCtaText} numberOfLines={1}>আজকের রাশিফল</Text>
        <MaterialCommunityIcons name="chevron-right" size={14} color={colors.primary} />
      </Pressable>
    </View>
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
              <Pressable
                key={idx}
                style={[s.rashiChip, { borderColor: RashiLucky[idx].color + '99' }]}
                onPress={() => onSelect(idx)}
              >
                <View style={[s.rashiChipDot, { backgroundColor: RashiLucky[idx].color }]} />
                <Text style={s.rashiChipLabel}>{name}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function BlogCard({ post, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.blogCard, pressed && { opacity: 0.85 }]}>
      <Image source={{ uri: post.image }} style={s.blogImg} />
      <Text style={s.blogTitle} numberOfLines={2}>{post.title}</Text>
      <Text style={s.blogDate}>{formatBlogDate(post.date)}</Text>
    </Pressable>
  );
}

function QuickTile({ icon, label, onPress }) {
  return (
    <Pressable
      onPress={() => { haptics.tap(); onPress(); }}
      style={({ pressed }) => [s.quickBtn, pressed && s.quickBtnPressed]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={colors.gold} />
      <Text style={s.quickLabel} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </Pressable>
  );
}

export function HomeScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { user, saveUser } = useUser();
  const [rashiModal, setRashiModal] = useState(false);
  const [blogPosts, setBlogPosts]   = useState([]);
  const userRashi = user?.rashi ?? null;

  useEffect(() => {
    let cancelled = false;
    fetch(BLOG_LIST_URL)
      .then(r => r.json())
      .then(posts => { if (!cancelled && Array.isArray(posts)) setBlogPosts(posts.slice(0, 6)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  function selectRashi(idx) { haptics.tap(); saveUser({ rashi: idx }); setRashiModal(false); }

  const today = useMemo(() => new Date(), []);
  const iso   = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const data = useMemo(() => {
    try {
      return getPanchangForDate(iso);
    } catch (_) {
      return { tithi:'—', nakshatra:'—', yoga:'—', karana:'—', sunrise:'—', sunset:'—',
               weekday:'—', weekdayNum:0, paksha:'—', bengaliDay:null,
               bengaliMonth:'—', bengaliYear:null, ritu:'—' };
    }
  }, [iso]);

  const enDateStr = `${today.getDate()} ${EN_MONTHS[today.getMonth()]} ${today.getFullYear()}`;
  const bnDateStr = data.bengaliDay
    ? `${toBN(data.bengaliDay)} ${data.bengaliMonth} ${toBN(data.bengaliYear)} বঙ্গাব্দ`
    : '—';

  const todaysFestival = useMemo(() => {
    try {
      const days = [{ dateStr: iso, tithiIdx: data.tithiIdx, bengaliDay: data.bengaliDay }];
      const found = getFestivalsForMonth(today.getFullYear(), today.getMonth(), days)
        .find(f => f.dateStr === iso);
      return found ? { ...found, image: found.imageKey ? PANJIKA_IMAGES[found.imageKey] : null } : null;
    } catch (_) {
      return null;
    }
  }, [iso, data.tithiIdx, data.bengaliDay]);

  const tabBarH = 58 + insets.bottom;

  const fmt = (slot) => `${slot.start} – ${slot.end}`;
  const muhurtaRows = [
    data.rahuKala && { label: 'রাহুকাল',        sub: 'এড়িয়ে চলুন', icon: 'alert-octagon-outline', time: fmt(data.rahuKala), tone: 'bad'  },
    data.gulika   && { label: 'গুলিক কাল',      sub: 'এড়িয়ে চলুন', icon: 'alert-outline',         time: fmt(data.gulika),   tone: 'bad'  },
    data.abhijit  && { label: 'অভিজিৎ মুহূর্ত', sub: 'শুভ সময়',    icon: 'white-balance-sunny',   time: fmt(data.abhijit),  tone: 'good' },
  ].filter(Boolean);

  return (
    <>
    <View style={s.container}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarH + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Panchang Hero Card ── */}
        <View style={s.heroWash}>
            <View style={s.card}>
              <ImageBackground source={HERO_BG} resizeMode="cover" style={s.heroImgBand}>
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
              </ImageBackground>

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
        </View>

          {/* ── আমার রাশি ── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>আমার রাশি</Text>
            <Pressable onPress={() => setRashiModal(true)}>
              <Text style={s.sectionLink}>পরিবর্তন করুন</Text>
            </Pressable>
          </View>
          {userRashi !== null ? (
            <RashiLuckyCard
              rashiIdx={userRashi}
              onChangePress={() => setRashiModal(true)}
              onRashifalPress={() => { haptics.tap(); navigation.navigate('RashifalDetail', { rashiIndex: userRashi }); }}
            />
          ) : (
            <Pressable style={s.rashiPrompt} onPress={() => setRashiModal(true)}>
              <MaterialCommunityIcons name="zodiac-aries" size={20} color={colors.gold} />
              <Text style={s.rashiPromptText}>আপনার জন্মরাশি নির্বাচন করুন</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
            </Pressable>
          )}

          {/* ── আজকের শুভ-অশুভ সময় ── */}
          {muhurtaRows.length > 0 && (
            <>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>আজকের শুভ-অশুভ সময়</Text>
              </View>
              <View style={s.muhurtaCard}>
                {muhurtaRows.map((row, i) => (
                  <MuhurtaRow key={row.label} {...row} isLast={i === muhurtaRows.length - 1} />
                ))}
              </View>
            </>
          )}

          {/* ── আজকের বিশেষ দিন ── */}
          {todaysFestival && (
            <Pressable
              onPress={() => { haptics.tap(); navigation.navigate('Panchang'); }}
              style={({ pressed }) => [s.festivalCard, pressed && { opacity: 0.85 }]}
            >
              {todaysFestival.image ? (
                <Image source={todaysFestival.image} style={s.festivalImg} />
              ) : (
                <View style={[s.festivalImg, s.festivalImgFallback]}>
                  <MaterialCommunityIcons name="party-popper" size={20} color={colors.gold} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.festivalTag}>আজকের বিশেষ দিন</Text>
                <Text style={s.festivalName} numberOfLines={1}>{todaysFestival.name}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
            </Pressable>
          )}

          {/* ── সাম্প্রতিক ব্লগ ── */}
          {blogPosts.length > 0 && (
            <>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>সাম্প্রতিক ব্লগ</Text>
                <Pressable onPress={() => navigation.navigate('Blog')}>
                  <Text style={s.sectionLink}>সব দেখুন</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.blogRow}
              >
                {blogPosts.map(post => (
                  <BlogCard
                    key={post.slug}
                    post={post}
                    onPress={() => { haptics.tap(); navigation.navigate('Blog', { slug: post.slug }); }}
                  />
                ))}
              </ScrollView>
            </>
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
    <RashiSelectorModal
      visible={rashiModal}
      onSelect={selectRashi}
      onClose={() => setRashiModal(false)}
    />
    </>
  );
}

const CARD_W = (Dimensions.get('window').width - spacing.md * 2 - 10 * 3) / 4;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  /* Panchang hero */
  heroWash: { paddingTop: 4 },
  card: {
    margin: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    overflow: 'hidden',
    ...shadows.raised,
  },
  heroImgBand: {
    marginHorizontal: -spacing.md, marginTop: -10,
    paddingHorizontal: spacing.md, paddingTop: 14, paddingBottom: 10,
    marginBottom: 4,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6, gap: 8 },
  dot:           { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.gold },
  cardTitle:     { ...typography.sectionTitle, color: colors.primary },

  bnDate:  { ...typography.heading, fontSize: 20, color: colors.text, textAlign: 'center', marginBottom: 3 },
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

  /* আমার রাশি */
  rashiCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: spacing.md, marginBottom: 4,
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: 12, paddingVertical: 12,
    ...shadows.card,
  },
  rashiAvatar: { width: 40, height: 40, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  rashiName:   { ...typography.value, fontSize: 14, marginBottom: 3 },
  rashiDetail: { ...typography.label, color: colors.textSecondary, lineHeight: 16, fontSize: 11 },
  rashiCta: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: colors.goldWash, borderRadius: radii.pill,
    paddingHorizontal: 10, paddingVertical: 7, maxWidth: 96,
  },
  rashiCtaText: { ...typography.label, fontSize: 10, color: colors.primary, fontWeight: '700' },

  rashiPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: spacing.md, marginBottom: 4,
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder, borderStyle: 'dashed',
    paddingHorizontal: 14, paddingVertical: 14,
  },
  rashiPromptText: { ...typography.body, flex: 1, color: colors.textSecondary },

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
  rashiChipDot:   { width: 10, height: 10, borderRadius: 5 },
  rashiChipLabel: { ...typography.body, fontSize: 13 },

  /* সাম্প্রতিক ব্লগ */
  blogRow: { paddingHorizontal: spacing.md, gap: 10 },
  blogCard: {
    width: 148, backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden',
    ...shadows.card,
  },
  blogImg:   { width: '100%', height: 84, backgroundColor: colors.goldWash },
  blogTitle: { ...typography.value, fontSize: 12, lineHeight: 16, marginHorizontal: 8, marginTop: 8, height: 32 },
  blogDate:  { ...typography.caption, color: colors.textSecondary, marginHorizontal: 8, marginTop: 4, marginBottom: 8 },

  /* আজকের শুভ-অশুভ সময় */
  muhurtaCard: {
    marginHorizontal: spacing.md, marginBottom: 4,
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    ...shadows.card,
  },
  muhurtaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  muhurtaRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  muhurtaIconWrap: {
    width: 34, height: 34, borderRadius: radii.md,
    alignItems: 'center', justifyContent: 'center',
  },
  muhurtaIconWrapBad:  { backgroundColor: '#FCE4EC' },
  muhurtaIconWrapGood: { backgroundColor: '#E8F5E9' },
  muhurtaTextWrap: { flex: 1 },
  muhurtaLabel: { ...typography.value, fontSize: 14 },
  muhurtaSub:   { ...typography.caption, fontWeight: '600', marginTop: 1 },
  muhurtaTime:  { ...typography.value, fontSize: 13, color: colors.textSecondary },

  /* Quick Grid */
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: spacing.md, gap: 10 },
  quickBtn: {
    width: CARD_W, backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, gap: 6,
    ...shadows.card,
  },
  quickBtnPressed: {
    backgroundColor: colors.goldWash, borderColor: colors.goldBorder, transform: [{ scale: 0.96 }],
  },
  quickLabel: { ...typography.label, fontSize: 11, color: colors.text, fontWeight: '600', textAlign: 'center' },

  /* আজকের বিশেষ দিন */
  festivalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: spacing.md, marginBottom: 14,
    backgroundColor: '#FFF8E6', borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.goldBorder,
    paddingHorizontal: 12, paddingVertical: 10,
    ...shadows.card,
  },
  festivalImg: { width: 42, height: 42, borderRadius: radii.md },
  festivalImgFallback: { backgroundColor: colors.goldWash, alignItems: 'center', justifyContent: 'center' },
  festivalTag:  { ...typography.caption, color: colors.goldLight, fontWeight: '700' },
  festivalName: { ...typography.value, fontSize: 14, marginTop: 1 },

  infoStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, paddingVertical: 6 },
  infoText:  { ...typography.label, color: colors.textSecondary },
});
