// src/screens/NumerologyScreen.js — সম্পূর্ণ নেটিভ নিউমেরোলজি
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../theme';

// ── বাংলা সংখ্যা ──
const BD = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBn = n => String(Math.abs(Math.round(n))).replace(/\d/g, d => BD[+d]);

// ── Chaldean নামসংখ্যা ──
const CHALDEAN = {
  A:1, B:2, C:3, D:4, E:5, F:8, G:3, H:5, I:1, J:1, K:2, L:3, M:4,
  N:5, O:7, P:8, Q:1, R:2, S:3, T:4, U:6, V:6, W:6, X:5, Y:1, Z:7,
};

// ── সংখ্যা এককে নামিয়ে আনা (1-9, 11, 22, 33) ──
function reduceNum(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((s, d) => s + +d, 0);
  }
  return n;
}

function calcLifePath(day, month, year) {
  const sum = String(day).split('').reduce((s,d)=>s+ +d,0)
            + String(month).split('').reduce((s,d)=>s+ +d,0)
            + String(year).split('').reduce((s,d)=>s+ +d,0);
  return reduceNum(sum);
}

function calcNameNumber(name) {
  const val = name.toUpperCase().replace(/[^A-Z]/g,'').split('')
    .reduce((s,c) => s + (CHALDEAN[c] || 0), 0);
  return reduceNum(val);
}

function calcDestiny(day, month, year) {
  return calcLifePath(day, month, year); // same as life path in Chaldean
}

function calcPersonality(name) {
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
  const val = name.toUpperCase().replace(/[^A-Z]/g,'').split('')
    .filter(c => consonants.includes(c))
    .reduce((s,c) => s + (CHALDEAN[c] || 0), 0);
  return val > 0 ? reduceNum(val) : null;
}

