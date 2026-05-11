// src/screens/PanjikaScreen.js — সম্পূর্ণ নেটিভ পঞ্জিকা স্ক্রিন
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTodayPanjika, getNextTithiChange,
  getBengaliDate, getMuhurtas, getMonthPanjika, toBn,
} from '../engine/panjika';
import {
  scheduleTithiChangeNotification,
  cancelAllScheduled,
} from '../NotificationService';
import { Colors, Spacing } from '../theme';

const WEEK_SHORT = ['র', 'স', 'ম', 'বু', 'বৃ', 'শু', 'শ'];
const PAKSHA_COLOR = { 0: Colors.goldLight, 1: Colors.moon };

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// ── Small components ────────────────────────────────────

function InfoRow({ label, value, color }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function TimeBlock({ label, time, auspicious }) {
  const bg = auspicious ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.10)';
  const border = auspicious ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)';
  const dot = auspicious ? '#22c55e' : '#ef4444';
  return (
    <View style={[styles.timeBlock, { backgroundColor: bg, borderColor: border }]}>
      <View style={[styles.timeDot, { backgroundColor: dot }]} />
      <Text style={styles.timeBlockLabel}>{label}</Text>
      <Text style={styles.timeBlockValue}>{time}</Text>
    </View>
  );
}

function PanchaCell({ icon, label, value }) {
  return (
    <View style={styles.panchaCell}>
      <Text style={styles.panchaCellIcon}>{icon}</Text>
      <Text style={styles.panchaCellLabel}>{label}</Text>
      <Text style={styles.panchaCellValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────

export default function PanjikaScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [panjika, setPanjika] = useState(null);
  const [bnDate, setBnDate] = useState(null);
  const [muhurtas, setMuhurtas] = useState(null);
  const [monthData, setMonthData] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tithiNotif, setTithiNotif] = useState(false);
  const calHeight = useRef(new Animated.Value(0)).current;

  // Load notification preference
  useEffect(() => {
    AsyncStorage.getItem('tithiNotif').then(v => setTithiNotif(v === '1'));
  }, []);

  // Compute panjika data whenever date changes
  useEffect(() => {
    const p = getTodayPanjika(selectedDate);
    setPanjika(p);
    setBnDate(getBengaliDate(selectedDate));
    setMuhurtas(getMuhurtas(selectedDate));
  }, [selectedDate]);

  // Load month calendar data
  useEffect(() => {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth() + 1;
    setMonthData(getMonthPanjika(y, m));
  }, [selectedDate.getFullYear(), selectedDate.getMonth()]);

  // Toggle calendar
  const toggleCalendar = useCallback(() => {
    const toValue = showCalendar ? 0 : 1;
    setShowCalendar(!showCalendar);
    Animated.spring(calHeight, {
      toValue,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  }, [showCalendar, calHeight]);

  // Toggle tithi notification
  const toggleTithiNotif = useCallback(async (val) => {
    setTithiNotif(val);
    await AsyncStorage.setItem('tithiNotif', val ? '1' : '0');
    if (val) {
      await scheduleTithiChangeNotification();
    }
  }, []);

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  const calMaxHeight = calHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 320],
  });

  if (!panjika || !bnDate || !muhurtas) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, styles.centered]}>
        <Text style={styles.loadingText}>গণনা হচ্ছে...</Text>
      </View>
    );
  }

  // Build calendar grid
  const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const startPad = firstDay.getDay(); // Sun=0
  const calCells = [];
  for (let i = 0; i < startPad; i++) calCells.push(null);
  for (const d of monthData) calCells.push(d);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── বাংলা তারিখ ব্যানার ── */}
        <View style={styles.bnDateBanner}>
          <Text style={styles.bnDateText}>
            {bnDate.dayName}, {toBn(bnDate.day)} {bnDate.monthName} {toBn(bnDate.year)}
          </Text>
          <Text style={styles.gregDateText}>
            {selectedDate.toLocaleDateString('bn-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* ── তারিখ নেভিগেশন ── */}
        <View style={styles.dateNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => setSelectedDate(d => addDays(d, -1))}>
            <Text style={styles.navBtnText}>◀ আগের দিন</Text>
          </TouchableOpacity>
          {!isToday && (
            <TouchableOpacity style={styles.todayBtn} onPress={() => setSelectedDate(new Date())}>
              <Text style={styles.todayBtnText}>আজ</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.navBtn} onPress={() => setSelectedDate(d => addDays(d, 1))}>
            <Text style={styles.navBtnText}>পরের দিন ▶</Text>
          </TouchableOpacity>
        </View>

        {/* ── পঞ্চাঙ্গ গ্রিড ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✨ পঞ্চাঙ্গ</Text>
          <View style={styles.panchaGrid}>
            <PanchaCell icon="🌙" label="তিথি"     value={panjika.tithi} />
            <PanchaCell icon="⭐" label="নক্ষত্র"  value={panjika.nakshatra} />
            <PanchaCell icon="☯"  label="যোগ"      value={panjika.yoga} />
            <PanchaCell icon="🔢" label="করণ"      value={panjika.karana} />
          </View>
        </View>

        {/* ── সূর্যোদয়/অস্ত ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>☀️ সূর্য সময়</Text>
          <View style={styles.sunRow}>
            <View style={styles.sunItem}>
              <Text style={styles.sunIcon}>🌅</Text>
              <Text style={styles.sunLabel}>সূর্যোদয়</Text>
              <Text style={styles.sunValue}>{panjika.sunrise}</Text>
            </View>
            <View style={styles.sunDivider} />
            <View style={styles.sunItem}>
              <Text style={styles.sunIcon}>🌇</Text>
              <Text style={styles.sunLabel}>সূর্যাস্ত</Text>
              <Text style={styles.sunValue}>{panjika.sunset}</Text>
            </View>
          </View>
        </View>

        {/* ── শুভ মুহূর্ত ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🟢 শুভ মুহূর্ত</Text>
          <TimeBlock label={muhurtas.brahma.label}  time={`${muhurtas.brahma.start} – ${muhurtas.brahma.end}`}  auspicious />
          <TimeBlock label={muhurtas.abhijit.label} time={`${muhurtas.abhijit.start} – ${muhurtas.abhijit.end}`} auspicious />
          <TimeBlock label={muhurtas.godhuli.label} time={`${muhurtas.godhuli.start} – ${muhurtas.godhuli.end}`} auspicious />
          <TimeBlock label="অমৃতযোগ" time={panjika.amrit} auspicious />
        </View>

        {/* ── অশুভ সময় ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔴 অশুভ সময়</Text>
          <TimeBlock label={muhurtas.rahukal.label}   time={`${muhurtas.rahukal.start} – ${muhurtas.rahukal.end}`}   auspicious={false} />
          <TimeBlock label={muhurtas.yamaganda.label} time={`${muhurtas.yamaganda.start} – ${muhurtas.yamaganda.end}`} auspicious={false} />
          <TimeBlock label={muhurtas.gulika.label}    time={`${muhurtas.gulika.start} – ${muhurtas.gulika.end}`}    auspicious={false} />
        </View>

        {/* ── তিথি নোটিফিকেশন টগল ── */}
        <View style={[styles.card, styles.notifRow]}>
          <View style={styles.notifText}>
            <Text style={styles.notifTitle}>🔔 তিথি পরিবর্তন বিজ্ঞপ্তি</Text>
            <Text style={styles.notifSub}>তিথি বদলালে স্বয়ংক্রিয় নোটিফিকেশন পাবেন</Text>
          </View>
          <Switch
            value={tithiNotif}
            onValueChange={toggleTithiNotif}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: Colors.goldGlowStrong }}
            thumbColor={tithiNotif ? Colors.gold : Colors.textMuted}
          />
        </View>

        {/* ── মাসিক ক্যালেন্ডার (কোলাপসিবল) ── */}
        <TouchableOpacity style={styles.calToggleBtn} onPress={toggleCalendar} activeOpacity={0.8}>
          <Text style={styles.calToggleText}>
            📅 {bnDate.monthName} মাসের পঞ্জিকা {showCalendar ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        <Animated.View style={[styles.calWrapper, { maxHeight: calMaxHeight, overflow: 'hidden' }]}>
          <View style={styles.calCard}>
            {/* Week headers */}
            <View style={styles.calWeekRow}>
              {WEEK_SHORT.map(w => (
                <Text key={w} style={styles.calWeekHead}>{w}</Text>
              ))}
            </View>
            {/* Calendar cells */}
            {Array.from({ length: Math.ceil(calCells.length / 7) }).map((_, ri) => (
              <View key={ri} style={styles.calRow}>
                {calCells.slice(ri * 7, ri * 7 + 7).map((cell, ci) => {
                  if (!cell) return <View key={ci} style={styles.calCell} />;
                  const isSelected = isSameDay(cell.date, selectedDate);
                  const isPurnima = cell.isPurnima;
                  const isAmabasya = cell.isAmabasya;
                  const tColor = cell.paksha === 0 ? '#e8bc5a' : '#94a3b8';
                  return (
                    <TouchableOpacity
                      key={ci}
                      style={[
                        styles.calCell,
                        isSelected && styles.calCellSelected,
                        isPurnima && styles.calCellPurnima,
                        isAmabasya && styles.calCellAmabasya,
                      ]}
                      onPress={() => setSelectedDate(cell.date)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.calDayNum, isSelected && styles.calDayNumSelected]}>
                        {toBn(cell.d)}
                      </Text>
                      <Text style={[styles.calTithi, { color: tColor }]} numberOfLines={1}>
                        {cell.tithi.slice(0, 4)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            {/* Legend */}
            <View style={styles.calLegend}>
              <View style={[styles.calLegendDot, { backgroundColor: 'rgba(250,204,21,0.3)' }]} />
              <Text style={styles.calLegendText}>পূর্ণিমা</Text>
              <View style={[styles.calLegendDot, { backgroundColor: 'rgba(148,163,184,0.3)', marginLeft: 12 }]} />
              <Text style={styles.calLegendText}>অমাবস্যা</Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },
  scroll:      { padding: Spacing.md },
  centered:    { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.gold, fontSize: 16, fontFamily: 'NotoSerifBengali' },

  bnDateBanner: {
    alignItems: 'center', paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.goldBorder,
    marginBottom: Spacing.md,
  },
  bnDateText: {
    fontSize: 20, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight, textAlign: 'center',
  },
  gregDateText: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, marginTop: 4,
  },

  dateNav: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  navBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.goldBorder,
    backgroundColor: Colors.bgCard,
  },
  navBtnText: { fontSize: 13, fontFamily: 'NotoSerifBengali', color: Colors.goldLight },
  todayBtn: {
    paddingHorizontal: 18, paddingVertical: 7,
    borderRadius: 20, backgroundColor: Colors.goldGlowStrong,
    borderWidth: 1, borderColor: Colors.gold,
  },
  todayBtnText: { fontSize: 13, fontFamily: 'NotoSerifBengali', color: Colors.gold, fontWeight: '700' },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.goldBorder,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 15, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight, marginBottom: Spacing.sm,
  },

  panchaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  panchaCell: {
    width: '47%', backgroundColor: 'rgba(201,146,42,0.07)',
    borderRadius: 12, borderWidth: 1, borderColor: Colors.goldBorder,
    padding: Spacing.sm, alignItems: 'center',
  },
  panchaCellIcon:  { fontSize: 22, marginBottom: 2 },
  panchaCellLabel: { fontSize: 11, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary, marginBottom: 2 },
  panchaCellValue: { fontSize: 14, fontFamily: 'NotoSerifBengali', fontWeight: '700', color: Colors.text, textAlign: 'center' },

  sunRow:    { flexDirection: 'row', alignItems: 'center' },
  sunItem:   { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
  sunDivider:{ width: 1, height: 50, backgroundColor: Colors.goldBorder },
  sunIcon:   { fontSize: 26, marginBottom: 4 },
  sunLabel:  { fontSize: 12, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary },
  sunValue:  { fontSize: 15, fontFamily: 'NotoSerifBengali', fontWeight: '700', color: Colors.goldLight, marginTop: 2 },

  timeBlock: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, borderWidth: 1,
    padding: Spacing.sm, marginBottom: 6,
    gap: 8,
  },
  timeDot:        { width: 8, height: 8, borderRadius: 4 },
  timeBlockLabel: { flex: 1, fontSize: 13, fontFamily: 'NotoSerifBengali', color: Colors.text },
  timeBlockValue: { fontSize: 13, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary },

  notifRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifText:  { flex: 1, marginRight: Spacing.sm },
  notifTitle: { fontSize: 14, fontFamily: 'NotoSerifBengali', fontWeight: '700', color: Colors.text },
  notifSub:   { fontSize: 12, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary, marginTop: 2 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.goldBorder },
  infoLabel: { fontSize: 13, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary },
  infoValue: { fontSize: 13, fontFamily: 'NotoSerifBengali', color: Colors.text, fontWeight: '600' },

  calToggleBtn: {
    backgroundColor: Colors.bgCard, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.goldBorder,
    padding: Spacing.md, alignItems: 'center', marginBottom: 8,
  },
  calToggleText: { fontSize: 14, fontFamily: 'NotoSerifBengali', color: Colors.goldLight, fontWeight: '600' },

  calWrapper: {},
  calCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.goldBorder,
    padding: Spacing.sm, marginBottom: Spacing.md,
  },
  calWeekRow:  { flexDirection: 'row', marginBottom: 4 },
  calWeekHead: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'NotoSerifBengali', color: Colors.textMuted },
  calRow:      { flexDirection: 'row', marginBottom: 2 },
  calCell:     { flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: 6, minHeight: 42 },
  calCellSelected: { backgroundColor: Colors.goldGlowStrong, borderWidth: 1, borderColor: Colors.gold },
  calCellPurnima:  { backgroundColor: 'rgba(250,204,21,0.12)' },
  calCellAmabasya: { backgroundColor: 'rgba(148,163,184,0.10)' },
  calDayNum:        { fontSize: 13, fontFamily: 'NotoSerifBengali', color: Colors.text, fontWeight: '600' },
  calDayNumSelected:{ color: Colors.gold },
  calTithi:         { fontSize: 9, fontFamily: 'NotoSerifBengali' },
  calLegend:        { flexDirection: 'row', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: Colors.goldBorder },
  calLegendDot:     { width: 10, height: 10, borderRadius: 5 },
  calLegendText:    { fontSize: 11, fontFamily: 'NotoSerifBengali', color: Colors.textSecondary, marginLeft: 4 },
});
