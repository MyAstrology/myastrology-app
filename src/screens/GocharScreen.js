// src/screens/GocharScreen.js
import React, { useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useUser } from '../context/UserContext';

const BASE_URL = 'https://www.myastrology.in/kundali.html';

export default function GocharScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webRef = useRef(null);
  const { user } = useUser();

  let url = BASE_URL;
  if (user?.day && user?.month && user?.year) {
    url = `${BASE_URL}?d=${user.day}&m=${user.month}&y=${user.year}&gochar=1`;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>🪐</Text>
          <ActivityIndicator color={Colors.gold} size="large" />
          <Text style={styles.loadingText}>গ্রহ গোচর লোড হচ্ছে...</Text>
        </View>
      )}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>⚠️</Text>
          <Text style={styles.errorText}>সংযোগ সমস্যা হয়েছে</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setError(false); webRef.current?.reload(); }}
          >
            <Text style={{ color: Colors.gold, fontSize: 14, fontWeight: '700' }}>আবার চেষ্টা করুন</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webRef}
          source={{ uri: url }}
          style={{ flex: 1 }}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  loadingText: { fontSize: 14, color: Colors.textSub, marginTop: 12 },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, color: Colors.text, marginBottom: 16 },
  retryBtn: {
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10,
  },
});
