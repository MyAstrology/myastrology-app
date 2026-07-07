import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

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
};

// Extracts the bare page name from a URL like "file://.../kundali.html?foo=bar"
function parsePageName(url) {
  const m = url && url.match(/([^/\\?#]+)\.html/);
  return m ? m[1] : null;
}

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
export function LocalWebView({ name, html, style, onPrint, injectedJS }) {
  const [uri,   setUri]   = useState(null);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    let cancelled = false;
    ensureFile(name, html)
      .then(u  => { if (!cancelled) setUri(u);          })
      .catch(e => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [name, html]);

  // Handles messages posted by the window.open interceptor in APP_CSS bridge script.
  // Message shape: { __rn: 'open', url: string, raw: string }
  const handleMessage = useCallback((event) => {
    let msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }
    if (!msg || msg.__rn !== 'open') return;

    const page = parsePageName(msg.url || '');
    if (!page) return;

    // PDF print request — delegate to parent screen
    if (page === 'match-making-print' || page === 'kundali-print') {
      onPrint && onPrint(msg.raw || '');
      return;
    }

    // Cross-page navigation
    const screen = PAGE_TO_SCREEN[page];
    if (screen) navigation.navigate(screen);
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
      navigation.navigate(screen);
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

  return (
    <WebView
      source={{ uri }}
      style={[s.wv, style]}
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
      onMessage={handleMessage}
      onShouldStartLoadWithRequest={handleNavRequest}
      injectedJavaScript={injectedJS || ''}
      renderLoading={() => (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={s.msg}>গণনা হচ্ছে…</Text>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  wv:     { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  msg:    { marginTop: 10, color: colors.textSecondary, fontSize: 13 },
  err:    { color: '#DC2626', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
});
