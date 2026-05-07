// src/screens/MatchMakingScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';
import { Colors } from '../theme';

export default function MatchMakingScreen() {
  const [loading, setLoading] = useState(true);
  return (
    <View style={styles.container}>
      {loading && <View style={styles.loader}><ActivityIndicator size="large" color={Colors.gold} /></View>}
      <WebView
        source={{ uri: 'https://www.myastrology.in/match-making.html' }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  webview: { flex: 1 },
  loader: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bg, zIndex: 10,
  },
});
