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
import { getNotificationPreference, setNotificationsEnabled } from '../utils/onesignal';
import { ADMIN_EMAILS } from '../config/adminEmails';

const WEB_CACHE_DIR = FileSystem.documentDirectory + 'myastro/';
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
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
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [notifOn, setNotifOn] = useState(false);
  const [clearing, setClearing] = useState(false);

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
                  icon="shield-account"
                  label="অ্যাডমিন প্যানেল"
                  onPress={() => navigation.navigate('Admin')}
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
            <Row
              icon="file-document-outline"
              label="শর্তাবলী"
              onPress={() => Linking.openURL('https://www.myastrology.in/terms-of-use.html').catch(() => {})}
            />
            <View style={s.divider} />
            <Row icon="information-outline" label="ভার্সন" sub={APP_VERSION} />
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
