import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getNamakaranResult } from '../engine/namakaran';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const PADA_NAMES = ['প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'চতুর্থ'];

function InfoRow({ icon, label, value }) {
  return (
    <View style={s.infoRow}>
      <MaterialCommunityIcons name={icon} size={16} color={colors.primary} style={{ width: 22 }} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

export function NamakaranScreen() {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  function calculate() {
    setError('');
    setResult(null);
    const dParts = date.trim().split('/');
    if (dParts.length !== 3) { setError('তারিখ DD/MM/YYYY ফরম্যাটে লিখুন'); return; }
    const [dd, mm, yyyy] = dParts.map(p => p.trim());
    const dateStr = `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
    const parsed = new Date(dateStr + 'T00:00:00');
    if (isNaN(parsed.getTime())) { setError('তারিখ সঠিক নয়'); return; }
    const timeStr = time.trim() || '12:00';
    if (!/^\d{1,2}:\d{2}$/.test(timeStr)) { setError('সময় HH:MM ফরম্যাটে লিখুন'); return; }
    try {
      const r = getNamakaranResult(dateStr, timeStr);
      setResult(r);
    } catch (_) {
      setError('গণনায় সমস্যা হয়েছে');
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <View style={s.hLine} />
        <Text style={s.brand}>MYASTROLOGY</Text>
        <Text style={s.tagline}>নামকরণ</Text>
        <View style={s.hLine} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        <View style={s.card}>
          <Text style={s.cardTitle}>শিশুর জন্মতথ্য</Text>

          <Text style={s.fieldLabel}>জন্মতারিখ (DD/MM/YYYY)</Text>
          <TextInput
            style={s.input}
            placeholder="যেমন: 15/03/2024"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={date}
            onChangeText={setDate}
          />

          <Text style={s.fieldLabel}>জন্মসময় (HH:MM) — ঐচ্ছিক</Text>
          <TextInput
            style={s.input}
            placeholder="যেমন: 08:30"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={time}
            onChangeText={setTime}
          />

          {!!error && <Text style={s.errorTxt}>{error}</Text>}

          <TouchableOpacity style={s.calcBtn} onPress={calculate} activeOpacity={0.8}>
            <MaterialCommunityIcons name="baby-face-outline" size={18} color={colors.headerBg} />
            <Text style={s.calcTxt}>নক্ষত্র দেখুন</Text>
          </TouchableOpacity>
        </View>

        {result && (
          <>
            {/* Suggested Akshar */}
            <View style={s.aksharCard}>
              <Text style={s.aksharHint}>শুভ নামের প্রথম অক্ষর</Text>
              <Text style={s.aksharBig}>{result.akshar}</Text>
              <Text style={s.aksharPada}>{result.nakshatra} — {result.padaName} পদ</Text>
            </View>

            {/* All 4 padas */}
            <View style={s.card}>
              <Text style={s.cardTitle}>চারটি পদের অক্ষর</Text>
              <View style={s.padaRow}>
                {result.allAkshar.map((ak, i) => (
                  <View key={i} style={[s.padaBox, i + 1 === result.pada && s.padaBoxActive]}>
                    <Text style={[s.padaBoxLetter, i + 1 === result.pada && s.padaBoxLetterActive]}>{ak}</Text>
                    <Text style={[s.padaBoxLabel, i + 1 === result.pada && { color: colors.headerBg }]}>
                      {PADA_NAMES[i]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Nakshatra details */}
            <View style={s.card}>
              <Text style={s.cardTitle}>নক্ষত্র বিবরণ</Text>
              <InfoRow icon="star-four-points"   label="নক্ষত্র"    value={result.nakshatra} />
              <View style={s.div} />
              <InfoRow icon="star-shooting"       label="পদ"         value={`${result.padaName} (${result.pada})`} />
              <View style={s.div} />
              <InfoRow icon="sun-wireless-outline" label="নক্ষত্রপতি" value={result.lord} />
              <View style={s.div} />
              <InfoRow icon="account-group-outline" label="গণ"        value={result.gana} />
              <View style={s.div} />
              <InfoRow icon="paw-outline"          label="যোনি"       value={result.yoni} />
              <View style={s.div} />
              <InfoRow icon="water-outline"        label="নাড়ী"       value={result.nadi} />
              <View style={s.div} />
              <InfoRow icon="medal-outline"        label="বর্ণ"        value={result.varna} />
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

  fieldLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: colors.background, borderRadius: 10, borderWidth: 1,
    borderColor: colors.cardBorder, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: colors.text, fontWeight: '600' },
  errorTxt: { color: '#DC2626', fontSize: 12, marginTop: 8 },
  calcBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 16, paddingVertical: 12, borderRadius: 12,
    backgroundColor: colors.gold },
  calcTxt: { fontSize: 15, fontWeight: '700', color: colors.headerBg },

  aksharCard: { margin: spacing.md, marginBottom: 0, backgroundColor: colors.headerBg,
    borderRadius: 16, borderWidth: 1, borderColor: colors.gold + '66',
    padding: spacing.lg, alignItems: 'center' },
  aksharHint: { fontSize: 11, color: colors.goldLight, letterSpacing: 1.5,
    textTransform: 'uppercase', opacity: 0.8 },
  aksharBig:  { fontSize: 72, fontWeight: '800', color: colors.gold, marginTop: 4, lineHeight: 80 },
  aksharPada: { fontSize: 13, color: colors.goldLight, marginTop: 6 },

  padaRow: { flexDirection: 'row', gap: 8 },
  padaBox: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.background },
  padaBoxActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  padaBoxLetter: { fontSize: 22, fontWeight: '800', color: colors.text },
  padaBoxLetterActive: { color: colors.headerBg },
  padaBoxLabel:  { fontSize: 10, color: colors.textSecondary, marginTop: 2 },

  infoRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  infoLabel: { flex: 1, fontSize: 13, color: colors.textSecondary, marginLeft: 8 },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '700' },
  div:       { height: 1, backgroundColor: colors.divider },
});
