// src/screens/BlogDetailScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Share } from 'react-native';
import WebView from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../theme';

export default function BlogDetailScreen({ route, navigation }) {
  const { slug, title } = route.params;
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const url = `https://www.myastrology.in/blog/${slug}.html`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${title}\n\nপড়ুন: ${url}`,
        url,
      });
    } catch {}
  };

  // header-এ share button যোগ করা
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleShare} style={{ marginRight: Spacing.md }}>
          <Text style={{ fontSize: 20 }}>📤</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Blog পেজে nav/footer লুকানো, reading mode চালু করা
  const injectedJS = `
    (function() {
      // navigation ও footer লুকানো
      ['nav', 'header', 'footer', '.hamburger', '._hdr', '._nav', '._ham', '.back-to-top']
        .forEach(sel => {
          const el = document.querySelector(sel);
          if (el) el.style.display = 'none';
        });

      // Reading-friendly style
      document.body.style.padding = '16px';
      document.body.style.maxWidth = '100%';
      document.body.style.fontSize = '16px';
      document.body.style.lineHeight = '1.8';
      document.body.style.backgroundColor = '#070e1a';
      document.body.style.color = '#e8dcc8';

      // WhatsApp CTA যোগ করা
      const cta = document.createElement('div');
      cta.innerHTML = \`
        <div style="
          margin: 32px 0 16px;
          padding: 16px;
          background: rgba(37,211,102,0.1);
          border: 1px solid rgba(37,211,102,0.3);
          border-radius: 12px;
          text-align: center;
        ">
          <p style="color:#e8dcc8;font-size:14px;margin:0 0 12px;font-family:serif;">
            বিস্তারিত পরামর্শের জন্য Dr. Acharya-র সাথে কথা বলুন
          </p>
          <a href="https://wa.me/919333122768" style="
            display:inline-block;
            background:#25d366;
            color:#fff;
            padding:10px 24px;
            border-radius:20px;
            text-decoration:none;
            font-weight:bold;
            font-size:14px;
          ">💬 WhatsApp-এ যোগাযোগ করুন</a>
        </div>
      \`;
      document.body.appendChild(cta);
      true;
    })();
  `;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loaderText}>লোড হচ্ছে...</Text>
        </View>
      )}
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        injectedJavaScript={injectedJS}
        javaScriptEnabled
        domStorageEnabled
        onShouldStartLoadWithRequest={(req) => {
          // WhatsApp link বাইরে খুলবে
          if (req.url.startsWith('https://wa.me')) {
            import('react-native').then(({ Linking }) => Linking.openURL(req.url));
            return false;
          }
          return true;
        }}
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
    backgroundColor: Colors.bg, zIndex: 10, gap: 12,
  },
  loaderText: {
    fontSize: 14, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary,
  },
});
