import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getKundali, HOUSE_GRID, RASHI_NAMES } from '../engine/kundali';
import { COLORS, SPACING, RADIUS } from '../theme';

let CITY_DB = [];
try { CITY_DB = require('../cities').CITY_DB || []; } catch (e) {}

const PLANET_COLOR = {
  'সূ': '#F59E0B', 'চ': '#94A3B8', 'মঙ্': '#EF4444',
  'বু': '#10B981', 'বৃ': '#8B5CF6', 'শু': '#EC4899',
  'শ':  '#6B7280', 'রা': '#374151', 'কে': '#78716C',
};

function ChartCell({ house, houseMap, houseRashi, isLagna }) {
  if (house === 0) return <View style={s.cellCenter} />;
  const rashiName = RASHI_NAMES[houseRashi[house]];
  const planets   = houseMap[house] || [];
  return (
    <View style={[s.cell, isLagna && s.cellLagna]}>
      <Text style={s.cellHouse}>{house}</Text>
      <Text style={s.cellRashi} numberOfLines={1}>{rashiName}</Text>
      {isLagna && <Text style={s.lagnaTag}>লগ্ন</Text>}
      <View style={s.cellPlanets}>
        {planets.map((p, i) => (
          <Text key={i} style={[s.cellPlanet, { color: PLANET_COLOR[p] || COLORS.charcoal }]}>{p}</Text>
        ))}
      </View>
    </View>
  );
}

