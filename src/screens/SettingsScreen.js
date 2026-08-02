import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Linking, Switch, Alert, Share,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { shadows } from '../theme/shadows';
import { typography } from '../theme/typography';
import { haptics } from '../utils/haptics';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { getNotificationPreference, setNotificationsEnabled } from '../utils/onesignal';
import { ADMIN_EMAILS } from '../config/adminEmails';
import { loadPanjikaCity } from '../utils/panjikaCity';

const WEB_CACHE_DIR = FileSystem.documentDirectory + 'myastro/';
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
const BUILD_NO = Constants.expoConfig?.android?.versionCode;
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=in.myastrology.app';
const SUPPORT_PHONE = '+919333122768';

function Row({ icon, label, sub, onPress, right, danger }) {
  return (
    <Pressable
      style={({ pressed }) => [s.item, pressed && onPress && s.itemPressed]}
      onPress={onPress ? () => { haptics.tap(); onPress(); } : undefined}
    >
      <View style={[s.iconWrap, danger && s.iconWrapDanger]}>
        <MaterialCommunityIcons name={icon} size={20} color={danger ? '#B71C1C' : colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.itemLabel, danger && { color: '#B71C1C' }]}>{label}</Text>
        {sub ? <Text style={s.itemSub}>{sub}</Text> : null}
      </View>
      {right}
      {onPress && !right ? (
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
      ) : null}
    </Pressable>
  );
}

