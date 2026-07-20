import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Pressable, Linking, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { typography } from '../theme/typography';
import { haptics } from '../utils/haptics';
import { useAuth } from '../context/AuthContext';
import { fetchWebViewAuthToken, buildBridgeSignInJS, BRIDGE_SIGNOUT_JS } from '../utils/webviewAuthBridge';

// react-native-webview-এর onError/onHttpError থেকে পাওয়া description-এ এই
// প্যাটার্নগুলো থাকলে বোঝা যায় সমস্যাটা ইন্টারনেট সংযোগের, সার্ভার/পেজের নয় —
// তখন "ইন্টারনেট চালু করুন" জাতীয় নির্দিষ্ট বার্তা দেখানো যায়, নাহলে সাধারণ বার্তা।
const NO_INTERNET_PATTERN = /ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|ERR_ADDRESS_UNREACHABLE|ERR_NETWORK_CHANGED|ERR_CONNECTION_(TIMED_OUT|REFUSED|RESET|CLOSED)|offline/i;

// Links that should always hand off to the OS (WhatsApp app, dialer, mail
// client) instead of loading inside the WebView. Without this, tapping one
// navigates the WebView's *main frame* to e.g. wa.me — replacing the whole
// app screen with a "wa.me" landing page that has no history back to the
// report, so the hardware back button falls through to React Navigation
// and exits to Home instead of going back to the report.
function isExternalHandoffUrl(url) {
  return /^(tel:|mailto:)/i.test(url) ||
    /^https?:\/\/(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\//i.test(url);
}

const WEB_DIR = FileSystem.documentDirectory + 'myastro/';
const _ready  = {};

async function ensureFile(name, htmlString) {
  if (_ready[name]) return _ready[name];
  await FileSystem.makeDirectoryAsync(WEB_DIR, { intermediates: true });
  const dest = WEB_DIR + name + '.html';
  await FileSystem.writeAsStringAsync(dest, htmlString, { encoding: FileSystem.EncodingType.UTF8 });
  _ready[name] = dest;
  return dest;
}

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
const RESULTS_CONTAINER_IDS = ['resultsArea', 'resultSection'];
const RESULTS_TRACKER_JS = `(function(){
  var ids=${JSON.stringify(RESULTS_CONTAINER_IDS)};
  function findEl(){for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el)return el;}return null;}
  function report(el){
    var visible=getComputedStyle(el).display!=='none';
    window.ReactNativeWebView.postMessage(JSON.stringify({__rn:'resultsVisible',visible:visible}));
  }
  function start(){
    var el=findEl();
    if(!el){setTimeout(start,400);return;}
    report(el);
    new MutationObserver(function(){report(el);}).observe(el,{attributes:true,attributeFilter:['style','class']});
  }
  start();
})();true;`;

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
export function LocalWebView({ name, html, style, onPrint, injectedJS, queryString, remoteUrl }) {
  const [uri,   setUri]   = useState(remoteUrl || null);
  const [error, setError] = useState(null);
  const [webError, setWebError] = useState(null); // { noInternet, description } — WebView-স্তরের লোড ব্যর্থতা (network/HTTP), file-write ব্যর্থতার (উপরের error) থেকে আলাদা
  const navigation = useNavigation();
  const webViewRef = useRef(null);
  const canGoBackRef = useRef(false);
  const resultsVisibleRef = useRef(false);
  const { user, loading: authLoading } = useAuth() || {};
  const uid = user?.uid || null;

  useEffect(() => {
    if (remoteUrl) { setUri(remoteUrl); return; }
    let cancelled = false;
    ensureFile(name, html)
      .then(u  => { if (!cancelled) setUri(u);          })
      .catch(e => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [name, html, remoteUrl]);

  // অ্যাপ ↔ ওয়েবসাইট লগইন ব্রিজ — বান্ডল করা পেজেই প্রযোজ্য (mya-auth.js
  // শুধু ওখানেই আছে); অ্যাপে সাইন-ইন থাকলে WebView-কেও একই Firebase
  // অ্যাকাউন্টে সাইন-ইন করানো হয় (custom token দিয়ে), যাতে প্রোফাইল
  // ক্লাউড-সিঙ্ক অ্যাপ থেকেও কাজ করে। অ্যাপে সাইন-আউট করলে WebView-ও
  // সাইন-আউট হয়ে যায় (একই ডিভাইসে ভিন্ন অ্যাকাউন্টের ডেটা যেন না মেশে)।
  useEffect(() => {
    if (remoteUrl || !uri || !webViewRef.current || authLoading) return;
    let cancelled = false;
    if (uid) {
      fetchWebViewAuthToken().then((token) => {
        if (cancelled || !token || !webViewRef.current) return;
        webViewRef.current.injectJavaScript(buildBridgeSignInJS(token));
      });
    } else {
      webViewRef.current.injectJavaScript(BRIDGE_SIGNOUT_JS);
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
      if (resultsVisibleRef.current && webViewRef.current) {
        const hideJs = `(function(){
          var ids=${JSON.stringify(RESULTS_CONTAINER_IDS)};
          for(var i=0;i<ids.length;i++){
            var el=document.getElementById(ids[i]);
            if(el&&getComputedStyle(el).display!=='none'){el.style.setProperty('display','none','important');break;}
          }
        })();true;`;
        webViewRef.current.injectJavaScript(hideJs);
        resultsVisibleRef.current = false;
        return true;
      }
      if (canGoBackRef.current && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, []);

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
    if (msg.__rn !== 'open') return;

    const page = parsePageName(msg.url || '');
    if (!page) return;

    // PDF print request — delegate to parent screen
    if (page === 'match-making-print' || page === 'kundali-print') {
      onPrint && onPrint(msg.raw || '');
      return;
    }

    // Cross-page navigation — forward the query string (name/dob/tob/lat/lon/…)
    // so the target screen can prefill and auto-calculate, e.g. "কুষ্ঠি দেখুন"
    // from match-making should open that person's chart directly, not a blank form.
    const screen = PAGE_TO_SCREEN[page];
    if (screen) {
      const qIdx = (msg.url || '').indexOf('?');
      const prefillQuery = qIdx >= 0 ? msg.url.slice(qIdx + 1) : '';
      navigation.navigate(screen, prefillQuery ? { prefillQuery } : undefined);
    }
  }, [navigation, name, onPrint]);

  // Intercepts window.location.href = 'page.html' navigations (e.g. _mmGoTo in match-making).
  // Returns false to block the WebView from actually navigating away.
  const handleNavRequest = useCallback((request) => {
    const url = request.url || '';
    if (isExternalHandoffUrl(url)) {
      Linking.openURL(url).catch(() => {});
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

  // মূল ফ্রেম লোড ব্যর্থ হলে (নেটওয়ার্ক/DNS ইত্যাদি) react-native-webview
  // ডিফল্টভাবে নেটিভ ব্রাউজার এরর চ্যাসিস দেখায় ("Error loading page /
  // Domain: undefined / ERR_INTERNET_DISCONNECTED") — সেটা আটকে বদলে থিমড,
  // বোধগম্য বাংলা বার্তা + রিট্রাই বোতাম দেখানো হচ্ছে।
  const handleWebError = useCallback((e) => {
    const { nativeEvent } = e;
    if (nativeEvent?.isMainFrame === false) return; // iframe/sub-resource ব্যর্থতা — মূল পেজ ঠিকই আছে, উপেক্ষা করুন
    haptics.error();
    setWebError({
      noInternet: NO_INTERNET_PATTERN.test(nativeEvent?.description || ''),
      description: nativeEvent?.description || '',
    });
  }, []);

  const handleHttpError = useCallback((e) => {
    const { nativeEvent } = e;
    if (nativeEvent?.isMainFrame === false) return;
    if ((nativeEvent?.statusCode || 0) < 400) return;
    haptics.error();
    setWebError({ noInternet: false, description: 'HTTP ' + nativeEvent.statusCode });
  }, []);

  const handleRetry = useCallback(() => {
    haptics.tap();
    setWebError(null);
    webViewRef.current?.reload();
  }, []);

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
  const fullInjectedJS = (injectedJS || '') + '\n' + RESULTS_TRACKER_JS;

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
        source={{ uri: queryString ? uri + '?' + queryString : uri }}
        style={s.wv}
        originWhitelist={['file://*', 'about:*', 'https://*', 'http://*']}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
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
        onNavigationStateChange={(state) => { canGoBackRef.current = state.canGoBack; }}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleNavRequest}
        injectedJavaScriptBeforeContentLoaded={earlyInjectedJS}
        injectedJavaScript={fullInjectedJS}
        onLoadStart={() => setWebError(null)}
        onLoadEnd={() => { webViewRef.current?.injectJavaScript(fullInjectedJS); }}
        onError={handleWebError}
        onHttpError={handleHttpError}
        renderLoading={() => (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={s.msg}>গণনা হচ্ছে…</Text>
          </View>
        )}
      />
      {webError && (
        <View style={s.errOverlay}>
          <View style={s.errIconWrap}>
            <MaterialCommunityIcons
              name={webError.noInternet ? 'wifi-off' : 'cloud-alert'}
              size={34}
              color={colors.primary}
            />
          </View>
          <Text style={s.errTitle}>
            {webError.noInternet ? 'ইন্টারনেট সংযোগ নেই' : 'পেজ লোড করা যায়নি'}
          </Text>
          <Text style={s.errSub}>
            {webError.noInternet
              ? 'আপনার মোবাইল ডেটা বা ওয়াইফাই চালু করে আবার চেষ্টা করুন।'
              : 'কিছুক্ষণ পর আবার চেষ্টা করুন। সমস্যা থাকলে ইন্টারনেট সংযোগ পরীক্ষা করুন।'}
          </Text>
          <Pressable
            onPress={handleRetry}
            style={({ pressed }) => [s.retryBtn, pressed && s.retryBtnPressed]}
          >
            <MaterialCommunityIcons name="refresh" size={17} color={colors.white} />
            <Text style={s.retryText}>আবার চেষ্টা করুন</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wv:     { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  msg:    { marginTop: 10, color: colors.textSecondary, fontSize: 13 },
  err:    { color: '#DC2626', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },

  errOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errIconWrap: {
    width: 64, height: 64, borderRadius: radii.pill,
    backgroundColor: colors.goldWash,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  errTitle: { ...typography.heading, color: colors.text, textAlign: 'center', marginBottom: 6 },
  errSub: {
    ...typography.body, color: colors.textSecondary, textAlign: 'center',
    lineHeight: 20, marginBottom: spacing.lg,
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: radii.pill,
  },
  retryBtnPressed: { opacity: 0.8 },
  retryText: { ...typography.value, color: colors.white },
});
