import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getTodayRashifal } from '../engine/rashifal';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const RASHI_IMAGES = [
  require('../assets/rashi/aries.png'),
  require('../assets/rashi/taurus.png'),
  require('../assets/rashi/gemini.png'),
  require('../assets/rashi/cancer.png'),
  require('../assets/rashi/leo.png'),
  require('../assets/rashi/virgo.png'),
  require('../assets/rashi/libra.png'),
  require('../assets/rashi/scorpio.png'),
  require('../assets/rashi/sagittarius.png'),
  require('../assets/rashi/capricorn.png'),
  require('../assets/rashi/aquarius.png'),
  require('../assets/rashi/pisces.png'),
];

const data = getTodayRashifal();

const TAG_COLOR = {
  'অতিশুভ':  { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
  'বিশেষ শুভ':{ bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },
  'শুভ':      { bg: '#FFF8E1', text: '#F57F17', border: '#FFE082' },
  'মিশ্র':    { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' },
  'সতর্কতা':  { bg: '#FCE4EC', text: '#B71C1C', border: '#F48FB1' },
};

const SCORE_ICONS = {
  love:    { icon: 'heart',          label: 'প্রেম' },
  work:    { icon: 'briefcase',      label: 'কর্ম' },
  health:  { icon: 'heart-pulse',    label: 'স্বাস্থ্য' },
  finance: { icon: 'cash-multiple',  label: 'অর্থ' },
};

function ScoreBar({ value }) {
  return (
    <View style={styles.scoreBarTrack}>
      {[1,2,3,4,5].map(i => (
        <View key={i} style={[styles.scoreBarDot, i <= value && styles.scoreBarDotFill]} />
      ))}
    </View>
  );
}

function RashiGrid({ selected, onSelect }) {
  return (
    <View style={styles.grid}>
      {data.rashifal.map((r) => {
        const isSelected = selected === r.rashiIndex;
        const tc = TAG_COLOR[r.tag] || TAG_COLOR['মিশ্র'];
        return (
          <TouchableOpacity
            key={r.rashiIndex}
            style={[styles.gridCell, isSelected && styles.gridCellSelected]}
            onPress={() => onSelect(r.rashiIndex)}
            activeOpacity={0.7}
          >
            <Image
              source={RASHI_IMAGES[r.rashiIndex]}
              style={[styles.gridImg, isSelected && styles.gridImgSelected]}
              resizeMode="contain"
            />
            <Text style={[styles.gridName, isSelected && styles.gridNameSelected]}>{r.rashi}</Text>
            <View style={[styles.gridTag, { backgroundColor: tc.bg, borderColor: tc.border }]}>
              <Text style={[styles.gridTagText, { color: tc.text }]}>{r.tag}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function DetailCard({ rashifal }) {
  const tc = TAG_COLOR[rashifal.tag] || TAG_COLOR['মিশ্র'];
  return (
    <View style={styles.detailCard}>
      <View style={styles.detailHeader}>
        <Image source={RASHI_IMAGES[rashifal.rashiIndex]} style={styles.detailImg} resizeMode="contain" />
        <View style={styles.detailTitleRow}>
          <Text style={styles.detailRashi}>{rashifal.rashi}</Text>
          <View style={[styles.tagBadge, { backgroundColor: tc.bg, borderColor: tc.border }]}>
            <Text style={[styles.tagBadgeText, { color: tc.text }]}>{rashifal.tag}</Text>
          </View>
        </View>
        <Text style={styles.detailMeta}>{rashifal.lord} · {rashifal.element} · ভাব {rashifal.house}</Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.summaryText}>{rashifal.summary}</Text>

      <View style={styles.divider} />

      <View style={styles.scoresContainer}>
        {Object.entries(SCORE_ICONS).map(([key, info]) => (
          <View key={key} style={styles.scoreRow}>
            <MaterialCommunityIcons name={info.icon} size={16} color={colors.primary} />
            <Text style={styles.scoreLabel}>{info.label}</Text>
            <ScoreBar value={rashifal.score[key]} />
            <Text style={styles.scoreNum}>{rashifal.score[key]}/৫</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="diamond-stone" size={16} color={colors.gold} />
          <Text style={styles.infoLabel}>রত্নপাথর</Text>
          <Text style={styles.infoValue}>{rashifal.gem}</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="compass-outline" size={16} color={colors.gold} />
          <Text style={styles.infoLabel}>শুভ দিক</Text>
          <Text style={styles.infoValue}>{rashifal.direction}</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="numeric" size={16} color={colors.gold} />
          <Text style={styles.infoLabel}>শুভ সংখ্যা</Text>
          <Text style={styles.infoValue}>{rashifal.luckyNums.join(', ')}</Text>
        </View>
      </View>

      <View style={[styles.adviceBox, { borderLeftColor: tc.text }]}>
        <MaterialCommunityIcons name="lightbulb-outline" size={15} color={tc.text} />
        <Text style={[styles.adviceText, { color: tc.text }]}>{rashifal.advice}</Text>
      </View>
    </View>
  );
}

export function RashifalScreen() {
  const [selected, setSelected] = useState(null);
  const selectedData = selected !== null ? data.rashifal[selected] : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topLine} />
        <Text style={styles.brand}>MyAstrology</Text>
        <Text style={styles.tagline}>✦ রাশিফল ✦</Text>
        <View style={styles.bottomLine} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.moonBar}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={16} color={colors.gold} />
          <Text style={styles.moonText}>আজ চন্দ্র <Text style={styles.moonRashi}>{data.moonRashiName}</Text> রাশিতে</Text>
        </View>

        <RashiGrid selected={selected} onSelect={setSelected} />

        {selectedData && <DetailCard rashifal={selectedData} />}

        {selected === null && (
          <View style={styles.hint}>
            <MaterialCommunityIcons name="gesture-tap" size={20} color={colors.textSecondary} />
            <Text style={styles.hintText}>রাশি বেছে নিন</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.headerBg, paddingTop: 48, paddingBottom: 20, alignItems: 'center',
  },
  topLine:    { width: 60, height: 1.5, backgroundColor: colors.gold, marginBottom: 14, opacity: 0.7 },
  brand:      { fontSize: 26, fontWeight: '700', color: colors.gold, letterSpacing: 3, textTransform: 'uppercase' },
  tagline:    { fontSize: 13, color: colors.goldLight, marginTop: 4, letterSpacing: 2, opacity: 0.85 },
  bottomLine: { width: 60, height: 1.5, backgroundColor: colors.gold, marginTop: 14, opacity: 0.7 },
  content:    { padding: spacing.md, paddingBottom: 40 },
  moonBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.cardBorder, alignSelf: 'center', marginBottom: spacing.md,
  },
  moonText:  { fontSize: 13, color: colors.textSecondary },
  moonRashi: { fontWeight: '700', color: colors.text },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md,
  },
  gridCell: {
    width: '30.5%', backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4,
  },
  gridCellSelected: {
    borderColor: colors.gold, borderWidth: 2, backgroundColor: colors.goldLight,
  },
  gridImg:         { width: 38, height: 38, marginBottom: 4, opacity: 0.7 },
  gridImgSelected: { opacity: 1 },
  gridName:         { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 },
  gridNameSelected: { color: colors.primaryDark },
  gridTag:  {
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, borderWidth: 1,
  },
  gridTagText: { fontSize: 9, fontWeight: '600' },
  detailCard: {
    backgroundColor: colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: colors.cardBorder, padding: spacing.md, marginTop: 4,
  },
  detailHeader:  { alignItems: 'center', marginBottom: spacing.sm },
  detailImg:     { width: 72, height: 72, marginBottom: 8 },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailRashi:   { fontSize: 22, fontWeight: '700', color: colors.text },
  tagBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  tagBadgeText:  { fontSize: 11, fontWeight: '700' },
  detailMeta:    { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  divider:       { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  summaryText:   { fontSize: 14, color: colors.text, lineHeight: 22, textAlign: 'center' },
  scoresContainer: { gap: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreLabel:    { fontSize: 13, color: colors.textSecondary, width: 52 },
  scoreBarTrack: { flex: 1, flexDirection: 'row', gap: 4 },
  scoreBarDot: {
    flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.divider,
  },
  scoreBarDotFill: { backgroundColor: colors.primary },
  scoreNum: { fontSize: 12, color: colors.textSecondary, width: 24, textAlign: 'right' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around' },
  infoItem: { alignItems: 'center', gap: 3 },
  infoLabel: { fontSize: 11, color: colors.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  adviceBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginTop: spacing.sm, paddingLeft: 10, borderLeftWidth: 3,
  },
  adviceText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' },
  hint: { alignItems: 'center', marginTop: 24, gap: 8 },
  hintText: { fontSize: 13, color: colors.textSecondary },
});
