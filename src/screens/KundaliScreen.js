import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
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
  'শ':  '#6B7280', 'রা': '#374151', 'কে': '#78716C',
};

const WEEKDAY_COLOR = ['#F59E0B','#C0C0C0','#EF4444','#10B981','#F59E0B','#FFFFFF','#6B7280'];

function InfoPill({ icon, label, value }) {
  return (
    <View style={styles.infoPill}>
      <MaterialCommunityIcons name={icon} size={14} color={colors.primary} />
      <Text style={styles.infoPillLabel}>{label}</Text>
      <Text style={styles.infoPillValue}>{value}</Text>
    </View>
  );
}

function ChartCell({ house, houseMap, houseRashi, isLagna }) {
  if (house === 0) return <View style={styles.cellCenter} />;
  const rashiIdx = houseRashi[house];
  const rashiName = RASHI_NAMES[rashiIdx];
  const planets = houseMap[house] || [];
  return (
    <View style={[styles.cell, isLagna && styles.cellLagna]}>
      <Text style={styles.cellHouse}>{house}</Text>
      <Text style={styles.cellRashi} numberOfLines={1}>{rashiName}</Text>
      {isLagna && <Text style={styles.lagnaTag}>লগ্ন</Text>}
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

      {/* Weekday + Panchang strip */}
      <View style={styles.panchangStrip}>
        <View style={[styles.barChip, { backgroundColor: colors.headerBg }]}>
          <MaterialCommunityIcons name="calendar-week" size={13} color={WEEKDAY_COLOR[result.weekdayNum] || colors.gold} />
          <Text style={[styles.barText, { color: WEEKDAY_COLOR[result.weekdayNum] || colors.gold }]}>
            {result.weekday}
          </Text>
        </View>
        <View style={styles.barChip}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={13} color={colors.primary} />
          <Text style={styles.barTextDark}>{result.paksha} {result.tithi}</Text>
        </View>
        <View style={styles.barChip}>
          <MaterialCommunityIcons name="star-four-points" size={13} color={colors.primary} />
          <Text style={styles.barTextDark}>{result.nakshatra}</Text>
        </View>
      </View>

      <View style={styles.lagnaRow}>
        <MaterialCommunityIcons name="zodiac-aries" size={16} color={colors.gold} />
        <Text style={styles.lagnaInfo}>লগ্ন: <Text style={styles.lagnaName}>{result.lagnaName}</Text></Text>
      </View>

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
  const [selectedCity, setSelectedCity] = useState(null);
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
    const lat = selectedCity?.lat ?? 22.5726;
    const lon = selectedCity?.lng ?? 88.3639;
    try {
      const r = getKundali(dateStr, timeStr, lat, lon);
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

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>জন্ম তথ্য প্রবেশ করুন</Text>

          {/* Date section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <MaterialCommunityIcons name="calendar" size={18} color={colors.gold} />
            </View>
            <Text style={styles.sectionLabel}>জন্মতারিখ</Text>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateInputWrap}>
              <Text style={styles.dateSubLabel}>দিন</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="১-৩১"
                placeholderTextColor={colors.textSecondary}
                value={day}
                onChangeText={setDay}
                keyboardType="numeric"
                maxLength={2}
                returnKeyType="next"
              />
            </View>
            <Text style={styles.dateSep}>/</Text>
            <View style={styles.dateInputWrap}>
              <Text style={styles.dateSubLabel}>মাস</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="১-১২"
                placeholderTextColor={colors.textSecondary}
                value={month}
                onChangeText={setMonth}
                keyboardType="numeric"
                maxLength={2}
                returnKeyType="next"
              />
            </View>
            <Text style={styles.dateSep}>/</Text>
            <View style={[styles.dateInputWrap, styles.yearWrap]}>
              <Text style={styles.dateSubLabel}>বছর</Text>
              <TextInput
                style={[styles.dateInput, styles.yearInput]}
                placeholder="যেমন: ১৯৯০"
                placeholderTextColor={colors.textSecondary}
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
                maxLength={4}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Time section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={18} color={colors.gold} />
            </View>
            <Text style={styles.sectionLabel}>জন্মসময় <Text style={styles.sectionHint}>(২৪ ঘণ্টা)</Text></Text>
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeInputWrap}>
              <Text style={styles.dateSubLabel}>ঘণ্টা (০-২৩)</Text>
              <TextInput
                style={styles.timeInput}
                placeholder="যেমন: ২৩"
                placeholderTextColor={colors.textSecondary}
                value={hour}
                onChangeText={setHour}
                keyboardType="numeric"
                maxLength={2}
                returnKeyType="next"
              />
            </View>
            <Text style={styles.timeSep}>:</Text>
            <View style={styles.timeInputWrap}>
              <Text style={styles.dateSubLabel}>মিনিট (০-৫৯)</Text>
              <TextInput
                style={styles.timeInput}
                placeholder="যেমন: ৩০"
                placeholderTextColor={colors.textSecondary}
                value={min}
                onChangeText={setMin}
                keyboardType="numeric"
                maxLength={2}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* City section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.gold} />
            </View>
            <Text style={styles.sectionLabel}>জন্মস্থান</Text>
          </View>

          <TextInput
            style={styles.cityInput}
            placeholder="শহরের নাম লিখুন…"
            placeholderTextColor={colors.textSecondary}
            value={cityQuery}
            onChangeText={t => { setCityQuery(t); setShowCities(true); }}
            onFocus={() => setShowCities(true)}
          />

          {showCities && filteredCities.length > 0 && (
            <View style={styles.cityDropdown}>
              {filteredCities.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.cityItem, i < filteredCities.length - 1 && styles.cityItemBorder]}
                  onPress={() => {
                    setCityQuery(c.bn || c.n);
                    setSelectedCity(c);
                    setShowCities(false);
                  }}
                >
                  <MaterialCommunityIcons name="map-marker" size={14} color={colors.primary} />
                  <Text style={styles.cityName}>{c.bn || c.n}</Text>
                  <Text style={styles.cityState}>{c.g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.calcBtn} onPress={calculate} activeOpacity={0.8}>
            <MaterialCommunityIcons name="chart-donut-variant" size={20} color={colors.gold} />
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
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    marginBottom: spacing.md,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  sectionHint:  { fontSize: 12, fontWeight: '400', color: colors.textSecondary },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dateInputWrap: { flex: 1, alignItems: 'center' },
  yearWrap:      { flex: 2 },
  dateSubLabel:  { fontSize: 10, color: colors.textSecondary, marginBottom: 5, fontWeight: '600' },
  dateInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  yearInput: { fontSize: 18 },
  dateSep:  { fontSize: 22, color: colors.textSecondary, fontWeight: '300', paddingBottom: 10 },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  timeInputWrap: { flex: 1, alignItems: 'center' },
  timeInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  timeSep: { fontSize: 26, color: colors.primary, fontWeight: '700', paddingBottom: 10 },

  cityInput: {
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    marginBottom: 8,
  },
  cityDropdown: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  cityItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  cityName:  { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600' },
  cityState: { fontSize: 12, color: colors.textSecondary },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { flex: 1, color: '#EF4444', fontSize: 13, fontWeight: '500' },

  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.headerBg,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 18,
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  calcBtnText: { fontSize: 16, fontWeight: '700', color: colors.gold, letterSpacing: 1 },

  // Chart
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: spacing.md,
  },
  chartTitle: { textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 10 },

  panchangStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  barChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.background,
  },
  barText:     { fontSize: 11, fontWeight: '700' },
  barTextDark: { fontSize: 11, fontWeight: '600', color: colors.text },

  lagnaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  lagnaInfo: { textAlign: 'center', fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  lagnaName: { fontSize: 14, fontWeight: '800', color: colors.primaryDark },

  grid:    { gap: 2 },
  gridRow: { flexDirection: 'row', gap: 2 },
  cell: {
    flex: 1,
    minHeight: 76,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 4,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cellLagna: {
    borderColor: colors.gold,
    borderWidth: 2,
    backgroundColor: '#FEF9E7',
  },
  cellCenter: { flex: 1, minHeight: 76, backgroundColor: colors.card },
  cellHouse:  { fontSize: 9, color: colors.textSecondary, fontWeight: '600' },
  cellRashi:  { fontSize: 9, color: colors.text, fontWeight: '700', marginTop: 1 },
  lagnaTag:   { fontSize: 8, color: colors.gold, fontWeight: '800', marginTop: 1 },
  cellPlanets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 1,
    marginTop: 2,
  },
  cellPlanet: { fontSize: 10, fontWeight: '800' },

  // Planet table
  tableCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  tableTitle:       { textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  tableRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  tableRowBorder:   { borderBottomWidth: 1, borderBottomColor: colors.divider },
  tablePlanetShort: { width: 28, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  tablePlanetName:  { flex: 1, fontSize: 14, color: colors.text },
  tableRashi:       { fontSize: 13, color: colors.text, fontWeight: '600', width: 72 },
  tableHouseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.goldLight,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tableHouseText: { fontSize: 12, color: colors.primaryDark, fontWeight: '700' },
});
