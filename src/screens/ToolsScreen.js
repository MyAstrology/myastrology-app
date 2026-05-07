
// src/screens/ToolsScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../theme';

const TOOLS = [
  {
    icon: '🔯', title: 'জন্মকুষ্ঠি', subtitle: 'VSOP87 নির্ভুল গণনা',
    desc: 'লগ্ন, রাশি, নক্ষত্র, দশা ও সম্পূর্ণ ফলাদেশ',
    screen: 'Kundali', color: '#c9a84c',
  },
  {
    icon: '💑', title: 'কুষ্ঠি মিলন', subtitle: 'অষ্টকূট পদ্ধতি',
    desc: '৩৬ গুণ বিচার, মাঙ্গলিক দোষ নির্ণয়',
    screen: 'MatchMaking', color: '#ec4899',
  },
  {
    icon: '🔢', title: 'সংখ্যা জ্যোতিষ', subtitle: 'নিউমেরোলজি',
    desc: 'নাম ও জন্মতারিখ অনুযায়ী ভাগ্য বিচার',
    screen: 'Numerology', color: '#8b5cf6',
  },
  {
    icon: '📅', title: 'বাংলা পঞ্জিকা', subtitle: 'দৈনিক তিথি-নক্ষত্র',
    desc: 'রাহুকাল, শুভমুহূর্ত, যোগ ও করণ',
    screen: 'Panjika', color: '#06b6d4',
  },
];

export default function ToolsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>🔮 জ্যোতিষ টুলস</Text>
      <Text style={styles.subtitle}>বিনামূল্যে · বৈজ্ঞানিক পদ্ধতি · বাংলায়</Text>

      <View style={styles.grid}>
        {TOOLS.map((tool, i) => (
          <TouchableOpacity key={i} style={styles.toolCard}
            onPress={() => navigation.navigate(tool.screen)}
          >
            <View style={[styles.toolIconWrap, { backgroundColor: tool.color + '22' }]}>
              <Text style={styles.toolIcon}>{tool.icon}</Text>
            </View>
            <Text style={styles.toolTitle}>{tool.title}</Text>
            <Text style={styles.toolSubtitle}>{tool.subtitle}</Text>
            <Text style={styles.toolDesc}>{tool.desc}</Text>
            <View style={[styles.toolBtn, { backgroundColor: tool.color + '33' }]}>
              <Text style={[styles.toolBtnText, { color: tool.color }]}>
                শুরু করুন →
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  title: {
    fontSize: 22, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight,
    padding: Spacing.md, paddingBottom: 4,
  },
  subtitle: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  grid: {
    paddingHorizontal: Spacing.md, gap: Spacing.md,
  },
  toolCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.goldBorder,
  },
  toolIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  toolIcon: { fontSize: 28 },
  toolTitle: {
    fontSize: 18, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.textPrimary,
  },
  toolSubtitle: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.gold, marginTop: 2, marginBottom: Spacing.sm,
  },
  toolDesc: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  toolBtn: {
    borderRadius: 20, padding: Spacing.sm,
    alignItems: 'center',
  },
  toolBtnText: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    fontWeight: '700',
  },
});
