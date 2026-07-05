import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getKundali, HOUSE_GRID, RASHI_NAMES } from '../engine/kundali';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

let CITY_DB = [];
try { CITY_DB = require('../cities').CITY_DB || []; } catch (e) {}

const PLANET_COLOR = {
  'সূ': '#F59E0B', 'চ':  '#94A3B8', 'মঙ্': '#EF4444',
  'বু': '#10B981', 'বৃ':  '#8B5CF6', 'শু':  '#EC4899',
  'শ':  '#6B7280', 'রা': '#1C1810', 'কে': '#78716C',
};

function ChartCell({ house, houseMap, houseRashi, isLagna }) {
  if (house === 0) return <View style={styles.cellCenter} />;
  const rashiIdx = houseRashi[house];
  const rashiName = RASHI_NAMES[rashiIdx];
  const planets = houseMap[house] || [];
  return (
    <View style={[styles.cell, isLagna && styles.cellLagna]}>
      <Text style={styles.cellHouse}>{house}</Text>
      <Text style={styles.cellRashi} numberOfLines={1}>{rashiName}</Text>
      <View style={styles.cellPlanets}>
        {planets.map((p, i) => (
          <Text key={i} style={[styles.cellPlanet, { color: PLANET_COLOR[p] || colors.text }]}>{p}</Text>
        ))}
      </View>
    </View>
  );
}