// ── সংখ্যার ব্যাখ্যা ──
const NUM_INFO = {
  1:  { title: 'নেতা (সূর্য)', planet: 'সূর্য', color: '#f97316', gem: 'মাণিক্য', desc: 'স্বাধীনচেতা, নেতৃত্বগুণ সম্পন্ন, আত্মবিশ্বাসী, কর্মঠ নেতা। ব্যবসা ও রাজনীতিতে সফল হয়।', lucky: 'রবিবার, সোমবার', remedy: 'আদিত্য হৃদয় স্তোত্র পাঠ করুন' },
  2:  { title: 'সহযোগী (চন্দ্র)', planet: 'চন্দ্র', color: '#e2e8f0', gem: 'মুক্তা', desc: 'সহমর্মী, ভাবুক, সুক্ষ্ম অনুভূতি, শিল্প-সাহিত্যে শ্রেষ্ঠ। সম্পর্ক বানানোতে পারদর্শী।', lucky: 'সোমবার, শুক্রবার', remedy: 'চন্দ্র নমস্কার দিয়ে দিন শুরু করুন' },
  3:  { title: 'সৃজনশীল (বৃহস্পতি)', planet: 'বৃহস্পতি', color: '#c9922a', gem: 'পুষ্পরাগ', desc: 'বাকপটু, শিল্পী, প্রসারিত স্বভাব। শিক্ষা, ধর্ম, বিদেশযাত্রায় সাফল্য। শুভানুধ্যায়ী।', lucky: 'বৃহস্পতিবার, রবিবার', remedy: 'বিষ্ণু সহস্রনাম পাঠ করুন' },
  4:  { title: 'পরিশ্রমী (রাহু)', planet: 'রাহু', color: '#64748b', gem: 'গোমেদ', desc: 'বাস্তববাদী, পরিশ্রমী, সিস্টেমাটিক, বিশ্বস্ত। পরিশ্রমের মাধ্যমে সাফল্য আসে।', lucky: 'শনিবার, রবিবার', remedy: 'গণেশ পূজা করুন' },
  5:  { title: 'পরিবর্তনশীল (বুধ)', planet: 'বুধ', color: '#22c55e', gem: 'পান্না', desc: 'বুদ্ধিমান, দ্রুতগতি, বহুমুখী প্রতিভা। যোগাযোগ, সাংবাদিকতা, ব্যবসায় শ্রেষ্ঠ।', lucky: 'বুধবার, শুক্রবার', remedy: 'বুধ বীজ মন্ত্র জপ করুন' },
  6:  { title: 'স্নেহশীল (শুক্র)', planet: 'শুক্র', color: '#ec4899', gem: 'হীরা', desc: 'প্রেমিক, সৌন্দর্যপ্রিয়, পরিবারদের প্রতি দায়িত্বশীল। শিল্প-সংগীত-ফ্যাশনে সফল।', lucky: 'শুক্রবার, সোমবার', remedy: 'লক্ষ্মী পূজা করুন' },
  7:  { title: 'রহস্যান্বেষী (কেতু)', planet: 'কেতু', color: '#8b5cf6', gem: 'লাহোষুণি', desc: 'আস্ম্যাত্মিক, শান্ত, রহস্যান্বেষী। দর্শন, গণিত, বিজ্ঞানে পারদর্শী। নিঃসঙ্গতা পছন্দ করে।', lucky: 'সোমবার, রবিবার', remedy: 'কেতু মন্ত্র জপ করুন' },
  8:  { title: 'শক্তিশালী (শনি)', planet: 'শনি', color: '#6366f1', gem: 'নীলম', desc: 'প্রতিষ্ঠিত, ব্যবহারিক, সামাজিক নিয়ম্তা। অর্থনীতি, নির্মাণ, রাজনীতিতে শ্রেষ্ঠ।', lucky: 'শনিবার, রবিবার', remedy: 'শনির প্রদীপ জ্বালান' },
  9:  { title: 'সাহসিক (মঙ্গল)', planet: 'মঙ্গল', color: '#ef4444', gem: 'প্রবাল', desc: 'সাহসী, শক্তিশালী, তাৎক্ষণিক সিদ্ধান্ত গ্রহণকারী। যুদ্ধ, জর্জি, খেলাধুলায় শ্রেষ্ঠ।', lucky: 'মঙ্গলবার, রবিবার', remedy: 'মঙ্গল বীজ মন্ত্র জপ করুন' },
  11: { title: 'অনুপ্রাণিত (কার্মিক ১১)', planet: 'চন্দ্র/সূর্য', color: '#a78bfa', gem: 'মুক্তা', desc: 'অসাধারণ অন্তরদৃষ্টি, আধ্যাত্মিক চেতনা। শিল্প, ধর্ম, সমাজসেবায় শ্রেষ্ঠ। মাস্টার নাম্বার বলা হয়।', lucky: 'সোম, বৃহস্পতি', remedy: 'ধ্যান ও প্রাণায়াম অভ্যাস করুন' },
  22: { title: 'মহান স্থপতি (কার্মিক ২২)', planet: 'বিশ্ব', color: '#0ea5e9', gem: 'নীলম', desc: 'অসাধারণ নির্মাণশক্তি, বাস্তব রূপায়ণ, বিশ্বদৃষ্টি। বড় বড় প্রতিষ্ঠান তৈরি করে মানবজাতির সেবা করার শক্তি রাখে।', lucky: 'শনি, শুক্র', remedy: 'সেবামূলক কাজ করুন' },
  33: { title: 'মহান গুরু (কার্মিক ৩৩)', planet: 'বিশ্ব', color: '#f59e0b', gem: 'পুষ্পরাগ', desc: 'বিশ্বের সর্বোচ্চ শিক্ষক সংখ্যা। অসাধারণ করুণা, জ্ঞান, মানবতাবোধ। ভারতবর্ষে বিরল ও অত্যন্ত শক্তিশালী।', lucky: 'বৃহ, রবি', remedy: 'সর্বভূত হিতায় নিজেকে নিয়োগ করুন' },
};

