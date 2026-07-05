import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPanchangForDate } from '../engine/panchang_full';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const BN_DAYS   = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];
const BN_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBN = n => String(n).split('').map(d => BN_DIGITS[d]??d).join('');

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtBN(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${BN_DAYS[d.getDay()]}, ${toBN(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${toBN(d.getFullYear())}`;
}

function shiftDay(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={s.infoRow}>
      <MaterialCommunityIcons name={icon} size={16} color={colors.primary} style={{ width: 22 }} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function TimeRow({ icon, label, range, good }) {
  if (!range) return null;
  return (
    <View style={[s.timeRow, good && s.timeRowGood]}>
      <MaterialCommunityIcons name={icon} size={16}
        color={good ? colors.gold : colors.primary} style={{ width: 22 }} />
      <Text style={[s.timeLabel, good && { color: colors.gold }]}>{label}</Text>
      <Text style={s.timeValue}>{range.start} — {range.end}</Text>
    </View>
  );
}

export function PanchangScreen() {
  const [date,      setDate]      = useState(todayISO);
  const [showInput, setShowInput] = useState(false);
  const [inDay,     setInDay]     = useState('');
  const [inMonth,   setInMonth]   = useState('');
  const [inYear,    setInYear]    = useState('');

  const data = useMemo(() => {
    try { return getPanchangForDate(date); } catch (_) { return null; }
  }, [date]);

  function goToInput() {
    const dd = inDay.padStart(2,'0'), mm = inMonth.padStart(2,'0'), yy = inYear;
    if (!yy || yy.length !== 4 || !dd || !mm) return;
    const parsed = new Date(`${yy}-${mm}-${dd}T00:00:00`);
    if (isNaN(parsed.getTime())) return;
    setDate(`${yy}-${mm}-${dd}`);
    setShowInput(false);
    setInDay(''); setInMonth(''); setInYear('');
  }

  const today = todayISO();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.hLine} />
        <Text style={s.brand}>MYASTROLOGY</Text>
        <Text style={s.tagline}>পঞ্চাঙ্গ</Text>
        <View style={s.hLine} />
      </View>

      {/* Date nav bar */}
      <View style={s.navBar}>
        <TouchableOpacity style={s.navBtn} onPress={() => setDate(shiftDay(date, -1))}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={colors.gold} />
        </TouchableOpacity>
        <TouchableOpacity style={s.datePill} onPress={() => setShowInput(v => !v)}>
          <MaterialCommunityIcons name="calendar" size={13} color={colors.primary} />
          <Text style={s.datePillTxt} numberOfLines={1}>{fmtBN(date)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navBtn} onPress={() => setDate(shiftDay(date, 1))}>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Today shortcut */}
        {date !== today && (
          <TouchableOpacity style={s.todayBtn} onPress={() => setDate(today)}>
            <Text style={s.todayTxt}>আজকে ফিরুন</Text>
          </TouchableOpacity>
        )}

        {/* Manual date input */}
        {showInput && (
          <View style={s.inputCard}>
            <View style={s.inputRow}>
              <TextInput style={s.dInput} placeholder="দিন" placeholderTextColor={colors.textSecondary}
                keyboardType="numeric" maxLength={2} value={inDay} onChangeText={setInDay} />
              <Text style={s.sep}>/</Text>
              <TextInput style={s.dInput} placeholder="মাস" placeholderTextColor={colors.textSecondary}
                keyboardType="numeric" maxLength={2} value={inMonth} onChangeText={setInMonth} />
              <Text style={s.sep}>/</Text>
              <TextInput style={[s.dInput, { flex:2 }]} placeholder="বছর" placeholderTextColor={colors.textSecondary}
                keyboardType="numeric" maxLength={4} value={inYear} onChangeText={setInYear} />
              <TouchableOpacity style={s.goBtn} onPress={goToInput}>
                <Text style={s.goTxt}>যাও</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {data ? (
          <>
            {/* Sunrise / Sunset */}
            <View style={s.card}>
              <Text style={s.cardTitle}>সূর্য ও সময়</Text>
              <View style={s.sunRow}>
                {[
                  { icon:'weather-sunset-up',   label:'সূর্যোদয়', val: data.sunrise },
                  { icon:'weather-sunny',        label:'মধ্যাহ্ন',  val: data.transit },
                  { icon:'weather-sunset-down',  label:'সূর্যাস্ত', val: data.sunset  },
                ].map((x, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={s.sunDiv} />}
                    <View style={s.sunItem}>
                      <MaterialCommunityIcons name={x.icon} size={22} color={colors.gold} />
                      <Text style={s.sunLabel}>{x.label}</Text>
                      <Text style={s.sunVal}>{x.val}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* Panchang */}
            <View style={s.card}>
              <Text style={s.cardTitle}>পঞ্চাঙ্গ</Text>
              <InfoRow icon="calendar-star"       label="বার"        value={data.weekday} />
              <View style={s.div} />
              <InfoRow icon="moon-waning-crescent" label="তিথি"       value={`${data.tithi} (${data.paksha})`} />
              <View style={s.div} />
              <InfoRow icon="star-four-points"     label="নক্ষত্র"    value={`${data.nakshatra} (${data.padaName} পদ)`} />
              <View style={s.div} />
              <InfoRow icon="infinity"             label="যোগ"        value={data.yoga} />
              <View style={s.div} />
              <InfoRow icon="yin-yang"             label="করণ"        value={data.karana} />
              <View style={s.div} />
              <InfoRow icon="zodiac-aquarius"      label="চন্দ্ররাশি" value={data.janmaRashi} />
              <View style={s.div} />
              <InfoRow icon="home-variant"         label="লগ্নরাশি"   value={data.lagnaRashi} />
            </View>

            {/* Muhurta */}
            <View style={s.card}>
              <Text style={s.cardTitle}>শুভ ও অশুভ সময়</Text>
              <TimeRow icon="clock-alert-outline"  label="রাহুকাল"         range={data.rahuKala} />
              <View style={s.div} />
              <TimeRow icon="clock-remove-outline" label="গুলিককাল"        range={data.gulika} />
              <View style={s.div} />
              <TimeRow icon="clock-minus-outline"  label="যমগণ্ড"          range={data.yamagnda} />
              <View style={s.div} />
              <TimeRow icon="star-shooting"        label="অভিজিৎ মুহূর্ত" range={data.abhijit} good />
            </View>

            {/* Mrityu Dosha */}
            {(data.mrityuDosha || data.mrityuAlert) && (
              <View style={[s.card, s.doshaCard]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
                <Text style={s.doshaTxt}>
                  {data.mrityuAlert
                    ? 'বিশেষ মৃত্যুদোষ — অতিরিক্ত সতর্কতা আবশ্যক'
                    : 'মৃত্যুদোষ আছে — সাবধানে থাকুন'}
                </Text>
              </View>
            )}

            {/* Ayanamsa */}
            <View style={s.strip}>
              <MaterialCommunityIcons name="rotate-right" size={13} color={colors.primary} />
              <Text style={s.stripTxt}>  লাহিড়ী অয়নাংশ: {data.ayanamsa}</Text>
            </View>
          </>
        ) : (
          <View style={s.card}>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 16 }}>
              গণনায় সমস্যা হয়েছে
            </Text>
          </View>
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

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.headerBg, paddingHorizontal: spacing.md, paddingBottom: 12,
  },
  navBtn:  { width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, borderWidth: 1, borderColor: colors.gold + '44' },
  datePill:{ flex:1, flexDirection:'row', alignItems:'center', gap:6, marginHorizontal:10,
    paddingHorizontal:14, paddingVertical:8, borderRadius:20,
    borderWidth:1, borderColor: colors.gold+'44', backgroundColor: colors.card },
  datePillTxt: { fontSize:12, color: colors.text, fontWeight:'600', flex:1 },

  scroll:   { flex:1, backgroundColor: colors.background },
  content:  { paddingBottom: 40 },

  todayBtn: { alignSelf:'center', marginTop:10, paddingHorizontal:16, paddingVertical:6,
    borderRadius:20, backgroundColor: colors.goldLight,
    borderWidth:1, borderColor: colors.cardBorder },
  todayTxt: { fontSize:12, color: colors.primaryDark, fontWeight:'600' },

  inputCard:{ backgroundColor: colors.card, margin: spacing.md, marginBottom:0,
    borderRadius:12, borderWidth:1, borderColor: colors.cardBorder, padding: spacing.sm },
  inputRow: { flexDirection:'row', alignItems:'center', gap:6 },
  dInput:   { flex:1, textAlign:'center', fontSize:16, fontWeight:'700', color: colors.text,
    backgroundColor: colors.background, borderRadius:8, paddingVertical:8,
    borderWidth:1, borderColor: colors.cardBorder },
  sep:      { fontSize:18, color: colors.textSecondary },
  goBtn:    { backgroundColor: colors.headerBg, borderRadius:8,
    paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor: colors.gold },
  goTxt:    { color: colors.gold, fontWeight:'700', fontSize:13 },

  card: { margin: spacing.md, marginBottom:0, backgroundColor: colors.card,
    borderRadius:16, borderWidth:1, borderColor: colors.cardBorder, padding: spacing.md },
  cardTitle:{ fontSize:11, fontWeight:'700', color: colors.textSecondary,
    letterSpacing:1.5, textTransform:'uppercase', marginBottom: spacing.sm },

  sunRow:  { flexDirection:'row', alignItems:'center' },
  sunItem: { flex:1, alignItems:'center', paddingVertical:8 },
  sunDiv:  { width:1, height:50, backgroundColor: colors.divider },
  sunLabel:{ fontSize:11, color: colors.textSecondary, marginTop:4 },
  sunVal:  { fontSize:16, fontWeight:'800', color: colors.text, marginTop:2 },

  infoRow: { flexDirection:'row', alignItems:'center', paddingVertical:10 },
  infoLabel:{ flex:1, fontSize:13, color: colors.textSecondary, marginLeft:8 },
  infoValue:{ fontSize:14, color: colors.text, fontWeight:'700' },

  timeRow: { flexDirection:'row', alignItems:'center', paddingVertical:10 },
  timeRowGood:{ backgroundColor: colors.goldLight+'55', borderRadius:8, paddingHorizontal:4 },
  timeLabel:{ flex:1, fontSize:13, color: colors.textSecondary, marginLeft:8 },
  timeValue:{ fontSize:13, color: colors.text, fontWeight:'600' },

  div: { height:1, backgroundColor: colors.divider },

  doshaCard:{ flexDirection:'row', alignItems:'center', gap:10,
    backgroundColor:'#FEF2F2', borderColor:'#FECACA' },
  doshaTxt: { flex:1, fontSize:13, color:'#DC2626', fontWeight:'600' },

  strip: { flexDirection:'row', alignItems:'center', justifyContent:'center',
    marginTop: spacing.md, paddingVertical:6 },
  stripTxt:{ fontSize:11, color: colors.textSecondary },
});
