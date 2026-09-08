import React, { useState, useEffect, useCallback, useRef } from 'react';
import { resolveWebNav } from '../utils/webNav';
import { View, ActivityIndicator, StyleSheet, Linking, BackHandler } from 'react-native';
/* Text এখানে react-native-এর নয় — ভাষা-সচেতন মোড়ক (src/i18n/Text.js)।
   import লাইনটাই একমাত্র বদল, তাই এই ফাইলের সব লেখা (ভবিষ্যতেরগুলোও)
   পাঠকের ভাষায় যায়; অনুবাদ না থাকলে বাংলাটাই থাকে। */
import { Text } from '../i18n/Text';
import { useAlert } from '../i18n/Text';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { fetchWebViewAuthToken, buildBridgeSignInJS, BRIDGE_SIGNOUT_JS } from '../utils/webviewAuthBridge';
import { useWebViewError, WebViewErrorOverlay } from './WebViewErrorOverlay';
import { handleBuyOnWeb } from '../utils/buyOnWebBridge';
import { HIDE_LANG_SWITCH_JS, RESULTS_CONTAINER_IDS, FORM_CONTAINER_IDS, makeHideResultsJS } from '../utils/hideWebChrome';
import { handleShareText } from '../utils/webShareBridge';
import { PAGE_PRINT_JS, collectPdfChunk, deliverPdf } from '../utils/webPrint';
import { pullProfiles, pushProfiles, buildProfileSyncJS, PROFILE_CLEAR_JS } from '../utils/profileBridge';
import { ensureWebFile } from '../utils/webAssetFile';
import { useLanguage } from '../context/LanguageContext';

