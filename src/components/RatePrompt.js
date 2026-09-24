/*  Play-তে রেটিং চাওয়ার ছোট কার্ড — হোম পর্দায়।
 *
 *  ⛔ ২০২৬-০৯-২৫ — Play Console: ২৮ দিনে স্টোরে ৬.৯২k ইম্প্রেশন, ১২৪ ইনস্টল।
 *  স্টোরে রেটিং ও রিভিউর সংখ্যাই ইনস্টলের হার সবচেয়ে বেশি ঠিক করে, আর
 *  অ্যাপ কখনো রেটিং চায়নি।
 *
 *  নিয়ম (UX ও Google-এর নীতি):
 *  - অ্যাপ অন্তত ৫ বার খোলা ও প্রথম খোলার ৩ দিন পরে — নতুন পাঠককে নয়
 *  - "পরে" = ১৪ দিন চুপ; "রেটিং দিন" = আর কখনো নয়
 *  - নিরপেক্ষ প্রশ্ন: কোনো পুরস্কার নেই, আর "খুশি হলে তবেই" জাতীয় ছাঁকনিও
 *    নেই — দুটোই Play-র নীতিতে নিষিদ্ধ
 *  - নতুন native মডিউল নয় (in-app review লাইব্রেরি নতুন বিল্ড-নির্ভরতা আনত) —
 *    সোজা Play স্টোরের পাতা খোলে
 */
import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../i18n/Text';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';

const KEY = 'mya_rate_v1';
const DAY = 864e5;
const STORE_APP = 'market://details?id=in.myastrology.app';
const STORE_WEB = 'https://play.google.com/store/apps/details?id=in.myastrology.app';

export function RatePrompt() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const now = Date.now();
        const st = JSON.parse((await AsyncStorage.getItem(KEY)) || 'null') || { opens: 0, first: now, next: 0, done: false };
        st.opens += 1;
        await AsyncStorage.setItem(KEY, JSON.stringify(st));
        if (alive && !st.done && st.opens >= 5 && now - st.first >= 3 * DAY && now >= (st.next || 0)) setShow(true);
      } catch (e) {}
    })();
    return () => { alive = false; };
  }, []);

  const save = async (patch) => {
    try {
      const st = JSON.parse((await AsyncStorage.getItem(KEY)) || '{}');
      await AsyncStorage.setItem(KEY, JSON.stringify({ ...st, ...patch }));
    } catch (e) {}
  };
  const rate = () => {
    setShow(false);
    save({ done: true });
    Linking.openURL(STORE_APP).catch(() => Linking.openURL(STORE_WEB).catch(() => {}));
  };
  const later = () => { setShow(false); save({ next: Date.now() + 14 * DAY }); };

  if (!show) return null;
  return (
    <View style={s.card} accessibilityRole="summary">
      <MaterialCommunityIcons name="star-circle-outline" size={30} color={colors.gold} />
      <View style={s.txt}>
        <Text style={s.title} maxFontSizeMultiplier={1.25}>অ্যাপটা কেমন লাগছে?</Text>
        <Text style={s.sub} maxFontSizeMultiplier={1.25}>Play স্টোরে আপনার রেটিং দেখে অন্যরাও অ্যাপটা খুঁজে পান</Text>
        <View style={s.row}>
          <Pressable onPress={rate} style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button" hitSlop={6}>
            <Text style={s.btnTxt}>রেটিং দিন</Text>
          </Pressable>
          <Pressable onPress={later} style={({ pressed }) => [s.btnGhost, pressed && { opacity: 0.7 }]}
            accessibilityRole="button" hitSlop={6}>
            <Text style={s.ghostTxt}>পরে</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md, marginTop: 10, padding: 12, flexDirection: 'row', gap: 10,
    backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.goldBorder,
  },
  txt: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: { backgroundColor: colors.gold, borderRadius: radii.md, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' },
  btnTxt: { color: colors.white, fontWeight: '700', fontSize: 14 },
  btnGhost: { borderRadius: radii.md, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' },
  ghostTxt: { color: colors.textSecondary, fontSize: 14 },
});
