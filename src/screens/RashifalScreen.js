import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { COLORS } from '../theme';

const HIDE_CHROME = `
  (function() {
    var style = document.createElement('style');
    style.innerHTML = 'nav, header, footer, .navbar, .header, .footer { display: none !important; }';
    document.head.appendChild(style);
  })();
  true;
`;

export default function RashifalScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <WebView
        source={{ uri: 'https://www.myastrology.in/rashifal.html' }}
        style={s.web}
        injectedJavaScript={HIDE_CHROME}
        javaScriptEnabled
        domStorageEnabled
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  web:  { flex: 1 },
});
