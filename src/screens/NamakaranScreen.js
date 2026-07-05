import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export function NamakaranScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topLine} />
        <Text style={styles.brand}>MyAstrology</Text>
        <Text style={styles.tagline}>✦ নামকরণ ✦</Text>
        <View style={styles.bottomLine} />
      </View>
      <View style={styles.body}>
        <MaterialCommunityIcons name="baby-face-outline" size={72} color={colors.primary} />
        <Text style={styles.title}>নামকরণ</Text>
        <Text style={styles.sub}>জন্মনক্ষত্র অনুযায়ী শিশুর{'\n'}শুভ নামের প্রথম অক্ষর</Text>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={colors.gold} />
          <Text style={styles.badgeText}>শীঘ্রই আসছে</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.headerBg,
    paddingTop: 48,
    paddingBottom: 24,
    alignItems: 'center',
  },
  topLine: { width: 60, height: 1.5, backgroundColor: colors.gold, marginBottom: 16, opacity: 0.7 },
  brand: { fontSize: 28, fontWeight: '700', color: colors.gold, letterSpacing: 3, textTransform: 'uppercase' },
  tagline: { fontSize: 13, color: colors.goldLight, marginTop: 4, letterSpacing: 2, opacity: 0.85 },
  bottomLine: { width: 60, height: 1.5, backgroundColor: colors.gold, marginTop: 16, opacity: 0.7 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginTop: 20, letterSpacing: 1 },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  badgeText: { fontSize: 14, color: colors.gold, fontWeight: '600' },
});
