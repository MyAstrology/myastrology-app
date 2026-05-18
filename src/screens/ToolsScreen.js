// src/screens/ToolsScreen.js — AstroSage-level সব টুলস
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../theme';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 3;

const SECTIONS = [
  {
    title: '🔮 কুণ্ডলী বিশ্লেষণ',
    items: [
      { icon: '🔯', label: 'জন্মকুষ্ঠি',    screen: 'Kundali',       color: Colors.saturn },
      { icon: '💑', label: 'কুষ্ঠি মিলন',   screen: 'MatchMaking',   color: Colors.venus },
      { icon: '📅', label: 'বর্ষফল',        screen: 'Varshaphala',   color: Colors.sun },
      { icon: '🪐', label: 'গ্রহ গোচর',     screen: 'Gochar',        color: Colors.rahu },
      { icon: '🌙', label: 'প্রশ্নকুণ্ডলী', screen: 'Prashna',       color: '#a78bfa' },
    ],
  },
  {
    title: '🗓️ পঞ্জিকা ও গণনা',
    items: [
      { icon: '🗓️', label: 'পঞ্জিকা',       screen: 'Panjika',       color: Colors.gold },
      { icon: '🔢', label: 'নিউমেরোলজি',   screen: 'Numerology',    color: Colors.mercury },
      { icon: '💎', label: 'রত্নপাথর',      screen: 'Gemstone',      color: '#06b6d4' },
      { icon: '🌟', label: 'রাশিফল',        screen: 'Rashifal',      color: Colors.gold },
    ],
  },
  {
    title: '🏠 বাস্তু ও হস্তরেখা',
    items: [
      { icon: '🏠', label: 'বাস্তুশাস্ত্র', screen: 'Vastu',         color: '#10b981' },
      { icon: '✋', label: 'হস্তরেখা',      screen: 'Palmistry',     color: '#f59e0b' },
      { icon: '📖', label: 'বৈদিক জ্যোতিষ', screen: 'VedicAstrology', color: '#8b5cf6' },
    ],
  },
];

function ToolCard({ item, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: item.color + '55' }]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={[styles.iconWrap, { backgroundColor: item.color + '22' }]}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <Text style={styles.label} numberOfLines={2}>{item.label}</Text>
    </TouchableOpacity>
  );
}

export default function ToolsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.heading}>🔮 জ্যোতিষ টুলস</Text>
      <Text style={styles.sub}>সব হিসাব এক জায়গায়</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {SECTIONS.map((sec, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <View style={styles.grid}>
              {sec.items.map((item, ii) => (
                <ToolCard
                  key={ii}
                  item={item}
                  onPress={() => navigation.navigate(item.screen)}
                />
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  heading: {
    fontSize: 22, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
  },
  sub: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
  },
  scroll: { paddingHorizontal: Spacing.md },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: 14, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.gold,
    paddingLeft: 10,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: CARD_W, alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14, borderWidth: 1,
    padding: 12, gap: 8,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  icon:  { fontSize: 26 },
  label: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    fontWeight: '600', color: Colors.text,
    textAlign: 'center', lineHeight: 16,
  },
});
