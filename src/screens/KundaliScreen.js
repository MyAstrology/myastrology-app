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
import KUNDALI_HTML from '../web-html/kundali';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const LOGO = require('../../assets/logo.png');

// ── File URI (written once per session) ──────────────────────────────────────

const WEB_DIR = FileSystem.documentDirectory + 'myastro/';
let _kUri = null;
let _kPromise = null;

async function getKUri() {
  if (_kUri) return _kUri;
  if (!_kPromise) {
    _kPromise = (async () => {
      await FileSystem.makeDirectoryAsync(WEB_DIR, { intermediates: true });
      const dest = WEB_DIR + 'kundali_app.html';
      await FileSystem.writeAsStringAsync(dest, KUNDALI_HTML,
        { encoding: FileSystem.EncodingType.UTF8 });
      _kUri = dest;
      return dest;
    })();
  }
  return _kPromise;
}

function useKUri() {
  const [uri, setUri] = useState(_kUri);
  useEffect(() => { getKUri().then(u => setUri(u)); }, []);
  return uri;
}

// ── CSS injected into WebView — hide website chrome, keep form + results ─────
// Explicit selectors only — NO body>*:not(main) to avoid hiding script tags

const APP_CSS = `
header.site-header,nav.nav,#navMenu,.nav-overlay,#navOverlay,
footer,.site-footer{display:none!important;}
.author-byline{display:none!important;}
section.k-wrap{display:none!important;}
#moreServicesCard{display:none!important;}
#ganeshabanner{display:none!important;}
#_prmOv,#_cspOv{display:none!important;}
.fab-wrap,.fab{display:none!important;}
.kf-alt-actions{display:none!important;}
button[onclick*="SaveProfile"],button[onclick*="saveProfile"]{display:none!important;}
body{background:#FAF8F3!important;padding:0!important;margin:0!important;overscroll-behavior:contain;}
main{padding:0 0 80px 0!important;margin:0!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
html{scrollbar-width:none!important;}
*{-webkit-tap-highlight-color:transparent!important;}
`;

// Build the injected JS string at module level (no runtime cost)
function buildInjectedJS(css) {
  return `(function(){
  /* 1 — CSS */
  var st=document.getElementById('__kNative__');
  if(!st){st=document.createElement('style');st.id='__kNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};

  /* 2 — Fix kundali.js HTML bug: JS code sits outside <script> tags as a text
     node (premature </script> closure in navamsha block). eval() it so that
     showToast, escapeHtml, loadCalcScripts and the dropdown-populate IIFE all
     get defined, then clear the text so raw source doesn't render on screen. */
  var mainEl=document.querySelector('main');
  Array.from(document.body.childNodes).forEach(function(node){
    if(node===mainEl)return;
    if(node.nodeType===3&&node.textContent.trim().length>20){
      try{(0,eval)(node.textContent);}catch(e){}
      node.textContent='';
    }
  });

  /* 3 — Fallback select populate (safety net if eval above still failed) */
  setTimeout(function(){
    var d=document.getElementById('dobDay');
    if(d&&d.options.length<=1){for(var i=1;i<=31;i++){var o=document.createElement('option');o.value=i;o.textContent=i;d.appendChild(o);}}
    var y=document.getElementById('dobYear');
    if(y&&y.options.length<=1){var cy=new Date().getFullYear();for(var yr=cy;yr>=1900;yr--){var o=document.createElement('option');o.value=yr;o.textContent=yr;y.appendChild(o);}}
    var h=document.getElementById('tobHour');
    if(h&&h.options.length<=1){for(var hh=0;hh<24;hh++){var o=document.createElement('option');o.value=hh;o.textContent=String(hh).padStart(2,'0');h.appendChild(o);}}
    var m=document.getElementById('tobMin');
    if(m&&m.options.length<=1){for(var mm=0;mm<60;mm++){var o=document.createElement('option');o.value=mm;o.textContent=String(mm).padStart(2,'0');m.appendChild(o);}}
  },300);
})();true;`;
}

const INJECTED_JS = buildInjectedJS(APP_CSS);

// ── Main Screen ───────────────────────────────────────────────────────────────

export function KundaliScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const kUri = useKUri();

  const MENU_ITEMS = [
    { tab: 'Home',        icon: 'home-variant',           label: 'হোম'            },
    { tab: 'Panchang',    icon: 'calendar-month',         label: 'পঞ্জিকা'         },
    { tab: 'Rashifal',    icon: 'star-circle',            label: 'রাশিফল'          },
    { tab: 'Kundali',     icon: 'chart-donut',            label: 'জন্ম কুণ্ডলী'    },
    { tab: 'MatchMaking', icon: 'heart-multiple',         label: 'যোটক বিচার'      },
    { tab: 'Numerology',  icon: 'numeric-9-plus-box',     label: 'সংখ্যাজ্যোতিষ'   },
    { tab: 'Namakaran',   icon: 'baby-face-outline',      label: 'নামকরণ'           },
    { tab: 'More',        icon: 'dots-horizontal-circle', label: 'আরও'              },
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

      {/* ── WebView ── */}
      <View style={s.content}>
        {!kUri ? (
          <View style={s.loadCenter}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={s.loadMsg}>লোড হচ্ছে…</Text>
          </View>
        ) : (
          <WebView
            source={{ uri: kUri }}
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
            injectedJavaScript={INJECTED_JS}
            renderLoading={() => (
              <View style={[s.loadCenter, StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.gold} />
                <Text style={s.loadMsg}>গণনা হচ্ছে…</Text>
              </View>
            )}
          />
        )}
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
  root: { flex: 1, backgroundColor: colors.background },

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

  /* Content */
  content:   { flex: 1 },
  wv:        { flex: 1 },
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
