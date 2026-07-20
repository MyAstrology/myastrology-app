import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { typography } from '../theme/typography';
import { haptics } from '../utils/haptics';

// react-native-webview-এর onError/onHttpError থেকে পাওয়া description-এ এই
// প্যাটার্নগুলো থাকলে বোঝা যায় সমস্যাটা ইন্টারনেট সংযোগের, সার্ভার/পেজের নয় —
// তখন "ইন্টারনেট চালু করুন" জাতীয় নির্দিষ্ট বার্তা দেখানো যায়, নাহলে সাধারণ বার্তা।
export const NO_INTERNET_PATTERN = /ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|ERR_ADDRESS_UNREACHABLE|ERR_NETWORK_CHANGED|ERR_CONNECTION_(TIMED_OUT|REFUSED|RESET|CLOSED)|offline/i;

// মূল ফ্রেম লোড ব্যর্থ হলে (নেটওয়ার্ক/DNS ইত্যাদি) react-native-webview
// ডিফল্টভাবে নেটিভ ব্রাউজার এরর চ্যাসিস দেখায় ("Error loading page /
// Domain: undefined / ERR_INTERNET_DISCONNECTED") — এই hook + overlay দিয়ে
// সেটা আটকে বদলে থিমড, বোধগম্য বাংলা বার্তা + রিট্রাই বোতাম দেখানো হয়।
// LocalWebView.js, PanchangScreen.js, KundaliScreen.js — তিনটাতেই ব্যবহৃত।
export function useWebViewError(webViewRef) {
  const [webError, setWebError] = useState(null); // { noInternet, description }

  const onLoadStart = useCallback(() => setWebError(null), []);

  const onError = useCallback((e) => {
    const { nativeEvent } = e;
    if (nativeEvent?.isMainFrame === false) return; // iframe/sub-resource ব্যর্থতা — মূল পেজ ঠিকই আছে, উপেক্ষা করুন
    haptics.error();
    setWebError({
      noInternet: NO_INTERNET_PATTERN.test(nativeEvent?.description || ''),
      description: nativeEvent?.description || '',
    });
  }, []);

  const onHttpError = useCallback((e) => {
    const { nativeEvent } = e;
    if (nativeEvent?.isMainFrame === false) return;
    if ((nativeEvent?.statusCode || 0) < 400) return;
    haptics.error();
    setWebError({ noInternet: false, description: 'HTTP ' + nativeEvent.statusCode });
  }, []);

  const retry = useCallback(() => {
    haptics.tap();
    setWebError(null);
    webViewRef.current?.reload();
  }, [webViewRef]);

  return { webError, onLoadStart, onError, onHttpError, retry };
}

export function WebViewErrorOverlay({ webError, onRetry }) {
  if (!webError) return null;
  return (
    <View style={s.errOverlay}>
      <View style={s.errIconWrap}>
        <MaterialCommunityIcons
          name={webError.noInternet ? 'wifi-off' : 'cloud-alert'}
          size={34}
          color={colors.primary}
        />
      </View>
      <Text style={s.errTitle}>
        {webError.noInternet ? 'ইন্টারনেট সংযোগ নেই' : 'পেজ লোড করা যায়নি'}
      </Text>
      <Text style={s.errSub}>
        {webError.noInternet
          ? 'আপনার মোবাইল ডেটা বা ওয়াইফাই চালু করে আবার চেষ্টা করুন।'
          : 'কিছুক্ষণ পর আবার চেষ্টা করুন। সমস্যা থাকলে ইন্টারনেট সংযোগ পরীক্ষা করুন।'}
      </Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [s.retryBtn, pressed && s.retryBtnPressed]}
      >
        <MaterialCommunityIcons name="refresh" size={17} color={colors.white} />
        <Text style={s.retryText}>আবার চেষ্টা করুন</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  errOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errIconWrap: {
    width: 64, height: 64, borderRadius: radii.pill,
    backgroundColor: colors.goldWash,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  errTitle: { ...typography.heading, color: colors.text, textAlign: 'center', marginBottom: 6 },
  errSub: {
    ...typography.body, color: colors.textSecondary, textAlign: 'center',
    lineHeight: 20, marginBottom: spacing.lg,
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: radii.pill,
  },
  retryBtnPressed: { opacity: 0.8 },
  retryText: { ...typography.value, color: colors.white },
});
