import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { colors } from '../theme/colors';

const WEB_DIR = FileSystem.documentDirectory + 'myastro/';
const _ready  = {};

// Write htmlString to a local file once, return file:// URI
async function ensureFile(name, htmlString) {
  if (_ready[name]) return _ready[name];
  await FileSystem.makeDirectoryAsync(WEB_DIR, { intermediates: true });
  const dest = WEB_DIR + name + '.html';
  await FileSystem.writeAsStringAsync(dest, htmlString, { encoding: FileSystem.EncodingType.UTF8 });
  _ready[name] = dest;
  return dest;
}

export function LocalWebView({ name, html, style }) {
  const [uri,   setUri]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    ensureFile(name, html)
      .then(u  => { if (!cancelled) setUri(u);         })
      .catch(e => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [name, html]);

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
      originWhitelist={['file://*', 'about:*']}
      allowFileAccess={true}
      allowFileAccessFromFileURLs={true}
      allowUniversalAccessFromFileURLs={true}
      mixedContentMode="always"
      javaScriptEnabled={true}
      domStorageEnabled={true}
      cacheEnabled={false}
      startInLoadingState={true}
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
