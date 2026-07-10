import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions, Image, Modal, ImageBackground,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { getPanchangForDate } from '../engine/panchang_full';
import { getTodayRashifal } from '../engine/rashifal';
import { getFestivalsForMonth } from '../engine/bengali_festivals';
import PANJIKA_IMAGES from '../engine/panjika-images';
import { useUser, RashiLucky, RASHI_NAMES } from '../context/UserContext';
import { QUICK_ACCESS_ITEMS, MenuIcon } from '../navigation/menuItems';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { shadows } from '../theme/shadows';
import { typography } from '../theme/typography';
import { haptics } from '../utils/haptics';

const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBN = n => String(n).split('').map(d => BN_DIGITS[+d] ?? d).join('');
const EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
// সূর্যোদয়/সূর্যাস্ত "HH:MM" (২৪ ঘণ্টা)-কে "সকাল ৫:০১" ফরম্যাটে দেখানোর জন্য —
// সূর্যোদয় সবসময় সকাল, সূর্যাস্ত সবসময় সন্ধ্যা, তাই period সরাসরি প্যারামিটার
// হিসেবে নেওয়া হচ্ছে, সাধারণ AM/PM লজিকের দরকার নেই।
const to12h = (hhmm, period) => {
  if (!hhmm || hhmm === '—') return hhmm;
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${toBN(h12)}:${toBN(String(m).padStart(2, '0'))}`;
};
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
// RASHI_NAMES (UserContext.js)-এর একই ক্রমে (মেষ→মীন) ইংরেজি নাম — "আমার রাশি"
// গ্র্যাডিয়েন্ট কার্ডে বাংলা নামের নিচে ছোট করে দেখানোর জন্য।
const ENGLISH_RASHI_NAMES = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];
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

// আজকের শুভ-অশুভ সময়ের চিপ — সবুজ (good) বা লালচে-গোলাপি (bad) ব্যাজ,
// horizontal scroll-এ পাশাপাশি (রেফারেন্স ডিজাইনের pill-row অনুযায়ী)
function MuhurtaChip({ icon, label, time, tone }) {
  const good = tone === 'good';
  return (
    <View style={[s.muhurtaChip, good ? s.muhurtaChipGood : s.muhurtaChipBad]}>
      <MaterialCommunityIcons
        name={icon}
        size={15}
        color={good ? '#2E7D32' : '#B71C1C'}
        style={{ marginBottom: 3 }}
      />
      <Text style={[s.muhurtaChipLabel, { color: good ? '#2E7D32' : '#B71C1C' }]} numberOfLines={1}>{label}</Text>
      <Text style={s.muhurtaChipTime} numberOfLines={1}>{time}</Text>
    </View>
  );
}

// "আজকের ব্যক্তিগত ভবিষ্যৎ" কার্ডের ২×২ গ্রিড — প্রেম/স্বাস্থ্য উপরের সারিতে,
// চাকরি/অর্থ নিচের সারিতে (রেফারেন্স ডিজাইনের ক্রম অনুযায়ী)
const FORECAST_CATS = [
  { key: 'love',    icon: 'heart',            label: 'প্রেম'   },
  { key: 'health',  icon: 'leaf',             label: 'স্বাস্থ্য' },
  { key: 'work',    icon: 'briefcase-outline',label: 'চাকরি'   },
  { key: 'finance', icon: 'cash-multiple',    label: 'অর্থ'    },
];

function StarRow({ score }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <MaterialCommunityIcons
          key={i}
          name={i <= score ? 'star' : 'star-outline'}
          size={8}
          color={i <= score ? colors.gold : colors.cardBorder}
          style={{ marginRight: i < 5 ? 0.5 : 0 }}
        />
      ))}
    </View>
  );
}

// "আমার রাশি" সেকশন — একটাই হালকা/আইভরি কার্ড, মাঝে উল্লম্ব ডিভাইডার দিয়ে দুই
// ভাগ: বাঁয়ে গোল অ্যাভাটার + নাম + পরিবর্তনের লিংক, ডানে "আজকের সংক্ষিপ্ত
// ভবিষ্যৎ" — ৪টা আইকন এক সারিতে, প্রতিটার নিচে স্টার রেটিং।
function RashiHeroRow({ rashiIdx, score, onChangePress, onRashifalPress }) {
  const lucky = RashiLucky[rashiIdx];
  return (
    <View style={s.rashiHeroCard}>
      <View style={s.rashiHeroLeft}>
        <Pressable onPress={onChangePress} style={s.rashiHeroAvatarWrap}>
          <Image source={RASHI_IMAGES[rashiIdx]} style={s.rashiHeroAvatarImg} resizeMode="contain" />
        </Pressable>
        <Text style={s.rashiHeroName}>{RASHI_NAMES[rashiIdx]}</Text>
        <Text style={s.rashiHeroEn}>({ENGLISH_RASHI_NAMES[rashiIdx]})</Text>
        <Pressable onPress={onChangePress} hitSlop={6}>
          <Text style={s.rashiHeroChangeLink}>রাশি পরিবর্তন করুন ›</Text>
        </Pressable>
      </View>

      <View style={s.rashiHeroDivider} />

      <Pressable onPress={onRashifalPress} style={s.rashiHeroRight}>
        <Text style={s.forecastTitle} numberOfLines={1}>আজকের সংক্ষিপ্ত ভবিষ্যৎ</Text>
        {score ? (
          <View style={s.forecastRow}>
            {FORECAST_CATS.map(cat => (
              <View key={cat.key} style={s.forecastCell}>
                <MaterialCommunityIcons name={cat.icon} size={13} color={colors.primary} />
                <Text style={s.forecastLabel} numberOfLines={1}>{cat.label}</Text>
                <StarRow score={score[cat.key]} />
              </View>
            ))}
          </View>
        ) : (
          <>
            <Text style={s.rashiDetail} numberOfLines={1}>শুভ রং: {lucky.colorName} · রত্ন: {lucky.gem}</Text>
            <Text style={s.rashiDetail} numberOfLines={1}>শুভ সংখ্যা: {lucky.number} · দিক: {lucky.dir}</Text>
          </>
        )}
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

const BOOKING_BANNER_IMG = require('../../assets/booking-banner-shiva.webp');

// একটামাত্র বড় ব্যানার — শিবের ছবি ব্যাকগ্রাউন্ডে (বাঁয়ে শিব দৃশ্যমান থাকে,
// ডানদিকে অন্ধকার নক্ষত্র-আকাশের অংশে লেখা বসানো, ওপরে হালকা গ্র্যাডিয়েন্ট
// scrim দিয়ে লেখা স্পষ্ট রাখা হয়েছে)।
function BookingBanner({ onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.bookingBannerWrap, pressed && { opacity: 0.9 }]}>
      <ImageBackground
        source={BOOKING_BANNER_IMG}
        resizeMode="cover"
        imageStyle={{ borderRadius: radii.lg }}
        style={s.bookingBanner}
      >
        <LinearGradient
          colors={['transparent', 'rgba(15,8,35,0.35)', 'rgba(15,8,35,0.72)']}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          locations={[0, 0.42, 1]}
          style={s.bookingBannerScrim}
        >
          <View style={s.bookingBannerSpacer} />
          <View style={{ flex: 1 }}>
            <Text style={s.bookingBannerTitle}>ব্যক্তিগত কুণ্ডলী বিশ্লেষণ ও পরামর্শ নিন</Text>
            <Text style={s.bookingBannerSub}>অভিজ্ঞ জ্যোতিষী প্রদ্যুৎ আচার্যের সাথে কথা বলুন</Text>
            <View style={s.bookingBannerCta}>
              <Text style={s.bookingBannerCtaText}>এখনই বুক করুন</Text>
              <MaterialCommunityIcons name="arrow-right" size={12} color={colors.text} />
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
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

function QuickTile({ tab, icon, label, color, onPress }) {
  return (
    <Pressable
      onPress={() => { haptics.tap(); onPress(); }}
      style={({ pressed }) => [s.quickBtn, pressed && s.quickBtnPressed]}
    >
      <View style={[s.quickIconWrap, { backgroundColor: color + '1E' }]}>
        <MenuIcon tab={tab} icon={icon} size={20} color={color} />
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
    data.abhijit  && { label: 'অভিজিৎ',    icon: 'white-balance-sunny',   time: fmt(data.abhijit),  tone: 'good' },
    data.amritKal && { label: 'অমৃত কাল',  icon: 'water-check-outline',   time: fmt(data.amritKal), tone: 'good' },
    data.rahuKala && { label: 'রাহুকাল',   icon: 'alert-octagon-outline', time: fmt(data.rahuKala), tone: 'bad'  },
    data.gulika   && { label: 'গুলিক কাল', icon: 'alert-outline',         time: fmt(data.gulika),   tone: 'bad'  },
    data.yamagnda && { label: 'যমঘণ্ট',    icon: 'alert-circle-outline',  time: fmt(data.yamagnda), tone: 'bad'  },
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
                <PanchangCell icon="weather-sunset-up"   label="সূর্যোদয়" value={to12h(data.sunrise, 'সকাল')} />
                <PanchangCell icon="weather-sunset-down" label="সূর্যাস্ত" value={to12h(data.sunset, 'সন্ধ্যা')}  />
              </View>
            </View>
        </View>

          {/* ── আমার রাশি ── */}
          {userRashi === null && (
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>আমার রাশি</Text>
            </View>
          )}
          {userRashi !== null ? (
            <RashiHeroRow
              rashiIdx={userRashi}
              score={todayRashiScore}
              onChangePress={() => { haptics.tap(); setRashiModal(true); }}
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
                tab={q.tab}
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.muhurtaRow}
              >
                {muhurtaRows.map(row => (
                  <MuhurtaChip key={row.label} {...row} />
                ))}
              </ScrollView>
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
          <BookingBanner onPress={() => { haptics.tap(); navigation.navigate('Booking'); }} />

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

  /* আমার রাশি — একটাই হালকা কার্ড, উল্লম্ব ডিভাইডারে দুই ভাগ (কম্প্যাক্ট হাইট) */
  rashiHeroCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md, marginBottom: 2,
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingVertical: 10, paddingHorizontal: 10, ...shadows.card,
  },
  rashiHeroLeft: { width: 96, alignItems: 'center' },
  rashiHeroAvatarWrap: {
    width: 46, height: 46, borderRadius: radii.pill,
    backgroundColor: colors.goldWash, borderWidth: 1.5, borderColor: colors.goldBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  rashiHeroAvatarImg: { width: 30, height: 30 },
  rashiHeroName: { ...typography.heading, fontSize: 13, color: colors.text },
  rashiHeroEn:   { ...typography.label, fontSize: 9.5, color: colors.textSecondary, marginBottom: 2 },
  rashiHeroChangeLink: { ...typography.label, fontSize: 9.5, color: colors.primary, fontWeight: '700', textAlign: 'center' },

  rashiHeroDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.divider, marginHorizontal: 8 },

  rashiHeroRight: { flex: 1 },
  forecastTitle: { ...typography.value, fontSize: 10.5, marginBottom: 6, color: colors.primary },
  forecastRow: { flexDirection: 'row' },
  forecastCell: { alignItems: 'center', gap: 1, width: '25%', overflow: 'hidden' },
  forecastLabel: { ...typography.label, fontSize: 8.5, color: colors.textSecondary },
  rashiDetail: { ...typography.label, color: colors.textSecondary, lineHeight: 16, fontSize: 11 },

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

  /* পরামর্শ বুকিং ব্যানার */
  bookingBannerWrap: { marginHorizontal: spacing.md, marginBottom: 2 },
  bookingBanner: {
    height: 108, borderRadius: radii.lg, overflow: 'hidden',
    ...shadows.raised,
  },
  bookingBannerScrim: {
    flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14,
  },
  bookingBannerSpacer: { width: 96 },
  bookingBannerTitle: { ...typography.value, fontSize: 13, color: colors.white, lineHeight: 17 },
  bookingBannerSub:   { ...typography.label, fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2, lineHeight: 13 },
  bookingBannerCta: {
    flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start',
    backgroundColor: colors.gold, borderRadius: radii.pill,
    paddingHorizontal: 10, paddingVertical: 6, marginTop: 8,
  },
  bookingBannerCtaText: { ...typography.label, fontSize: 10, color: colors.text, fontWeight: '700' },

  blogRow: { paddingHorizontal: spacing.md, gap: 8 },
  blogCard: {
    width: 132, backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden',
    ...shadows.card,
  },
  blogImg:   { width: '100%', height: 66, backgroundColor: colors.goldWash },
  blogTitle: { ...typography.value, fontSize: 11, lineHeight: 14, marginHorizontal: 7, marginTop: 6, height: 28 },
  blogDate:  { ...typography.caption, color: colors.textSecondary, marginHorizontal: 7, marginTop: 3, marginBottom: 6 },

  /* আজকের শুভ-অশুভ সময় — pill চিপ, horizontal scroll */
  muhurtaRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: 8 },
  muhurtaChip: {
    width: 92, borderRadius: radii.lg, borderWidth: 1,
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6,
  },
  muhurtaChipGood: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
  muhurtaChipBad:  { backgroundColor: '#FCE4EC', borderColor: '#F8BBD0' },
  muhurtaChipLabel: { ...typography.value, fontSize: 11, fontWeight: '700', marginBottom: 2 },
  muhurtaChipTime:  { ...typography.label, fontSize: 9.5, color: colors.textSecondary },

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
