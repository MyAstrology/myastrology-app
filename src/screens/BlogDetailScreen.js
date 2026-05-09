// src/screens/BlogDetailScreen.js
import React, { useState, useRef, useCallback } from 'react';
import {
  View, StyleSheet, ActivityIndicator, TouchableOpacity,
  Text, Share, RefreshControl,
} from 'react-native';
import WebView from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../theme';

export default function BlogDetailScreen({ route, navigation }) {
  const { slug, title } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();
  const url = `https://www.myastrology.in/blog/${slug}.html`;

  // ─── Share handler ────────────────────────────────
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${title}\n\nপড়ুন: ${url}`,
        url,
      });
    } catch {}
  };

  // ─── Header share button ──────────────────────────
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleShare} style={{ marginRight: Spacing.md }}>
          <Text style={{ fontSize: 20 }}>📤</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // ─── Reload logic ─────────────────────────────────
  const loadBlog = useCallback(() => {
    setError(false);
    setLoading(true);
    setProgress(0);
    if (webViewRef.current) webViewRef.current.reload();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBlog();
  }, [loadBlog]);

  // ─── Injected JS ──────────────────────────────────
  const injectedJS = `
    (function(){
      // হেডার, নেভিগেশন, ফুটার লুকানো
      var hide = function(sel){
        var el = document.querySelector(sel);
        if(el) el.style.display = 'none';
      };
      hide('header');
      hide('nav');
      hide('footer');
      hide('.site-header');
      hide('.nav');
      hide('.site-footer');
      hide('.ham');
      hide('.hamburger');
      hide('.back-to-top');
      hide('.wa-float');
      hide('#back-to-top');

      // বডি প্যাডিং ঠিক করা
      document.body.style.paddingTop = '0';
      document.body.style.paddingBottom = '0';
      document.body.style.backgroundColor = '#070e1a';
      document.body.style.color = '#e8dcc8';
    })();
  `;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* এরর ভিউ */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📡</Text>
          <Text style={styles.errorTitle}>পেজ লোড করা যায়নি</Text>
          <Text style={styles.errorSub}>
            ইন্টারনেট সংযোগ পরীক্ষা করুন অথবা পরে আবার চেষ্টা করুন
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadBlog}>
            <Text style={styles.retryText}>🔄 আবার চেষ্টা করুন</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* প্রগ্রেস বার */}
      {loading && !error && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          <ActivityIndicator size="small" color={Colors.gold} style={{ marginLeft: 8 }} />
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoadEnd={() => {
          setLoading(false);
          setRefreshing(false);
        }}
        onError={() => {
          setError(true);
          setLoading(false);
          setRefreshing(false);
        }}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        injectedJavaScript={injectedJS}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
        pullToRefreshEnabled
        renderError={() => (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>📡</Text>
            <Text style={styles.errorTitle}>পেজ লোড করা যায়নি</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadBlog}>
              <Text style={styles.retryText}>🔄 আবার চেষ্টা করুন</Text>
            </TouchableOpacity>
          </View>
        )}
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

  // Error view
  errorContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bg, zIndex: 10, padding: 20,
  },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  errorSub: { fontSize: 13, color: Colors.textSub, textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: Colors.goldGlow,
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  retryText: { fontSize: 14, color: Colors.goldLight, fontWeight: '700' },

  // Progress bar
  progressContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    flexDirection: 'row', alignItems: 'center', zIndex: 10,
    backgroundColor: Colors.bg,
  },
  progressBar: {
    height: 3, backgroundColor: Colors.gold,
    borderRadius: 1.5,
  },
});