export function SettingsScreen({ navigation }) {
  const { user, loading, signInWithGoogle, signOut, deleteAccount } = useAuth();
  const { clearUser } = useUser();
  const [notifOn, setNotifOn] = useState(false);
  const [clearing, setClearing] = useState(false);
  // পঞ্চাঙ্গ কোন শহরের হিসাবে দেখানো হচ্ছে — হোম ও পঞ্জিকা দুটোই এই একই
  // শহর ব্যবহার করে। আগে এটা কোথাও লেখা ছিল না, ফলে সময় নিয়ে বিভ্রান্তি
  // হতো (হোম কলকাতা ধরত, পঞ্জিকা অন্য শহর)। এখন স্পষ্ট করে দেখানো হয়।
  const [panchangCity, setPanchangCity] = useState(null);
  useEffect(() => { loadPanjikaCity().then(setPanchangCity).catch(() => {}); }, []);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getNotificationPreference().then(setNotifOn).catch(() => {});
  }, []);

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const toggleNotif = useCallback(async (val) => {
    haptics.tap();
    setNotifOn(val);
    try {
      await setNotificationsEnabled(val);
    } catch (_) {
      setNotifOn(!val);
    }
  }, []);

  const handleAuthPress = useCallback(async () => {
    try {
      if (user) {
        await signOut();
        haptics.tap();
      } else {
        await signInWithGoogle();
        haptics.success();
      }
    } catch (e) {
      haptics.error();
      Alert.alert('ত্রুটি', 'সাইন-ইন করা যায়নি। আবার চেষ্টা করুন।');
    }
  }, [user, signInWithGoogle, signOut]);

  // Google Play-র Data deletion নীতি অনুযায়ী অ্যাপের ভেতরেই অ্যাকাউন্ট ও
  // ডেটা মোছার পথ থাকতে হয়। দুই ধাপের নিশ্চিতকরণ রাখা হয়েছে — কাজটা
  // অপরিবর্তনীয়, আর "লগআউট" সারির ঠিক নিচেই থাকায় ভুল ট্যাপের ঝুঁকি আছে।
  const confirmDeleteAccount = useCallback(() => {
    Alert.alert(
      'অ্যাকাউন্ট মুছে ফেলবেন?',
      'আপনার নাম, ইমেইল, প্রোফাইল ছবি ও ক্লাউডে সংরক্ষিত কুণ্ডলীগুলো স্থায়ীভাবে মুছে যাবে। এটি ফিরিয়ে আনা যাবে না।',
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'এগিয়ে যান',
          style: 'destructive',
          onPress: () => Alert.alert(
            'শেষ নিশ্চিতকরণ',
            'সত্যিই অ্যাকাউন্ট মুছে ফেলতে চান?',
            [
              { text: 'না', style: 'cancel' },
              {
                text: 'হ্যাঁ, মুছে ফেলুন',
                style: 'destructive',
                onPress: async () => {
                  setDeleting(true);
                  try {
                    await deleteAccount();
                    // ডিভাইসে রাখা জন্ম-তথ্যও মুছি — ব্যবহারকারী "সব মুছে
                    // যাক" বুঝেই এটা চাপেন, শুধু সার্ভারের কপি মুছলে
                    // প্রতিশ্রুতিটা অর্ধেক পালন করা হতো।
                    await clearUser().catch(() => {});
                    haptics.success();
                    Alert.alert('মুছে ফেলা হয়েছে', 'আপনার অ্যাকাউন্ট ও সংরক্ষিত তথ্য মুছে ফেলা হয়েছে।');
                  } catch (e) {
                    haptics.error();
                    Alert.alert(
                      'মুছে ফেলা যায়নি',
                      'নিরাপত্তার কারণে আবার সাইন-ইন করে চেষ্টা করতে হতে পারে। সমস্যা থাকলে ' +
                      SUPPORT_PHONE + ' নম্বরে যোগাযোগ করুন।',
                    );
                  } finally {
                    setDeleting(false);
                  }
                },
              },
            ],
          ),
        },
      ],
    );
  }, [deleteAccount, clearUser]);

  const shareApp = useCallback(async () => {
    haptics.tap();
    try {
      await Share.share({
        message: `MyAstrology অ্যাপ ব্যবহার করুন — জ্যোতিষ, পঞ্জিকা, কুণ্ডলী সব এক জায়গায়!\n${PLAY_STORE_URL}`,
      });
    } catch (_) {}
  }, []);

  const clearCache = useCallback(() => {
    Alert.alert(
      'ক্যাশ পরিষ্কার করুন',
      'অফলাইন পেজগুলো নতুন করে লোড হবে। এগিয়ে যাবেন?',
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'পরিষ্কার করুন',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              await FileSystem.deleteAsync(WEB_CACHE_DIR, { idempotent: true });
              haptics.success();
              Alert.alert('সম্পন্ন', 'ক্যাশ পরিষ্কার হয়েছে।');
            } catch (_) {
              haptics.error();
              Alert.alert('ত্রুটি', 'ক্যাশ পরিষ্কার করা যায়নি।');
            } finally {
              setClearing(false);
            }
          },
        },
      ],
    );
  }, []);

  return (
    <View style={s.container}>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={s.section}>
          <Text style={s.sectionTitle}>অ্যাকাউন্ট</Text>
          <View style={s.card}>
            {user ? (
              <Row
                icon="account-circle"
                label={user.displayName || 'ব্যবহারকারী'}
                sub={user.email}
                onPress={handleAuthPress}
                right={<Text style={s.signOutText}>লগআউট</Text>}
              />
            ) : (
              <Row
                icon="login"
                label="Google দিয়ে সাইন-ইন করুন"
                sub={loading ? 'লোড হচ্ছে…' : 'একাধিক ডিভাইসে আপনার তথ্য সংরক্ষণ করুন'}
                onPress={handleAuthPress}
              />
            )}
            {isAdmin && (
              <>
                <View style={s.divider} />
                <Row
                  icon="account-group-outline"
                  label="নিবন্ধিত ব্যবহারকারী"
                  onPress={() => navigation.navigate('Admin')}
                />
                <View style={s.divider} />
                <Row
                  icon="tune-variant"
                  label="ওয়েবসাইট Admin টুলস"
                  sub="মূল্য, প্রিমিয়াম, কুণ্ডলী মিলন ও রিভিউ সংখ্যা"
                  onPress={() => Linking.openURL('https://myastrology.in/admin').catch(() => {})}
                />
              </>
            )}
            {user && (
              <>
                <View style={s.divider} />
                <Row
                  icon="account-remove-outline"
                  label="অ্যাকাউন্ট মুছে ফেলুন"
                  sub={deleting ? 'মুছে ফেলা হচ্ছে…' : 'অ্যাকাউন্ট ও সংরক্ষিত তথ্য স্থায়ীভাবে মুছে যাবে'}
                  onPress={deleting ? undefined : confirmDeleteAccount}
                  danger
                />
              </>
            )}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>নোটিফিকেশন</Text>
          <View style={s.card}>
            <Row
              icon="bell-ring-outline"
              label="পঞ্জিকা ও রাশিফল নোটিফিকেশন"
              sub="প্রতিদিন সকালে বিজ্ঞপ্তি পাবেন"
              right={
                <Switch
                  value={notifOn}
                  onValueChange={toggleNotif}
                  trackColor={{ true: colors.gold, false: colors.divider }}
                  thumbColor={colors.white}
                />
              }
            />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>সাহায্য ও শেয়ার</Text>
          <View style={s.card}>
            <Row
              icon="share-variant-outline"
              label="অ্যাপ শেয়ার করুন"
              sub="বন্ধুদের সাথে শেয়ার করুন"
              onPress={shareApp}
            />
            <View style={s.divider} />
            <Row
              icon="star-outline"
              label="প্লে স্টোরে রেট করুন"
              onPress={() => Linking.openURL(PLAY_STORE_URL).catch(() => {})}
            />
            <View style={s.divider} />
            <Row
              icon="phone-outline"
              label="ফোন করুন"
              sub={SUPPORT_PHONE}
              onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {})}
            />
            <View style={s.divider} />
            <Row
              icon="whatsapp"
              label="WhatsApp-এ যোগাযোগ করুন"
              sub="দ্রুত উত্তর পান"
              onPress={() => Linking.openURL(
                `https://wa.me/${SUPPORT_PHONE.replace('+', '')}?text=${encodeURIComponent('নমস্কার, আমি MyAstrology অ্যাপ থেকে যোগাযোগ করছি। ')}`
              ).catch(() => {})}
            />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>অ্যাপ সম্পর্কে</Text>
          <View style={s.card}>
            <Row
              icon="trash-can-outline"
              label="ক্যাশ পরিষ্কার করুন"
              sub={clearing ? 'পরিষ্কার হচ্ছে…' : 'অফলাইন পেজের সংরক্ষিত ফাইল মুছুন'}
              onPress={clearing ? undefined : clearCache}
            />
            <View style={s.divider} />
            <Row
              icon="shield-check-outline"
              label="প্রাইভেসি পলিসি"
              onPress={() => Linking.openURL('https://www.myastrology.in/privacy-policy.html').catch(() => {})}
            />
            <View style={s.divider} />
            {/* সাইন-ইন করা না থাকলে উপরের "অ্যাকাউন্ট মুছে ফেলুন" সারিটা
                দেখা যায় না, অথচ অ্যাপ আনইনস্টল করে ফেলা বা সাইন-ইন করতে না
                পারা ব্যবহারকারীরও মোছার পথ থাকা Play-র শর্ত — তাই ওয়েব
                পাতার লিংকটা এখানে সবসময় থাকে। */}
            <Row
              icon="account-remove-outline"
              label="অ্যাকাউন্ট মোছার নিয়ম"
              sub="সাইন-ইন ছাড়াও অনুরোধ পাঠানোর উপায়"
              onPress={() => Linking.openURL('https://www.myastrology.in/account-deletion').catch(() => {})}
            />
            <View style={s.divider} />
            <Row
              icon="file-document-outline"
              label="শর্তাবলী"
              onPress={() => Linking.openURL('https://www.myastrology.in/terms-of-use.html').catch(() => {})}
            />
            <View style={s.divider} />
            <Row
              icon="map-marker-outline"
              label="পঞ্চাঙ্গের অবস্থান"
              sub={panchangCity
                ? `${panchangCity.label} — পঞ্জিকা ট্যাবের 📍 বোতাম থেকে বদলানো যায়`
                : 'লোড হচ্ছে…'}
            />
            <View style={s.divider} />
            <Row
              icon="information-outline"
              label="ভার্সন"
              sub={BUILD_NO ? `${APP_VERSION} (বিল্ড ${BUILD_NO})` : APP_VERSION}
            />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  section:      { marginHorizontal: spacing.md, marginTop: spacing.md },
  sectionTitle: { ...typography.sectionTitle, color: colors.textSecondary, marginBottom: 8 },
  card: {
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden',
    ...shadows.card,
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: spacing.md, gap: 10,
  },
  itemPressed: { backgroundColor: colors.goldWash },
  iconWrap: {
    width: 38, height: 38, borderRadius: radii.md,
    backgroundColor: colors.goldLight,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapDanger: { backgroundColor: '#FCE4EC' },
  itemLabel: { ...typography.body, fontSize: 15, color: colors.text, fontWeight: '500' },
  itemSub:   { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  signOutText: { ...typography.label, color: '#B71C1C', fontWeight: '600' },
  divider:   { height: 1, backgroundColor: colors.divider, marginLeft: 62 },
});
