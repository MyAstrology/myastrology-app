// src/screens/HomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, Animated, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Rashis, Planets, Spacing } from '../theme';
import { getTodayPanjika, getBengaliDate } from '../engine/panjika';
import { loadUserCity } from '../engine/cities';
import { useUser } from '../context/UserContext';
import LuckyWidget from '../components/LuckyWidget';

const { width } = Dimensions.get('window');

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 4 && h < 12)  return { text: 'সুপ্রভাত',    icon: '🌅' };
  if (h >= 12 && h < 17) return { text: 'শুভ অপরাহ্ণ', icon: '☀️' };
  if (h >= 17 && h < 20) return { text: 'শুভ সন্ধ্যা', icon: '🌆' };
  return { text: 'শুভ রাত্রি', icon: '🌙' };
}

function StarField() {
  const stars = useRef(
    Array.from({ length: 25 }, (_, i) => ({
      key: i,
      top: Math.random() * 250,
      left: Math.random() * width,
      size: Math.random() * 2.5 + 0.5,
      anim: new Animated.Value(Math.random()),
    }))
  ).current;

  useEffect(() => {
    stars.forEach(star => {
      const twinkle = () => Animated.sequence([
        Animated.timing(star.anim, { toValue: 0.1 + Math.random() * 0.4, duration: 1500 + Math.random() * 2500, useNativeDriver: true }),
        Animated.timing(star.anim, { toValue: 0.6 + Math.random() * 0.4, duration: 1500 + Math.random() * 2500, useNativeDriver: true }),
      ]).start(twinkle);
      twinkle();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map(s => (
        <Animated.View key={s.key} style={{
          position: 'absolute', top: s.top, left: s.left,
          width: s.size, height: s.size, borderRadius: s.size,
          backgroundColor: '#fff', opacity: s.anim,
        }} />
      ))}
    </View>
  );
}

// দ্রুত অ্যাক্সেস বিভাগসমূহ
const QUICK_TOOLS = [
  { icon: '🔯', label: 'জন্মকুষ্ঠি',    screen: 'Kundali',       tab: 'Tools', color: Colors.saturn },
  { icon: '💑', label: 'কুষ্ঠি মিলন',   screen: 'MatchMaking',   tab: 'Tools', color: Colors.venus },
  { icon: '🗓️', label: 'পঞ্জিকা',       screen: 'Panjika',       tab: 'Tools', color: Colors.gold },
  { icon: '🔢', label: 'নিউমেরোলজি',   screen: 'Numerology',    tab: 'Tools', color: Colors.mercury },
  { icon: '🪐', label: 'গ্রহ গোচর',     screen: 'Gochar',        tab: 'Tools', color: Colors.rahu },
  { icon: '💎', label: 'রত্নপাথর',      screen: 'Gemstone',      tab: 'Tools', color: '#06b6d4' },
  { icon: '🏠', label: 'বাস্তুশাস্ত্র', screen: 'Vastu',         tab: 'Tools', color: '#10b981' },
  { icon: '✋', label: 'হস্তরেখা',      screen: 'Palmistry',     tab: 'Tools', color: '#f59e0b' },
];

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const greeting = getGreeting();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { user } = useUser();

  const [panjika, setPanjika] = useState({
    tithi: '—', nakshatra: '—', yoga: '—',
    sunrise: '—', sunset: '—', rahukal: '—', amrit: '—',
  });
  const [bnDate, setBnDate] = useState(null);
  const [cityName, setCityName] = useState('রাণাঘাট');

  useEffect(() => {
    (async () => {
      try {
        const city = await loadUserCity();
        setCityName(city.n);
        const today = new Date();
        setPanjika(getTodayPanjika(today, city.lat, city.lng));
        setBnDate(getBengaliDate(today));
      } catch (_) {
        try {
          const today = new Date();
          setPanjika(getTodayPanjika());
          setBnDate(getBengaliDate(today));
        } catch (_) {}
      }
    })();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const openWhatsApp = () => Linking.openURL(
    'https://wa.me/919333122768?text=' +
    encodeURIComponent('নমস্কার Dr. Acharya 🙏 আমি পরামর্শ নিতে চাই।')
  );

  const firstName  = user?.name ? user.name.split(' ')[0] : null;
  const userRashi  = (user?.rashiIndex !== undefined) ? Rashis[user.rashiIndex] : null;
  const bnDateStr  = bnDate ? bnDate.formatted : '';

  const goTool = (screen, tab = 'Tools') => {
    if (tab === 'Home') navigation.navigate(screen);
    else navigation.navigate(tab, { screen });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerWrap}>
          <StarField />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.om}>🙏🏼</Text>
              <Text style={styles.greeting}>{greeting.icon} {greeting.text}{firstName ? `, ${firstName}` : ''}</Text>
              {bnDateStr ? (
                <Text style={styles.bnDate}>{bnDateStr}</Text>
              ) : null}
              <Text style={styles.date}>মিলাদ তারিখ: {new Date().toLocaleDateString('bn-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              {userRashi && (
                <View style={styles.rashiBadgeWrap}>
                  <Text style={[styles.rashiBadge, { color: userRashi.color }]}>
                    {userRashi.symbol} {userRashi.name} রাশি
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.waBtn} onPress={openWhatsApp} activeOpacity={0.8}>
              <Text style={{ fontSize: 22 }}>💬</Text>
              <Text style={styles.waBtnText}>পরামর্শ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* নবগ্রহ স্ক্রোল */}
        <Text style={styles.sectionTitle}>🪐 নবগ্রহ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.grahaList}
        >
          {Object.entries(Planets).map(([key, p]) => (
            <TouchableOpacity key={key} style={styles.grahaItem}
              onPress={() => navigation.navigate('AIChat')}
            >
              <View style={[styles.grahaCircle, { borderColor: p.color + '88', backgroundColor: p.color + '22' }]}>
                <Text style={styles.grahaSymbol}>{p.symbol}</Text>
              </View>
              <Text style={[styles.grahaName, { color: p.color }]}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* পঞ্জিকা Card */}
        <TouchableOpacity style={styles.panjikaCard}
          onPress={() => navigation.navigate('Tools', { screen: 'Panjika' })}
          activeOpacity={0.9}
        >
          <View style={styles.panjikaHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 26 }}>🗓️</Text>
              <View>
                <Text style={styles.panjikaTitle}>আজকের পঞ্জিকা</Text>
                <Text style={styles.panjikaSubtitle}>📍 {cityName} • বিশুদ্ধসিদ্ধ</Text>
              </View>
            </View>
            <Text style={styles.moreLink}>বিস্তারিত →</Text>
          </View>

          <View style={styles.panjikaHighlight}>
            {[
              { icon: '🌙', label: 'তিথি',    value: panjika.tithi,     color: Colors.moon },
              { icon: '⭐',   label: 'নক্ষত্র', value: panjika.nakshatra, color: Colors.gold },
            ].map((item, i) => (
              <View key={i} style={[styles.panjikaHItem, { borderColor: item.color + '44' }]}>
                <Text style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</Text>
                <Text style={styles.panjikaHLabel}>{item.label}</Text>
                <Text style={styles.panjikaHValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sunRow}>
            <View style={styles.sunItem}>
              <Text style={{ fontSize: 20 }}>🌅</Text>
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.sunLabel}>সূর্যোদয়</Text>
                <Text style={styles.sunValue}>{panjika.sunrise}</Text>
              </View>
            </View>
            <View style={styles.sunDivider} />
            <View style={styles.sunItem}>
              <Text style={{ fontSize: 20 }}>🌇</Text>
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.sunLabel}>সূর্যাস্ত</Text>
                <Text style={styles.sunValue}>{panjika.sunset}</Text>
              </View>
            </View>
          </View>

          <View style={styles.rahuRow}>
            <Text>⚠️ </Text>
            <Text style={styles.rahuText}>রাহুকাল: {panjika.rahukal}</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.amritText}>🍀 অমৃত: {panjika.amrit}</Text>
          </View>
        </TouchableOpacity>

        {/* ভাগ্য Widget */}
        <Text style={styles.sectionTitle}>🍀 আজকের শুভসংকেত</Text>
        <LuckyWidget onPress={() => navigation.navigate('Tools', { screen: 'Gemstone' })} />

        {/* দ্রুত অ্যাক্সেস — 8 টুল (2×4 গ্রিড) */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>⚡ জ্যোতিষ টুলস</Text>
        <View style={styles.quickGrid}>
          {QUICK_TOOLS.map((item, i) => (
            <TouchableOpacity key={i}
              style={[styles.quickCard, { borderColor: item.color + '44' }]}
              onPress={() => goTool(item.screen, item.tab)}
              activeOpacity={0.78}
            >
              <View style={[styles.quickIconWrap, { backgroundColor: item.color + '22' }]}>
                <Text style={{ fontSize: 26 }}>{item.icon}</Text>
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* রাশিফল স্ক্রোল */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 8, marginBottom: 10 }}>
          <Text style={styles.sectionTitle2}>🌟 আজকের রাশিফল</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tools', { screen: 'Rashifal' })}>
            <Text style={{ fontSize: 12, color: Colors.gold }}>সব দেখুন →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rashiList}
        >
          {Rashis.map((r, i) => (
            <TouchableOpacity key={i}
              style={[
                styles.rashiCard,
                { borderColor: r.color + '55' },
                userRashi && i === user.rashiIndex && { borderColor: r.color, borderWidth: 2 },
              ]}
              onPress={() => navigation.navigate('RashifalDetail', { rashi: r })}
              activeOpacity={0.8}
            >
              <View style={[styles.rashiIconWrap, { backgroundColor: r.color + '22' }]}>
                <Text style={{ fontSize: 26 }}>{r.symbol}</Text>
              </View>
              <Text style={[styles.rashiName, { color: r.color }]}>{r.name}</Text>
              <Text style={styles.rashiLord}>{r.lord}</Text>
              {userRashi && i === user.rashiIndex && (
                <Text style={{ fontSize: 8, color: r.color, fontWeight: '700' }}>আমার</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quote */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteOm}>🙏🏼</Text>
          <Text style={styles.quoteText}>
            "জ্যোতিষ ভাগ্যের দাস নয় — এটি চেতনার আলো যা অন্ধকারে পথ দেখায়।"
          </Text>
          <View style={{ width: 40, height: 1.5, backgroundColor: Colors.saturn, marginVertical: 10, alignSelf: 'center' }} />
          <Text style={styles.quoteAuthor}>ডা. প্রদ্যুৎ আচার্য</Text>
          <Text style={{ fontSize: 11, color: Colors.textSub, textAlign: 'center' }}>জ্যোতিষী ও হস্তরেখাবিদ, রাণাঘাট</Text>
        </View>

        {/* Consult CTA */}
        <TouchableOpacity style={styles.consultCard} onPress={openWhatsApp} activeOpacity={0.85}>
          <View style={styles.consultLeft}>
            <Text style={{ fontSize: 28 }}>🙏🏼</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.consultTitle}>ব্যক্তিগত পরামর্শ নিন</Text>
            <Text style={styles.consultSub}>WhatsApp-এ Dr. Acharya-র সাথে কথা বলুন</Text>
            <View style={styles.consultBadge}>
              <Text style={{ fontSize: 10, color: Colors.whatsapp }}>✓ বিনামূল্যে প্রাথমিক আলোচনা</Text>
            </View>
          </View>
          <Text style={{ fontSize: 22, color: Colors.whatsapp }}>→</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  headerWrap: {
    backgroundColor: Colors.headerGrad3,
    borderBottomWidth: 1, borderBottomColor: Colors.goldBorder,
    paddingBottom: 16, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', padding: 16,
  },
  om:       { fontSize: 18, marginBottom: 4 },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.goldLight, fontFamily: 'NotoSerifBengali' },
  bnDate:   { fontSize: 14, color: Colors.gold, marginTop: 3, fontFamily: 'NotoSerifBengali', fontWeight: '600' },
  date:     { fontSize: 11, color: Colors.textSub, marginTop: 2, fontFamily: 'NotoSerifBengali' },
  rashiBadgeWrap: { marginTop: 5 },
  rashiBadge:     { fontSize: 12, fontWeight: '700', fontFamily: 'NotoSerifBengali' },
  waBtn: {
    backgroundColor: Colors.whatsappBg,
    borderWidth: 1, borderColor: 'rgba(37,211,102,0.3)',
    borderRadius: 14, padding: 10, alignItems: 'center',
  },
  waBtnText: { fontSize: 10, color: Colors.whatsapp, marginTop: 2, fontFamily: 'NotoSerifBengali' },

  sectionTitle: {
    fontSize: 14, color: Colors.textSub,
    paddingHorizontal: 16, marginBottom: 8, marginTop: 12,
    fontFamily: 'NotoSerifBengali',
  },
  sectionTitle2: { fontSize: 17, fontWeight: '700', color: Colors.text, fontFamily: 'NotoSerifBengali' },

  grahaList:   { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  grahaItem:   { alignItems: 'center', gap: 4 },
  grahaCircle: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  grahaSymbol: { fontSize: 20 },
  grahaName:   { fontSize: 10, fontFamily: 'NotoSerifBengali' },

  panjikaCard: {
    margin: 16, borderRadius: 20,
    backgroundColor: 'rgba(201,168,76,0.05)',
    borderWidth: 1.5, borderColor: Colors.goldBorder,
    padding: 16,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  panjikaHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  panjikaTitle:    { fontSize: 17, fontWeight: '700', color: Colors.goldLight, fontFamily: 'NotoSerifBengali' },
  panjikaSubtitle: { fontSize: 11, color: Colors.textSub, fontFamily: 'NotoSerifBengali' },
  moreLink:        { fontSize: 12, color: Colors.gold, fontFamily: 'NotoSerifBengali' },
  panjikaHighlight: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  panjikaHItem: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12, alignItems: 'center',
  },
  panjikaHLabel: { fontSize: 11, color: Colors.textSub, fontFamily: 'NotoSerifBengali' },
  panjikaHValue: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 4, textAlign: 'center', fontFamily: 'NotoSerifBengali' },
  sunRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12, padding: 12, marginBottom: 10,
  },
  sunItem:    { flex: 1, flexDirection: 'row', alignItems: 'center' },
  sunLabel:   { fontSize: 11, color: Colors.textSub, fontFamily: 'NotoSerifBengali' },
  sunValue:   { fontSize: 14, color: Colors.text, fontWeight: '600', fontFamily: 'NotoSerifBengali' },
  sunDivider: { width: 1, height: 32, backgroundColor: Colors.goldBorder, marginHorizontal: 8 },
  rahuRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)',
    padding: 10,
  },
  rahuText:  { fontSize: 12, color: Colors.mars, fontWeight: '600', fontFamily: 'NotoSerifBengali' },
  amritText: { fontSize: 12, color: Colors.mercury, fontWeight: '600', fontFamily: 'NotoSerifBengali' },

  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10, marginBottom: 8,
  },
  quickCard: {
    width: (width - 48) / 2,
    backgroundColor: Colors.bgCard,
    borderRadius: 14, borderWidth: 1,
    padding: 14, alignItems: 'center', gap: 8,
  },
  quickIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'center', fontFamily: 'NotoSerifBengali' },

  rashiList: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  rashiCard: {
    width: 78, alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 16, borderWidth: 1,
    padding: 10, gap: 4,
  },
  rashiIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rashiName:     { fontSize: 12, fontWeight: '700', fontFamily: 'NotoSerifBengali' },
  rashiLord:     { fontSize: 9, color: Colors.textSub, fontFamily: 'NotoSerifBengali' },

  quoteCard: {
    margin: 16, borderRadius: 18,
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
    padding: 20, alignItems: 'center',
  },
  quoteOm:     { fontSize: 30, marginBottom: 10 },
  quoteText:   { fontSize: 15, color: Colors.text, lineHeight: 26, fontStyle: 'italic', textAlign: 'center', fontFamily: 'NotoSerifBengali' },
  quoteAuthor: { fontSize: 14, fontWeight: '700', color: Colors.gold, fontFamily: 'NotoSerifBengali' },

  consultCard: {
    margin: 16, borderRadius: 18,
    backgroundColor: Colors.whatsappBg,
    borderWidth: 1.5, borderColor: 'rgba(37,211,102,0.25)',
    padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12,
  },
  consultLeft: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(37,211,102,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  consultTitle:  { fontSize: 16, fontWeight: '700', color: Colors.whatsapp, fontFamily: 'NotoSerifBengali' },
  consultSub:    { fontSize: 12, color: Colors.textSub, marginTop: 2, fontFamily: 'NotoSerifBengali' },
  consultBadge: {
    marginTop: 6, backgroundColor: 'rgba(37,211,102,0.15)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
});
