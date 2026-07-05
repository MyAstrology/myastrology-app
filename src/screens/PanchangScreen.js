import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import PANJIKA_HTML from '../web-html/panjika';
import PANJIKA_DATA from '../engine/panjika-data';
import { getMonthCalendar, getBengaliDate } from '../engine/panchang_full';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const LOGO = require('../../assets/logo.png');

// ── Utility ───────────────────────────────────────────────────────────────────

const BN_DIGITS    = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBN         = n => String(n).split('').map(d => BN_DIGITS[+d] ?? d).join('');
const BN_MONTHS_EN = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন',
                      'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
const BN_MONTH_NAMES = ['বৈশাখ','জ্যৈষ্ঠ','আষাঢ়','শ্রাবণ','ভাদ্র','আশ্বিন',
                        'কার্তিক','অগ্রহায়ণ','পৌষ','মাঘ','ফাল্গুন','চৈত্র'];

const INNER_TABS = [
  { key: 'today',    label: 'আজ' },
  { key: 'calendar', label: 'পঞ্জিকা' },
  { key: 'events',   label: 'এই মাসের উৎসব' },
  { key: 'shubha',   label: 'এই মাসের শুভ দিন' },
  { key: 'old',      label: 'পুরনো বছরের পঞ্জিকা' },
  { key: 'pdf',      label: 'PDF ডাউনলোড' },
];

// ── Local panjika.html URI (written once per session) ─────────────────────────

const WEB_DIR = FileSystem.documentDirectory + 'myastro/';
let _pjUri = null;
let _pjPromise = null;

async function getPjUri() {
  if (_pjUri) return _pjUri;
  if (!_pjPromise) {
    _pjPromise = (async () => {
      await FileSystem.makeDirectoryAsync(WEB_DIR, { intermediates: true });
      const dest = WEB_DIR + 'panjika_app.html';
      await FileSystem.writeAsStringAsync(dest, PANJIKA_HTML,
        { encoding: FileSystem.EncodingType.UTF8 });
      _pjUri = dest;
      return dest;
    })();
  }
  return _pjPromise;
}

function usePjUri() {
  const [uri, setUri] = useState(_pjUri);
  useEffect(() => { getPjUri().then(u => setUri(u)); }, []);
  return uri;
}

// ── CSS injected into every WebView — whitelist approach ─────────────────────
// Strategy: hide everything outside <main>, then inside <main> hide only
// the website chrome (tab nav, interlinking grid). Keep .pj-tab-panel intact
// so switchPjTab() can show/hide panels normally.

const APP_CSS = `
body>*:not(main){display:none!important;}
#pjTabs,.pj-tabs,.pj-tools-wrap{display:none!important;}
body{
  background:#FAF8F3!important;
  padding:0!important;margin:0!important;
  overscroll-behavior:contain;
  -webkit-tap-highlight-color:transparent!important;
}
main{padding:0!important;margin:0!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
html{scrollbar-width:none!important;}
*{-webkit-tap-highlight-color:transparent!important;}
.pj-tab-panel{animation:none!important;}
.tban{border-radius:14px!important;}
.auspicious-counter-wrap{border-radius:14px!important;}
`;

// পঞ্জিকা tab: keep only .cal-card (calendar) + .dtp (date detail panel)
const CAL_CSS = `
#pj-mas .month-events-wrap{display:none!important;}
#pj-mas .dvd{display:none!important;}
a#rashifal-today-link{display:none!important;}
a[data-saptahik]{display:none!important;}
#pj-mas .auspicious-counter-wrap{display:none!important;}
#pj-mas .guide-wrap{display:none!important;}
`;

// এই মাসের উৎসব tab: keep .month-events-wrap + .auspicious-counter-wrap + .guide-wrap
const EVENTS_CSS = `
#pj-mas .cal-card{display:none!important;}
#pj-mas .dtp{display:none!important;}
#pj-mas .dvd{display:none!important;}
a#rashifal-today-link{display:none!important;}
a[data-saptahik]{display:none!important;}
`;

// JS to hide rashifal card parent divs (CSS cannot select parent elements)
const HIDE_RASHI_PARENTS_JS = `
setTimeout(function(){
  var rL=document.getElementById('rashifal-today-link');
  if(rL&&rL.parentElement)rL.parentElement.style.cssText='display:none!important;';
  var sL=document.querySelector('a[data-saptahik]');
  if(sL&&sL.parentElement)sL.parentElement.style.cssText='display:none!important;';
},300);
`;

// ── injectedJavaScript builders ───────────────────────────────────────────────

