import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import PANJIKA_IMAGES from '../engine/panjika-images';
import { getPanchangForDate, getMonthCalendar, getBengaliDate } from '../engine/panchang_full';
import { getFestivalsForMonth } from '../engine/bengali_festivals';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const LOGO = require('../../assets/logo.png');
const { width: SW } = Dimensions.get('window');

const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBN = n => String(n).split('').map(d => BN_DIGITS[+d] ?? d).join('');

const EN_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const BN_MONTHS_EN = [
  'জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন',
  'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর',
];
const WD_SHORT = ['রবি','সোম','মঙ্গ','বুধ','বৃহঃ','শুক্র','শনি'];

const INNER_TABS = [
  { key: 'today',   label: 'আজ' },
  { key: 'calendar',label: 'পঞ্জিকা' },
  { key: 'festival',label: 'এই মাসের শুভ দিন' },
  { key: 'old',     label: 'পুরনো বছরের পঞ্জিকা' },
  { key: 'pdf',     label: 'PDF ডাউনলোড' },
];

// ── Small shared components ──────────────────────────────────────────────────

function SectionHead({ label }) {
  return (
    <View style={s.secHead}>
      <View style={s.secDot} />
      <Text style={s.secLabel}>{label}</Text>
      <View style={s.secLine} />
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={s.infoRow}>
      <MaterialCommunityIcons name={icon} size={14} color={colors.primary} style={s.infoIcon} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value || '—'}</Text>
    </View>
  );
}

function TimeRow({ icon, label, start, end }) {
  const range = (start && end) ? `${start} – ${end}` : (start || end || '—');
  return (
    <View style={s.infoRow}>
      <MaterialCommunityIcons name={icon} size={14} color={colors.primary} style={s.infoIcon} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{range}</Text>
    </View>
  );
}

function PanchangCard({ icon, label, value, timeStart, timeEnd }) {
  const time = (timeStart && timeEnd) ? `${timeStart} – ${timeEnd}` : (timeEnd || timeStart || null);
  return (
    <View style={s.panCard}>
      <View style={s.panCardHeader}>
        <MaterialCommunityIcons name={icon} size={12} color={colors.primary} />
        <Text style={s.panCardLabel}>{label}</Text>
      </View>
      <Text style={s.panCardValue} numberOfLines={1} adjustsFontSizeToFit>{value || '—'}</Text>
      {time ? <Text style={s.panCardTime}>{time}</Text> : null}
    </View>
  );
}

// ── Today Tab ────────────────────────────────────────────────────────────────

