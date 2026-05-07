// src/screens/KundaliScreen.js
// আপনার existing kundali.html WebView-এ load করা হচ্ছে
// Future-এ native React Native calculation যোগ হবে
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';
import { Colors } from '../theme';

export default function KundaliScreen() {
  const [loading, setLoading] = useState(true);
  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      )}
      <WebView
        source={{ uri: 'https://www.myastrology.in/kundali.html' }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        injectedJavaScript={`
          // App-এ থাকলে navigation bar লুকানো
          document.querySelector('nav') && (document.querySelector('nav').style.display = 'none');
          document.querySelector('footer') && (document.querySelector('footer').style.display = 'none');
        `}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  webview: { flex: 1, backgroundColor: Colors.bg },
  loader: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bg, zIndex: 10,
  },
});
