// src/components/WebViewScreen.js — পুনর্ব্যবহারযোগ্য WebView wrapper
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { Colors } from '../theme';

const BASE_HIDE_JS = `
(function(){
  ['header','footer','nav'].forEach(sel=>{
    var el=document.querySelector(sel);
    if(el) el.style.display='none';
  });
  ['faqSection','seow','ctaw','lkw','planw','numsw','how','catsw','stats','daily-box']
    .forEach(id=>{ var e=document.getElementById(id); if(e) e.style.display='none'; });
  document.body.style.paddingTop='0';
  document.body.style.marginTop='0';
})();
`;

export default function WebViewScreen({ uri, extraHideJS = '' }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);
  const ref = useRef(null);

  const reload = useCallback(() => {
    setError(false); setLoading(true); setProgress(0);
    ref.current?.reload();
  }, []);

  const injectedJS = BASE_HIDE_JS + extraHideJS;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {loading && !error && (
        <View style={styles.progressWrap}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
      )}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>📡</Text>
          <Text style={styles.errorTitle}>পেজ লোড করা যায়নি</Text>
          <Text style={styles.errorSub}>ইন্টারনেট সংযোগ পরীক্ষা করুন</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={reload}>
            <Text style={styles.retryText}>🔄 আবার চেষ্টা করুন</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={ref}
          source={{ uri }}
          style={styles.webview}
          onLoadStart={() => { setLoading(true); setError(false); }}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setError(true); setLoading(false); }}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          injectedJavaScript={injectedJS}
          javaScriptEnabled
          domStorageEnabled
          pullToRefreshEnabled
          renderError={() => (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>লোড ব্যর্থ হয়েছে</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={reload}>
                <Text style={styles.retryText}>🔄 পুনরায় চেষ্টা</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  webview:      { flex: 1, backgroundColor: Colors.bg },
  progressWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 20, backgroundColor: 'transparent' },
  progressBar:  { height: 3, backgroundColor: Colors.gold, borderRadius: 2 },
  errorBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, backgroundColor: Colors.bg,
  },
  errorIcon:  { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 6, fontFamily: 'NotoSerifBengali' },
  errorSub:   { fontSize: 13, color: Colors.textSub, textAlign: 'center', marginBottom: 16, fontFamily: 'NotoSerifBengali' },
  retryBtn:   { backgroundColor: Colors.goldGlow, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: Colors.goldBorder },
  retryText:  { fontSize: 14, color: Colors.goldLight, fontWeight: '700', fontFamily: 'NotoSerifBengali' },
});