function TodayTab({ data, todayStr }) {
  if (!data) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.gold} />;

  const today   = new Date();
  const enDate  = `${today.getDate()} ${EN_MONTHS[today.getMonth()]} ${today.getFullYear()}`;
  const bnDate  = data.bengaliDay
    ? `${toBN(data.bengaliDay)} ${data.bengaliMonth} ${toBN(data.bengaliYear)} বঙ্গাব্দ`
    : '—';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.todayContent}>

      {/* Date header */}
      <View style={s.dateCard}>
        <Text style={s.dateCardBn}>{bnDate}</Text>
        <View style={s.dateCardMeta}>
          <Text style={s.dateCardMetaTxt}>{enDate}</Text>
          <View style={s.metaDot} />
          <Text style={s.dateCardMetaTxt}>{data.weekday}</Text>
          <View style={s.metaDot} />
          <Text style={s.dateCardMetaTxt}>{data.ritu}</Text>
        </View>
        <View style={s.pakshaBadge}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={12} color={colors.primary} />
          <Text style={s.pakshaBadgeText}>{data.paksha}</Text>
        </View>
      </View>

      {/* পঞ্চাঙ্গ বিস্তার */}
      <SectionHead label="পঞ্চাঙ্গ বিস্তার" />
      <View style={s.panGrid}>
        <PanchangCard icon="moon-waning-crescent" label="তিথি"
          value={data.tithi} timeStart={data.tithiStart} timeEnd={data.tithiEnd} />
        <View style={s.panVDiv} />
        <PanchangCard icon="star-four-points" label="নক্ষত্র"
          value={`${data.nakshatra} (${data.padaName} পাদ)`}
          timeStart={data.nakshatraStart} timeEnd={data.nakshatraEnd} />
      </View>
      <View style={[s.panGrid, { borderTopWidth: 1, borderTopColor: colors.divider }]}>
        <PanchangCard icon="infinity" label="যোগ"
          value={data.yoga} timeStart={data.yogaStart} timeEnd={data.yogaEnd} />
        <View style={s.panVDiv} />
        <PanchangCard icon="hexagon-outline" label="করণ" value={data.karana} />
      </View>

      {/* সূর্য ও লগ্ন */}
      <SectionHead label="সূর্যোদয় ও সূর্যাস্ত" />
      <View style={s.infoCard}>
        <InfoRow icon="weather-sunset-up"   label="সূর্যোদয়"   value={data.sunrise} />
        <View style={s.infoDiv} />
        <InfoRow icon="weather-sunset-down" label="সূর্যাস্ত"   value={data.sunset}  />
        <View style={s.infoDiv} />
        <InfoRow icon="sun-clock"           label="মধ্যাহ্ন"    value={data.transit} />
      </View>

      {/* মুহূর্ত */}
      <SectionHead label="শুভ মুহূর্ত" />
      <View style={s.infoCard}>
        <TimeRow icon="weather-night" label="ব্রহ্ম মুহূর্ত"
          start={data.brahmaM?.start} end={data.brahmaM?.end} />
        <View style={s.infoDiv} />
        <TimeRow icon="white-balance-sunny" label="অভিজিৎ"
          start={data.abhijit?.start} end={data.abhijit?.end} />
      </View>

      {/* অশুভ কাল */}
      <SectionHead label="অশুভ কাল" />
      <View style={s.infoCard}>
        <TimeRow icon="alert-circle-outline" label="রাহুকাল"
          start={data.rahuKala?.start} end={data.rahuKala?.end} />
        <View style={s.infoDiv} />
        <TimeRow icon="clock-alert-outline" label="গুলিক কাল"
          start={data.gulika?.start} end={data.gulika?.end} />
        <View style={s.infoDiv} />
        <TimeRow icon="timer-off-outline" label="যমঘণ্টা"
          start={data.yamagnda?.start} end={data.yamagnda?.end} />
        <View style={s.infoDiv} />
        <TimeRow icon="shield-alert-outline" label="বারেবলা"
          start={data.varebela?.start} end={data.varebela?.end} />
      </View>

      {/* মৃত্যু দোষ */}
      {data.mrityuDosha && (
        <>
          <SectionHead label="মৃত্যু দোষ" />
          <View style={[s.infoCard, s.mrityuCard]}>
            <MaterialCommunityIcons name="alert" size={16} color="#dc2626" />
            <Text style={s.mrityuText}>
              {data.mrityuAlert
                ? 'এই দিনে মৃত্যু দোষ বিদ্যমান। বিশেষ সতর্কতা অবলম্বন করুন।'
                : 'এই দিনে মৃত্যু দোষের প্রভাব রয়েছে।'}
            </Text>
          </View>
        </>
      )}

      {/* লগ্ন ও অয়নাংশ */}
      <SectionHead label="লগ্ন ও অয়নাংশ" />
      <View style={s.infoCard}>
        <InfoRow icon="star-circle"    label="লগ্ন রাশি"  value={data.lagnaRashi} />
        <View style={s.infoDiv} />
        <InfoRow icon="zodiac-aquarius" label="জন্ম রাশি" value={data.janmaRashi} />
        <View style={s.infoDiv} />
        <InfoRow icon="rotate-orbit"   label="লাহিড়ি অয়নাংশ" value={data.ayanamsa} />
      </View>

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

// ── Calendar Tab ─────────────────────────────────────────────────────────────

