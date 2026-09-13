import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute } from '@react-navigation/native';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import html from '../web-html/result';
import PRINT_HTML from '../web-html/numerology-print';
import { colors } from '../theme/colors';
import { buildBuyOnWebJS } from '../utils/buyOnWebBridge';
import { WEB_SHARE_JS } from '../utils/webShareBridge';
import { makeCaptureJS, collectPdfChunk, deliverPdf } from '../utils/webPrint';
import { useAlert, Text } from '../i18n/Text';

// numerology.html's "বিশ্লেষণ করুন" button navigates to result.html?q=... — this
// screen renders that bundled page. The website itself ships a @media print
// rule that hides exactly the promotional/chrome elements we don't want in
// the app either, so that list doubles as our hide-list here.
const APP_CSS = `
/* ── Hide website chrome (mirrors result.html's own @media print rule) ── */
.site-header,.nav,.nav-ov,.wa-float,#btt,.back-btn,
.cta-wrap,.sp-strip,.blog-wrap,.try-own-card,.seo-wrap,.phi-hero,
.site-footer{display:none!important;}
/* ── Hide external "আমাদের পরিষেবা" service-scroll strip — links to other
   website pages (palmistry/vastu/gemstone) that aren't screens in this app ── */
.svc-scroll-sect{display:none!important;}
/* ── Page base ── */
html{height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none!important;max-width:100vw!important;}
body{height:auto!important;min-height:100vh!important;background:#FAF8F3!important;padding:0!important;margin:0!important;overflow-x:hidden!important;}
#main,main{padding:8px 12px 20px!important;margin:0!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
*{-webkit-tap-highlight-color:transparent!important;box-sizing:border-box!important;}
/* ── ফলাফলের নিচের "অ্যাপ শেয়ার করুন" বোতাম ──
   বান্ডলে কপি ও প্রিন্ট আগেই বাদ দেওয়া আছে (port-result.js), তাই এখানে
   একটাই বোতাম থাকে। আগে nth-child(1) ও (3) লুকানো হতো — তিন-বোতামের
   যুগের নিয়ম; একটাই থাকায় সেটা উল্টে শেয়ার বোতামটাকেই লুকিয়ে দিচ্ছিল
   (২০২৬-০৮-০৪-এ ধরা পড়ে, ফলাফলের নিচটা ফাঁকা দেখাত)। ক্রম-নির্ভর নিয়ম
   ভঙ্গুর, তাই সব বোতামেই একই সাজ — একটাই হোক বা ভবিষ্যতে একাধিক। */
.share-buttons{margin-top:22px!important;display:flex!important;
  justify-content:center!important;gap:10px!important;flex-wrap:wrap!important;}
.share-buttons .share-btn{
  background:linear-gradient(135deg,#f5b800,#e08a00)!important;
  border:none!important;color:#0a1233!important;
  font-weight:800!important;font-size:.92rem!important;
  padding:12px 30px!important;border-radius:999px!important;
  box-shadow:0 3px 14px rgba(245,184,0,.32)!important;
}
/* ── Tables (if any appear in the analysis) ── */
table{display:table!important;width:100%!important;border-collapse:collapse!important;font-size:.82rem!important;}
thead{display:table-header-group!important;}tbody{display:table-row-group!important;}
tr{display:table-row!important;}
th,td{display:table-cell!important;padding:6px 8px!important;vertical-align:middle!important;word-break:break-word!important;}
th{background:#7a2e2e!important;color:#fff!important;font-size:.76rem!important;text-align:left!important;font-weight:600!important;}
td{border-bottom:1px solid #f0e4d4!important;color:#2c1a0e!important;}
tr:nth-child(even) td{background:#fdf8f3!important;}
`;

function buildInjectedJS(css) {
  return `(function(){
  var st=document.getElementById('__nrNative__');
  if(!st){st=document.createElement('style');st.id='__nrNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};
})();true;`;
}

const INJECTED_JS = buildInjectedJS(APP_CSS) + WEB_SHARE_JS + buildBuyOnWebJS('result');

