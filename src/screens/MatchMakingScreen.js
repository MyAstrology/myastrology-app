import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { calculateAshtakuta, RASHI_NAMES, NAKSHATRA_NAMES } from '../engine/matchmaking';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const KOOTA_META = [
  { key: 'varna',       label: 'বর্ণ',         max: 1  },
  { key: 'vashya',      label: 'বশ্য',         max: 2  },
  { key: 'tara',        label: 'তারা',          max: 3  },
  { key: 'yoni',        label: 'যোনি',          max: 4  },
  { key: 'grahaMaitri', label: 'গ্রহমৈত্রী',  max: 5  },
  { key: 'gana',        label: 'গণ',            max: 6  },
  { key: 'rashi',       label: 'রাশি (ভকূট)',  max: 7  },
  { key: 'nadi',        label: 'নাড়ী',          max: 8  },
];

function SelectPicker({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TouchableOpacity style={s.selectBtn} onPress={() => setOpen(v => !v)} activeOpacity={0.8}>
        <Text style={[s.selectTxt, !value && { color: colors.textSecondary }]}>
          {value || '— বেছে নিন —'}
        </Text>
        <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {open && (
        <View style={s.dropdown}>
          {options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[s.dropItem, value === opt && s.dropItemActive]}
              onPress={() => { onChange(opt); setOpen(false); }}
            >
              <Text style={[s.dropItemTxt, value === opt && s.dropItemTxtActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function PersonForm({ title, icon, data, onChange }) {
  return (
    <View style={s.personCard}>
      <View style={s.personHeader}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.gold} />
        <Text style={s.personTitle}>{title}</Text>
      </View>
      <SelectPicker
        label="চন্দ্ররাশি"
        options={RASHI_NAMES}
        value={data.moonRashi}
        onChange={v => onChange({ ...data, moonRashi: v })}
      />
      <SelectPicker
        label="জন্মনক্ষত্র"
        options={NAKSHATRA_NAMES}
        value={data.moonNakshatra}
        onChange={v => onChange({ ...data, moonNakshatra: v })}
      />
      <SelectPicker
        label="মঙ্গলরাশি (ঐচ্ছিক)"
        options={RASHI_NAMES}
        value={data.marsRashi}
        onChange={v => onChange({ ...data, marsRashi: v })}
      />
      <SelectPicker
        label="লগ্নরাশি (ঐচ্ছিক)"
        options={RASHI_NAMES}
        value={data.lagnaRashi}
        onChange={v => onChange({ ...data, lagnaRashi: v })}
      />
    </View>
  );
}

function ScoreBar({ points, max }) {
  const pct = max > 0 ? points / max : 0;
  const barColor = pct >= 0.7 ? '#16A34A' : pct >= 0.4 ? colors.gold : '#DC2626';
  return (
    <View style={s.barBg}>
      <View style={[s.barFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
    </View>
  );
}

export function MatchMakingScreen() {
  const [girl, setGirl] = useState({ moonRashi: '', moonNakshatra: '', marsRashi: '', lagnaRashi: '' });
  const [boy,  setBoy]  = useState({ moonRashi: '', moonNakshatra: '', marsRashi: '', lagnaRashi: '' });
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  function calculate() {
    setError('');
    setResult(null);
    if (!girl.moonRashi || !girl.moonNakshatra) { setError('কনের চন্দ্ররাশি ও নক্ষত্র বেছে নিন'); return; }
    if (!boy.moonRashi  || !boy.moonNakshatra)  { setError('বরের চন্দ্ররাশি ও নক্ষত্র বেছে নিন');  return; }
    try {
      setResult(calculateAshtakuta(girl, boy));
    } catch (_) {
      setError('গণনায় সমস্যা হয়েছে');
    }
  }

  function reset() {
    setGirl({ moonRashi: '', moonNakshatra: '', marsRashi: '', lagnaRashi: '' });
    setBoy({ moonRashi: '', moonNakshatra: '', marsRashi: '', lagnaRashi: '' });
    setResult(null);
    setError('');
  }

  const verdictColor = result
    ? result.total >= 25 ? '#16A34A' : result.total >= 18 ? colors.gold : '#DC2626'
    : colors.text;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <View style={s.hLine} />
        <Text style={s.brand}>MYASTROLOGY</Text>
        <Text style={s.tagline}>বিবাহ মিলাপ</Text>
        <View style={s.hLine} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        <PersonForm title="কনের তথ্য" icon="face-woman-outline" data={girl} onChange={setGirl} />
        <PersonForm title="বরের তথ্য"  icon="face-man-outline"   data={boy}  onChange={setBoy}  />

        {!!error && (
          <View style={s.errorCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={s.errorTxt}>{error}</Text>
          </View>
        )}

        <View style={s.btnRow}>
          <TouchableOpacity style={s.calcBtn} onPress={calculate} activeOpacity={0.8}>
            <MaterialCommunityIcons name="heart-multiple-outline" size={18} color={colors.headerBg} />
            <Text style={s.calcTxt}>মিলাপ দেখুন</Text>
          </TouchableOpacity>
          {result && (
            <TouchableOpacity style={s.resetBtn} onPress={reset} activeOpacity={0.8}>
              <MaterialCommunityIcons name="refresh" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {result && (
          <>
            {/* Score summary */}
            <View style={s.summaryCard}>
              <Text style={s.sumLabel}>মোট গুণ</Text>
              <Text style={[s.sumScore, { color: verdictColor }]}>
                {result.total} / {result.max}
              </Text>
              <Text style={[s.sumVerdict, { color: verdictColor }]}>{result.verdict}</Text>
              {result.isRajaYotak && (
                <View style={s.rajaBadge}>
                  <MaterialCommunityIcons name="crown-outline" size={14} color={colors.headerBg} />
                  <Text style={s.rajaTxt}>রাজযোটক</Text>
                </View>
              )}
            </View>

            {/* Koota table */}
            <View style={s.card}>
              <Text style={s.cardTitle}>অষ্টকূট বিচার</Text>
              {KOOTA_META.map((km, i) => {
                const k = result.kootas[km.key];
                return (
                  <View key={km.key}>
                    <View style={s.kootaRow}>
                      <Text style={s.kootaLabel}>{km.label}</Text>
                      <ScoreBar points={k.points} max={km.max} />
                      <Text style={s.kootaScore}>{k.points}/{km.max}</Text>
                    </View>
                    {i < KOOTA_META.length - 1 && <View style={s.div} />}
                  </View>
                );
              })}
            </View>

            {/* Manglik */}
            <View style={s.card}>
              <Text style={s.cardTitle}>মাঙ্গলিক দোষ</Text>
              {[
                { label: 'কনে', info: result.manglik.girl },
                { label: 'বর',  info: result.manglik.boy  },
              ].map(({ label, info }, i) => (
                <View key={i}>
                  {i > 0 && <View style={s.div} />}
                  <View style={s.mangRow}>
                    <Text style={s.mangName}>{label}</Text>
                    <View style={[s.mangPill, { backgroundColor: info.hasDosha ? '#FEF2F2' : '#F0FDF4', borderColor: info.hasDosha ? '#FECACA' : '#BBF7D0' }]}>
                      <Text style={[s.mangPillTxt, { color: info.hasDosha ? '#DC2626' : '#16A34A' }]}>
                        {info.hasDosha ? `মাঙ্গলিক (${info.house} ভাব)` : 'মাঙ্গলিক নয়'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              <View style={s.div} />
              <View style={s.mangRow}>
                <Text style={s.mangName}>মিলাপ</Text>
                <View style={[s.mangPill, { backgroundColor: result.manglik.match ? '#F0FDF4' : '#FEF2F2', borderColor: result.manglik.match ? '#BBF7D0' : '#FECACA' }]}>
                  <Text style={[s.mangPillTxt, { color: result.manglik.match ? '#16A34A' : '#DC2626' }]}>
                    {result.manglik.match ? 'সামঞ্জস্যপূর্ণ' : 'অসামঞ্জস্যপূর্ণ'}
                  </Text>
                </View>
              </View>
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

  personCard: { margin: spacing.md, marginBottom: 0, backgroundColor: colors.card,
    borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md },
  personHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  personTitle:  { fontSize: 14, fontWeight: '700', color: colors.text },

  fieldLabel: { fontSize: 11, color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
  selectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.background, borderRadius: 10, borderWidth: 1,
    borderColor: colors.cardBorder, paddingHorizontal: 12, paddingVertical: 10 },
  selectTxt: { fontSize: 14, color: colors.text, fontWeight: '600' },
  dropdown: { backgroundColor: colors.card, borderRadius: 10, borderWidth: 1,
    borderColor: colors.cardBorder, marginTop: 2, overflow: 'hidden', zIndex: 999 },
  dropItem: { paddingVertical: 9, paddingHorizontal: 14 },
  dropItemActive: { backgroundColor: colors.goldLight },
  dropItemTxt: { fontSize: 14, color: colors.text },
  dropItemTxtActive: { fontWeight: '700', color: colors.primaryDark },

  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: spacing.md, marginBottom: 0, padding: spacing.sm,
    backgroundColor: '#FEF2F2', borderRadius: 10, borderWidth: 1, borderColor: '#FECACA' },
  errorTxt: { flex: 1, fontSize: 13, color: '#DC2626' },

  btnRow: { flexDirection: 'row', margin: spacing.md, marginBottom: 0, gap: 10 },
  calcBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.gold },
  calcTxt: { fontSize: 15, fontWeight: '700', color: colors.headerBg },
  resetBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.card },

  summaryCard: { margin: spacing.md, marginBottom: 0, backgroundColor: colors.headerBg,
    borderRadius: 16, borderWidth: 1, borderColor: colors.gold + '55',
    padding: spacing.lg, alignItems: 'center' },
  sumLabel:   { fontSize: 11, color: colors.goldLight, letterSpacing: 1.5, textTransform: 'uppercase' },
  sumScore:   { fontSize: 52, fontWeight: '800', marginTop: 4, lineHeight: 60 },
  sumVerdict: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  rajaBadge:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: colors.gold },
  rajaTxt:    { fontSize: 13, fontWeight: '700', color: colors.headerBg },

  card: { margin: spacing.md, marginBottom: 0, backgroundColor: colors.card,
    borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md },
  cardTitle: { fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: spacing.sm },

  kootaRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  kootaLabel: { width: 96, fontSize: 13, color: colors.textSecondary },
  kootaScore: { width: 36, fontSize: 13, color: colors.text, fontWeight: '700', textAlign: 'right' },
  barBg:  { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.divider, marginHorizontal: 8 },
  barFill:{ height: 6, borderRadius: 3 },
  div:    { height: 1, backgroundColor: colors.divider },

  mangRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  mangName:   { width: 60, fontSize: 13, color: colors.textSecondary },
  mangPill:   { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1 },
  mangPillTxt:{ fontSize: 13, fontWeight: '600' },
});
