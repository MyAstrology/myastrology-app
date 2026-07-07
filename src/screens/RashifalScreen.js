import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { getTodayRashifal } from '../engine/rashifal';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

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
  'অতিশুভ':  { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
  'বিশেষ শুভ':{ bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },
  'শুভ':      { bg: '#FFF8E1', text: '#F57F17', border: '#FFE082' },
  'মিশ্র':    { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' },
  'সতর্কতা':  { bg: '#FCE4EC', text: '#B71C1C', border: '#F48FB1' },
};

function RashiGrid({ onSelect }) {
  return (
    <View style={styles.grid}>
      {data.rashifal.map((r) => {
        const tc = TAG_COLOR[r.tag] || TAG_COLOR['মিশ্র'];
        return (
          <TouchableOpacity
            key={r.rashiIndex}
            style={styles.gridCell}
            onPress={() => onSelect(r.rashiIndex)}
            activeOpacity={0.7}
          >
            <Image source={RASHI_IMAGES[r.rashiIndex]} style={styles.gridImg} resizeMode="contain" />
            <Text style={styles.gridName}>{r.rashi}</Text>
            <View style={[styles.gridTag, { backgroundColor: tc.bg, borderColor: tc.border }]}>
              <Text style={[styles.gridTagText, { color: tc.text }]}>{r.tag}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function RashifalScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.moonBar}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={16} color={colors.gold} />
          <Text style={styles.moonText}>আজ চন্দ্র <Text style={styles.moonRashi}>{data.moonRashiName}</Text> রাশিতে</Text>
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
    backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.cardBorder, alignSelf: 'center', marginBottom: spacing.md,
  },
  moonText:  { fontSize: 13, color: colors.textSecondary },
  moonRashi: { fontWeight: '700', color: colors.text },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md,
  },
  gridCell: {
    width: '30.5%', backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4,
  },
  gridImg:  { width: 38, height: 38, marginBottom: 4, opacity: 0.7 },
  gridName: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 },
  gridTag:  {
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, borderWidth: 1,
  },
  gridTagText: { fontSize: 9, fontWeight: '600' },
  hint: { alignItems: 'center', marginTop: 24, gap: 8, paddingHorizontal: 20 },
  hintText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});