function CalendarTab({ initYear, initMonth, todayStr }) {
  const [year,  setYear]  = useState(initYear);
  const [month, setMonth] = useState(initMonth);

  const days = useMemo(() => getMonthCalendar(year, month), [year, month]);

  const firstWd = days[0]?.weekday ?? 0;
  const cells   = useMemo(() => {
    const blanks = Array.from({ length: firstWd }, (_, i) => ({ key: `b${i}`, blank: true }));
    return [...blanks, ...days.map(d => ({ ...d, key: d.dateStr }))];
  }, [days, firstWd]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const cellW = (SW - spacing.md * 2 - 1) / 7;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
      {/* Month nav */}
      <View style={s.calNav}>
        <TouchableOpacity onPress={prevMonth} style={s.calNavBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.calNavTitle}>
          {BN_MONTHS_EN[month]} {toBN(year)}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={s.calNavBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={s.calWdRow}>
        {WD_SHORT.map(w => (
          <View key={w} style={[s.calWdCell, { width: cellW }]}>
            <Text style={[s.calWdText, w === 'রবি' && { color: '#dc2626' }]}>{w}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={s.calGrid}>
        {cells.map(cell => {
          if (cell.blank) return <View key={cell.key} style={[s.calCell, { width: cellW }]} />;
          const isToday = cell.dateStr === todayStr;
          const isSun   = cell.weekday === 0;
          return (
            <View key={cell.key} style={[
              s.calCell,
              { width: cellW },
              isToday && s.calCellToday,
            ]}>
              {cell.bengaliDay !== null && (
                <Text style={[s.calBnDay, isToday && { color: colors.gold }]}>
                  {toBN(cell.bengaliDay)}
                </Text>
              )}
              <Text style={[s.calEnDay, isSun && { color: '#dc2626' }, isToday && { color: colors.gold }]}>
                {cell.day}
              </Text>
              <Text style={s.calTithi} numberOfLines={1}>{cell.tithi.slice(0,4)}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── Festival Tab ─────────────────────────────────────────────────────────────

function FestivalTab({ year, month }) {
  const items = useMemo(() => {
    const cal = getMonthCalendar(year, month);
    return getFestivalsForMonth(year, month, cal);
  }, [year, month]);

  if (items.length === 0) {
    return (
      <View style={s.emptyBox}>
        <MaterialCommunityIcons name="calendar-blank" size={32} color={colors.textSecondary} />
        <Text style={s.emptyText}>এই মাসে কোনো বিশেষ দিন নেই</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.festContent}>
      <Text style={s.festMonthTitle}>{BN_MONTHS_EN[month]} {toBN(year)}</Text>
      {items.map((item, idx) => {
        const d = new Date(item.dateStr + 'T00:00:00');
        const dayNum  = d.getDate();
        const wd      = WD_SHORT[d.getDay()];
        const bnDate  = getBengaliDate(item.dateStr);
        const bnDayStr = bnDate ? `${toBN(bnDate.day)} ${bnDate.monthName}` : '';
        return (
          <View key={idx} style={s.festItem}>
            {item.imageKey && PANJIKA_IMAGES[item.imageKey]
              ? <Image source={PANJIKA_IMAGES[item.imageKey]} style={s.festImg} />
              : (
                <View style={s.festDateBox}>
                  <Text style={s.festDayNum}>{toBN(dayNum)}</Text>
                  <Text style={s.festWd}>{wd}</Text>
                </View>
              )
            }
            <View style={s.festInfo}>
              <Text style={s.festName}>{item.name}</Text>
              <Text style={s.festBnDate}>{toBN(dayNum)} {wd} · {bnDayStr || ''}</Text>
            </View>
            <View style={[
              s.festBadge,
              item.type === 'জাতীয়'       && { backgroundColor: '#fef3c7' },
              item.type === 'জন্মবার্ষিকী' && { backgroundColor: '#eff6ff' },
            ]}>
              <Text style={[
                s.festBadgeText,
                item.type === 'জাতীয়'       && { color: '#b45309' },
                item.type === 'জন্মবার্ষিকী' && { color: '#1d4ed8' },
              ]}>
                {item.type}
              </Text>
            </View>
          </View>
        );
      })}
      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

// ── Old Years Tab ─────────────────────────────────────────────────────────────

const OLD_YEARS = [2023, 2024, 2025];

function OldYearsTab({ todayStr }) {
  const now = new Date();
  const [year,  setYear]  = useState(2025);
  const [month, setMonth] = useState(now.getMonth());

  const days = useMemo(() => getMonthCalendar(year, month), [year, month]);
  const firstWd = days[0]?.weekday ?? 0;
  const cells   = useMemo(() => {
    const blanks = Array.from({ length: firstWd }, (_, i) => ({ key: `b${i}`, blank: true }));
    return [...blanks, ...days.map(d => ({ ...d, key: d.dateStr }))];
  }, [days, firstWd]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const cellW = (SW - spacing.md * 2 - 1) / 7;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
      {/* Year selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.yearChipsRow}>
        {OLD_YEARS.map(y => (
          <TouchableOpacity key={y} onPress={() => setYear(y)} activeOpacity={0.7}
            style={[s.yearChip, year === y && s.yearChipActive]}>
            <Text style={[s.yearChipLabel, year === y && s.yearChipLabelActive]}>
              {toBN(y)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Month nav */}
      <View style={s.calNav}>
        <TouchableOpacity onPress={prevMonth} style={s.calNavBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.calNavTitle}>{BN_MONTHS_EN[month]} {toBN(year)}</Text>
        <TouchableOpacity onPress={nextMonth} style={s.calNavBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={s.calWdRow}>
        {WD_SHORT.map(w => (
          <View key={w} style={[s.calWdCell, { width: cellW }]}>
            <Text style={[s.calWdText, w === 'রবি' && { color: '#dc2626' }]}>{w}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={s.calGrid}>
        {cells.map(cell => {
          if (cell.blank) return <View key={cell.key} style={[s.calCell, { width: cellW }]} />;
          const isSun = cell.weekday === 0;
          return (
            <View key={cell.key} style={[s.calCell, { width: cellW }]}>
              {cell.bengaliDay !== null && (
                <Text style={s.calBnDay}>{toBN(cell.bengaliDay)}</Text>
              )}
              <Text style={[s.calEnDay, isSun && { color: '#dc2626' }]}>{cell.day}</Text>
              <Text style={s.calTithi} numberOfLines={1}>{cell.tithi.slice(0,4)}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── PDF Tab ───────────────────────────────────────────────────────────────────

function PdfTab({ data, todayStr }) {
  const [busy, setBusy] = useState(false);

  async function generatePdf() {
    if (!data) return;
    setBusy(true);
    try {
      const html = `<!DOCTYPE html><html lang="bn"><head>
<meta charset="UTF-8"/>
<style>
  body { font-family: serif; margin: 32px; color: #1E1408; }
  h1   { font-size: 22px; text-align: center; color: #B8960C; margin-bottom: 4px; }
  h2   { font-size: 14px; text-align: center; color: #7B6B4E; font-weight: normal; margin-bottom: 24px; }
  table{ width: 100%; border-collapse: collapse; }
  td   { padding: 8px 12px; border-bottom: 1px solid #E2CFA0; font-size: 13px; }
  td:first-child { color: #7B6B4E; width: 40%; }
  td:last-child  { font-weight: bold; }
  .sec { margin-top: 20px; font-size: 11px; color: #B8960C; text-transform: uppercase;
         letter-spacing: 2px; border-bottom: 1px solid #C9A84C; padding-bottom: 4px; }
</style></head><body>
<h1>MYASTROLOGY</h1>
<h2>আজকের পঞ্জিকা · ${data.bengaliDay ? `${data.bengaliDay} ${data.bengaliMonth} ${data.bengaliYear} বঙ্গাব্দ` : '—'}</h2>

<p class="sec">পঞ্চাঙ্গ</p>
<table>
<tr><td>তারিখ</td><td>${todayStr}</td></tr>
<tr><td>বার</td><td>${data.weekday}</td></tr>
<tr><td>ঋতু</td><td>${data.ritu}</td></tr>
<tr><td>পক্ষ</td><td>${data.paksha}</td></tr>
<tr><td>তিথি</td><td>${data.tithi} (${data.tithiStart || ''}–${data.tithiEnd || ''})</td></tr>
<tr><td>নক্ষত্র</td><td>${data.nakshatra} ${data.padaName} পাদ (${data.nakshatraStart || ''}–${data.nakshatraEnd || ''})</td></tr>
<tr><td>যোগ</td><td>${data.yoga} (${data.yogaStart || ''}–${data.yogaEnd || ''})</td></tr>
<tr><td>করণ</td><td>${data.karana}</td></tr>
</table>

<p class="sec">সময়</p>
<table>
<tr><td>সূর্যোদয়</td><td>${data.sunrise}</td></tr>
<tr><td>সূর্যাস্ত</td><td>${data.sunset}</td></tr>
<tr><td>ব্রহ্ম মুহূর্ত</td><td>${data.brahmaM ? `${data.brahmaM.start}–${data.brahmaM.end}` : '—'}</td></tr>
<tr><td>অভিজিৎ</td><td>${data.abhijit ? `${data.abhijit.start}–${data.abhijit.end}` : '—'}</td></tr>
</table>

<p class="sec">অশুভ কাল</p>
<table>
<tr><td>রাহুকাল</td><td>${data.rahuKala ? `${data.rahuKala.start}–${data.rahuKala.end}` : '—'}</td></tr>
<tr><td>গুলিক কাল</td><td>${data.gulika ? `${data.gulika.start}–${data.gulika.end}` : '—'}</td></tr>
<tr><td>যমঘণ্টা</td><td>${data.yamagnda ? `${data.yamagnda.start}–${data.yamagnda.end}` : '—'}</td></tr>
<tr><td>বারেবলা</td><td>${data.varebela ? `${data.varebela.start}–${data.varebela.end}` : '—'}</td></tr>
</table>

${data.mrityuDosha ? `<p class="sec" style="color:#dc2626">মৃত্যু দোষ</p>
<p style="color:#dc2626;font-size:13px">এই দিনে মৃত্যু দোষের প্রভাব রয়েছে।</p>` : ''}

<p style="margin-top:32px;font-size:10px;color:#7B6B4E;text-align:center">
Generated by MYASTROLOGY App · myastrology.in</p>
</body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'পঞ্জিকা শেয়ার করুন' });
      } else {
        Alert.alert('PDF তৈরি হয়েছে', uri);
      }
    } catch (e) {
      Alert.alert('সমস্যা হয়েছে', e.message || 'PDF তৈরি করা যায়নি');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={s.pdfContainer}>
      <MaterialCommunityIcons name="file-pdf-box" size={56} color={colors.primary} />
      <Text style={s.pdfTitle}>আজকের পঞ্জিকা PDF</Text>
      <Text style={s.pdfDesc}>
        আজকের সম্পূর্ণ পঞ্জিকা তথ্য PDF হিসেবে সংরক্ষণ বা শেয়ার করুন।
      </Text>
      <TouchableOpacity style={s.pdfBtn} onPress={generatePdf} activeOpacity={0.8} disabled={busy}>
        {busy
          ? <ActivityIndicator color={colors.white} />
          : <>
              <MaterialCommunityIcons name="download" size={18} color={colors.white} />
              <Text style={s.pdfBtnText}>PDF তৈরি করুন ও শেয়ার করুন</Text>
            </>}
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export function PanchangScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('today');
  const [menuOpen,  setMenuOpen]  = useState(false);

  const today    = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const data = useMemo(() => {
    try { return getPanchangForDate(todayStr); }
    catch (_) { return null; }
  }, [todayStr]);

  const tabBarH = 58 + insets.bottom;

  const MENU_ITEMS = [
    { tab: 'Home',        icon: 'home-variant',          label: 'হোম' },
    { tab: 'Panchang',    icon: 'calendar-month',        label: 'পঞ্জিকা' },
    { tab: 'Rashifal',    icon: 'star-circle',            label: 'রাশিফল' },
    { tab: 'Kundali',     icon: 'chart-donut',            label: 'জন্ম কুণ্ডলী' },
    { tab: 'MatchMaking', icon: 'heart-multiple',         label: 'যোটক বিচার' },
    { tab: 'Numerology',  icon: 'numeric-9-plus-box',     label: 'সংখ্যাজ্যোতিষ' },
    { tab: 'Namakaran',   icon: 'baby-face-outline',      label: 'নামকরণ' },
    { tab: 'More',        icon: 'dots-horizontal-circle', label: 'আরও' },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Image source={LOGO} style={s.logo} />
        <View style={s.headerCenter}>
          <Text style={s.brand}>MYASTROLOGY</Text>
          <Text style={s.tagline}>জ্যোতিষ · পঞ্জিকা · কুণ্ডলী</Text>
        </View>
        <TouchableOpacity style={s.hamBtn} onPress={() => setMenuOpen(true)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="menu" size={24} color={colors.gold} />
        </TouchableOpacity>
      </View>

      {/* ── Inner Tab Bar ── */}
      <View style={s.innerTabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.innerTabScroll}>
          {INNER_TABS.map(t => (
            <TouchableOpacity key={t.key} onPress={() => setActiveTab(t.key)}
              activeOpacity={0.7} style={[s.innerTab, activeTab === t.key && s.innerTabActive]}>
              <Text style={[s.innerTabLabel, activeTab === t.key && s.innerTabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Tab Content ── */}
      <View style={[s.content, { paddingBottom: tabBarH }]}>
        {activeTab === 'today'    && <TodayTab data={data} todayStr={todayStr} />}
        {activeTab === 'calendar' && (
          <CalendarTab
            initYear={today.getFullYear()}
            initMonth={today.getMonth()}
            todayStr={todayStr}
          />
        )}
        {activeTab === 'festival' && (
          <FestivalTab year={today.getFullYear()} month={today.getMonth()} />
        )}
        {activeTab === 'old'      && <OldYearsTab todayStr={todayStr} />}
        {activeTab === 'pdf'      && <PdfTab data={data} todayStr={todayStr} />}
      </View>

      {/* ── Hamburger Drawer ── */}
      {menuOpen && (
        <View style={s.drawerOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setMenuOpen(false)} activeOpacity={1} />
          <View style={[s.drawer, { paddingTop: insets.top + 8 }]}>
            <View style={s.drawerHeader}>
              <Text style={s.drawerTitle}>MENU</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={s.drawerDivider} />
            {MENU_ITEMS.map(item => (
              <TouchableOpacity key={item.tab} style={s.menuItem}
                onPress={() => { setMenuOpen(false); navigation.navigate(item.tab); }}
                activeOpacity={0.7}>
                <MaterialCommunityIcons name={item.icon} size={20} color={colors.primary} />
                <Text style={s.menuLabel}>{item.label}</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.background },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.headerBg,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.headerBorder,
  },
  logo:        { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.gold + 'AA' },
  headerCenter:{ flex: 1, alignItems: 'center' },
  brand:       { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  tagline:     { fontSize: 9, color: colors.textSecondary, letterSpacing: 1.2, marginTop: 1, fontFamily: 'NotoSerifBengali-Regular' },
  hamBtn:      { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  /* Inner tab bar */
  innerTabBar: {
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  innerTabScroll: { paddingHorizontal: spacing.md, paddingVertical: 0 },
  innerTab: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  innerTabActive: { borderBottomColor: colors.gold },
  innerTabLabel: {
    fontSize: 13, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular',
  },
  innerTabLabelActive: { color: colors.primary, fontFamily: 'NotoSerifBengali-Bold' },

  /* Content */
  content: { flex: 1 },

  /* Date card */
  dateCard: {
    margin: spacing.md, backgroundColor: colors.card,
    borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
  },
  dateCardBn:      { fontSize: 19, color: colors.text, fontFamily: 'NotoSerifBengali-Bold', marginBottom: 6 },
  dateCardMeta:    { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  dateCardMetaTxt: { fontSize: 11, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular' },
  metaDot:         { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textSecondary, opacity: 0.5 },
  pakshaBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.background, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder },
  pakshaBadgeText: { fontSize: 12, color: colors.primary, fontFamily: 'NotoSerifBengali-Bold' },

  /* Section header */
  secHead: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginTop: 16, marginBottom: 8, gap: 8 },
  secDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  secLabel:{ fontSize: 11, color: colors.primary, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'NotoSerifBengali-Bold' },
  secLine: { flex: 1, height: 1, backgroundColor: colors.divider },

  /* Panchang 2-col cards */
  panGrid: {
    flexDirection: 'row', marginHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 14, overflow: 'hidden',
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  panVDiv:       { width: 1, backgroundColor: colors.divider },
  panCard:       { flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
  panCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  panCardLabel:  { fontSize: 10, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular' },
  panCardValue:  { fontSize: 13, color: colors.text, fontWeight: '700', textAlign: 'center', fontFamily: 'NotoSerifBengali-Bold' },
  panCardTime:   { fontSize: 10, color: colors.primary, marginTop: 2, opacity: 0.85 },

  /* Info card */
  infoCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder,
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  infoDiv:   { height: 1, backgroundColor: colors.divider },
  infoRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  infoIcon:  { width: 20 },
  infoLabel: { flex: 1, fontSize: 13, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular' },
  infoValue: { fontSize: 13, color: colors.text, fontWeight: '600', fontFamily: 'NotoSerifBengali-Bold' },

  mrityuCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderColor: '#fca5a5' },
  mrityuText: { flex: 1, fontSize: 13, color: '#dc2626', fontFamily: 'NotoSerifBengali-Regular', lineHeight: 20 },

  todayContent: { paddingBottom: 16 },

  /* Calendar */
  calNav:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12 },
  calNavBtn:   { padding: 6 },
  calNavTitle: { fontSize: 16, color: colors.text, fontFamily: 'NotoSerifBengali-Bold' },
  calWdRow:    { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.divider, marginBottom: 2 },
  calWdCell:   { alignItems: 'center', paddingVertical: 6 },
  calWdText:   { fontSize: 11, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular' },
  calGrid:     { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: spacing.md },
  calCell: {
    borderWidth: 0.5, borderColor: colors.divider,
    alignItems: 'center', paddingVertical: 6, paddingHorizontal: 2,
    minHeight: 62,
  },
  calCellToday: { borderColor: colors.gold, borderWidth: 1.5, backgroundColor: '#FFFBF0' },
  calBnDay:     { fontSize: 14, color: colors.text, fontFamily: 'NotoSerifBengali-Bold' },
  calEnDay:     { fontSize: 10, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular' },
  calTithi:     { fontSize: 9, color: colors.primary, fontFamily: 'NotoSerifBengali-Regular', marginTop: 1 },

  /* Festival */
  festContent:    { paddingHorizontal: spacing.md, paddingBottom: 16 },
  festMonthTitle: { fontSize: 15, color: colors.text, fontFamily: 'NotoSerifBengali-Bold', marginVertical: 14 },
  festItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  festImg:     { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.divider },
  festDateBox: { width: 48, alignItems: 'center' },
  festDayNum:  { fontSize: 18, color: colors.text, fontFamily: 'NotoSerifBengali-Bold', lineHeight: 22 },
  festWd:      { fontSize: 10, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular' },
  festInfo:    { flex: 1 },
  festName:    { fontSize: 13, color: colors.text, fontFamily: 'NotoSerifBengali-Bold', lineHeight: 20 },
  festBnDate:  { fontSize: 11, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular' },
  festBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: '#f0fdf4', borderRadius: 10,
  },
  festBadgeText: { fontSize: 10, color: '#15803d', fontFamily: 'NotoSerifBengali-Regular' },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 60 },
  emptyText: { fontSize: 13, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular' },

  /* Old years */
  yearChipsRow: { paddingHorizontal: spacing.md, paddingVertical: 12, gap: 8 },
  yearChip: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  yearChipActive:      { backgroundColor: colors.primary, borderColor: colors.primary },
  yearChipLabel:       { fontSize: 14, color: colors.text, fontFamily: 'NotoSerifBengali-Regular' },
  yearChipLabelActive: { color: colors.white, fontFamily: 'NotoSerifBengali-Bold' },

  /* PDF */
  pdfContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg, gap: 14,
  },
  pdfTitle: { fontSize: 18, color: colors.text, fontFamily: 'NotoSerifBengali-Bold' },
  pdfDesc:  { fontSize: 13, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular', textAlign: 'center', lineHeight: 22 },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.primary, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 14,
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
    marginTop: 8,
  },
  pdfBtnText: { fontSize: 14, color: colors.white, fontFamily: 'NotoSerifBengali-Bold' },

  /* Drawer */
  drawerOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row-reverse', zIndex: 100 },
  drawer: {
    width: '75%', backgroundColor: colors.card,
    paddingHorizontal: 18, paddingBottom: 32,
    borderLeftWidth: 1, borderLeftColor: colors.cardBorder,
    elevation: 16, shadowColor: '#000', shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.12, shadowRadius: 12,
  },
  drawerHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  drawerTitle:   { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  drawerDivider: { height: 1, backgroundColor: colors.cardBorder, marginBottom: 14 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  menuLabel: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600', fontFamily: 'NotoSerifBengali-Regular' },
});
