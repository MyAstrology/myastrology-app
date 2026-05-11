// src/components/LuckyWidget.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Rashis } from '../theme';
import { useUser, RashiLucky } from '../context/UserContext';

function getDailyLuckyNumber(base) {
  const d = new Date();
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return ((base + dayOfYear - 1) % 9) + 1;
}

export default function LuckyWidget({ onPress }) {
  const { user } = useUser();

  if (!user || (user.rashiIndex === undefined && user.rashiIndex !== 0)) return null;

  const rashi = Rashis[user.rashiIndex];
  const lucky = RashiLucky[user.rashiIndex];
  const luckyNum = getDailyLuckyNumber(lucky.number);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 22 }}>🍀</Text>
          <View>
            <Text style={styles.title}>আজকের ভাগ্য</Text>
            <Text style={styles.rashiLabel}>{rashi.symbol} {rashi.name} রাশি</Text>
          </View>
        </View>
        <Text style={styles.moreLink}>বিস্তারিত →</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.item}>
          <View style={[styles.colorDot, { backgroundColor: lucky.color }]} />
          <Text style={styles.itemLabel}>শুভ রং</Text>
          <Text style={styles.itemValue}>{lucky.colorName}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.item}>
          <Text style={[styles.itemBig, { color: rashi.color }]}>{luckyNum}</Text>
          <Text style={styles.itemLabel}>শুভ সংখ্যা</Text>
          <Text style={styles.itemValue}>আজকের</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.item}>
          <Text style={{ fontSize: 20 }}>💎</Text>
          <Text style={styles.itemLabel}>রত্নপাথর</Text>
          <Text style={styles.itemValue}>{lucky.gem}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.item}>
          <Text style={{ fontSize: 20 }}>🧭</Text>
          <Text style={styles.itemLabel}>শুভ দিক</Text>
          <Text style={styles.itemValue}>{lucky.dir}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginBottom: 4, borderRadius: 20,
    backgroundColor: 'rgba(201,146,42,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(201,146,42,0.3)',
    padding: 16,
    shadowColor: '#c9922a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#e8bc5a' },
  rashiLabel: { fontSize: 11, color: '#8899aa', marginTop: 2 },
  moreLink: { fontSize: 12, color: '#c9922a' },
  grid: { flexDirection: 'row', alignItems: 'center' },
  item: { flex: 1, alignItems: 'center', gap: 5 },
  divider: { width: 1, height: 44, backgroundColor: 'rgba(201,146,42,0.25)' },
  colorDot: { width: 22, height: 22, borderRadius: 11 },
  itemBig: { fontSize: 24, fontWeight: '700' },
  itemLabel: { fontSize: 9, color: '#8899aa' },
  itemValue: { fontSize: 11, color: '#e8dcc8', fontWeight: '600', textAlign: 'center' },
});
