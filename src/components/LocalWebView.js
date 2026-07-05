import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { colors } from '../theme/colors';

const WEB_DIR = FileSystem.documentDirectory + 'myastro-web/';
const _cache  = {};

async function prepareAsset(assetModule) {
  if (_cache[assetModule]) return _cache[assetModule];

  // 1. Load from Expo asset bundle
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();

  // 2. Ensure destination directory exists
  await FileSystem.makeDirectoryAsync(WEB_DIR, { intermediates: true });

  // 3. Destination path
  const dest = WEB_DIR + asset.name + '.html';

  // 4. Copy (skip if already current — compare size as quick check)
  const src     = asset.localUri;
  const srcInfo = await FileSystem.getInfoAsync(src, { size: true });
  const dstInfo = await FileSystem.getInfoAsync(dest, { size: true });
  if (!dstInfo.exists || dstInfo.size !== srcInfo.size) {
    if (dstInfo.exists) await FileSystem.deleteAsync(dest, { idempotent: true });
    await FileSystem.copyAsync({ from: src, to: dest });
  }

  _cache[assetModule] = dest;
  return dest;
}

export function LocalWebView({ assetModule, style }) {
  const [uri,   setUri]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    prepareAsset(assetModule)
      .then(u  => { if (!cancelled) setUri(u);       })
      .catch(e => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [assetModule]);

  if (error) {
    return (
      <View style={[s.center, style]}>
        <Text style={s.errTxt}>লোড ব্যর্থ: {error}</Text>
      </View>
    );
  }

  if (!uri) {
    return (
      <View style={[s.center, style]}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={s.loadTxt}>লোড হচ্ছে…</Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ uri }}
      style={[s.webview, style]}
      originWhitelist={['file://*', 'about:*']}
      allowFileAccess={true}
      allowFileAccessFromFileURLs={true}
      allowUniversalAccessFromFileURLs={true}
      mixedContentMode="always"
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      renderLoading={() => (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={s.loadTxt}>গণনা হচ্ছে…</Text>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  webview: { flex: 1 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  loadTxt: { marginTop: 10, color: colors.textSecondary, fontSize: 13 },
  errTxt:  { color: '#DC2626', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
});