function KundaliChart({ result }) {
  return (
    <View style={s.chartCard}>
      <Text style={s.chartTitle}>জন্মকুণ্ডলী</Text>

      <View style={s.panchangStrip}>
        <View style={s.chip}>
          <Ionicons name="calendar-outline" size={12} color={COLORS.gold} />
          <Text style={s.chipText}>{result.weekday}</Text>
        </View>
        <View style={s.chip}>
          <Ionicons name="moon-outline" size={12} color={COLORS.gold} />
          <Text style={s.chipText}>{result.paksha} · {result.tithi}</Text>
        </View>
        <View style={s.chip}>
          <Ionicons name="star-outline" size={12} color={COLORS.gold} />
          <Text style={s.chipText}>{result.nakshatra}</Text>
        </View>
      </View>

      <Text style={s.lagnaInfo}>লগ্ন: <Text style={s.lagnaName}>{result.lagnaName}</Text></Text>

      <View style={s.grid}>
        {HOUSE_GRID.map((row, ri) => (
          <View key={ri} style={s.gridRow}>
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
    <View style={s.tableCard}>
      <Text style={s.chartTitle}>গ্রহ স্থান</Text>
      {planets.map((pl, i) => (
        <View key={i} style={[s.tableRow, i < planets.length - 1 && s.tableRowBorder]}>
          <Text style={[s.tablePlanetShort, { color: PLANET_COLOR[pl.short] || COLORS.gold }]}>{pl.short}</Text>
          <Text style={s.tablePlanetName}>{pl.name}</Text>
          <Text style={s.tableRashi}>{pl.rashiName}</Text>
          <View style={s.tableHouseBadge}>
            <Text style={s.tableHouseText}>{pl.house}ম</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function KundaliScreen() {
  const [day,   setDay]   = useState('');
  const [month, setMonth] = useState('');
  const [year,  setYear]  = useState('');
  const [hour,  setHour]  = useState('');
  const [min,   setMin]   = useState('');
  const [cityQuery,    setCityQuery]    = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCities,   setShowCities]   = useState(false);
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState('');

  const filteredCities = cityQuery.length > 1
    ? CITY_DB.filter(c =>
        c.bn?.includes(cityQuery) || c.n?.toLowerCase().includes(cityQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  function calculate() {
    setError('');
    const dd = day.padStart(2, '0'), mm = month.padStart(2, '0'), yy = year;
    const hh = hour.padStart(2, '0'), mn = min.padStart(2, '0');
    if (!yy || yy.length !== 4 || !dd || !mm) { setError('জন্মতারিখ সম্পূর্ণ করুন'); return; }
    if (!hh || !mn) { setError('জন্মসময় দিন'); return; }
    try {
      const lat = selectedCity?.lat ?? 22.5726;
      const lon = selectedCity?.lng ?? 88.3639;
      const r = getKundali(`${yy}-${mm}-${dd}`, `${hh}:${mn}`, lat, lon);
      setResult(r);
    } catch (e) {
      setError('গণনায় সমস্যা হয়েছে।');
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <Text style={s.headerTitle}>কুণ্ডলী</Text>
        <View style={s.goldLine} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.formCard}>
          <Text style={s.formTitle}>জন্ম তথ্য প্রবেশ করুন</Text>

          <Text style={s.fieldLabel}>জন্মতারিখ</Text>
          <View style={s.dateRow}>
            <View style={s.dateBox}>
              <Text style={s.dateSubLabel}>দিন</Text>
              <TextInput style={s.dateInput} placeholder="১-৩১" placeholderTextColor={COLORS.subtleMuted}
                value={day} onChangeText={setDay} keyboardType="numeric" maxLength={2} />
            </View>
            <Text style={s.dateSep}>/</Text>
            <View style={s.dateBox}>
              <Text style={s.dateSubLabel}>মাস</Text>
              <TextInput style={s.dateInput} placeholder="১-১২" placeholderTextColor={COLORS.subtleMuted}
                value={month} onChangeText={setMonth} keyboardType="numeric" maxLength={2} />
            </View>
            <Text style={s.dateSep}>/</Text>
            <View style={[s.dateBox, { flex: 2 }]}>
              <Text style={s.dateSubLabel}>বছর</Text>
              <TextInput style={s.dateInput} placeholder="১৯৯০" placeholderTextColor={COLORS.subtleMuted}
                value={year} onChangeText={setYear} keyboardType="numeric" maxLength={4} />
            </View>
          </View>

          <Text style={s.fieldLabel}>জন্মসময় <Text style={s.fieldHint}>(২৪ ঘণ্টা)</Text></Text>
          <View style={s.timeRow}>
            <View style={s.dateBox}>
              <Text style={s.dateSubLabel}>ঘণ্টা</Text>
              <TextInput style={s.dateInput} placeholder="০-২৩" placeholderTextColor={COLORS.subtleMuted}
                value={hour} onChangeText={setHour} keyboardType="numeric" maxLength={2} />
            </View>
            <Text style={s.dateSep}>:</Text>
            <View style={s.dateBox}>
              <Text style={s.dateSubLabel}>মিনিট</Text>
              <TextInput style={s.dateInput} placeholder="০-৫৯" placeholderTextColor={COLORS.subtleMuted}
                value={min} onChangeText={setMin} keyboardType="numeric" maxLength={2} />
            </View>
          </View>

          <Text style={s.fieldLabel}>জন্মস্থান</Text>
          <TextInput
            style={s.cityInput}
            placeholder="শহরের নাম লিখুন…"
            placeholderTextColor={COLORS.subtleMuted}
            value={cityQuery}
            onChangeText={t => { setCityQuery(t); setShowCities(true); }}
            onFocus={() => setShowCities(true)}
          />
          {showCities && filteredCities.length > 0 && (
            <View style={s.cityDropdown}>
              {filteredCities.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.cityItem, i < filteredCities.length - 1 && s.cityItemBorder]}
                  onPress={() => { setCityQuery(c.bn || c.n); setSelectedCity(c); setShowCities(false); }}
                >
                  <Ionicons name="location-outline" size={14} color={COLORS.gold} />
                  <Text style={s.cityName}>{c.bn || c.n}</Text>
                  <Text style={s.cityState}>{c.g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={s.calcBtn} onPress={calculate} activeOpacity={0.8}>
            <Ionicons name="planet-outline" size={20} color={COLORS.white} />
            <Text style={s.calcBtnText}>কুণ্ডলী তৈরি করুন</Text>
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

const s = StyleSheet.create({
  header:      { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.lg, backgroundColor: COLORS.cream },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.charcoal, marginBottom: SPACING.sm },
  goldLine:    { height: 1, width: 40, backgroundColor: COLORS.gold, opacity: 0.5 },
  scroll:      { flex: 1, backgroundColor: COLORS.cream },
  content:     { padding: SPACING.lg, paddingBottom: 40 },

  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#1C1C2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  formTitle:  { fontSize: 15, fontWeight: '700', color: COLORS.charcoal, marginBottom: SPACING.lg, textAlign: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: SPACING.sm, marginTop: SPACING.sm },
  fieldHint:  { fontSize: 11, fontWeight: '400', color: COLORS.subtleMuted, textTransform: 'none', letterSpacing: 0 },

  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, marginBottom: SPACING.md },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, marginBottom: SPACING.md },
  dateBox: { flex: 1, alignItems: 'center' },
  dateSubLabel: { fontSize: 10, color: COLORS.subtleMuted, marginBottom: 4, fontWeight: '600' },
  dateInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.charcoal,
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateSep: { fontSize: 20, color: COLORS.muted, paddingBottom: 10 },

  cityInput: {
    fontSize: 14,
    color: COLORS.charcoal,
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  cityDropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  cityItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 10, gap: 8 },
  cityItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  cityName:       { flex: 1, fontSize: 14, color: COLORS.charcoal, fontWeight: '600' },
  cityState:      { fontSize: 12, color: COLORS.muted },

  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: RADIUS.sm, padding: 10, marginBottom: SPACING.sm, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { flex: 1, color: '#EF4444', fontSize: 13, fontWeight: '500' },

  calcBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.charcoal, borderRadius: RADIUS.md, paddingVertical: 15, marginTop: SPACING.md },
  calcBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.gold, letterSpacing: 0.5 },

  // Chart
  chartCard:    { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, elevation: 2, shadowColor: '#1C1C2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  chartTitle:   { textAlign: 'center', fontSize: 14, fontWeight: '700', color: COLORS.charcoal, marginBottom: SPACING.sm },
  panchangStrip: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.sm },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cream },
  chipText:     { fontSize: 11, fontWeight: '600', color: COLORS.charcoal },
  lagnaInfo:    { textAlign: 'center', fontSize: 13, color: COLORS.muted, marginBottom: SPACING.sm },
  lagnaName:    { fontSize: 14, fontWeight: '800', color: COLORS.goldDark },
  grid:         { gap: 2 },
  gridRow:      { flexDirection: 'row', gap: 2 },
  cell: {
    flex: 1, minHeight: 76,
    backgroundColor: COLORS.cream,
    borderWidth: 1, borderColor: COLORS.divider,
    borderRadius: 4, padding: 4,
    alignItems: 'center', justifyContent: 'flex-start',
  },
  cellLagna:   { borderColor: COLORS.gold, borderWidth: 2, backgroundColor: '#FEF9E7' },
  cellCenter:  { flex: 1, minHeight: 76, backgroundColor: COLORS.white },
  cellHouse:   { fontSize: 9, color: COLORS.subtleMuted, fontWeight: '600' },
  cellRashi:   { fontSize: 9, color: COLORS.charcoal, fontWeight: '700', marginTop: 1 },
  lagnaTag:    { fontSize: 8, color: COLORS.gold, fontWeight: '800', marginTop: 1 },
  cellPlanets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 1, marginTop: 2 },
  cellPlanet:  { fontSize: 10, fontWeight: '800' },

  // Planet table
  tableCard:        { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, elevation: 2, shadowColor: '#1C1C2E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  tableRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  tableRowBorder:   { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  tablePlanetShort: { width: 28, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  tablePlanetName:  { flex: 1, fontSize: 14, color: COLORS.charcoal },
  tableRashi:       { fontSize: 13, color: COLORS.charcoal, fontWeight: '600', width: 72 },
  tableHouseBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm, backgroundColor: COLORS.goldLight, borderWidth: 1, borderColor: COLORS.border },
  tableHouseText:   { fontSize: 12, color: COLORS.goldDark, fontWeight: '700' },
});
