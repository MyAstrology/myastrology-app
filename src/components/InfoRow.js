import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const ICON_MAP = {
  'তিথি': 'moon-waning-crescent',
  'নক্ষত্র': 'star-four-points',
  'যোগ': 'infinity',
  'সূর্যোদয়': 'weather-sunset-up',
  'সূর্যাস্ত': 'weather-sunset-down',
  'তারিখ': 'calendar-today',
};

export function InfoRow({ label, value, isLast }) {
  const icon = ICON_MAP[label] || 'circle-small';
  return (
    <View style={[styles.row, isLast && styles.lastRow]}>
      <View style={styles.left}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} style={styles.icon} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  lastRow: { borderBottomWidth: 0 },
  left: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  label: { fontSize: 14, color: colors.textSecondary, fontWeight: '500', letterSpacing: 0.3 },
  value: { fontSize: 16, color: colors.text, fontWeight: '700', letterSpacing: 0.2 },
});
