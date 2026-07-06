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

// The main app script is in the HTML without a <script> opener. Worse: the first
// ~450 chars after the navamsha </script> are broken cut-off fragments (s.onerror,
// })); etc.) that cause a SyntaxError, preventing the whole block from executing.
// Fix: skip the broken prefix, inject <script> + clean stubs, then append the
// valid code starting from if('requestIdleCallback'...) — verified SYNTAX OK.
function fixKundaliHtml(html) {
  const navamshaClose = html.indexOf('</script>\nvar CALC_SCRIPTS=[];');
  if (navamshaClose < 0) return html;
  const orphanEnd  = navamshaClose + 9; // end of </script>
  const validStart = html.indexOf("if('requestIdleCallback' in window){", orphanEnd);
  if (validStart < 0) return html;
  return (
    html.substring(0, orphanEnd) +
    '\n<script>\n' +
    'var CALC_SCRIPTS=[];\nvar _calcScriptsPromise=null;\n' +
    'function loadCalcScripts(){' +
      'if(_calcScriptsPromise)return _calcScriptsPromise;' +
      '_calcScriptsPromise=Promise.resolve();' +
      'return _calcScriptsPromise;' +
    '}\n' +
    html.substring(validStart)
  );
}

async function getKUri() {
  if (_kUri) return _kUri;
  if (!_kPromise) {
    _kPromise = (async () => {
      await FileSystem.makeDirectoryAsync(WEB_DIR, { intermediates: true });
      const dest = WEB_DIR + 'kundali_app.html';
      await FileSystem.writeAsStringAsync(dest, fixKundaliHtml(KUNDALI_HTML),
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
/* ── Hide website chrome ── */
header.site-header,nav.nav,#navMenu,.nav-overlay,#navOverlay,
footer,.site-footer{display:none!important;}
.author-byline{display:none!important;}
section.k-wrap{display:none!important;}
#moreServicesCard{display:none!important;}
#ganeshabanner{display:none!important;}
#_prmOv,#_cspOv{display:none!important;}
.fab-wrap,.fab{display:none!important;}
.kf-alt-actions{display:none!important;}
#inputSection > div:first-child{display:none!important;}
#inputSection > p{display:none!important;}
/* ── Page base ── */
body{background:#FAF8F3!important;padding:0!important;margin:0!important;overscroll-behavior:contain;}
main{padding:0 0 80px 0!important;margin:0!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
html{scrollbar-width:none!important;}
*{-webkit-tap-highlight-color:transparent!important;}
/* ── Box-sizing: prevent card/inputs overflowing viewport ── */
html,body{overflow-x:hidden!important;max-width:100vw!important;}
div.k-wrap#inputSection,div.k-wrap#inputSection *{box-sizing:border-box!important;}
.card{box-sizing:border-box!important;}
input[type=number],input[type=text],input[type=search]{min-width:0!important;width:100%!important;box-sizing:border-box!important;}
/* ── Design system classes (external stylesheet not loaded in file:// mode) ── */
div.k-wrap#inputSection{padding:8px 12px 0!important;}
.card{background:#fff!important;border-radius:14px!important;border:1.5px solid #e0cdbc!important;padding:16px!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important;margin-bottom:12px!important;}
.ig{margin-bottom:10px!important;}
.sel-ctrl{width:100%!important;padding:9px 10px!important;border:1.5px solid #e0cdbc!important;border-radius:9px!important;background:#fefcf9!important;font-size:.95rem!important;color:#3a2218!important;font-family:inherit!important;}
/* #userName has no class — must target by ID */
#userName{width:100%!important;padding:9px 10px!important;border:1.5px solid #e0cdbc!important;border-radius:9px!important;background:#fefcf9!important;font-size:.95rem!important;color:#3a2218!important;font-family:inherit!important;outline:none!important;}
#userName:focus{border-color:#c8a87a!important;box-shadow:0 0 0 3px rgba(200,168,122,.15)!important;}
.btn.btn-primary,.btn-primary{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;width:100%!important;padding:14px 20px!important;background:#7a2e2e!important;color:#fff!important;border:none!important;border-radius:12px!important;font-size:1rem!important;font-weight:700!important;font-family:inherit!important;cursor:pointer!important;margin:12px 0 4px!important;}
.btn-loading{opacity:.75!important;}
.spinner{display:inline-block!important;width:16px!important;height:16px!important;border:2px solid rgba(255,255,255,.4)!important;border-top-color:#fff!important;border-radius:50%!important;animation:kspin .7s linear infinite!important;flex-shrink:0!important;}
@keyframes kspin{to{transform:rotate(360deg);}}
.city-wrap{position:relative!important;}
.suggestions{position:absolute!important;z-index:999!important;background:#fff!important;border:1.5px solid #e0cdbc!important;border-radius:10px!important;list-style:none!important;margin:2px 0 0!important;padding:0!important;width:100%!important;box-shadow:0 4px 14px rgba(0,0,0,.12)!important;max-height:220px!important;overflow-y:auto!important;}
.suggestions li{padding:10px 12px!important;cursor:pointer!important;border-bottom:1px solid #f0e8d8!important;font-size:.9rem!important;color:#3a2218!important;}
.suggestions li:last-child{border-bottom:none!important;}
#toastStack{position:fixed!important;bottom:90px!important;left:12px!important;right:12px!important;z-index:9999!important;pointer-events:none!important;}
.toast{display:flex!important;align-items:flex-start!important;gap:8px!important;background:#fff!important;border:1.5px solid #e0cdbc!important;border-radius:10px!important;padding:10px 12px!important;margin-bottom:8px!important;box-shadow:0 2px 10px rgba(0,0,0,.1)!important;font-size:.88rem!important;pointer-events:all!important;opacity:0!important;transition:opacity .25s!important;}
.toast.show{opacity:1!important;}
.toast-error{border-color:#e0a0a0!important;background:#fff9f9!important;}
.toast-success{border-color:#a0c8a0!important;}
`;

function buildInjectedJS(css) {
  return `(function(){
  /* 1 — CSS */
  var st=document.getElementById('__kNative__');
  if(!st){st=document.createElement('style');st.id='__kNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};

  /* 2 — toastStack (showToast uses it) */
  if(!document.getElementById('toastStack')){
    var ts=document.createElement('div');ts.id='toastStack';document.body.appendChild(ts);
  }

  /* 3 — Fallbacks: run after page scripts, fill any gaps */
  setTimeout(function(){

    /* 3a — Populate select dropdowns if the main script didn't */
    var d=document.getElementById('dobDay');
    if(d&&d.options.length<=1){for(var i=1;i<=31;i++){var o=document.createElement('option');o.value=i;o.textContent=i;d.appendChild(o);}}

    var mo=document.getElementById('dobMonth');
    if(mo&&mo.options.length<=1){
      ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন',
       'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'
      ].forEach(function(m,i){var o=document.createElement('option');o.value=i+1;o.textContent=m;mo.appendChild(o);});
    }

    var y=document.getElementById('dobYear');
    if(y&&y.options.length<=1){var cy=new Date().getFullYear();for(var yr=cy;yr>=1900;yr--){var o=document.createElement('option');o.value=yr;o.textContent=yr;y.appendChild(o);}}

    var h=document.getElementById('tobHour');
    if(h&&h.options.length<=1){for(var hh=0;hh<24;hh++){var o=document.createElement('option');o.value=hh;o.textContent=String(hh).padStart(2,'0');h.appendChild(o);}}

    var mn=document.getElementById('tobMin');
    if(mn&&mn.options.length<=1){for(var mm=0;mm<60;mm++){var o=document.createElement('option');o.value=mm;o.textContent=String(mm).padStart(2,'0');mn.appendChild(o);}}

    var sc=document.getElementById('tobSec');
    if(sc&&sc.options.length<=1){for(var ss=0;ss<60;ss++){var o=document.createElement('option');o.value=ss;o.textContent=String(ss).padStart(2,'0');sc.appendChild(o);}}

    /* 3b — GPS fallback */
    if(typeof getGPSLocation==='undefined'){
      window.getGPSLocation=function(){
        var msg=document.getElementById('gpsMsg');
        if(!navigator.geolocation){if(msg)msg.textContent='GPS সমর্থন নেই';return;}
        if(msg)msg.textContent='লোকেশন অনুসন্ধান হচ্ছে...';
        navigator.geolocation.getCurrentPosition(
          function(pos){
            var la=document.getElementById('lat'),lo=document.getElementById('lon');
            if(la)la.value=pos.coords.latitude.toFixed(4);
            if(lo)lo.value=pos.coords.longitude.toFixed(4);
            if(msg)msg.textContent='লোকেশন পাওয়া গেছে';
            if(typeof validateForm==='function')validateForm();
          },
          function(){if(msg)msg.textContent='লোকেশন পাওয়া যায়নি';}
        );
      };
    }

    /* 3c — City search fallback (guarded so original listener isn't doubled) */
    var inp=document.getElementById('citySearch');
    var sugg=document.getElementById('citySuggestions');
    if(inp&&sugg&&!inp.__csOk){
      inp.__csOk=true;
      inp.addEventListener('input',function(){
        var q=this.value.trim().toLowerCase();
        sugg.innerHTML='';
        if(q.length<3){sugg.style.display='none';return;}
        var cd=(typeof CITY_DB!=='undefined')?CITY_DB:[];
        var hits=cd.filter(function(c){return(c.n||'').toLowerCase().startsWith(q);}).slice(0,8);
        if(!hits.length){sugg.style.display='none';return;}
        hits.forEach(function(c){
          var li=document.createElement('li');
          li.textContent=c.n+(c.g?' ('+c.g+')':'');
          li.addEventListener('click',function(){
            inp.value=c.n;
            var la=document.getElementById('lat'),lo=document.getElementById('lon');
            if(la)la.value=parseFloat(c.lat).toFixed(4);
            if(lo)lo.value=parseFloat(c.lng).toFixed(4);
            sugg.style.display='none';
            if(typeof validateForm==='function')validateForm();
          });
          sugg.appendChild(li);
        });
        sugg.style.display='block';
      });
      document.addEventListener('click',function(e){
        if(!inp.contains(e.target)&&!sugg.contains(e.target))sugg.style.display='none';
      });
    }

  },600);
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
