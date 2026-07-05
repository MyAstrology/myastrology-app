import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import PANJIKA_HTML from '../web-html/panjika';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const LOGO = require('../../assets/logo.png');

// ── Inner tabs ────────────────────────────────────────────────────────────────

const INNER_TABS = [
  { key: 'today',    label: 'আজ' },
  { key: 'calendar', label: 'পঞ্জিকা' },
  { key: 'events',   label: 'এই মাসের উৎসব' },
  { key: 'old',      label: 'পুরনো বছরের পঞ্জিকা' },
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
// Hide everything outside <main>, then hide website chrome inside <main>.
// padding-bottom on panels prevents last rows from being obscured.

const APP_CSS = `
body>*:not(main){display:none!important;}
#pjTabs,.pj-tabs,.pj-tools-wrap{display:none!important;}
.author-byline{display:none!important;}
body{
  background:#FAF8F3!important;
  padding:0!important;margin:0!important;
  overscroll-behavior:contain;
  -webkit-tap-highlight-color:transparent!important;
}
main{padding:0 0 80px 0!important;margin:0!important;}
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

// ── Main Screen ───────────────────────────────────────────────────────────────

export function PanchangScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('today');
  const [menuOpen,  setMenuOpen]  = useState(false);

  const pjUri = usePjUri();

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
      <View style={s.content}>
        {activeTab === 'today'    && <PjWebView uri={pjUri} injectedJavaScript={JS_TODAY} />}
        {activeTab === 'calendar' && <PjWebView uri={pjUri} injectedJavaScript={JS_CALENDAR} />}
        {activeTab === 'events'   && <PjWebView uri={pjUri} injectedJavaScript={JS_EVENTS} />}
        {activeTab === 'old'      && <PjWebView uri={pjUri} injectedJavaScript={JS_OLD} />}
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