function KundaliChart({ result }) {
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>● জন্মকুণ্ডলী ●</Text>
      <Text style={styles.lagnaInfo}>লগ্ন: {result.lagnaName}</Text>
      <View style={styles.grid}>
        {HOUSE_GRID.map((row, ri) => (
          <View key={ri} style={styles.gridRow}>
            {row.map((house, ci) => (
              <ChartCell
                key={ci}
                house={house}
                houseMap={result.houseMap}
                houseRashi={result.houseRashi}
                isLagna={house === 1}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function PlanetTable({ planets }) {
  return (
    <View style={styles.tableCard}>
      <Text style={styles.tableTitle}>● গ্রহ স্থান ●</Text>
      {planets.map((pl, i) => (
        <View key={i} style={[styles.tableRow, i < planets.length - 1 && styles.tableRowBorder]}>
          <Text style={[styles.tablePlanetShort, { color: PLANET_COLOR[pl.short] || colors.primary }]}>
            {pl.short}
          </Text>
          <Text style={styles.tablePlanetName}>{pl.name}</Text>
          <Text style={styles.tableRashi}>{pl.rashiName}</Text>
          <View style={styles.tableHouseBadge}>
            <Text style={styles.tableHouseText}>{pl.house}ম</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function KundaliScreen() {
  const [day, setDay]     = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear]   = useState('');
  const [hour, setHour]   = useState('');
  const [min, setMin]     = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [showCities, setShowCities] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const filteredCities = cityQuery.length > 1
    ? CITY_DB.filter(c =>
        c.bn?.includes(cityQuery) || c.n?.toLowerCase().includes(cityQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  function calculate() {
    setError('');
    const dd = day.padStart(2,'0'), mm = month.padStart(2,'0'), yy = year;
    const hh = hour.padStart(2,'0'), mn = min.padStart(2,'0');
    if (!yy || yy.length !== 4 || !dd || !mm) { setError('জন্মতারিখ সম্পূর্ণ করুন'); return; }
    if (!hh || !mn) { setError('জন্মসময় দিন'); return; }
    const dateStr = `${yy}-${mm}-${dd}`;
    const timeStr = `${hh}:${mn}`;
    try {
      const r = getKundali(dateStr, timeStr);
      setResult(r);
    } catch (e) {
      setError('গণনায় সমস্যা হয়েছে।');
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.topLine} />
        <Text style={styles.brand}>MyAstrology</Text>
        <Text style={styles.tagline}>✦ জন্মকুণ্ডলী ✦</Text>
        <View style={styles.bottomLine} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>জন্ম তথ্য</Text>

          {/* Date row */}
          <View style={styles.fieldLabel}>
            <MaterialCommunityIcons name="calendar" size={16} color={colors.primary} />
            <Text style={styles.fieldLabelText}>জন্মতারিখ</Text>
          </View>
          <View style={styles.dateRow}>
            <TextInput style={styles.dateInput} placeholder="দিন" placeholderTextColor={colors.textSecondary}
              value={day} onChangeText={setDay} keyboardType="numeric" maxLength={2} />
            <Text style={styles.dateSep}>/</Text>
            <TextInput style={styles.dateInput} placeholder="মাস" placeholderTextColor={colors.textSecondary}
              value={month} onChangeText={setMonth} keyboardType="numeric" maxLength={2} />
            <Text style={styles.dateSep}>/</Text>
            <TextInput style={[styles.dateInput, styles.yearInput]} placeholder="বছর" placeholderTextColor={colors.textSecondary}
              value={year} onChangeText={setYear} keyboardType="numeric" maxLength={4} />
          </View>

          {/* Time row */}
          <View style={styles.fieldLabel}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primary} />
            <Text style={styles.fieldLabelText}>জন্মসময় (২৪ ঘণ্টা)</Text>
          </View>
          <View style={styles.dateRow}>
            <TextInput style={styles.dateInput} placeholder="ঘণ্টা" placeholderTextColor={colors.textSecondary}
              value={hour} onChangeText={setHour} keyboardType="numeric" maxLength={2} />
            <Text style={styles.dateSep}>:</Text>
            <TextInput style={styles.dateInput} placeholder="মিনিট" placeholderTextColor={colors.textSecondary}
              value={min} onChangeText={setMin} keyboardType="numeric" maxLength={2} />
          </View>

          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.primary} />
            <TextInput
              style={styles.input}
              placeholder="জন্মস্থান (শহরের নাম)"
              placeholderTextColor={colors.textSecondary}
              value={cityQuery}
              onChangeText={t => { setCityQuery(t); setShowCities(true); }}
              onFocus={() => setShowCities(true)}
            />
          </View>

          {showCities && filteredCities.length > 0 && (
            <View style={styles.cityDropdown}>
              {filteredCities.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.cityItem}
                  onPress={() => { setCityQuery(c.bn || c.n); setShowCities(false); }}
                >
                  <Text style={styles.cityName}>{c.bn || c.n}</Text>
                  <Text style={styles.cityState}>{c.g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.calcBtn} onPress={calculate}>
            <MaterialCommunityIcons name="chart-donut-variant" size={18} color={colors.white} />
            <Text style={styles.calcBtnText}>কুণ্ডলী তৈরি করুন</Text>
          </TouchableOpacity>
        </View>

        {result && (
          <>
            <KundaliChart result={result} />
            <PlanetTable planets={result.planets} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.headerBg, paddingTop: 48, paddingBottom: 20, alignItems: 'center' },
  topLine:    { width: 60, height: 1.5, backgroundColor: colors.gold, marginBottom: 14, opacity: 0.7 },
  brand:      { fontSize: 26, fontWeight: '700', color: colors.gold, letterSpacing: 3, textTransform: 'uppercase' },
  tagline:    { fontSize: 13, color: colors.goldLight, marginTop: 4, letterSpacing: 2, opacity: 0.85 },
  bottomLine: { width: 60, height: 1.5, backgroundColor: colors.gold, marginTop: 14, opacity: 0.7 },
  container:  { flex: 1, backgroundColor: colors.background },
  content:    { padding: spacing.md, paddingBottom: 40 },

  formCard: {
    backgroundColor: colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: colors.cardBorder, padding: spacing.md, marginBottom: spacing.md,
  },
  formTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, marginBottom: 6 },
  fieldLabelText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.divider, paddingBottom: 10,
  },
  dateInput: {
    flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text,
    backgroundColor: colors.background, borderRadius: 8, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  yearInput: { flex: 2 },
  dateSep: { fontSize: 20, color: colors.textSecondary, fontWeight: '300' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderBottomWidth: 1, borderBottomColor: colors.divider, paddingVertical: 10, marginBottom: 4,
  },
  input: { flex: 1, fontSize: 14, color: colors.text },
  cityDropdown: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 8, marginTop: 4, overflow: 'hidden',
  },
  cityItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  cityName:  { fontSize: 14, color: colors.text, fontWeight: '600' },
  cityState: { fontSize: 12, color: colors.textSecondary },
  errorText: { color: '#EF4444', fontSize: 13, marginTop: 6, textAlign: 'center' },
  calcBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.headerBg, borderRadius: 12, paddingVertical: 14, marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.gold,
  },
  calcBtnText: { fontSize: 15, fontWeight: '700', color: colors.gold, letterSpacing: 1 },

  chartContainer: {
    backgroundColor: colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: colors.cardBorder, padding: 12, marginBottom: spacing.md,
  },
  chartTitle: { textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  lagnaInfo:  { textAlign: 'center', fontSize: 12, color: colors.textSecondary, marginBottom: 10 },
  grid:       { gap: 2 },
  gridRow:    { flexDirection: 'row', gap: 2 },
  cell: {
    flex: 1, minHeight: 72, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.divider, borderRadius: 4,
    padding: 4, alignItems: 'center', justifyContent: 'flex-start',
  },
  cellLagna: { borderColor: colors.gold, borderWidth: 2, backgroundColor: colors.goldLight },
  cellCenter: { flex: 1, minHeight: 72, backgroundColor: colors.card },
  cellHouse:   { fontSize: 9, color: colors.textSecondary, fontWeight: '600' },
  cellRashi:   { fontSize: 10, color: colors.text, fontWeight: '700', marginTop: 1 },
  cellPlanets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 1, marginTop: 2 },
  cellPlanet:  { fontSize: 10, fontWeight: '800' },

  tableCard: {
    backgroundColor: colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: colors.cardBorder, padding: spacing.md,
  },
  tableTitle:   { textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  tableRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  tablePlanetShort: { width: 24, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  tablePlanetName:  { flex: 1, fontSize: 14, color: colors.text },
  tableRashi:       { fontSize: 14, color: colors.text, fontWeight: '600', width: 70 },
  tableHouseBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    backgroundColor: colors.goldLight, borderWidth: 1, borderColor: colors.cardBorder,
  },
  tableHouseText: { fontSize: 12, color: colors.primaryDark, fontWeight: '700' },
});