function makeJS(tabId, extraCSS, extraJS) {
  var css = APP_CSS + (extraCSS || '');
  var switchCall = tabId
    ? `if(typeof switchPjTab==='function'){switchPjTab(${JSON.stringify(tabId)});}else{setTimeout(t,150);}`
    : '';
  return `(function(){
  var st=document.getElementById('__appNative__');
  if(!st){st=document.createElement('style');st.id='__appNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};
  function t(){${switchCall}${extraJS || ''}}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',t);}else{t();}
})();true;`;
}

const JS_TODAY    = makeJS(null);
const JS_CALENDAR = makeJS('mas', CAL_CSS, HIDE_RASHI_PARENTS_JS);
const JS_EVENTS   = makeJS('mas', EVENTS_CSS, HIDE_RASHI_PARENTS_JS);
const JS_OLD      = makeJS('pura');

// ── Shared WebView wrapper ────────────────────────────────────────────────────

function PjWebView({ uri, injectedJavaScript }) {
  if (!uri) {
    return (
      <View style={s.loadCenter}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={s.loadMsg}>লোড হচ্ছে…</Text>
      </View>
    );
  }
  return (
    <WebView
      source={{ uri }}
      style={s.wv}
      originWhitelist={['file://*', 'about:*', 'https://*', 'http://*']}
      allowFileAccess={true}
      allowFileAccessFromFileURLs={true}
      allowUniversalAccessFromFileURLs={true}
      mixedContentMode="always"
      javaScriptEnabled={true}
      domStorageEnabled={true}
      cacheEnabled={false}
      startInLoadingState={true}
      injectedJavaScript={injectedJavaScript}
      renderLoading={() => (
        <View style={[s.loadCenter, StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={s.loadMsg}>গণনা হচ্ছে…</Text>
        </View>
      )}
    />
  );
}

// ── এই মাসের শুভ দিন (Native count grid) ─────────────────────────────────────
// Uses PANJIKA_DATA hardcoded arrays (same source as website's _isHardcodedDate)

const AC_CATS = [
  { key: 'vivah',  label: 'বিবাহের শুভ দিন',           icon: 'ring' },
  { key: 'griha',  label: 'গৃহপ্রবেশের শুভ দিন',        icon: 'home-city-outline' },
  { key: 'nirman', label: 'গৃহ নির্মাণের শুভ দিন',       icon: 'home-plus-outline' },
  { key: 'garb',   label: 'গর্ভধারণের শুভ দিন',          icon: 'baby-carriage' },
  { key: 'anna',   label: 'অন্নপ্রাশনের শুভ দিন',        icon: 'bowl-mix-outline' },
  { key: 'sadh',   label: 'স্বাদ ভক্ষণের শুভ দিন',        icon: 'food-variant' },
  { key: 'biz',    label: 'ব্যবসা/শিল্প আরম্ভের শুভ দিন', icon: 'briefcase-outline' },
];
// nirman maps to griha array in PANJIKA_DATA (same as website's _HC_BASE_KEY)
const DATA_KEY = { vivah:'vivah', griha:'griha', nirman:'griha',
                   garb:'garb', anna:'anna', sadh:'sadh', biz:'biz' };

function getShubhaCounts(year, month) {
  const calDays = getMonthCalendar(year, month);
  const counts = {}, dates = {};
  AC_CATS.forEach(c => { counts[c.key] = 0; dates[c.key] = []; });

  for (const day of calDays) {
    const bnDate = getBengaliDate(day.dateStr);
    if (!bnDate) continue;
    const bnYear     = bnDate.year;
    const bnMonthIdx = BN_MONTH_NAMES.indexOf(bnDate.monthName);
    if (bnMonthIdx < 0) continue;
    const bnDay = bnDate.day;

    AC_CATS.forEach(cat => {
      const arr = PANJIKA_DATA[DATA_KEY[cat.key] + bnYear]?.[bnMonthIdx] || [];
      if (arr.includes(bnDay)) {
        counts[cat.key]++;
        dates[cat.key].push(day.day);
      }
    });
  }
  return { counts, dates };
}

function ShubhaDinTab({ year, month }) {
  const { counts, dates } = useMemo(() => getShubhaCounts(year, month), [year, month]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.shContent}>
      <Text style={s.shTitle}>{BN_MONTHS_EN[month]} {toBN(year)}</Text>
      <Text style={s.shSub}>বিশুদ্ধ সিদ্ধান্ত পঞ্জিকা অনুযায়ী শুভ মুহূর্ত</Text>
      <View style={s.shGrid}>
        {AC_CATS.map(cat => (
          <View key={cat.key} style={s.shCard}>
            <MaterialCommunityIcons name={cat.icon} size={20} color={colors.primary} />
            <Text style={s.shCount}>{toBN(counts[cat.key])}</Text>
            <Text style={s.shLabel}>{cat.label}</Text>
            {dates[cat.key].length > 0 && (
              <Text style={s.shDates} numberOfLines={2}>
                {dates[cat.key].map(d => toBN(d)).join(' · ')} তারিখ
              </Text>
            )}
          </View>
        ))}
      </View>
      <View style={s.shNote}>
        <MaterialCommunityIcons name="information-outline" size={13} color={colors.textSecondary} />
        <Text style={s.shNoteText}>
          তারিখের বিস্তারিত মুহূর্ত জানতে বিশেষজ্ঞের পরামর্শ নিন।
        </Text>
      </View>
    </ScrollView>
  );
}

// ── PDF Tab (annual calendar) ─────────────────────────────────────────────────

const PDF_WD_BN = ['রবি','সোম','মঙ্গল','বুধ','বৃহঃ','শুক্র','শনি'];
const PDF_MN_BN = ['জানু','ফেব্রু','মার্চ','এপ্রিল','মে','জুন',
                   'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভে','ডিসে'];

function PdfTab() {
  const [busy, setBusy] = useState(false);
  const year = useMemo(() => new Date().getFullYear(), []);

  async function generate() {
    setBusy(true);
    try {
      let monthsHtml = '';
      for (let m = 0; m < 12; m++) {
        const days = getMonthCalendar(year, m);
        if (!days.length) continue;
        const firstWd     = days[0].weekday;
        const bnYearLabel = getBengaliDate(days[0].dateStr)?.year || year;

        let cells = '';
        for (let b = 0; b < firstWd; b++) cells += '<td class="e"></td>';
        let col = firstWd;
        for (const d of days) {
          const bnD  = d.bengaliDay !== null ? toBN(d.bengaliDay) : '';
          const isSun = d.weekday === 0;
          const color = isSun ? '#dc2626' : '#1E1408';
          const ti   = d.tithi     ? d.tithi.slice(0,5)     : '';
          const nk   = d.nakshatra ? d.nakshatra.slice(0,4) : '';
          const yg   = d.yoga      ? d.yoga.slice(0,4)      : '';
          cells += `<td style="color:${color}">
<b>${bnD}</b><small>${d.day}</small>
<t>${ti}</t><n>${nk}</n><y>${yg}</y>
</td>`;
          col++;
          if (col % 7 === 0 && d !== days[days.length - 1]) cells += '</tr><tr>';
        }
        while (col % 7 !== 0) { cells += '<td class="e"></td>'; col++; }

        monthsHtml += `<div class="mb">
<div class="mh">${PDF_MN_BN[m]} ${year}&nbsp;·&nbsp;বঙ্গাব্দ ${toBN(bnYearLabel)}</div>
<table><thead><tr>${PDF_WD_BN.map((w,i)=>`<th${i===0?' style="color:#dc2626"':''}>${w}</th>`).join('')}</tr></thead>
<tbody><tr>${cells}</tr></tbody></table></div>\n`;
      }

      const html = `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"/>
<style>
@page{size:A4 portrait;margin:12mm 10mm;}
body{font-family:serif;color:#1E1408;margin:0;font-size:10px;}
h1{text-align:center;font-size:18px;color:#B8960C;margin:0 0 2px;letter-spacing:3px;}
h2{text-align:center;font-size:10px;color:#7B6B4E;font-weight:normal;margin:0 0 16px;}
.mb{page-break-inside:avoid;margin-bottom:14px;}
.mh{font-size:11px;font-weight:bold;color:#B8960C;border-bottom:1.5px solid #C9A84C;padding-bottom:2px;margin-bottom:4px;}
table{width:100%;border-collapse:collapse;}
th{text-align:center;font-size:8px;padding:3px 1px;color:#7B6B4E;border-bottom:1px solid #E2CFA0;}
td{text-align:center;vertical-align:top;padding:2px 1px;border:.5px solid #E8DEBC;height:40px;}
td.e{background:#FDFAF3;}
td b{display:block;font-size:13px;line-height:1.1;}
td small{display:block;font-size:7px;color:#7B6B4E;}
td t{display:block;font-size:6.5px;color:#B8960C;margin-top:1px;}
td n{display:block;font-size:6px;color:#4a7ca8;}
td y{display:block;font-size:6px;color:#6b8e4e;}
</style></head><body>
<h1>MYASTROLOGY</h1>
<h2>বাংলা পঞ্জিকা ${year} · বিশুদ্ধ সিদ্ধান্ত মতে · myastrology.in</h2>
${monthsHtml}
</body></html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'পঞ্জিকা PDF শেয়ার করুন' });
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
      <Text style={s.pdfTitle}>বার্ষিক পঞ্জিকা PDF</Text>
      <Text style={s.pdfDesc}>
        {toBN(year)} সালের সম্পূর্ণ পঞ্জিকা — প্রতিটি দিনের বাংলা তারিখ, তিথি,
        নক্ষত্র ও যোগ সহ A4 PDF হিসেবে সংরক্ষণ বা শেয়ার করুন।
      </Text>
      <TouchableOpacity style={s.pdfBtn} onPress={generate} activeOpacity={0.8} disabled={busy}>
        {busy
          ? <ActivityIndicator color={colors.white} />
          : <>
              <MaterialCommunityIcons name="download" size={18} color={colors.white} />
              <Text style={s.pdfBtnText}>{toBN(year)} সালের পঞ্জিকা তৈরি করুন</Text>
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

  const today   = useMemo(() => new Date(), []);
  const tabBarH = 58 + insets.bottom;
  const pjUri   = usePjUri();

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

      {/* ── Content ── */}
      <View style={[s.content, { paddingBottom: tabBarH }]}>
        {activeTab === 'today'    && <PjWebView uri={pjUri} injectedJavaScript={JS_TODAY} />}
        {activeTab === 'calendar' && <PjWebView uri={pjUri} injectedJavaScript={JS_CALENDAR} />}
        {activeTab === 'events'   && <PjWebView uri={pjUri} injectedJavaScript={JS_EVENTS} />}
        {activeTab === 'shubha'   && <ShubhaDinTab year={today.getFullYear()} month={today.getMonth()} />}
        {activeTab === 'old'      && <PjWebView uri={pjUri} injectedJavaScript={JS_OLD} />}
        {activeTab === 'pdf'      && <PdfTab />}
      </View>

      {/* ── Drawer ── */}
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
  root:    { flex: 1, backgroundColor: colors.background },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.headerBg,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.headerBorder,
  },
  logo:         { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.gold + 'AA' },
  headerCenter: { flex: 1, alignItems: 'center' },
  brand:        { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  tagline:      { fontSize: 9, color: colors.textSecondary, letterSpacing: 1.2, marginTop: 1,
                  fontFamily: 'NotoSerifBengali-Regular' },
  hamBtn:       { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  /* Inner tab bar */
  innerTabBar:      { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  innerTabScroll:   { paddingHorizontal: spacing.md, paddingVertical: 0 },
  innerTab:         { paddingHorizontal: 14, paddingVertical: 10,
                      borderBottomWidth: 2, borderBottomColor: 'transparent' },
  innerTabActive:   { borderBottomColor: colors.gold },
  innerTabLabel:    { fontSize: 13, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular' },
  innerTabLabelActive: { color: colors.primary, fontFamily: 'NotoSerifBengali-Bold' },

  /* Content */
  content: { flex: 1 },
  wv:      { flex: 1 },
  loadCenter: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadMsg: { marginTop: 12, color: colors.textSecondary, fontSize: 13,
             fontFamily: 'NotoSerifBengali-Regular' },

  /* Shubha Din grid */
  shContent: { paddingHorizontal: spacing.md, paddingBottom: 24 },
  shTitle:   { fontSize: 17, color: colors.text, fontFamily: 'NotoSerifBengali-Bold',
               marginTop: 16, marginBottom: 2 },
  shSub:     { fontSize: 12, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular',
               marginBottom: 14 },
  shGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  shCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder,
    padding: 14, alignItems: 'center',
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  shCount:  { fontSize: 28, color: colors.primary, fontFamily: 'NotoSerifBengali-Bold',
              lineHeight: 36, marginTop: 4 },
  shLabel:  { fontSize: 11, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular',
              textAlign: 'center', marginTop: 4, lineHeight: 16 },
  shDates:  { fontSize: 11, color: colors.gold, fontFamily: 'NotoSerifBengali-Regular',
              textAlign: 'center', marginTop: 4, lineHeight: 16 },
  shNote:   { flexDirection: 'row', alignItems: 'flex-start', gap: 6,
              marginTop: 16, paddingHorizontal: 4 },
  shNoteText: { flex: 1, fontSize: 11, color: colors.textSecondary,
                fontFamily: 'NotoSerifBengali-Regular', lineHeight: 17 },

  /* PDF */
  pdfContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg, gap: 14,
  },
  pdfTitle: { fontSize: 18, color: colors.text, fontFamily: 'NotoSerifBengali-Bold' },
  pdfDesc:  { fontSize: 13, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular',
              textAlign: 'center', lineHeight: 22 },
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
    elevation: 16, shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.12, shadowRadius: 12,
  },
  drawerHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  drawerTitle:   { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  drawerDivider: { height: 1, backgroundColor: colors.cardBorder, marginBottom: 14 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  menuLabel: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600',
               fontFamily: 'NotoSerifBengali-Regular' },
});
