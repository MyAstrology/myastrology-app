// src/screens/NumerologyScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';
import { Colors } from '../theme';
export default function NumerologyScreen() {
  const [loading, setLoading] = useState(true);
  return (
    <View style={styles.c}>
      {loading && <View style={styles.l}><ActivityIndicator size="large" color={Colors.gold} /></View>}
      <WebView source={{ uri: 'https://www.myastrology.in/numerology.html' }}
        style={styles.w} onLoadEnd={() => setLoading(false)} javaScriptEnabled domStorageEnabled />
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: Colors.bg },
  w: { flex: 1 },
  l: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, zIndex: 10 },
});
