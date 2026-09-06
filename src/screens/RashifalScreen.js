import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
/* Text এখানে react-native-এর নয় — ভাষা-সচেতন মোড়ক (src/i18n/Text.js)।
   import লাইনটাই একমাত্র বদল, তাই এই ফাইলের সব লেখা (ভবিষ্যতেরগুলোও)
   পাঠকের ভাষায় যায়; অনুবাদ না থাকলে বাংলাটাই থাকে। */
import { Text } from '../i18n/Text';
import { useLanguage } from '../context/LanguageContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { getTodayRashifal } from '../engine/rashifal';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { shadows } from '../theme/shadows';
import { typography } from '../theme/typography';
import { haptics } from '../utils/haptics';

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

let data;
try { data = getTodayRashifal(); } catch (_) {
  data = { date: '', moonRashi: 0, moonRashiName: '—', rashifal: [] };
}

const TAG_COLOR = {
  'অতিশুভ':  { bg: colors.goodWash, text: colors.good, border: '#A5D6A7' },
  'বিশেষ শুভ':{ bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },
  'শুভ':      { bg: '#FFF8E1', text: '#F57F17', border: '#FFE082' },
  'মিশ্র':    { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' },
  'সতর্কতা':  { bg: colors.dangerWash, text: colors.danger, border: '#F48FB1' },
};

function RashiGrid({ onSelect }) {
  return (
    <View style={styles.grid}>
      {data.rashifal.map((r) => {
        const tc = TAG_COLOR[r.tag] || TAG_COLOR['মিশ্র'];
        return (
          <Pressable
            key={r.rashiIndex}
            style={({ pressed }) => [styles.gridCell, pressed && styles.gridCellPressed]}
            onPress={() => { haptics.tap(); onSelect(r.rashiIndex); }}
          >
            <Image source={RASHI_IMAGES[r.rashiIndex]} style={styles.gridImg} resizeMode="contain" />
            <Text style={styles.gridName}>{r.rashi}</Text>
            <View style={[styles.gridTag, { backgroundColor: tc.bg, borderColor: tc.border }]}>
              <Text style={[styles.gridTagText, { color: tc.text }]}>{r.tag}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function RashifalScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.moonBar}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={16} color={colors.gold} />
          {/* ⚠️ বাক্যটা আগে তিন টুকরোয় ভাঙা ছিল — ইংরেজি/হিন্দিতে
              শব্দক্রম আলাদা, তাই টুকরো অনুবাদ করলে অর্থ ভেঙে যেত — ওয়েবসাইটে
              data-lang-hide দিয়ে যে সমস্যাটা সারানো হয়েছিল, এটা তারই নেটিভ রূপ।
              এখন গোটা বাক্যটাই একটা চাবি। */}
          <Text style={styles.moonText}>
            {t('আজ চন্দ্র {rashi} রাশিতে').split('{rashi}').map((part, idx) => (
              idx === 0 ? part : [
                <Text key={'r' + idx} style={styles.moonRashi}>{t(data.moonRashiName)}</Text>,
                part,
              ]
            ))}
          </Text>
        </View>

        <RashiGrid onSelect={(rashiIndex) => navigation.navigate('RashifalDetail', { rashiIndex })} />

        <View style={styles.hint}>
          <MaterialCommunityIcons name="gesture-tap" size={20} color={colors.textSecondary} />
          <Text style={styles.hintText}>বিস্তারিত আজকের ও সাপ্তাহিক রাশিফল দেখতে রাশি বেছে নিন</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:    { padding: spacing.md, paddingBottom: 40 },
  moonBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.card, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.cardBorder, alignSelf: 'center', marginBottom: spacing.md,
    ...shadows.card,
  },
  moonText:  { ...typography.body, fontSize: 13, color: colors.textSecondary },
  moonRashi: { ...typography.value, fontSize: 13 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md,
  },
  gridCell: {
    width: '30.5%', backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4,
    ...shadows.card,
  },
  gridCellPressed: {
    backgroundColor: colors.goldWash, borderColor: colors.goldBorder, transform: [{ scale: 0.96 }],
  },
  gridImg:  { width: 38, height: 38, marginBottom: 4, opacity: 0.7 },
  gridName: { ...typography.value, fontSize: 13, marginBottom: 4 },
  gridTag:  {
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: radii.sm, borderWidth: 1,
  },
  gridTagText: { ...typography.caption, fontSize: 9, fontWeight: '600' },
  hint: { alignItems: 'center', marginTop: 24, gap: 8, paddingHorizontal: 20 },
  hintText: { ...typography.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});
