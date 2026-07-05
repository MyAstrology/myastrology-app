import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getNumerologyReport } from '../engine/numerology';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBN = n => String(n).split('').map(d => BN_DIGITS[+d] || d).join('');

const PLANET_ICON = {
  1: 'white-balance-sunny',
  2: 'moon-waning-crescent',
  3: 'star-three-points',
  4: 'orbit',
  5: 'mercury',
  6: 'heart-outline',
  7: 'eye-outline',
  8: 'rings-wedding',
  9: 'fire',
};

function NumberCard({ num, label, meaning, planetIcon }) {
  if (!num) return null;
  return (
    <View style={s.numCard}>
      <View style={s.numLeft}>
        <MaterialCommunityIcons name={planetIcon || 'numeric'} size={22} color={colors.gold} />
        <Text style={s.numLabel}>{label}</Text>
      </View>
      <View style={s.numRight}>
        <Text style={s.numBig}>{toBN(num)}</Text>
        {!!meaning && <Text style={s.numMeaning}>{meaning}</Text>}
      </View>
    </View>
  );
}

export function NumerologyScreen() {
  const [day,   setDay]   = useState('');
  const [month, setMonth] = useState('');
  const [year,  setYear]  = useState('');
  const [name,  setName]  = useState('');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  function calculate() {
    setError('');
    setResult(null);
    const d = parseInt(day, 10), m = parseInt(month, 10), y = parseInt(year, 10);
    if (isNaN(d) || d < 1 || d > 31) { setError('সঠিক জন্মতারিখ (১–৩১) লিখুন'); return; }
    if (isNaN(m) || m < 1 || m > 12) { setError('সঠিক মাস (১–১২) লিখুন'); return; }
    if (isNaN(y) || y < 1900 || y > 2100) { setError('সঠিক বছর লিখুন'); return; }
    try {
      setResult(getNumerologyReport(d, m, y, name.trim()));
    } catch (_) {
      setError('গণনায় সমস্যা হয়েছে');
    }
  }

  function reset() {
    setDay(''); setMonth(''); setYear(''); setName('');
    setResult(null); setError('');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <View style={s.hLine} />
        <Text style={s.brand}>MYASTROLOGY</Text>
        <Text style={s.tagline}>সংখ্যাতত্ত্ব</Text>
        <View style={s.hLine} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        <View style={s.card}>
          <Text style={s.cardTitle}>জন্মতথ্য</Text>

          <View style={s.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>দিন</Text>
              <TextInput style={s.input} placeholder="DD" placeholderTextColor={colors.textSecondary}
                keyboardType="numeric" maxLength={2} value={day} onChangeText={setDay} />
            </View>
            <Text style={s.sep}>/</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>মাস</Text>
              <TextInput style={s.input} placeholder="MM" placeholderTextColor={colors.textSecondary}
                keyboardType="numeric" maxLength={2} value={month} onChangeText={setMonth} />
            </View>
            <Text style={s.sep}>/</Text>
            <View style={{ flex: 2 }}>
              <Text style={s.fieldLabel}>বছর</Text>
              <TextInput style={s.input} placeholder="YYYY" placeholderTextColor={colors.textSecondary}
                keyboardType="numeric" maxLength={4} value={year} onChangeText={setYear} />
            </View>
          </View>

          <Text style={[s.fieldLabel, { marginTop: 12 }]}>নাম (ইংরেজিতে — ঐচ্ছিক)</Text>
          <TextInput style={s.input} placeholder="Your Name"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            value={name} onChangeText={setName} />

          {!!error && <Text style={s.errorTxt}>{error}</Text>}

          <View style={s.btnRow}>
            <TouchableOpacity style={s.calcBtn} onPress={calculate} activeOpacity={0.8}>
              <MaterialCommunityIcons name="numeric" size={18} color={colors.headerBg} />
              <Text style={s.calcTxt}>সংখ্যা দেখুন</Text>
            </TouchableOpacity>
            {result && (
              <TouchableOpacity style={s.resetBtn} onPress={reset} activeOpacity={0.8}>
                <MaterialCommunityIcons name="refresh" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {result && (
          <>
            {/* Summary strip */}
            <View style={s.summaryRow}>
              <View style={s.summaryBox}>
                <Text style={s.sumLabel}>মূলাংক</Text>
                <Text style={s.sumNum}>{result.moolankBN}</Text>
              </View>
              <View style={s.sumDiv} />
              <View style={s.summaryBox}>
                <Text style={s.sumLabel}>ভাগ্যাংক</Text>
                <Text style={s.sumNum}>{result.bhagyankBN}</Text>
              </View>
              {result.nameankBN && (
                <>
                  <View style={s.sumDiv} />
                  <View style={s.summaryBox}>
                    <Text style={s.sumLabel}>নামাংক</Text>
                    <Text style={s.sumNum}>{result.nameankBN}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Details */}
            <View style={s.card}>
              <Text style={s.cardTitle}>বিস্তারিত</Text>
              <NumberCard
                num={result.moolank}
                label="মূলাংক"
                meaning={result.moolankMeaning}
                planetIcon={PLANET_ICON[result.moolank]}
              />
              <View style={s.div} />
              <NumberCard
                num={result.bhagyankNum}
                label="ভাগ্যাংক"
                meaning={result.bhagyankMeaning}
                planetIcon={PLANET_ICON[result.bhagyankNum]}
              />
              {result.nameank && (
                <>
                  <View style={s.div} />
                  <NumberCard
                    num={result.nameank}
                    label="নামাংক"
                    meaning=""
                    planetIcon={PLANET_ICON[result.nameank]}
                  />
                </>
              )}
            </View>
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: colors.headerBg, paddingTop: 52, paddingBottom: 18, alignItems: 'center' },
  hLine:  { width: 56, height: 1.5, backgroundColor: colors.gold, opacity: 0.7, marginVertical: 10 },
  brand:  { fontSize: 26, fontWeight: '800', color: colors.gold, letterSpacing: 4 },
  tagline:{ fontSize: 12, color: colors.goldLight, letterSpacing: 2, opacity: 0.85 },

  scroll:  { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },

  card: { margin: spacing.md, marginBottom: 0, backgroundColor: colors.card,
    borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md },
  cardTitle: { fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: spacing.sm },

  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  fieldLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  sep:    { fontSize: 20, color: colors.textSecondary, marginBottom: 8, paddingHorizontal: 2 },
  input:  { backgroundColor: colors.background, borderRadius: 10, borderWidth: 1,
    borderColor: colors.cardBorder, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: colors.text, fontWeight: '600', textAlign: 'center' },
  errorTxt: { color: '#DC2626', fontSize: 12, marginTop: 8 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  calcBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.gold },
  calcTxt: { fontSize: 15, fontWeight: '700', color: colors.headerBg },
  resetBtn: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card },

  summaryRow: { flexDirection: 'row', margin: spacing.md, marginBottom: 0,
    backgroundColor: colors.headerBg, borderRadius: 16, borderWidth: 1,
    borderColor: colors.gold + '55', overflow: 'hidden' },
  summaryBox: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  sumLabel:   { fontSize: 11, color: colors.goldLight, letterSpacing: 1, opacity: 0.8 },
  sumNum:     { fontSize: 42, fontWeight: '800', color: colors.gold, lineHeight: 50 },
  sumDiv:     { width: 1, backgroundColor: colors.gold + '33', marginVertical: 10 },

  numCard: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14 },
  numLeft: { width: 90, alignItems: 'center', gap: 4 },
  numLabel:{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  numRight:{ flex: 1 },
  numBig:  { fontSize: 32, fontWeight: '800', color: colors.gold, lineHeight: 36 },
  numMeaning: { fontSize: 13, color: colors.text, lineHeight: 20, marginTop: 6 },
  div: { height: 1, backgroundColor: colors.divider },
});
