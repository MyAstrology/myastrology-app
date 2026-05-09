// src/screens/MatchMakingScreen.js
import React, { useState, useRef, useCallback } from 'react';
import {
  View, StyleSheet, ActivityIndicator, Text,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { Colors } from '../theme';

export default function MatchMakingScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();

  const loadMatchMaking = useCallback(() => {
    setError(false);
    setLoading(true);
    setProgress(0);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, []);

  const injectedJS = `
    (function(){
      var hide = function(id){
        var el = document.getElementById(id);
        if(el) el.style.display='none';
      };
      hide('faqSection');
      document.querySelector('header') && (document.querySelector('header').style.display = 'none');
      document.querySelector('footer') && (document.querySelector('footer').style.display = 'none');
      document.querySelector('nav') && (document.querySelector('nav').style.display = 'none');
      document.body.style.paddingTop = '0';
    })();
  `;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📡</Text>
          <Text style={styles.errorTitle}>পেজ লোড করা যায়নি</Text>
          <Text style={styles.errorSub}>
            ইন্টারনেট সংযোগ পরীক্ষা করুন অথবা পরে আবার চেষ্টা করুন
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadMatchMaking}>
            <Text style={styles.retryText}>🔄 আবার চেষ্টা করুন</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !error && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          <ActivityIndicator size="small" color={Colors.gold} style={{ marginLeft: 8 }} />
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: 'https://www.myastrology.in/match-making.html' }}
        style={styles.webview}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        javaScriptEnabled
        domStorageEnabled
        injectedJavaScript={injectedJS}
        startInLoadingState={false}
        renderError={() => (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>📡</Text>
            <Text style={styles.errorTitle}>পেজ লোড করা যায়নি</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadMatchMaking}>
              <Text style={styles.retryText}>🔄 আবার চেষ্টা করুন</Text>
            </TouchableOpacity>
          </View>
        )}
        pullToRefreshEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  webview: { flex: 1, backgroundColor: Colors.bg },
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
