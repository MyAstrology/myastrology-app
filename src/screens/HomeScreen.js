import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions, Image, Modal, ImageBackground,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { getPanchangForDate } from '../engine/panchang_full';
import { getTodayRashifal } from '../engine/rashifal';
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
// রাশিফল গ্রিড কার্ডের (RashifalScreen.js) একই ইমেজ সেট — সেখানকার
// RASHI_IMAGES-এর ক্রমের সাথে মিল রেখে (মেষ→মীন)
const RASHI_IMAGES = [
  require('../assets/rashi/aries.png'),
  require('../assets/rashi/taurus.png'),
  require('../assets/rashi/gemini.png'),
  require('../assets/rashi/cancer.png'),
  require('../assets/rashi/leo.png'),
  require('../assets/rashi/virgo.png'),
  require('../assets/rashi/libra.png'),
  require('../assets/rashi/scorpio.png'),
  require('../assets/rashi/sagittarius.png'),
  require('../assets/rashi/capricorn.png'),
  require('../assets/rashi/aquarius.png'),
  require('../assets/rashi/pisces.png'),
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
        <MaterialCommunityIcons name={icon} size={13} color={bad ? '#B71C1C' : '#2E7D32'} />
      </View>
      <View style={s.muhurtaTextWrap}>
        <Text style={s.muhurtaLabel}>{label}</Text>
        <Text style={[s.muhurtaSub, { color: bad ? '#B71C1C' : '#2E7D32' }]}>{sub}</Text>
      </View>
      <Text style={s.muhurtaTime}>{time}</Text>
    </View>
  );
}

const RASHI_CATS = [
  { key: 'love',    icon: '💕', label: 'প্রেম' },
  { key: 'work',    icon: '💼', label: 'কর্ম' },
  { key: 'health',  icon: '❤️‍🩹', label: 'স্বাস্থ্য' },
  { key: 'finance', icon: '💰', label: 'অর্থ' },
];

function RashiLuckyCard({ rashiIdx, score, onChangePress, onRashifalPress }) {
  const lucky = RashiLucky[rashiIdx];
  return (
    <View style={s.rashiCard}>
      <Pressable onPress={onChangePress} style={[s.rashiAvatar, { backgroundColor: lucky.color + '22' }]}>
        <Image source={RASHI_IMAGES[rashiIdx]} style={s.rashiAvatarImg} resizeMode="contain" />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={s.rashiName}>{RASHI_NAMES[rashiIdx]} রাশি</Text>
        {score ? (
          <View style={s.rashiCatRow}>
            {RASHI_CATS.map(cat => (
              <Text key={cat.key} style={s.rashiCatItem}>
                {cat.icon} {toBN(score[cat.key])}/{toBN(5)}
              </Text>
            ))}
          </View>
        ) : (
          <>
            <Text style={s.rashiDetail} numberOfLines={1}>শুভ রং: {lucky.colorName} · রত্ন: {lucky.gem}</Text>
            <Text style={s.rashiDetail} numberOfLines={1}>শুভ সংখ্যা: {lucky.number} · দিক: {lucky.dir}</Text>
          </>
        )}
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

const BOOKING_TOPICS = [
  { icon: '💍', color: '#D6577A', title: 'বিয়েতে বাধা বা দেরি হচ্ছে?',   sub: 'কুণ্ডলী মিলিয়ে জানুন বিয়ের যোগ ও প্রকৃত কারণ' },
  { icon: '💼', color: '#3E7FC1', title: 'চাকরি বা প্রমোশন আটকে আছে?',    sub: 'কর্মজীবন বিশ্লেষণে জানুন সঠিক দিশা ও সময়' },
  { icon: '💰', color: '#E08A3C', title: 'ব্যবসায় লোকসান বা স্থবিরতা?',   sub: 'জ্যোতিষ পরামর্শে বুঝুন ব্যবসার শুভ সময়' },
  { icon: '💔', color: '#9457B0', title: 'সম্পর্কে অশান্তি বা ভুল বোঝাবুঝি?', sub: 'কুণ্ডলী মিলিয়ে জানুন সম্পর্কের চিত্র ও সমাধান' },
  { icon: '🏠', color: '#4FA57A', title: 'বাড়ি বা অফিসে বারবার অশান্তি?', sub: 'বাস্তু পরামর্শে দূর করুন নেতিবাচক প্রভাব' },
];

function BookingCard({ topic, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.bookingCard, { borderLeftColor: topic.color }, pressed && { opacity: 0.85 }]}>
      <Text style={s.bookingIcon}>{topic.icon}</Text>
      <Text style={s.bookingTitle} numberOfLines={2}>{topic.title}</Text>
      <Text style={s.bookingSub} numberOfLines={2}>{topic.sub}</Text>
      <View style={s.bookingCta}>
        <Text style={[s.bookingCtaText, { color: topic.color }]}>পরামর্শ বুকিং করুন</Text>
        <MaterialCommunityIcons name="arrow-right" size={13} color={topic.color} />
      </View>
    </Pressable>
  );
}