// ── Lo Shu Grid (লো শু গ্রিড) ──
// তিনটি সারি: [4,9,2], [3,5,7], [8,1,6]
const LO_SHU_POS = [4, 9, 2, 3, 5, 7, 8, 1, 6];
const LO_SHU_MEANING = {
  1: 'হর্ষ',  2: 'বল',    3: 'পরিকল্পনা',
  4: 'বাস্তব',  5: 'শক্তি', 6: 'সাহধর্মিতা',
  7: 'সাফল্য', 8: 'প্রজ্ঞা', 9: 'মানবতা',
};

function makeLoShuGrid(dob) {
  const digits = dob.replace(/\D/g, '').split('').map(Number).filter(n => n >= 1 && n <= 9);
  const counts = {};
  for (let i = 1; i <= 9; i++) counts[i] = digits.filter(d => d === i).length;
  return counts;
}

// ── UI Components ──

function NumCard({ label, value, color, sub }) {
  return (
    <View style={[styles.numCard, { borderColor: color + '55' }]}>
      <Text style={styles.numCardLabel}>{label}</Text>
      <View style={[styles.numCircle, { backgroundColor: color + '22', borderColor: color }]}>
        <Text style={[styles.numBig, { color }]}>{toBn(value)}</Text>
      </View>
      {sub ? <Text style={styles.numCardSub}>{sub}</Text> : null}
    </View>
  );
}