/*  সাজানো PDF-এর ছাপার পাতা — /numerology-print.html-এর বান্ডল।
 *  ⚠️ localStorage অ্যাপের WebView-এ সবসময় ভরসাযোগ্য নয়, তাই payload
 *  সরাসরি HTML-এর ভিতরেই বসিয়ে দেওয়া হয় (যোটক-মিলনের প্রমাণিত ধাঁচ)। */
function buildPrintHtml(rawJson) {
  const safe = JSON.stringify(rawJson).replace(/</g, '\\u003c');
  return PRINT_HTML
    .replace('<head>', () => `<head><script>window.__nuRaw=${safe};<\/script>`)
    .replace("try{raw=localStorage.getItem('numerology_print_data');}catch(e){}",
             () => 'try{raw=window.__nuRaw||null;}catch(e){}');
}

const CAPTURE_JS = makeCaptureJS('nuPdfChunk', 8000);

export function NumerologyResultScreen() {
  const route = useRoute();
  const alertT = useAlert();
  const [pdfHtml, setPdfHtml] = useState(null);
  const [busy, setBusy] = useState(false);
  const chunksRef = useRef({ parts: [], total: 0 });
  const busyRef = useRef(false);

  const handlePrint = useCallback((rawJson) => {
    if (busyRef.current) return;
    if (!rawJson) { alertT('ত্রুটি', 'PDF ডেটা পাওয়া যায়নি। আগে বিশ্লেষণ করুন।'); return; }
    busyRef.current = true; setBusy(true);
    setPdfHtml(buildPrintHtml(rawJson));
  }, [alertT]);

  const onPdfMessage = useCallback(async (e) => {
    let m; try { m = JSON.parse(e.nativeEvent.data); } catch { return; }
    const full = collectPdfChunk(m, chunksRef.current, 'nuPdfChunk');
    if (!full) return;
    setPdfHtml(null);
    try {
      await deliverPdf(full, { alertT, fileName: 'MyAstrology_numerology.pdf',
                               dialogTitle: 'সংখ্যা জ্যোতিষ রিপোর্ট শেয়ার করুন' });
    } catch (_) {
      alertT('ত্রুটি', 'PDF তৈরি করা যায়নি।');
    } finally { busyRef.current = false; setBusy(false); }
  }, [alertT]);

  return (
    <View style={s.root}>
      <AppHeader />
      <LocalWebView
        name="result" webPath="result"
        html={html}
        style={s.wv}
        injectedJS={INJECTED_JS}
        queryString={route.params?.prefillQuery}
        /* ফলাফল আলাদা পাতায় — ফিরে দেখানোর মতো ফর্ম নেই, তাই ব্যাক চাপলে
           ফলাফল লুকিয়ে সাদা পাতা না দেখিয়ে আগের পর্দায় ফেরাই ঠিক। */
        hideResultsOnBack={false}
        /* ⚠️ এই পাতাও নিজেই window.print() ডাকে — WebView-এ যা নিষ্ক্রিয়।
           তাই ₹৫১ দিয়েও বা প্রোমো কোড দিয়েও PDF আসত না। */
        pagePrint={{ fileName: 'MyAstrology_numerology.pdf', dialogTitle: 'সংখ্যা জ্যোতিষ রিপোর্ট শেয়ার করুন' }}
        onPrint={handlePrint}
      />
      {busy ? (
        <View style={s.ov} pointerEvents="auto">
          <ActivityIndicator size="large" color={colors.gold || '#c9922a'} />
          <Text style={s.ovTx}>PDF তৈরি হচ্ছে…</Text>
        </View>
      ) : null}
      {pdfHtml ? (
        <WebView
          source={{ html: pdfHtml }}
          style={s.hidden}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          onLoadEnd={() => { /* পাতা আঁকা শেষ হলে ধরা শুরু */ }}
          injectedJavaScript={CAPTURE_JS}
          onMessage={onPdfMessage}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  ov: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,.45)',
        alignItems: 'center', justifyContent: 'center' },
  ovTx: { color: '#fff', marginTop: 12, fontWeight: '700' },
});
