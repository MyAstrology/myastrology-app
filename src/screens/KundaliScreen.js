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
try { CITY_DB = require('../cities').CITY_DB || []; } catch (_) {}

const PLANET_COLOR = {
  'সূ':'#F59E0B','চ':'#94A3B8','মঙ্':'#EF4444','বু':'#10B981',
  'বৃ':'#8B5CF6','শু':'#EC4899','শ':'#6B7280','রা':'#1C1810','কে':'#78716C',
};

// ── চার্ট সেল ───────────────────────────────────────────────
function ChartCell({ house, houseMap, houseRashi, isLagna }) {
  if (house === 0) return <View style={s.cellCenter} />;
  const rashiIdx = houseRashi[house];
  const planets  = houseMap[house] || [];
  return (
    <View style={[s.cell, isLagna && s.cellLagna]}>
      <Text style={s.cellHouse}>{house}</Text>
      <Text style={s.cellRashi} numberOfLines={1}>{RASHI_NAMES[rashiIdx]}</Text>
      <View style={s.cellPlanets}>
        {planets.map((p, i) => (
          <Text key={i} style={[s.cellPlanet, { color: PLANET_COLOR[p] || colors.text }]}>{p}</Text>
        ))}
      </View>
    </View>
  );
}

function KundaliGrid({ result, d9 }) {
  const houseMap   = d9 ? result.houseMapD9   : result.houseMap;
  const houseRashi = d9 ? result.houseRashiD9 : result.houseRashi;
  const lagnaRashi = d9 ? result.lagnaD9      : result.lagnaRashi;
  const lagnaLabel = d9 ? result.lagnaD9Name  : result.lagnaName;
  const title      = d9 ? 'নবাংশ (D9)' : 'জন্মকুণ্ডলী (D1)';

  return (
    <View style={s.chartWrap}>
      <Text style={s.chartTitle}>{title}</Text>
      <Text style={s.chartLagna}>লগ্ন: {lagnaLabel}</Text>
      <View style={s.grid}>
        {HOUSE_GRID.map((row, ri) => (
          <View key={ri} style={s.gridRow}>
            {row.map((house, ci) => (
              <ChartCell
                key={ci} house={house}
                houseMap={houseMap} houseRashi={houseRashi}
                isLagna={house === 1}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// ── ট্যাব বাটন ──────────────────────────────────────────────
const TABS = ['চার্ট','গ্রহ','পঞ্চাঙ্গ','দশা','দোষ'];

function TabBar({ active, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={s.tabBar} contentContainerStyle={s.tabBarContent}>
      {TABS.map(t => (
        <TouchableOpacity key={t} style={[s.tab, active===t && s.tabActive]} onPress={() => onSelect(t)}>
          <Text style={[s.tabTxt, active===t && s.tabTxtActive]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── গ্রহ সারণী ───────────────────────────────────────────────
function PlanetTable({ planets }) {
  return (
    <View style={s.card}>
      <Text style={s.sectionTitle}>গ্রহ সারণী</Text>
      <View style={s.tableHead}>
        {['গ্রহ','রাশি','নক্ষত্র/পদ','ভাব','D9'].map((h, i) => (
          <Text key={i} style={[s.th, i===0&&{ flex:1.2 }, i===2&&{ flex:2 }]}>{h}</Text>
        ))}
      </View>
      {planets.map((pl, i) => (
        <View key={i} style={[s.tableRow, i < planets.length-1 && { borderBottomWidth:1, borderBottomColor: colors.divider }]}>
          <Text style={[s.td, { flex:1.2, color: PLANET_COLOR[pl.short]||colors.primary, fontWeight:'800' }]}>{pl.name}</Text>
          <Text style={[s.td, { fontWeight:'700' }]}>{pl.rashiName}</Text>
          <Text style={[s.td, { flex:2 }]}>{pl.nakName} ({pl.padaName})</Text>
          <Text style={s.td}>{pl.house}ম</Text>
          <Text style={[s.td, { color: colors.primary }]}>{pl.d9RashiName}</Text>
        </View>
      ))}
    </View>
  );
}

// ── জন্মকালীন পঞ্চাঙ্গ ──────────────────────────────────────
function BirthPanchang({ result }) {
  const rows = [
    { icon:'calendar-star',       label:'বার',       value: result.weekday },
    { icon:'moon-waning-crescent',label:'তিথি',      value: result.tithi + ' (' + result.paksha + ')' },
    { icon:'star-four-points',    label:'নক্ষত্র',   value: result.nakshatra + ' (' + result.padaName + ' পদ)' },
    { icon:'infinity',            label:'যোগ',       value: result.yoga },
    { icon:'yin-yang',            label:'করণ',       value: result.karana },
    { icon:'zodiac-aquarius',     label:'জন্ম রাশি', value: result.janmaRashi },
    { icon:'home-variant',        label:'লগ্ন',      value: result.lagnaName },
    { icon:'home-search',         label:'D9 লগ্ন',   value: result.lagnaD9Name },
    { icon:'rotate-right',        label:'অয়নাংশ',   value: result.ayanamsa },
    { icon:'weather-sunset-up',   label:'সূর্যোদয়', value: result.sunrise },
    { icon:'weather-sunset-down', label:'সূর্যাস্ত', value: result.sunset  },
  ];
  return (
    <View style={s.card}>
      <Text style={s.sectionTitle}>জন্মকালীন পঞ্চাঙ্গ</Text>
      {rows.map((r, i) => (
        <View key={i}>
          <View style={s.infoRow}>
            <MaterialCommunityIcons name={r.icon} size={16} color={colors.primary} style={{ width:22 }} />
            <Text style={s.infoLabel}>{r.label}</Text>
            <Text style={s.infoValue}>{r.value}</Text>
          </View>
          {i < rows.length-1 && <View style={{ height:1, backgroundColor: colors.divider }} />}
        </View>
      ))}
    </View>
  );
}

// ── বিংশোত্তরী দশা ──────────────────────────────────────────
function DashaList({ dashas }) {
  const today = new Date();
  return (
    <View style={s.card}>
      <Text style={s.sectionTitle}>বিংশোত্তরী দশা</Text>
      {dashas.map((d, i) => {
        const [sd, sm, sy] = d.start.split('/').map(Number);
        const [ed, em, ey] = d.end.split('/').map(Number);
        const startDate = new Date(sy, sm-1, sd);
        const endDate   = new Date(ey, em-1, ed);
        const isActive  = today >= startDate && today <= endDate;
        return (
          <View key={i} style={[s.dashaRow, isActive && s.dashaRowActive,
            i < dashas.length-1 && { borderBottomWidth:1, borderBottomColor: colors.divider }]}>
            <View style={[s.dashaIcon, { backgroundColor: isActive ? colors.gold : colors.cardBorder }]}>
              <Text style={[s.dashaIconTxt, { color: isActive ? colors.headerBg : colors.textSecondary }]}>
                {d.short}
              </Text>
            </View>
            <View style={s.dashaInfo}>
              <Text style={[s.dashaName, isActive && { color: colors.gold }]}>
                {d.planet} মহাদশা{isActive ? ' (চলতি)' : ''}
              </Text>
              <Text style={s.dashaDate}>{d.start} → {d.end}</Text>
            </View>
            <Text style={[s.dashaYears, isActive && { color: colors.gold }]}>
              {d.years} বছর
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── দোষ বিচার ────────────────────────────────────────────────
function DoshaTab({ result }) {
  const { mangalik, kalaSarpa } = result;
  return (
    <>
      <View style={s.card}>
        <Text style={s.sectionTitle}>মাঙ্গলিক দোষ</Text>
        <View style={[s.doshaBox, { backgroundColor: mangalik.isMangalik ? '#FEF2F2' : '#F0FDF4',
          borderColor: mangalik.isMangalik ? '#FECACA' : '#BBF7D0' }]}>
          <MaterialCommunityIcons
            name={mangalik.isMangalik ? 'alert-circle' : 'check-circle'}
            size={24}
            color={mangalik.isMangalik ? '#DC2626' : '#16A34A'}
          />
          <Text style={[s.doshaTitle, { color: mangalik.isMangalik ? '#DC2626' : '#16A34A' }]}>
            {mangalik.isMangalik ? 'মাঙ্গলিক দোষ আছে' : 'মাঙ্গলিক দোষ নেই'}
          </Text>
        </View>
        {mangalik.house > 0 && (
          <Text style={s.doshaDesc}>
            মঙ্গল {mangalik.house}ম ভাবে অবস্থিত
            {mangalik.isMangalik ? ' — মাঙ্গলিক।' : ' — মাঙ্গলিক নয়।'}
          </Text>
        )}
      </View>

      <View style={s.card}>
        <Text style={s.sectionTitle}>কালসর্প যোগ</Text>
        <View style={[s.doshaBox, { backgroundColor: kalaSarpa.hasYoga ? '#FFF7ED' : '#F0FDF4',
          borderColor: kalaSarpa.hasYoga ? '#FED7AA' : '#BBF7D0' }]}>
          <MaterialCommunityIcons
            name={kalaSarpa.hasYoga ? 'alert-circle-outline' : 'check-circle'}
            size={24}
            color={kalaSarpa.hasYoga ? '#EA580C' : '#16A34A'}
          />
          <Text style={[s.doshaTitle, { color: kalaSarpa.hasYoga ? '#EA580C' : '#16A34A' }]}>
            {kalaSarpa.hasYoga ? `${kalaSarpa.type || 'কালসর্প'} যোগ আছে` : 'কালসর্প যোগ নেই'}
          </Text>
        </View>
        {kalaSarpa.hasYoga && (
          <Text style={s.doshaDesc}>
            সমস্ত গ্রহ রাহু-কেতু অক্ষের একদিকে অবস্থিত
          </Text>
        )}
      </View>
    </>
  );
}

// ── মূল স্ক্রিন ──────────────────────────────────────────────
export function KundaliScreen() {
  const [day, setDay]     = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear]   = useState('');
  const [hour, setHour]   = useState('');
  const [min, setMin]     = useState('');
  const [cityQ, setCityQ] = useState('');
  const [showCity, setShowCity] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');
  const [activeTab, setActiveTab] = useState('চার্ট');

  const filteredCities = cityQ.length > 1
    ? CITY_DB.filter(c => c.bn?.includes(cityQ) || c.n?.toLowerCase().includes(cityQ.toLowerCase())).slice(0,6)
    : [];

  function calculate() {
    setError('');
    const dd = day.padStart(2,'0'), mm = month.padStart(2,'0'), yy = year;
    const hh = hour.padStart(2,'0'), mn = min.padStart(2,'0');
    if (!yy || yy.length !== 4 || !dd || !mm) { setError('জন্মতারিখ সম্পূর্ণ করুন'); return; }
    if (!hh || !mn) { setError('জন্মসময় দিন'); return; }
    try {
      const r = getKundali(`${yy}-${mm}-${dd}`, `${hh}:${mn}`);
      setResult(r);
      setActiveTab('চার্ট');
    } catch (_) {
      setError('গণনায় সমস্যা হয়েছে।');
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <View style={s.hLine} />
        <Text style={s.brand}>MYASTROLOGY</Text>
        <Text style={s.tagline}>জন্মকুণ্ডলী</Text>
        <View style={s.hLine} />
      </View>

      {result && <TabBar active={activeTab} onSelect={setActiveTab} />}

      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Form */}
        <View style={s.formCard}>
          <Text style={s.formTitle}>জন্ম তথ্য</Text>

          <View style={s.fieldLabel}>
            <MaterialCommunityIcons name="calendar" size={15} color={colors.primary} />
            <Text style={s.fieldLabelTxt}>জন্মতারিখ</Text>
          </View>
          <View style={s.dateRow}>
            <TextInput style={s.dIn} placeholder="দিন" placeholderTextColor={colors.textSecondary}
              keyboardType="numeric" maxLength={2} value={day} onChangeText={setDay} />
            <Text style={s.sep}>/</Text>
            <TextInput style={s.dIn} placeholder="মাস" placeholderTextColor={colors.textSecondary}
              keyboardType="numeric" maxLength={2} value={month} onChangeText={setMonth} />
            <Text style={s.sep}>/</Text>
            <TextInput style={[s.dIn, { flex:2 }]} placeholder="বছর" placeholderTextColor={colors.textSecondary}
              keyboardType="numeric" maxLength={4} value={year} onChangeText={setYear} />
          </View>

          <View style={s.fieldLabel}>
            <MaterialCommunityIcons name="clock-outline" size={15} color={colors.primary} />
            <Text style={s.fieldLabelTxt}>জন্মসময় (২৪ ঘণ্টা)</Text>
          </View>
          <View style={s.dateRow}>
            <TextInput style={s.dIn} placeholder="ঘণ্টা" placeholderTextColor={colors.textSecondary}
              keyboardType="numeric" maxLength={2} value={hour} onChangeText={setHour} />
            <Text style={s.sep}>:</Text>
            <TextInput style={s.dIn} placeholder="মিনিট" placeholderTextColor={colors.textSecondary}
              keyboardType="numeric" maxLength={2} value={min} onChangeText={setMin} />
          </View>

          <View style={s.cityRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={17} color={colors.primary} />
            <TextInput style={s.cityInput} placeholder="জন্মস্থান (শহরের নাম)" placeholderTextColor={colors.textSecondary}
              value={cityQ} onChangeText={t => { setCityQ(t); setShowCity(true); }} onFocus={() => setShowCity(true)} />
          </View>
          {showCity && filteredCities.length > 0 && (
            <View style={s.cityDrop}>
              {filteredCities.map((c, i) => (
                <TouchableOpacity key={i} style={s.cityItem}
                  onPress={() => { setCityQ(c.bn||c.n); setShowCity(false); }}>
                  <Text style={s.cityName}>{c.bn||c.n}</Text>
                  <Text style={s.cityState}>{c.g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!!error && <Text style={s.errTxt}>{error}</Text>}

          <TouchableOpacity style={s.calcBtn} onPress={calculate}>
            <MaterialCommunityIcons name="chart-donut-variant" size={17} color={colors.gold} />
            <Text style={s.calcTxt}>কুণ্ডলী তৈরি করুন</Text>
          </TouchableOpacity>
        </View>

        {/* Result tabs */}
        {result && (
          <>
            {activeTab === 'চার্ট' && (
              <>
                <KundaliGrid result={result} d9={false} />
                <KundaliGrid result={result} d9={true} />
              </>
            )}
            {activeTab === 'গ্রহ'    && <PlanetTable planets={result.planets} />}
            {activeTab === 'পঞ্চাঙ্গ' && <BirthPanchang result={result} />}
            {activeTab === 'দশা'     && <DashaList dashas={result.dashas} />}
            {activeTab === 'দোষ'     && <DoshaTab result={result} />}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header:  { backgroundColor: colors.headerBg, paddingTop: 48, paddingBottom: 18, alignItems: 'center' },
  hLine:   { width: 60, height: 1.5, backgroundColor: colors.gold, opacity: 0.7, marginVertical: 12 },
  brand:   { fontSize: 26, fontWeight: '700', color: colors.gold, letterSpacing: 3, textTransform: 'uppercase' },
  tagline: { fontSize: 13, color: colors.goldLight, marginTop: 4, letterSpacing: 2, opacity: 0.85 },

  tabBar:        { backgroundColor: colors.headerBg, maxHeight: 52 },
  tabBarContent: { paddingHorizontal: spacing.sm, paddingVertical: 10, alignItems: 'center', flexDirection: 'row' },
  tab:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: colors.gold + '44', marginRight: 8 },
  tabActive:{ backgroundColor: colors.gold },
  tabTxt:   { fontSize: 13, color: colors.goldLight, fontWeight: '600' },
  tabTxtActive: { color: colors.headerBg },

  scroll:  { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },

  formCard: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: colors.cardBorder, padding: spacing.md, marginBottom: spacing.md },
  formTitle:{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  fieldLabel:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, marginBottom: 6 },
  fieldLabelTxt:{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  dateRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4,
    borderBottomWidth: 1, borderBottomColor: colors.divider, paddingBottom: 10 },
  dIn:      { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text,
    backgroundColor: colors.background, borderRadius: 8, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.cardBorder },
  sep:      { fontSize: 20, color: colors.textSecondary, fontWeight: '300' },
  cityRow:  { flexDirection: 'row', alignItems: 'center', gap: 10,
    borderBottomWidth: 1, borderBottomColor: colors.divider, paddingVertical: 10 },
  cityInput:{ flex: 1, fontSize: 14, color: colors.text },
  cityDrop: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 8, overflow: 'hidden', marginTop: 4 },
  cityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  cityName: { fontSize: 14, color: colors.text, fontWeight: '600' },
  cityState:{ fontSize: 12, color: colors.textSecondary },
  errTxt:   { color: '#EF4444', fontSize: 13, marginTop: 6, textAlign: 'center' },
  calcBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.headerBg, borderRadius: 12, paddingVertical: 14, marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.gold },
  calcTxt:  { fontSize: 15, fontWeight: '700', color: colors.gold, letterSpacing: 1 },

  // Charts
  chartWrap:{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: colors.cardBorder, padding: 12, marginBottom: spacing.md },
  chartTitle:{ textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  chartLagna:{ textAlign: 'center', fontSize: 11, color: colors.textSecondary, marginBottom: 8 },
  grid:      { gap: 2 },
  gridRow:   { flexDirection: 'row', gap: 2 },
  cell: { flex: 1, minHeight: 68, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.divider, borderRadius: 4,
    padding: 3, alignItems: 'center' },
  cellLagna: { borderColor: colors.gold, borderWidth: 2, backgroundColor: colors.goldLight },
  cellCenter:{ flex: 1, minHeight: 68, backgroundColor: colors.card },
  cellHouse: { fontSize: 9, color: colors.textSecondary, fontWeight: '600' },
  cellRashi: { fontSize: 9, color: colors.text, fontWeight: '700', marginTop: 1 },
  cellPlanets:{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 1, marginTop: 2 },
  cellPlanet: { fontSize: 9, fontWeight: '800' },

  // Shared card
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: colors.cardBorder, padding: spacing.md, marginBottom: spacing.md },
  sectionTitle:{ fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: spacing.sm },

  // Planet table
  tableHead:  { flexDirection: 'row', marginBottom: 6, paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: colors.divider },
  th:         { flex: 1, fontSize: 11, color: colors.textSecondary, fontWeight: '700' },
  tableRow:   { flexDirection: 'row', paddingVertical: 9, alignItems: 'center' },
  td:         { flex: 1, fontSize: 12, color: colors.text },

  // Panchang info rows
  infoRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  infoLabel:  { flex: 1, fontSize: 13, color: colors.textSecondary, marginLeft: 8 },
  infoValue:  { fontSize: 13, color: colors.text, fontWeight: '700' },

  // Dasha
  dashaRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  dashaRowActive:{ backgroundColor: colors.goldLight + '44', borderRadius: 10, paddingHorizontal: 4 },
  dashaIcon:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dashaIconTxt:{ fontSize: 12, fontWeight: '800' },
  dashaInfo:  { flex: 1 },
  dashaName:  { fontSize: 14, color: colors.text, fontWeight: '600' },
  dashaDate:  { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  dashaYears: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },

  // Dosha
  doshaBox:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 12, borderWidth: 1, marginBottom: spacing.sm },
  doshaTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  doshaDesc:  { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
