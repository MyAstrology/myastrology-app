import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { InfoRow } from './InfoRow';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export function PanchangaCard({ data }) {
  const rows = [
    { label: 'তিথি', value: data.tithi },
    { label: 'নক্ষত্র', value: data.nakshatra },
    { label: 'যোগ', value: data.yoga },
    { label: 'সূর্যোদয়', value: data.sunrise },
    { label: 'সূর্যাস্ত', value: data.sunset },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.dateRow}>
        <MaterialCommunityIcons name="calendar-today" size={16} color={colors.primary} />
        <Text style={styles.date}> {data.date}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.goldDot} />
          <Text style={styles.cardTitle}>দৈনিক পঞ্জিকা</Text>
          <View style={styles.goldDot} />
        </View>

        {rows.map((row, i) => (
          <InfoRow key={row.label} label={row.label} value={row.value} isLast={i === rows.length - 1} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: spacing.md, marginTop: spacing.lg },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  date: { fontSize: 13, color: colors.textSecondary, letterSpacing: 0.5 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    elevation: 4,
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  cardTitle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
