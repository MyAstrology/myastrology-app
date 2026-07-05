import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { colors } from '../theme/colors';

// Cache: assetModule -> localUri
const _uriCache = {};

async function getLocalUri(assetModule) {
  if (_uriCache[assetModule]) return _uriCache[assetModule];
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  // Copy to a stable path in documentDirectory so relative resources work
  const destDir = FileSystem.documentDirectory + 'myastro-web/';
  await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
  const destPath = destDir + asset.name + '.html';
  await FileSystem.copyAsync({ from: asset.localUri, to: destPath });
  _uriCache[assetModule] = destPath;
  return destPath;
}

export function LocalWebView({ assetModule, style, injectedJavaScript, onMessage }) {
  const [uri, setUri] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getLocalUri(assetModule)
      .then(u => { if (!cancelled) setUri(u); })
      .catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [assetModule]);

  if (error) {
    return (
      <View style={[s.center, style]}>
        <Text style={s.errTxt}>লোড হয়নি: {error}</Text>
      </View>
    );
  }

  if (!uri) {
    return (
      <View style={[s.center, style]}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={s.loadTxt}>লোড হচ্ছে...</Text>
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
          <Text style={s.loadTxt}>লোড হচ্ছে...</Text>
        </View>
      )}
      injectedJavaScript={injectedJavaScript}
      onMessage={onMessage}
    />
  );
}

const s = StyleSheet.create({
  webview: { flex: 1 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  loadTxt: { marginTop: 10, color: colors.textSecondary, fontSize: 13 },
  errTxt:  { color: '#DC2626', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
});
