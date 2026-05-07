// src/screens/PanjikaScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';
import { Colors } from '../theme';
export default function PanjikaScreen() {
  const [loading, setLoading] = useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {loading && <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, zIndex: 10 }]}><ActivityIndicator size="large" color={Colors.gold} /></View>}
      <WebView source={{ uri: 'https://www.myastrology.in/panjika.html' }} style={{ flex: 1 }} onLoadEnd={() => setLoading(false)} javaScriptEnabled domStorageEnabled />
    </View>
  );
}