function LoShuGrid({ counts }) {
  return (
    <View style={styles.loShuWrap}>
      {LO_SHU_POS.map((num, i) => {
        const cnt = counts[num] || 0;
        const filled = cnt > 0;
        return (
          <View key={i} style={[
            styles.loShuCell,
            filled ? styles.loShuFilled : styles.loShuEmpty,
          ]}>
            <Text style={[styles.loShuNum, { color: filled ? Colors.goldLight : Colors.textMuted }]}>
              {toBn(num)}
            </Text>
            {cnt > 0 && (
              <Text style={styles.loShuCount}>{'●'.repeat(Math.min(cnt, 5))}</Text>
            )}
            <Text style={[styles.loShuMeaning, { color: filled ? Colors.textSecondary : Colors.textMuted }]}>
              {LO_SHU_MEANING[num]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function NumerologyScreen() {
  const insets = useSafeAreaInsets();
  const [day, setDay]     = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear]   = useState('');
  const [name, setName]   = useState('');
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');

  const calculate = useCallback(() => {
    const d = parseInt(day), m = parseInt(month), y = parseInt(year);
    if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2100) {
      setError('সঠিক জন্মতারিখ দিন (দিন: ১–3১, মাস: ১–12, বছর: ১৯০০–2১০০)');
      return;
    }
    setError('');

    const lp  = calcLifePath(d, m, y);
    const bn  = reduceNum(d);
    const nn  = name.trim() ? calcNameNumber(name.trim()) : null;
    const dp  = name.trim() ? calcPersonality(name.trim()) : null;
    const lsc = makeLoShuGrid(`${String(d).padStart(2,'0')}${String(m).padStart(2,'0')}${y}`);

    setResult({ lp, bn, nn, dp, lsc, name: name.trim(), d, m, y });
  }, [day, month, year, name]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Text style={styles.heading}>🔢 নিউমেরোলজি</Text>
        <Text style={styles.subHeading}>জন্মতারিখ ও নাম দিয়ে সংখ্যাভিত্তিক বিশ্লেষণ</Text>

        {/* ইনপুট */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>🎂 জন্মতারিখ</Text>
          <View style={styles.dobRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="দিন"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={2}
              value={day}
              onChangeText={setDay}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="মাস"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={2}
              value={month}
              onChangeText={setMonth}
            />
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="বছর"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={4}
              value={year}
              onChangeText={setYear}
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>📝 পূর্ণনাম (ইংরেজি, নামসংখ্যার জন্য)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Pradyut Acharya"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.calcBtn} onPress={calculate} activeOpacity={0.85}>
            <Text style={styles.calcBtnText}>গণনা করুন →</Text>
          </TouchableOpacity>
        </View>

        {result && (
          <>
            {/* Numbers */}
            <Text style={styles.sectionTitle}>মূল সংখ্যাসমূহ</Text>
            <View style={styles.numRow}>
              <NumCard label="জীবনসংখ্যা" value={result.lp} color={NUM_INFO[result.lp]?.color || Colors.gold} sub={NUM_INFO[result.lp]?.planet} />
              <NumCard label="জন্মসংখ্যা" value={result.bn} color={NUM_INFO[result.bn]?.color || Colors.gold} sub={NUM_INFO[result.bn]?.planet} />
              {result.nn && <NumCard label="নামসংখ্যা" value={result.nn} color={NUM_INFO[result.nn]?.color || Colors.gold} sub={NUM_INFO[result.nn]?.planet} />}
            </View>

            {/* Life Path Info */}
            {NUM_INFO[result.lp] && (
              <View style={[styles.infoCard, { borderLeftColor: NUM_INFO[result.lp].color }]}>
                <Text style={[styles.infoTitle, { color: NUM_INFO[result.lp].color }]}>
                  জীবনসংখ্যা {toBn(result.lp)} — {NUM_INFO[result.lp].title}
                </Text>
                <Text style={styles.infoDesc}>{NUM_INFO[result.lp].desc}</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}><Text style={styles.infoKey}>🌀 গ্রহ</Text><Text style={styles.infoVal}>{NUM_INFO[result.lp].planet}</Text></View>
                  <View style={styles.infoItem}><Text style={styles.infoKey}>💎 রত্ন</Text><Text style={styles.infoVal}>{NUM_INFO[result.lp].gem}</Text></View>
                  <View style={styles.infoItem}><Text style={styles.infoKey}>📅 শুভদিন</Text><Text style={styles.infoVal}>{NUM_INFO[result.lp].lucky}</Text></View>
                </View>
                <View style={styles.remedyBox}>
                  <Text style={styles.remedyTitle}>🚨 প্রতিকার</Text>
                  <Text style={styles.remedyText}>{NUM_INFO[result.lp].remedy}</Text>
                </View>
              </View>
            )}

            {/* Lo Shu Grid */}
            <Text style={styles.sectionTitle}>🔲 লো শু গ্রিড বিশ্লেষণ</Text>
            <View style={styles.loShuCard}>
              <Text style={styles.loShuDesc}>
                জন্মতারিখের অঙ্কগুলো থেকে সাধিত ৯-ঘরের চাইনিজ ম্যাজিক স্কোয়ার। ভরা ঘর = শক্তি, খালি = শেখার সুযোগ।
              </Text>
              <LoShuGrid counts={result.lsc} />
            </View>

            {/* Name Number detail */}
            {result.nn && NUM_INFO[result.nn] && (
              <View style={[styles.infoCard, { borderLeftColor: NUM_INFO[result.nn].color }]}>
                <Text style={[styles.infoTitle, { color: NUM_INFO[result.nn].color }]}>
                  নামসংখ্যা {toBn(result.nn)} — {NUM_INFO[result.nn].title}
                </Text>
                <Text style={styles.infoDesc}>{NUM_INFO[result.nn].desc}</Text>
              </View>
            )}

            {/* Tip */}
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                💡 নামসংখ্যা যদি জীবনসংখ্যার সাথে মিলন না হয়, তাহলে নামের বানানে সামান্য পরিবর্তন করে অনুকূল সংখ্যা পাওয়া যায়।
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { padding: Spacing.md },

  heading:    { fontSize: 22, fontFamily: 'NotoSerifBengali', fontWeight: '700', color: Colors.goldLight, marginBottom: 4 },
  subHeading: { fontSize: 13, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary, marginBottom: Spacing.md },

  inputCard: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.goldBorder, padding: Spacing.md, marginBottom: Spacing.md },
  inputLabel: { fontSize: 13, fontFamily: 'NotoSerifBengali', color: Colors.goldLight, fontWeight: '600', marginBottom: 6 },
  dobRow:    { flexDirection: 'row', gap: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10,
    borderWidth: 1, borderColor: Colors.goldBorder,
    padding: 10, color: Colors.textPrimary,
    fontFamily: 'NotoSerifBengali', fontSize: 14,
  },
  errorText: { color: Colors.danger, fontFamily: 'NotoSerifBengali', fontSize: 12, marginTop: 6 },
  calcBtn: {
    backgroundColor: Colors.gold, borderRadius: 12,
    padding: 12, alignItems: 'center', marginTop: 14,
  },
  calcBtnText: { fontSize: 15, fontFamily: 'NotoSerifBengali', fontWeight: '700', color: '#0e0e2a' },

  sectionTitle: { fontSize: 15, fontFamily: 'NotoSerifBengali', fontWeight: '700', color: Colors.goldLight, marginBottom: 10, marginTop: 4 },

  numRow:  { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  numCard: {
    flex: 1, alignItems: 'center', backgroundColor: Colors.bgCard,
    borderRadius: 14, borderWidth: 1, padding: 10,
  },
  numCardLabel: { fontSize: 11, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary, marginBottom: 8 },
  numCircle: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  numBig:      { fontSize: 22, fontFamily: 'NotoSerifBengali', fontWeight: '700' },
  numCardSub:  { fontSize: 10, fontFamily: 'NotoSerifBengali', color: Colors.textMuted },

  infoCard: {
    backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderLeftWidth: 4, padding: Spacing.md, marginBottom: Spacing.md,
  },
  infoTitle: { fontSize: 15, fontFamily: 'NotoSerifBengali', fontWeight: '700', marginBottom: 8 },
  infoDesc:  { fontSize: 13, fontFamily: 'NotoSerifBengali', color: Colors.textPrimary, lineHeight: 22, marginBottom: 10 },
  infoGrid:  { flexDirection: 'row', gap: 8, marginBottom: 10 },
  infoItem:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 8, alignItems: 'center' },
  infoKey:   { fontSize: 10, fontFamily: 'NotoSerifBengali', color: Colors.textMuted, marginBottom: 4 },
  infoVal:   { fontSize: 12, fontFamily: 'NotoSerifBengali', fontWeight: '700', color: Colors.textPrimary },
  remedyBox: { backgroundColor: 'rgba(201,146,42,0.08)', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: Colors.goldBorder },
  remedyTitle: { fontSize: 11, fontFamily: 'NotoSerifBengali', fontWeight: '700', color: Colors.gold, marginBottom: 4 },
  remedyText:  { fontSize: 12, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary },

  loShuCard: { backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.goldBorder, padding: Spacing.md, marginBottom: Spacing.md },
  loShuDesc: { fontSize: 12, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary, marginBottom: 12, lineHeight: 18 },
  loShuWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  loShuCell: { width: '30%', aspectRatio: 1, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  loShuFilled: { backgroundColor: 'rgba(201,146,42,0.12)', borderColor: Colors.goldBorder },
  loShuEmpty:  { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' },
  loShuNum:    { fontSize: 18, fontFamily: 'NotoSerifBengali', fontWeight: '700' },
  loShuCount:  { fontSize: 10, color: Colors.gold, letterSpacing: 1 },
  loShuMeaning:{ fontSize: 9, fontFamily: 'NotoSerifBengali', textAlign: 'center' },

  tipCard: { backgroundColor: 'rgba(34,197,94,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)', padding: 12, marginBottom: Spacing.md },
  tipText: { fontSize: 12, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary, lineHeight: 20 },
});