// শুধু হোম স্ক্রিনের quick-access গ্রিডের জন্য — প্রতিটা টাইলে আলাদা রঙ দিয়ে
// গ্রিডটাকে আরও প্রাণবন্ত করা হচ্ছে, কিন্তু এই ম্যাপিং শুধু এই ফাইলেই সীমাবদ্ধ
// রাখা হয়েছে যাতে drawer মেনু বা অন্য স্ক্রিনের (যেগুলো একই MENU_ITEMS শেয়ার
// করে) সোনালি/আইভরি রঙের ধারাবাহিকতা অক্ষুণ্ণ থাকে।
const QUICK_TILE_COLORS = {
  Kundali:     '#6C63C7', // ইন্ডিগো
  MatchMaking: '#D6577A', // গোলাপি
  Panchang:    '#2E9E8F', // টিল
  Numerology:  '#E08A3C', // কমলা
  Rashifal:    '#3E7FC1', // আকাশি নীল
  Namakaran:   '#4FA57A', // সবুজ
  Prashna:     '#9457B0', // বেগুনি
  Booking:     '#C1543D', // টেরাকোটা
};

function QuickTile({ icon, label, color, onPress }) {
  return (
    <Pressable
      onPress={() => { haptics.tap(); onPress(); }}
      style={({ pressed }) => [s.quickBtn, pressed && s.quickBtnPressed]}
    >
      <View style={[s.quickIconWrap, { backgroundColor: color + '1E' }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={s.quickLabel} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </Pressable>
  );
}

export function HomeScreen() {
  const navigation = useNavigation();
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

  // "আমার রাশি" কার্ডে প্রতিদিন বদলানো তথ্য দেখানোর জন্য — স্থির শুভ রং/সংখ্যা/
  // দিকের বদলে আজকের প্রেম/কর্ম/স্বাস্থ্য/আর্থিক রেটিং, যাতে প্রতিদিন নতুন কিছু দেখা যায়।
  const todayRashiScore = useMemo(() => {
    if (userRashi === null) return null;
    try { return getTodayRashifal().rashifal[userRashi]?.score || null; }
    catch (_) { return null; }
  }, [userRashi, iso]);

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
        contentContainerStyle={{ paddingBottom: 24 }}
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

              <View style={s.cellGrid4}>
                <PanchangCell icon="moon-waning-crescent" label="তিথি"    value={data.tithi}
                  timeStart={data.tithiStart}     timeEnd={data.tithiEnd} />
                <PanchangCell icon="star-four-points"     label="নক্ষত্র" value={data.nakshatra}
                  timeStart={data.nakshatraStart} timeEnd={data.nakshatraEnd} />
                <PanchangCell icon="infinity"        label="যোগ"      value={data.yoga}
                  timeStart={data.yogaStart} timeEnd={data.yogaEnd} />
                <PanchangCell icon="hexagon-outline" label="করণ"      value={data.karana} />
              </View>
              <View style={s.cardDivider} />
              <View style={s.cellGrid2}>
                <PanchangCell icon="weather-sunset-up"   label="সূর্যোদয়" value={data.sunrise} />
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
              score={todayRashiScore}
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

          {/* ── Quick Actions ── */}
          <Text style={[s.sectionTitle, { marginHorizontal: spacing.md, marginTop: 6, marginBottom: 6 }]}>
            দ্রুত অ্যাক্সেস
          </Text>
          <View style={s.quickGrid}>
            {QUICK_ACCESS_ITEMS.map(q => (
              <QuickTile
                key={q.tab}
                icon={q.icon}
                label={q.label}
                color={QUICK_TILE_COLORS[q.tab] || colors.gold}
                onPress={() => navigation.navigate(q.tab)}
              />
            ))}
          </View>

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

          {/* ── পরামর্শ বুকিং ── */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>আপনার সমস্যা কী?</Text>
            <Pressable onPress={() => navigation.navigate('Booking')}>
              <Text style={s.sectionLink}>সব দেখুন</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.bookingRow}
          >
            {BOOKING_TOPICS.map((topic, i) => (
              <BookingCard
                key={i}
                topic={topic}
                onPress={() => { haptics.tap(); navigation.navigate('Booking'); }}
              />
            ))}
          </ScrollView>

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
    margin: spacing.md, marginBottom: 8, backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    overflow: 'hidden',
    ...shadows.raised,
  },
  heroImgBand: {
    marginHorizontal: -spacing.md, marginTop: -8,
    paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: 6,
    marginBottom: 2,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4, gap: 8 },
  dot:           { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.gold },
  cardTitle:     { ...typography.sectionTitle, color: colors.primary },

  bnDate:  { ...typography.heading, fontSize: 19, color: colors.text, textAlign: 'center', marginBottom: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' },
  metaText:{ ...typography.label, color: colors.textSecondary, fontWeight: '500' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textSecondary, opacity: 0.5 },

  cardDivider: { height: 1, backgroundColor: colors.divider },

  cellGrid4:  { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  cellGrid2:  { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 2 },
  cell:       { flex: 1, paddingVertical: 2, paddingHorizontal: 2, alignItems: 'center' },
  cellHeader: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
  cellLabel:  { ...typography.caption, color: colors.textSecondary },
  cellValue:  { ...typography.value, textAlign: 'center' },
  timeRange:  { fontSize: 10, color: colors.primary, textAlign: 'center', marginTop: 1, opacity: 0.85 },

  /* Section row */
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.md, marginTop: 2, marginBottom: 6,
  },
  sectionTitle: { ...typography.sectionTitle, color: colors.textSecondary },
  sectionLink:  { ...typography.label, color: colors.gold },

  /* আমার রাশি */
  rashiCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: spacing.md, marginBottom: 2,
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: 12, paddingVertical: 9,
    ...shadows.card,
  },
  rashiAvatar: { width: 40, height: 40, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  rashiAvatarImg: { width: 28, height: 28 },
  rashiName:   { ...typography.value, fontSize: 14, marginBottom: 3 },
  rashiDetail: { ...typography.label, color: colors.textSecondary, lineHeight: 16, fontSize: 11 },
  rashiCatRow:  { flexDirection: 'row', flexWrap: 'wrap', rowGap: 2, columnGap: 8 },
  rashiCatItem: { ...typography.label, color: colors.textSecondary, fontSize: 11 },
  rashiCta: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: colors.goldWash, borderRadius: radii.pill,
    paddingHorizontal: 10, paddingVertical: 7, maxWidth: 96,
  },
  rashiCtaText: { ...typography.label, fontSize: 10, color: colors.primary, fontWeight: '700' },

  rashiPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: spacing.md, marginBottom: 2,
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder, borderStyle: 'dashed',
    paddingHorizontal: 14, paddingVertical: 10,
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
  bookingRow: { paddingHorizontal: spacing.md, gap: 8 },
  bookingCard: {
    width: 168, backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder, borderLeftWidth: 3,
    padding: 12,
    ...shadows.card,
  },
  bookingIcon: { fontSize: 24, marginBottom: 6 },
  bookingTitle: { ...typography.value, fontSize: 12.5, lineHeight: 16, height: 32 },
  bookingSub: { ...typography.caption, color: colors.textSecondary, fontSize: 10.5, lineHeight: 13, height: 26, marginTop: 3 },
  bookingCta: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.divider,
  },
  bookingCtaText: { ...typography.label, color: colors.gold, fontSize: 11 },

  blogRow: { paddingHorizontal: spacing.md, gap: 8 },
  blogCard: {
    width: 132, backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden',
    ...shadows.card,
  },
  blogImg:   { width: '100%', height: 66, backgroundColor: colors.goldWash },
  blogTitle: { ...typography.value, fontSize: 11, lineHeight: 14, marginHorizontal: 7, marginTop: 6, height: 28 },
  blogDate:  { ...typography.caption, color: colors.textSecondary, marginHorizontal: 7, marginTop: 3, marginBottom: 6 },

  /* আজকের শুভ-অশুভ সময় */
  muhurtaCard: {
    marginHorizontal: spacing.md, marginBottom: 2,
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    ...shadows.card,
  },
  muhurtaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  muhurtaRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  muhurtaIconWrap: {
    width: 24, height: 24, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  muhurtaIconWrapBad:  { backgroundColor: '#FCE4EC' },
  muhurtaIconWrapGood: { backgroundColor: '#E8F5E9' },
  muhurtaTextWrap: { flex: 1 },
  muhurtaLabel: { ...typography.value, fontSize: 12 },
  muhurtaSub:   { ...typography.caption, fontSize: 10, fontWeight: '600' },
  muhurtaTime:  { ...typography.value, fontSize: 11, color: colors.textSecondary },

  /* Quick Grid */
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: spacing.md, gap: 8 },
  quickBtn: {
    width: CARD_W, backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, gap: 4,
    ...shadows.card,
  },
  quickBtnPressed: {
    backgroundColor: colors.goldWash, borderColor: colors.goldBorder, transform: [{ scale: 0.96 }],
  },
  quickIconWrap: {
    width: 38, height: 38, borderRadius: radii.md,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { ...typography.label, fontSize: 11, color: colors.text, fontWeight: '600', textAlign: 'center' },

  /* আজকের বিশেষ দিন */
  festivalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: spacing.md, marginBottom: 8,
    backgroundColor: '#FFF8E6', borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.goldBorder,
    paddingHorizontal: 12, paddingVertical: 8,
    ...shadows.card,
  },
  festivalImg: { width: 38, height: 38, borderRadius: radii.md },
  festivalImgFallback: { backgroundColor: colors.goldWash, alignItems: 'center', justifyContent: 'center' },
  festivalTag:  { ...typography.caption, color: colors.goldLight, fontWeight: '700' },
  festivalName: { ...typography.value, fontSize: 14, marginTop: 1 },

  infoStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6, paddingVertical: 4 },
  infoText:  { ...typography.label, color: colors.textSecondary },
});
