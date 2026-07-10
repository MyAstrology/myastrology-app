import React, { useState, useEffect, useRef, forwardRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import PANJIKA_HTML from '../web-html/panjika';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { MENU_ITEMS, MenuIcon } from '../navigation/menuItems';
import { haptics } from '../utils/haptics';
import { RASHI_SIGNS } from '../data/rashifalSigns';

const LOGO = require('../../assets/logo.png');

// panjika.html-এর "আজকের রাশিফল" গ্রিড ও অন্যান্য জায়গায় /rashifal/<slug>.html
// (root-relative) লিংক আছে — bundled file:// পেজে এগুলো ERR_FILE_NOT_FOUND
// দেয়, তাই এই ম্যাপ দিয়ে ধরে সরাসরি অ্যাপের RashifalDetail স্ক্রিনে পাঠানো হয়।
const RASHIFAL_SLUG_TO_INDEX = {};
RASHI_SIGNS.forEach((sign, i) => { RASHIFAL_SLUG_TO_INDEX[sign.dailySlug] = i; });

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
/* whitelist approach, but #acModalOverlay (শুভ দিনের তালিকা মডাল), #pdfPromoOverlay
   ও #payOverlay (প্রমো/Razorpay পেমেন্ট মডাল), #yearlyPanjikaView (পুরনো/
   ভবিষ্যৎ বছরের পঞ্জিকা full view), এবং #cityModal (শহর/দেশ-ভিত্তিক
   টাইমজোন সিলেক্টর) — এই ৫টাই <main>-এর বাইরে <body>-এর সরাসরি child হিসেবে
   বসানো, তাই ব্ল্যাঙ্কেট hide-rule থেকে বাদ না রাখলে ওয়েবসাইটের নিজস্ব JS
   কখনোই এগুলো দেখাতে পারে না (inline style এর চেয়ে stylesheet !important
   সবসময় জেতে) — PDF সংরক্ষণ বাটন কাজ না করার আসল কারণ ছিল এটাই, এবং শহর
   সিলেক্টরও একই কারণে এতদিন দেখা যাচ্ছিল না। */
body>*:not(main):not(#acModalOverlay):not(#yearlyPanjikaView):not(#pdfPromoOverlay):not(#payOverlay):not(#cityModal){display:none!important;}
/* বান্ডেলের নিজস্ব __app_mode__ স্টাইলে #pdfPromoOverlay একটা আলাদা ব্ল্যাঙ্কেট
   display:none!important রুল দিয়ে চিরস্থায়ীভাবে হাইড করা আছে (সাধারণত অফলাইন
   বান্ডেলে জেনেরিক পেমেন্ট/আপসেল পপ-আপ ব্লক করার কনভেনশন) — এটা override করতে
   .open ক্লাস-সহ higher-specificity সিলেক্টর লাগবে, নাহলে PDF সংরক্ষণ বাটনের
   প্রমো-কোড/পেমেন্ট মডাল কখনোই দেখা যাবে না। */
#pdfPromoOverlay.open{display:flex!important;}
#pjTabs,.pj-tabs,.pj-tools-wrap{display:none!important;}
.author-byline{display:none!important;}
body{
  background:#FAF8F3!important;
  padding:0!important;margin:0!important;
  -webkit-tap-highlight-color:transparent!important;
  height:auto!important;min-height:100vh!important;
  overflow-y:auto!important;overflow-x:hidden!important;
  -webkit-overflow-scrolling:touch!important;
}
main{
  padding:0 0 80px 0!important;margin:0!important;
  height:auto!important;overflow-y:visible!important;
  -webkit-overflow-scrolling:touch!important;
}
::-webkit-scrollbar{display:none!important;width:0!important;}
html{
  scrollbar-width:none!important;height:auto!important;
  overflow-y:auto!important;overflow-x:hidden!important;
  -webkit-overflow-scrolling:touch!important;
}
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

// festival/remembrance photos (আজকের বিশেষ দিন, এই মাসের উৎসব ইত্যাদি), কিছু
// স্ট্যাটিক আইকন (গণেশ, প্রোফাইল ছবি) এবং কিছু বাটন (যেমন "শুভ সময় নির্ধারণের
// গাইড"-এর বুকিং বাটন) root-relative "/gallery/...", "/images/..." বা
// "/booking.html"-এর মতো পাথ দিয়ে রেফারেন্স করা — file:// বান্ডেলে এগুলো
// কখনোই রিজলভ হয় না (লিংকে ট্যাপ করলে net::ERR_FILE_NOT_FOUND)। এত রকম ছবি
// (প্রতি উৎসব/ঐতিহাসিক ব্যক্তির আলাদা ছবি) সব base64 করে বান্ডেলে গুঁজে দেওয়ার
// বদলে লাইভ CDN/পেজ থেকে লোড করাই ভালো — ডিভাইসে ইন্টারনেট থাকলে সব ঠিকভাবে আসবে।
const FIX_IMAGES_JS = `
(function(){
  function fix(){
    if(typeof _evtImgBase!=='undefined'){try{_evtImgBase='https://myastrology.in/gallery/';}catch(e){}}
    var imgs=document.querySelectorAll('img[src^="/gallery/"],img[src^="/images/"]');
    for(var i=0;i<imgs.length;i++){
      var raw=imgs[i].getAttribute('src');
      imgs[i].setAttribute('src','https://myastrology.in'+raw);
    }
    var links=document.querySelectorAll('a[href^="/"]:not([href^="//"])');
    for(var j=0;j<links.length;j++){
      var rawH=links[j].getAttribute('href');
      links[j].setAttribute('href','https://myastrology.in'+rawH);
    }
  }
  fix();
  new MutationObserver(fix).observe(document.body,{childList:true,subtree:true});
})();
`;

// ওয়েবসাইটের নিজস্ব @media print CSS (বার্ষিক পঞ্জিকা PDF-এর প্রতি মাস আলাদা
// পৃষ্ঠায়, প্রিন্ট হেডার/ফুটার ইত্যাদি) — media-query wrapper ছাড়া, কারণ
// expo-print-কে দেওয়া static HTML capture-এ media query নির্ভরযোগ্যভাবে
// প্রয়োগ হয় না; তাই এই স্টাইলগুলো unconditionally inject করে দেওয়া হচ্ছে।
const YEARLY_PRINT_CSS = `
@page{size:A4 portrait;margin:8mm 8mm;}
body.yearly-mode>*:not(#yearlyPanjikaView){display:none!important;}
#pdfPromoOverlay,#payOverlay{display:none!important;}
#yearlyPanjikaView{display:block!important;background:#FDFBF7;}
.yp-header{display:none!important;}
.yp-pdf-brand{display:none!important;}
.yp-month{page-break-before:always!important;break-before:page!important;page-break-inside:avoid;break-inside:avoid;margin:0;box-shadow:none;border:2px solid #D4AF37!important;background:#FDFBF7!important;border-radius:0!important;overflow:hidden!important;}
.yp-print-hdr{display:flex!important;align-items:center;justify-content:space-between;padding:.38rem .9rem;background:linear-gradient(90deg,#3d1c00,#7a5c00);color:#FDF4D0;font-size:.68rem;font-weight:700;font-family:'Times New Roman',serif;letter-spacing:.03em;}
.yp-print-hdr-brand{font-size:.80rem;font-weight:700;}
.yp-print-hdr-right{font-size:.62rem;opacity:.85;}
.yp-print-ftr{display:flex!important;align-items:center;justify-content:space-between;padding:.28rem .9rem;background:#FAF4E8;border-top:1.5px solid #D4AF37;font-size:.58rem;color:#5a4a30;font-family:'Times New Roman',serif;page-break-before:avoid!important;break-before:avoid!important;}
.yp-malmas-bar{display:block!important;background:#7B0000!important;color:#FFD700!important;font-size:.70rem!important;padding:.25rem 1rem!important;}
.yp-malmas-badge{display:inline-block!important;background:#7B0000!important;color:#FFD700!important;font-size:.55rem!important;padding:.05rem .38rem!important;border-radius:3px!important;font-weight:800!important;}
.yp-month-hdr{background:linear-gradient(135deg,#FAF4E8,#FDF8F0)!important;border-bottom:1.5px solid #D4AF37!important;padding:.45rem .9rem!important;}
.yp-month-bn{color:#332A24!important;font-size:1.3rem!important;font-weight:700!important;}
.yp-month-yr{color:#B38F43!important;font-size:.88rem!important;}
.yp-month-en{color:#7A6F66!important;font-size:.72rem!important;}
.yp-cal-hdr{background:#FAF4E8!important;border-bottom:1px solid #E6DCC4!important;}
.yp-cal-wdh{color:#4A3F35!important;border-right:1px solid #E6DCC4!important;font-size:.80rem!important;font-weight:700!important;padding:.32rem .1rem!important;}
.yp-sun-h{color:#BA2D2D!important;background:rgba(186,45,45,.06)!important;}
.yp-cal-cell{border-right:1px solid #E6DCC4!important;border-bottom:1px solid #E6DCC4!important;min-height:108px!important;background:#FFFFFF!important;padding:.28rem .22rem!important;}
.yp-empty{background:#FDFBF7!important;}
.yp-sun-c{background:#FFF8F8!important;}
.yp-sat-c{background:#F8F8FF!important;}
.yp-today-c{background:#FAF6EC!important;outline:1.5px solid #D4AF37!important;}
.yp-cd-fest{display:none!important;}
.yp-cd-bn{color:#332A24!important;font-size:1.45rem!important;font-weight:800!important;}
.yp-sun-c .yp-cd-bn{color:#BA2D2D!important;}
.yp-cd-en{color:#7A6F66!important;font-size:.75rem!important;}
.yp-cd-tit{color:#3a2a00!important;font-size:.92rem!important;font-weight:700!important;line-height:1.3!important;}
.yp-cd-tit-ctx{font-size:.76rem!important;opacity:.82!important;font-weight:700!important;}
.yp-cd-nak{color:#1a3a6a!important;font-size:.96rem!important;}
.yp-g-yoga{font-size:.88rem!important;color:#1a6a28!important;}
.yp-b-yoga{font-size:.88rem!important;color:#922!important;}
.yp-cd-kar{font-size:.84rem!important;color:#4a3060!important;}
.yp-has-fest{background:#FAF6EC!important;box-shadow:inset 0 0 0 1.5px #D4AF37!important;}
.yp-has-fest.yp-sun-c{background:#FFF6F0!important;}
.yp-fests-hdr{background:linear-gradient(135deg,#FAF4E8,#FDF8F0)!important;color:#332A24!important;border-top:2px solid #D4AF37!important;padding:.35rem 1rem!important;font-size:.76rem!important;}
.yp-fests-list{display:grid!important;grid-template-columns:1fr 1fr!important;padding:.35rem 1rem .4rem!important;gap:.18rem .8rem!important;background:#FDFBF7!important;}
.yp-fest-item{font-size:.72rem!important;color:#332A24!important;line-height:1.45!important;}
.yp-good-yoga{color:#1a6a28!important;}
.yp-bad-yoga{color:#922!important;}
.yp-malmas-day{background:rgba(123,0,0,.06)!important;}
.yp-malmas-t{color:#7B0000!important;font-style:italic!important;font-size:.72rem!important;}
`;

// বার্ষিক পঞ্জিকা "PDF সংরক্ষণ" (প্রমো কোড বা ₹২১ Razorpay) উভয় পথই শেষে
// _doPrint()-কে ডাকে, যেটা render শেষ হওয়া পর্যন্ত অপেক্ষা করে window.print()
// কল করে। window.print()-কে override করে static HTML capture + React Native-এ
// postMessage — কোনো native print dialog-এর ওপর নির্ভর না করে expo-print দিয়ে
// আসল PDF বানানো হবে (Kundali/MatchMaking-এর pattern-এর মতোই)।
//
// একটা সম্পূর্ণ বছরের (১২ মাস) HTML একসাথে postMessage করলে কিছু (বিশেষত কম
// RAM-এর) ফোনে react-native-webview-এর bridge ওভারলোড হয়ে অ্যাপ ক্র্যাশ করে —
// তাই এখানে HTML-কে ছোট ছোট টুকরোয় ভেঙে একাধিক postMessage-এ পাঠানো হচ্ছে,
// React Native পাশে জোড়া লাগিয়ে নেওয়া হয়।
const YEARLY_PDF_JS = `
setTimeout(function(){
  if(typeof Razorpay==='undefined'&&!document.querySelector('script[src*="checkout.razorpay"]')){
    var s=document.createElement('script');
    s.src='https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(s);
  }
  window.print=function(){
    var clone=document.documentElement.cloneNode(true);
    var scripts=clone.querySelectorAll('script');
    for(var i=0;i<scripts.length;i++){scripts[i].parentNode.removeChild(scripts[i]);}
    var printSt=clone.ownerDocument.createElement('style');
    printSt.textContent=${JSON.stringify(YEARLY_PRINT_CSS)};
    clone.querySelector('head').appendChild(printSt);
    var html='<!DOCTYPE html>'+clone.outerHTML;
    if(window.ReactNativeWebView){
      var CHUNK=200000;
      var total=Math.ceil(html.length/CHUNK)||1;
      for(var c=0;c<total;c++){
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type:'panjikaPdfChunk', i:c, total:total,
          chunk:html.substring(c*CHUNK,(c+1)*CHUNK)
        }));
      }
    }
  };
},600);
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
  ${FIX_IMAGES_JS}
  function t(){${switchCall}${extraJS || ''}}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',t);}else{t();}
})();true;`;
}

const JS_TODAY    = makeJS(null);
const JS_CALENDAR = makeJS('mas', CAL_CSS, HIDE_RASHI_PARENTS_JS);
const JS_EVENTS   = makeJS('mas', EVENTS_CSS, HIDE_RASHI_PARENTS_JS);
const JS_OLD      = makeJS('pura', '', YEARLY_PDF_JS);

// ── Shared WebView wrapper ────────────────────────────────────────────────────

const PjWebView = forwardRef(function PjWebView({ uri, injectedJavaScript, onMessage }, ref) {
  const navigation = useNavigation();

  const handleNavRequest = (request) => {
    const url = request.url || '';
    const m = url.match(/\/rashifal\/([a-z]+)\.html/);
    if (m && RASHIFAL_SLUG_TO_INDEX[m[1]] !== undefined) {
      navigation.navigate('RashifalDetail', { rashiIndex: RASHIFAL_SLUG_TO_INDEX[m[1]] });
      return false;
    }
    return true;
  };

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
      ref={ref}
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
      geolocationEnabled={true}
      injectedJavaScript={injectedJavaScript}
      onMessage={onMessage}
      onShouldStartLoadWithRequest={handleNavRequest}
      renderLoading={() => (
        <View style={[s.loadCenter, StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={s.loadMsg}>গণনা হচ্ছে…</Text>
        </View>
      )}
    />
  );
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export function PanchangScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('today');
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false); // drives the "PDF তৈরি হচ্ছে…" overlay
  const pdfBusyRef   = useRef(false); // prevent double-tap while a PDF is being generated
  const pdfChunksRef = useRef([]);    // accumulates chunked HTML from window.print() override until complete
  const webViewRef   = useRef(null);  // shared across tabs — only one PjWebView is mounted at a time

  const pjUri = usePjUri();

  // পঞ্জিকা বান্ডেলের নিজস্ব শহর/দেশ-ভিত্তিক টাইমজোন সিলেক্টর (openCityModal) আছে,
  // কিন্তু এটার ট্রিগার বাটন ওয়েবসাইটের নিজস্ব টপ-বারে থাকে যেটা আমাদের নেটিভ
  // হেডারের সাথে ডুপ্লিকেট হওয়ায় CSS দিয়ে হাইড করা — তাই এখানে নেটিভ হেডারে
  // একটা 📍 বাটন দিয়ে সরাসরি সেই একই ফাংশন কল করা হচ্ছে।
  const openCitySelector = () => {
    haptics.tap();
    webViewRef.current?.injectJavaScript(
      `(function(){if(typeof openCityModal==='function'){openCityModal();}})();true;`
    );
  };

  const handleOldTabMessage = async (event) => {
    let msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }
    if (!msg || msg.type !== 'panjikaPdfChunk') return;
    setPdfGenerating(true);
    pdfChunksRef.current[msg.i] = msg.chunk;
    if (Object.keys(pdfChunksRef.current).length < msg.total) return; // still waiting for more chunks
    const fullHtml = pdfChunksRef.current.join('');
    pdfChunksRef.current = [];
    if (pdfBusyRef.current) return;
    pdfBusyRef.current = true;
    try {
      const { uri } = await Print.printToFileAsync({ html: fullHtml, base64: false, width: 595, height: 842 });
      haptics.success();
      Alert.alert(
        'PDF তৈরি হয়েছে',
        'কী করতে চান?',
        [
          {
            text: 'সংরক্ষণ করুন',
            onPress: async () => {
              try {
                const { StorageAccessFramework } = FileSystem;
                const perm = await StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (perm.granted) {
                  const destUri = await StorageAccessFramework.createFileAsync(
                    perm.directoryUri, 'MyAstrology_panjika.pdf', 'application/pdf'
                  );
                  const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                  await FileSystem.writeAsStringAsync(destUri, b64, { encoding: FileSystem.EncodingType.Base64 });
                  Alert.alert('সংরক্ষিত!', 'PDF ফোল্ডারে সেভ হয়েছে।');
                }
              } catch (_) {
                await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
              }
            },
          },
          {
            text: 'শেয়ার করুন',
            onPress: () => { Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' }); },
          },
          { text: 'বাতিল', style: 'cancel' },
        ]
      );
    } catch (e) {
      haptics.error();
      Alert.alert('ত্রুটি', 'PDF তৈরি করা যায়নি।');
    } finally {
      pdfBusyRef.current = false;
      setPdfGenerating(false);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Image source={LOGO} style={s.logo} />
        <View style={s.headerCenter}>
          <Text style={s.brand}>MYASTROLOGY</Text>
          <Text style={s.tagline}>জ্যোতিষ · পঞ্জিকা · কুণ্ডলী</Text>
        </View>
        <TouchableOpacity style={s.hamBtn} onPress={openCitySelector} activeOpacity={0.7}>
          <MaterialCommunityIcons name="map-marker-outline" size={22} color={colors.gold} />
        </TouchableOpacity>
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
        {activeTab === 'today'    && <PjWebView ref={webViewRef} uri={pjUri} injectedJavaScript={JS_TODAY} />}
        {activeTab === 'calendar' && <PjWebView ref={webViewRef} uri={pjUri} injectedJavaScript={JS_CALENDAR} />}
        {activeTab === 'events'   && <PjWebView ref={webViewRef} uri={pjUri} injectedJavaScript={JS_EVENTS} />}
        {activeTab === 'old'      && <PjWebView ref={webViewRef} uri={pjUri} injectedJavaScript={JS_OLD} onMessage={handleOldTabMessage} />}
      </View>

      {/* ── PDF generation overlay — otherwise the wait (rendering a whole
           year's calendar, then handing off to expo-print) looks frozen ── */}
      {pdfGenerating && (
        <View style={s.pdfOverlay}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={s.pdfOverlayText}>PDF তৈরি হচ্ছে…{'\n'}একটু অপেক্ষা করুন</Text>
        </View>
      )}

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
                <MenuIcon tab={item.tab} icon={item.icon} size={20} color={colors.primary} />
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
  pdfOverlay: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(20,14,4,0.72)', zIndex: 200,
  },
  pdfOverlayText: {
    marginTop: 14, color: '#fff', fontSize: 15, textAlign: 'center', lineHeight: 22,
    fontFamily: 'NotoSerifBengali-Regular',
  },
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