// Links that should always hand off to the OS (WhatsApp app, dialer, mail
// client) instead of loading inside the WebView. Without this, tapping one
// navigates the WebView's *main frame* to e.g. wa.me — replacing the whole
// app screen with a "wa.me" landing page that has no history back to the
// report, so the hardware back button falls through to React Navigation
// and exits to Home instead of going back to the report.
// The sample-kundali PDFs (_openSamplePdf in the kundali bundle) are the same
// case: Android's WebView cannot render a PDF, so letting it navigate leaves a
// blank screen where the chart used to be. Hand the URL to the OS instead —
// the browser/PDF viewer opens it and the calculator page stays put.
function isExternalHandoffUrl(url) {
  return /^(tel:|mailto:)/i.test(url) ||
    /^https?:\/\/(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\//i.test(url) ||
    /^https?:\/\/([a-z0-9-]+\.)*myastrology\.in\/[^?#]*\.pdf(\?|#|$)/i.test(url) ||
    /^https?:\/\/[^/?#]+\/[^?#]*\.pdf(\?|#|$)/i.test(url);
}

const ensureFile = (name, htmlString) => ensureWebFile(name, htmlString);

// HTML page filename → React Navigation screen name
const PAGE_TO_SCREEN = {
  'kundali':      'Kundali',
  'namakaran':    'Namakaran',
  'match-making': 'MatchMaking',
  'varshaphala':  'Varshaphala',
  'prashna':      'Prashna',
  'numerology':   'Numerology',
  'result':       'NumerologyResult',
};

// Extracts the bare page name from a URL like "file://.../kundali.html?foo=bar"
function parsePageName(url) {
  const m = url && url.match(/([^/\\?#]+)\.html/);
  return m ? m[1] : null;
}

// Every form+results screen (match-making, namakaran, varshaphala, numerology,
// prashna) uses one of these two ids for its results container, hidden until
// "calculate" is pressed. Watch it generically (independent of each screen's
// own show/hide JS) and report visibility to RN, so the hardware back button
// can undo "show results" (go back to the form) before falling through to
// React Navigation's tab history — which otherwise exits straight to whatever
// tab was open before this screen (e.g. Home), skipping over the in-screen
// form/results distinction the user actually expects "back" to respect.
/* তালিকা দুটো src/utils/hideWebChrome.js-এ — দুই স্ক্রিনই একই উৎস পড়ে */
/* ⚠️ ফাংশন, ধ্রুবক নয় — ভিতরের তিনটে লেখা পাঠকের ভাষায় লাগে। মডিউল-স্তরে
   একবার তৈরি হলে ওগুলো চিরকালের জন্য বাংলা হয়ে যেত, আর ইংরেজি পাতার
   নিচে বাংলা পরামর্শ-কার্ড বসত (সহকর্মী ঠিক সেটাই ধরেছেন)। */
const makeResultsTrackerJS = (tr) => {
  const T = (x) => JSON.stringify(tr ? tr(x) : x);
  return `(function(){
  var ids=${JSON.stringify(RESULTS_CONTAINER_IDS)};
  function findEl(){for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el)return el;}return null;}
  function report(el){
    var visible=getComputedStyle(el).display!=='none';
    window.ReactNativeWebView.postMessage(JSON.stringify({__rn:'resultsVisible',visible:visible}));
  }
  /* ── ফলাফলের শেষে পরামর্শ-বুকিং কার্ড ──
     ফলাফল দেখা যাচ্ছে এমন অবস্থাতেই কেবল বসে; একবারই (id দিয়ে পাহারা)।
     চাপলে নেটিভ দিকে বার্তা যায়, LocalWebView বুকিং স্ক্রিনে নিয়ে যায়। */
  function addBookingCard(el){
    if(document.getElementById('__myaBookCard')) return;
    if(getComputedStyle(el).display==='none') return;
    /* ঘরটা তৈরি থাকলেই হবে না — ভিতরে সত্যিই ফলাফল আছে কি না দেখা হয়।
       নইলে ফলাফল আসার আগেই ফাঁকা পাতায় কার্ডটা একা বসে যেত। */
    if((el.innerText||'').trim().length<300) return;
    /* ⚠️ পাতাটা নিজেই পরামর্শের ব্যবস্থা দিলে অ্যাপ দ্বিতীয় কার্ড বসায় না।
       কুণ্ডলী ও যোটক-বিচারের ফলাফলে ওয়েবসাইটের নিজের কার্ড আছে
       ("WhatsApp consultation"), ফলে দুটো কার্ড একটার নিচে আরেকটা বসত —
       একই কথা দু'বার। যে পাতায় কিছু নেই, সেখানে অ্যাপেরটা আগের মতোই বসে।
       ⚠️ লেখা নয়, **লিংক** দেখে ঠিক করা হয় — লেখা তিন ভাষায় বদলায়,
       ঠিকানা বদলায় না। শেয়ার-বোতামের wa.me/?text=... এতে ধরা পড়ে না,
       কারণ পরামর্শের লিংকে wa.me-র পরেই ফোন নম্বরের অঙ্ক থাকে। */
    try{
      var wa=el.querySelector('a[href*="wa.me/9"],a[href*="wa.me/+9"],a[href*="api.whatsapp.com/send?phone"]');
      if(wa) return;
    }catch(e){}
    var d=document.createElement('div');
    d.id='__myaBookCard';
    d.setAttribute('style','margin:20px auto 6px;max-width:600px;border-radius:13px;'
      +'padding:11px 14px;background:linear-gradient(135deg,#2a1206 0%,#5a2410 55%,#2a1206 100%);'
      +'box-shadow:0 4px 16px rgba(90,36,16,.25);text-align:center;font-family:inherit');
    d.innerHTML='<div style="font-size:.88rem;color:#fff;font-weight:800;line-height:1.45">'
      +${T('ড. প্রদ্যুৎ আচার্যের সাথে সরাসরি কথা বলুন')}+'</div>'
      +'<div style="font-size:.68rem;color:rgba(255,255,255,.72);line-height:1.5;margin:2px 0 9px">'
      +${T('১৫+ বছরের অভিজ্ঞতা · PhD স্বর্ণপদক')}+'</div>'
      +'<button type="button" id="__myaBookBtn" style="border:none;cursor:pointer;'
      +'background:linear-gradient(135deg,#f5b800,#e08a00);color:#2a1206;font-weight:800;'
      +'font-size:.83rem;font-family:inherit;padding:8px 24px;border-radius:999px;'
      +'box-shadow:0 2px 10px rgba(245,184,0,.32)">'+${T('পরামর্শ বুকিং করুন')}+'</button>';
    el.appendChild(d);
    var b=document.getElementById('__myaBookBtn');
    if(b) b.addEventListener('click',function(){
      try{ window.ReactNativeWebView.postMessage(JSON.stringify({__rn:'goScreen',screen:'Booking'})); }catch(e){}
    });
  }
  function start(){
    var el=findEl();
    if(!el){setTimeout(start,400);return;}
    report(el);
    addBookingCard(el);
    new MutationObserver(function(){report(el);addBookingCard(el);})
      .observe(el,{attributes:true,attributeFilter:['style','class'],childList:true});
  }
  start();
})();true;`;
};

// LocalWebView renders a bundled HTML page from a local file:// URI.
// It bridges cross-page navigation and print requests back to React Native:
//   - window.location.href = 'page.html' → navigates to the RN screen
//   - window.open('page.html')           → navigates (or triggers onPrint)
//   - Razorpay calls                     → replaced with toast (see bundle-web-assets.js)
//
// Props:
//   name              — key used for the local file (must be unique per page)
//   html              — bundled HTML string exported from web-html/*.js
//   style             — additional style for the WebView
//   onPrint(rawJson)  — called when the page requests PDF generation
//   injectedJS        — extra JS to run after page finishes loading
//   queryString       — optional "a=1&b=2" appended to the file:// uri, so the
//                       page's own location.search-based prefill logic (e.g.
//                       result.html reading ?q=...) picks it up on load
/*  ── ভাষা ও বান্ডল ──
 *  বান্ডল করা পাতাগুলোতে (web-html/*.js) কোনো অনুবাদ-যন্ত্রপাতি নেই — মেপে
 *  দেখা: দশটা বান্ডলের একটিতেও MyaI18n বা ENGINE_I18N নেই। অর্থাৎ ওগুলো
 *  বাংলা-only, আর অনুবাদ বসাতে হলে ইঞ্জিনের ওভারলে বান্ডলে ঢোকাতে হতো —
 *  একা কুণ্ডলীতেই কাঁচা ১.৪ MB (en) + ২.৯ MB (hi), অ্যাপের আকার প্রায়
 *  দ্বিগুণ। তার বদলে পাঠক ইংরেজি/হিন্দি বেছে নিলে ওয়েবসাইটের **ওই ভাষার
 *  পাতাটাই** খোলা হয় — সেগুলো সম্পূর্ণ অনূদিত ও যাচাই করা, আর ক্যালকুলেটরে
 *  কোনো সংশোধন হলে অ্যাপে সঙ্গে সঙ্গে পৌঁছয় (বান্ডল পোর্ট করার অপেক্ষা নেই)।
 *
 *  ⚠️ বাংলা পাঠকের কিছুই বদলায়নি — ডিফল্ট বাংলা, আর বাংলায় বান্ডলই চলে,
 *  অর্থাৎ ইন্টারনেট ছাড়াও আগের মতোই কাজ করে।
 *  ⚠️ ইংরেজি/হিন্দিতে নেট না থাকলে বাংলা বান্ডলে ফিরে যাওয়া হয় — কিন্তু
 *  নীরবে নয়, পাঠককে এক লাইনে বলা হয়। "ইংরেজি খোলস, বাংলা ভিতর" নীরবে
 *  দেখানোটাই এই রিপোর সবচেয়ে বেশিবার নথিভুক্ত ব্যর্থতা।
 */
const SITE = 'https://myastrology.in/';

export function LocalWebView({ name, html, style, onPrint, injectedJS, queryString, remoteUrl, webPath, hideResultsOnBack = true, pagePrint }) {
  /* pagePrint = {fileName, dialogTitle} — যে পাতাগুলো নিজেরাই ছাপে
     (বর্ষফল, সংখ্যা-জ্যোতিষ)। WebView-এ window.print() কিছুই করে না,
     তাই ওটা ধরে expo-print দিয়ে আসল PDF বানানো হয়। */
  const pdfAlertT = useAlert();
  const pdfStore = useRef({ parts: [], total: 0 });
  const [makingPdf, setMakingPdf] = useState(false);
  const { lang, t } = useLanguage();
  /* ভাষা **রেন্ডারের সময়** পড়া হয়, মডিউল লোডে নয় — নইলে চালুর সময়ের
     ভাষা জমে যেত আর সেটিংসে বদলালেও পাতা বাংলাই থাকত। */
  const langUrl = (!remoteUrl && webPath && (lang === 'en' || lang === 'hi'))
    ? SITE + lang + '/' + webPath
    : null;
  const [fellBack, setFellBack] = useState(false);
  const useLang = !!langUrl && !fellBack;

  /* ⚠️ ব্লগ, রত্ন, হস্তরেখা, জ্যোতিষ-শাস্ত্র, উৎসব — এগুলোর en/hi
     সংস্করণ নেই (মেপে সিদ্ধান্ত: ওই ভাষায় চাহিদা প্রায় শূন্য)। মেনু
     থেকে জিনিসগুলো তুলে দিলে হিন্দি/ইংরেজি পাঠক কম পেতেন; তাই রাখা
     হয়েছে, কিন্তু নীরবে বাংলা দেখানো হয় না — একবার বলা হয়, তারপর
     লাইনটা নিজে থেকেই সরে যায়। */
  const bnOnly = !!remoteUrl && lang !== 'bn';
  const [showBnOnly, setShowBnOnly] = useState(false);
  useEffect(() => {
    if (!bnOnly) { setShowBnOnly(false); return; }
    setShowBnOnly(true);
    const id = setTimeout(() => setShowBnOnly(false), 6000);
    return () => clearTimeout(id);
  }, [bnOnly, remoteUrl]);
  const [uri,   setUri]   = useState(remoteUrl || langUrl || null);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const webViewRef = useRef(null);
  const { webError, onLoadStart: onWebLoadStart, onError: handleWebError, onHttpError: handleHttpError, retry: handleRetry, renderError: renderWebError } = useWebViewError(webViewRef);
  const canGoBackRef = useRef(false);
  /* ⚠️ ২০২৬-০৯-০৮ — ব্যাক চেপে সংখ্যা-জ্যোতিষের পাতা থেকে বেরোনো যেত না।
     কারণ ক্যাটাগরি বাছলে পাতাটা **নিজের ভিতরেই** নতুন ঠিকানায় যায়, তাই
     WebView-এর ইতিহাস বাড়তে থাকে আর `canGoBack` চিরকাল true — ব্যাক
     প্রতিবার goBack() ডাকত, পর্দা কখনো ছাড়ত না (অ্যাপ বন্ধ করতে হতো)।
     এখন আমরা নিজেরাই গুনি কতবার সামনে গেছি; শূন্যে নামলে ব্যাক নিচে
     গড়িয়ে যায় আর আগের পর্দায় ফেরা যায়। */
  const backDepthRef = useRef(0);
  const goingBackRef = useRef(false);
  const lastUrlRef   = useRef(null);
  const firstNavRef  = useRef(false);
  const resultsVisibleRef = useRef(false);
  const { user, loading: authLoading } = useAuth() || {};
  const uid = user?.uid || null;

  useEffect(() => {
    backDepthRef.current = 0; goingBackRef.current = false;
    lastUrlRef.current = null; firstNavRef.current = false;
  }, [uri, queryString]);

  useEffect(() => {
    if (remoteUrl) { setUri(remoteUrl); return; }
    if (useLang) { setUri(langUrl); return; }
    let cancelled = false;
    ensureFile(name, html)
      .then(u  => { if (!cancelled) setUri(u);          })
      .catch(e => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [name, html, remoteUrl, useLang, langUrl]);

  /* ভাষা বদলালে আগের ফলব্যাক-অবস্থা ভুলে যেতে হয়, নইলে একবার নেট গেলে
     পাঠক ভাষা বদলেও আর অনূদিত পাতা পেতেন না। */
  useEffect(() => { setFellBack(false); }, [lang]);

  // অ্যাপ ↔ ওয়েবসাইট লগইন ব্রিজ — বান্ডল করা পেজেই প্রযোজ্য (mya-auth.js
  // শুধু ওখানেই আছে); অ্যাপে সাইন-ইন থাকলে WebView-কেও একই Firebase
  // অ্যাকাউন্টে সাইন-ইন করানো হয় (custom token দিয়ে), যাতে প্রোফাইল
  // ক্লাউড-সিঙ্ক অ্যাপ থেকেও কাজ করে। অ্যাপে সাইন-আউট করলে WebView-ও
  // সাইন-আউট হয়ে যায় (একই ডিভাইসে ভিন্ন অ্যাকাউন্টের ডেটা যেন না মেশে)।
  useEffect(() => {
    /* ⚠️ আগে যেকোনো remoteUrl-এ সেতুটা বন্ধ ছিল ("mya-auth.js শুধু বান্ডলে
       আছে")। কিন্তু আমাদের **নিজের সাইটের** পাতাগুলোতেও ওটা আছে — আর
       /my-reports-এ সাইন-ইন ছাড়া ক্রেতা নিজের রিপোর্টই দেখতে পেতেন না।
       বাইরের কোনো ঠিকানায় টোকেন পাঠানো হয় না; আর পাতায় myaAuth না থাকলে
       ইনজেক্ট করা স্ক্রিপ্ট ২০ বার চেষ্টা করে চুপচাপ থেমে যায়। */
    const ownSite = !remoteUrl || /^https:\/\/myastrology\.in\//.test(remoteUrl);
    if (!ownSite || !(uri || remoteUrl) || !webViewRef.current || authLoading) return;
    let cancelled = false;
    if (uid) {
      fetchWebViewAuthToken().then((token) => {
        if (cancelled || !token || !webViewRef.current) return;
        webViewRef.current.injectJavaScript(buildBridgeSignInJS(token));
      });
      /* সেভ করা প্রোফাইল — নেটিভ Firebase দিয়ে সরাসরি (profileBridge.js-এর
         নোট দ্রষ্টব্য)। টোকেন-সেতু ব্যর্থ হলেও এটা কাজ করে, তাই ওয়েবসাইটে
         সেভ করা প্রোফাইল অ্যাপে দেখা যাবেই। */
      pullProfiles(uid).then((list) => {
        if (cancelled || list === null || !webViewRef.current) return;
        webViewRef.current.injectJavaScript(buildProfileSyncJS(list));
      });
    } else {
      webViewRef.current.injectJavaScript(BRIDGE_SIGNOUT_JS);
      webViewRef.current.injectJavaScript(PROFILE_CLEAR_JS);
    }
    return () => { cancelled = true; };
  }, [uid, uri, remoteUrl, authLoading]);

  // Hardware back priority: (1) if results are showing, hide them and go back
  // to the form — mirrors what a user expects "back" to do after "calculate"
  // (undo the last action, don't leave the screen); (2) if the WebView has
  // real navigation history, step back through that; (3) otherwise let React
  // Navigation handle it (its default tab history behavior).
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      /* hideResultsOnBack=false — সংখ্যা জ্যোতিষের ফলাফল আলাদা পাতায়
         (result.html), সেখানে ফিরে দেখানোর মতো কোনো ফর্ম নেই। ফলে ব্যাক
         চাপলে ফলাফলটা লুকিয়ে যেত আর দেখানোর কিছু থাকত না — সাদা পাতা।
         ওই পর্দায় ব্যাক মানে আগের পর্দায় ফেরা, তাই নিচে গড়িয়ে যেতে দেওয়া। */
      if (hideResultsOnBack && resultsVisibleRef.current && webViewRef.current) {
        const hideJs = makeHideResultsJS();
        webViewRef.current.injectJavaScript(hideJs);
        resultsVisibleRef.current = false;
        return true;
      }
      if (backDepthRef.current > 0 && canGoBackRef.current && webViewRef.current) {
        goingBackRef.current = true;
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [hideResultsOnBack]);

  // Handles messages posted by the window.open interceptor in APP_CSS bridge
  // script, and by RESULTS_TRACKER_JS.
  const handleMessage = useCallback((event) => {
    let msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }
    if (!msg) return;

    if (msg.__rn === 'resultsVisible') {
      resultsVisibleRef.current = !!msg.visible;
      return;
    }
    if (msg.__rn === 'buyOnWeb') {
      /* Play Billing-এ কেনা হলে ডেলিভারিটা এই WebView-এর ভিতরেই
      হয় — তাই ইনজেক্টরটা সঙ্গে দেওয়া হয়। না দিলে অ্যাপ চুপচাপ
      ব্রাউজারে পাঠাত, অর্থাৎ Play Billing বসিয়েও কাজে লাগত না। */
      handleBuyOnWeb(msg, js => webViewRef.current?.injectJavaScript(js));
      return;
    }
    if (msg.__rn === 'shareText') { handleShareText(msg); return; }
    if (msg.__rn === 'pagePdfChunk') {
      const full = collectPdfChunk(msg, pdfStore.current);
      if (!full) { setMakingPdf(true); return; }
      deliverPdf(full, {
        alertT: pdfAlertT,
        fileName: (pagePrint && pagePrint.fileName) || 'MyAstrology.pdf',
        dialogTitle: t((pagePrint && pagePrint.dialogTitle) || 'MyAstrology'),
      }).catch(() => pdfAlertT('ত্রুটি', 'PDF তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'))
        .finally(() => setMakingPdf(false));
      return;
    }
    if (msg.__rn === 'goScreen' && msg.screen) {
      /* ফলাফলের নিচের বুকিং কার্ড থেকে — অ্যাপের নিজের স্ক্রিনে */
      try { navigation.navigate(msg.screen); } catch (_) {}
      return;
    }
    if (msg.__rn === 'profiles') {
      /* পাতায় প্রোফাইল যোগ/মুছলে সেটাই ক্লাউডে — লগইন না থাকলে কিছু নয় */
      if (uid && Array.isArray(msg.list)) pushProfiles(uid, msg.list);
      return;
    }
    if (msg.__rn !== 'open') return;

    const page = parsePageName(msg.url || '');
    if (!page) return;

    // PDF print request — delegate to parent screen
    if (page === 'match-making-print' || page === 'kundali-print') {
      onPrint && onPrint(msg.raw || '');
      return;
    }

    // Cross-page navigation — forward the query string (name/dob/tob/lat/lon/…)
    // so the target screen can prefill and auto-calculate, e.g. "কোষ্ঠী দেখুন"
    // from match-making should open that person's chart directly, not a blank form.
    const screen = PAGE_TO_SCREEN[page];
    if (screen) {
      const qIdx = (msg.url || '').indexOf('?');
      const prefillQuery = qIdx >= 0 ? msg.url.slice(qIdx + 1) : '';
      navigation.navigate(screen, prefillQuery ? { prefillQuery } : undefined);
    }
  }, [navigation, name, onPrint, uid, pagePrint, pdfAlertT, t]);

  // Intercepts window.location.href = 'page.html' navigations (e.g. _mmGoTo in match-making).
  // Returns false to block the WebView from actually navigating away.
  const handleNavRequest = useCallback((request) => {
    const url = request.url || '';
    if (isExternalHandoffUrl(url)) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    /* ⚠️ ২০২৬-০৯-০৮ — আগে এখানে শুধু file:// দেখা হতো, আর নামটা বার করা
       হতো `.html` ধরে। কিন্তু পাতাগুলো লেখে window.location.href='panjika'
       (`.html` ছাড়া), আর en/hi-তে ঠিকানা https://myastrology.in/en/panjika।
       দুটোর একটাও মিলত না, তাই ওই ট্যাবগুলো নীরবে মরে যেত।
       webNav.js দুটো রূপই বোঝে, আর ভাষা-উপসর্গ ছেঁটে নেয়। */
    const nav2 = resolveWebNav(url);
    if (nav2 && nav2.page !== name) {
      navigation.navigate(nav2.screen, nav2.query ? { prefillQuery: nav2.query } : undefined);
      return false;
    }
    if (!url.startsWith('file://')) return true;

    const page = parsePageName(url);
    // Allow the initial page load and anything we don't recognise
    if (!page || page === name) return true;

    const screen = PAGE_TO_SCREEN[page];
    if (screen) {
      // Forward the query string (e.g. numerology.html → result.html?q=...)
      // so the target screen can pick up on it — mirrors handleMessage below.
      const qIdx = url.indexOf('?');
      const prefillQuery = qIdx >= 0 ? url.slice(qIdx + 1) : '';
      navigation.navigate(screen, prefillQuery ? { prefillQuery } : undefined);
      return false;
    }
    return true;
  }, [navigation, name]);

  if (error) {
    return (
      <View style={[s.center, style]}>
        <Text style={s.err}>লোড ব্যর্থ: {error}</Text>
      </View>
    );
  }

  if (!uri) {
    return (
      <View style={[s.center, style]}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={s.msg}>লোড হচ্ছে…</Text>
      </View>
    );
  }

  // injectedJavaScript only reliably fires on the WebView's first load — a page
  // that navigates in-place to another page on the same site (e.g. remoteUrl
  // pages following an in-content link) won't get it re-applied on its own, so
  // onLoadEnd below re-injects it after every navigation, not just the first.
  /* ভাষা-বদলের সারিটা অ্যাপে দেখানো হয় না — অ্যাপে ভাষা ঠিক হয়
     Settings থেকে, আর পাতার নিজের সারি সেটাকে না জানিয়েই বদলে দিত।
     এক জায়গায় বসানো, তাই প্রতিটি স্ক্রিনেই খাটে। */
  const fullInjectedJS = (injectedJS || '') + '\n' + React.useMemo(() => makeResultsTrackerJS(t), [t])
    + '\n' + HIDE_LANG_SWITCH_JS
    + (pagePrint ? '\n' + PAGE_PRINT_JS : '');

  // injectedJavaScript চলে পেজ লোড হওয়ার *পরে* — remoteUrl পেজে (Gemstone/
  // Vastu/Palmistry/...) এর মানে হলো ওয়েবসাইটের নিজস্ব header/nav/footer-সহ
  // পুরো পেজ একবার "flash" হয়ে দেখা যায়, তারপর app CSS বসে সেগুলো লুকায়।
  // injectedJavaScriptBeforeContentLoaded দিয়ে একই স্ক্রিপ্ট পেজের নিজস্ব
  // রেন্ডার শুরুর আগেই চালানো হচ্ছে — document.head তখনও নাও থাকতে পারে বলে
  // requestAnimationFrame দিয়ে অপেক্ষা করা হচ্ছে (bundled পেজে CSS আগে থেকেই
  // HTML-এ বসানো থাকে বলে ওখানে এটা নিছক অতিরিক্ত সুরক্ষা, ক্ষতি নেই)।
  const earlyInjectedJS = `(function(){
    function run(){
      if(!document.head){requestAnimationFrame(run);return;}
      ${fullInjectedJS}
    }
    run();
  })();true;`;

  return (
    <View style={[s.wv, style]}>
      <WebView
        ref={webViewRef}
        /* queryString বদলালে WebView-কে নতুন করে বসানো হয় (key)। শুধু
           source.uri বদলে দিলে পাতাটা নির্ভরযোগ্যভাবে আবার লোড হয় না —
           result.html-এ সামঞ্জস্য বিশ্লেষণ দেখার পর নতুন একক অনুসন্ধান
           করলে পুরনো ফলটাই পর্দায় থেকে যেত, কারণ পাতার JS আবার চলত না
           (currentMultiItems-এর মতো ভেরিয়েবল আগের অবস্থাতেই বসে থাকত)।
           key বদলালে React উপাদানটা ফেলে নতুন বানায় — গ্যারান্টিসহ নতুন
           লোড। পাতার *ভিতরের* নেভিগেশনে (ক্যাটাগরি বেছে নেওয়া) queryString
           বদলায় না, তাই সেখানে অকারণ রিলোডও হয় না। */
        key={queryString || '__noq__'}
        source={{ uri: queryString ? uri + '?' + queryString : uri }}
        style={s.wv}
        // নিরাপত্তা: http:// ইচ্ছাকৃতভাবে বাদ, আর mixedContentMode="never" —
        // অন্যথায় শত্রুভাবাপন্ন ওয়াই-ফাইতে কেউ সাদা-টেক্সট HTTP রিসোর্স বদলে
        // দিয়ে পেজে কোড ঢোকাতে পারত। যাচাই করা হয়েছে: বান্ডল করা কোনো পেজই
        // http:// রিসোর্স ব্যবহার করে না, তাই এতে কিছু ভাঙে না।
        originWhitelist={['file://*', 'about:*', 'https://*']}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="never"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
        setSupportMultipleWindows={false}
        cacheEnabled={false}
        startInLoadingState={true}
        // শুধু লাইভ (remoteUrl) পেজে pull-to-refresh চালু — bundled ফর্ম পেজে
        // (কুণ্ডলী/ম্যাচমেকিং ইত্যাদি) এটা চালু থাকলে টেনে ধরলে ভরা ফর্মের ডেটা
        // মুছে পুরো পেজ রিলোড হয়ে যেত, যা অনিচ্ছাকৃত ডেটা-লস তৈরি করত।
        pullToRefreshEnabled={!!remoteUrl}
        onNavigationStateChange={(state) => {
          canGoBackRef.current = state.canGoBack;
          if (state.loading) return;
          const u = state.url || '';
          if (!u || u === lastUrlRef.current) return;
          lastUrlRef.current = u;
          if (goingBackRef.current) {
            goingBackRef.current = false;
            backDepthRef.current = Math.max(0, backDepthRef.current - 1);
          } else if (firstNavRef.current) {
            backDepthRef.current += 1;
          } else {
            firstNavRef.current = true;   /* প্রথম লোডটা 'সামনে যাওয়া' নয় */
          }
        }}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleNavRequest}
        injectedJavaScriptBeforeContentLoaded={earlyInjectedJS}
        injectedJavaScript={fullInjectedJS}
        onLoadStart={onWebLoadStart}
        onLoadEnd={() => { webViewRef.current?.injectJavaScript(fullInjectedJS); }}
        onError={(e) => {
          /* ইংরেজি/হিন্দিতে লাইভ পাতা না এলে বাংলা বান্ডলে ফেরা — কিন্তু
             নীরবে নয়, নিচে এক লাইনে বলা হয়। */
          if (useLang) { setFellBack(true); return; }
          handleWebError(e);
        }}
        onHttpError={handleHttpError}
        renderError={renderWebError}
        renderLoading={() => (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={s.msg}>গণনা হচ্ছে…</Text>
          </View>
        )}
      />
      <WebViewErrorOverlay webError={webError} onRetry={handleRetry} />
      {/* PDF বানাতে কয়েক সেকেন্ড লাগে — ঢাকনা না দিলে অ্যাপটা জমে
          গেছে মনে হয় (কুণ্ডলী ও পঞ্জিকার পর্দায় শেখা)। */}
      {makingPdf && (
        <View style={s.pdfVeil}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={s.msg}>PDF তৈরি হচ্ছে…</Text>
        </View>
      )}
      {showBnOnly && (
        <View style={s.langNote}>
          <Text style={s.langNoteText} numberOfLines={2}>
            {t('এই পাতাটি এখনো কেবল বাংলায় আছে।')}
          </Text>
        </View>
      )}
      {fellBack && !!langUrl && (
        <View style={s.langNote}>
          <Text style={s.langNoteText} numberOfLines={2}>
            {t('ইন্টারনেট নেই — এই গণনাটি আপাতত বাংলাতেই দেখানো হচ্ছে।')}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wv:     { flex: 1 },
  langNote: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(122,46,46,0.94)', paddingVertical: 7, paddingHorizontal: 14,
  },
  langNoteText: { color: '#fff', fontSize: 12, textAlign: 'center', lineHeight: 17 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  pdfVeil: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(254,250,242,0.92)',
  },
  msg:    { marginTop: 10, color: colors.textSecondary, fontSize: 13 },
  err:    { color: '#DC2626', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
});
