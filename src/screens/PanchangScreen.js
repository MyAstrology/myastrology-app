import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Header } from '../components/Header';
import { PanchangaCard } from '../components/PanchangaCard';
import { getTodayPanchang } from '../engine/panjika';
import { colors } from '../theme/colors';

export function PanchangScreen() {
  let data;
  try { data = getTodayPanchang(); } catch (_) {
    data = { date: '', tithi: '—', nakshatra: '—', yoga: '—', sunrise: '—', sunset: '—' };
  }
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header />
      <PanchangaCard data={data} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
});
