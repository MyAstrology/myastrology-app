import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import html from '../web-html/result';
import { colors } from '../theme/colors';
import { WEB_SHARE_JS } from '../utils/webShareBridge';

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

const INJECTED_JS = buildInjectedJS(APP_CSS) + WEB_SHARE_JS;

export function NumerologyResultScreen() {
  const route = useRoute();
  return (
    <View style={s.root}>
      <AppHeader />
      <LocalWebView
        name="result"
        html={html}
        style={s.wv}
        injectedJS={INJECTED_JS}
        queryString={route.params?.prefillQuery}
        /* ফলাফল আলাদা পাতায় — ফিরে দেখানোর মতো ফর্ম নেই, তাই ব্যাক চাপলে
           ফলাফল লুকিয়ে সাদা পাতা না দেখিয়ে আগের পর্দায় ফেরাই ঠিক। */
        hideResultsOnBack={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
