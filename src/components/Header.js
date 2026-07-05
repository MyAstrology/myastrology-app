import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export function Header() {
  return (
    <View style={styles.container}>
      <View style={styles.topLine} />
      <Text style={styles.brand}>MyAstrology</Text>
      <Text style={styles.tagline}>✦ আজকের পঞ্জিকা ✦</Text>
      <View style={styles.bottomLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.headerBg,
    paddingTop: spacing.xl + 8,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  topLine: {
    width: 60,
    height: 1.5,
    backgroundColor: colors.gold,
    marginBottom: spacing.md,
    opacity: 0.7,
  },
  brand: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 13,
    color: colors.goldLight,
    marginTop: spacing.xs,
    letterSpacing: 2,
    opacity: 0.85,
  },
  bottomLine: {
    width: 60,
    height: 1.5,
    backgroundColor: colors.gold,
    marginTop: spacing.md,
    opacity: 0.7,
  },
});
