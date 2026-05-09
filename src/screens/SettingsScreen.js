// src/screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Alert, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Colors } from '../theme';
import {
  registerForPushNotifications,
  schedulePanjikaNotification,
  cancelAllNotifications,
} from '../services/NotificationService';

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState({
    panjikaNotif: true,
    blogNotif: true,
    youtubeNotif: true,
    festivalNotif: true,
    rashifalNotif: false,
    darkMode: true,
  });
  const [pushToken, setPushToken] = useState('');

  useEffect(() => {
    loadSettings();
    loadToken();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('appSettings');
      if (saved) setSettings(JSON.parse(saved));
    } catch {}
  };

  const loadToken = async () => {
    const token = await AsyncStorage.getItem('pushToken');
    if (token) setPushToken(token.substring(0, 30) + '...');
  };

  const updateSetting = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await AsyncStorage.setItem('appSettings', JSON.stringify(updated));

    if (key === 'panjikaNotif') {
      if (value) schedulePanjikaNotification('আজকের তিথি');
      else cancelAllNotifications();
    }

    // Dark Mode পরিবর্তন পুরো অ্যাপে প্রভাব ফেলবে (তুমি পরে Context দিয়ে যুক্ত করতে পারবে)
    if (key === 'darkMode') {
      // উদাহরণ: এখানে তুমি ThemeContext-এর মাধ্যমে গ্লোবাল থিম পরিবর্তন করতে পারবে
      // toggleTheme(value);
    }
  };

  const enableNotifications = async () => {
    const token = await registerForPushNotifications();
    if (token) {
      setPushToken(token.substring(0, 30) + '...');
      Alert.alert('✅ সফল', 'Push notification চালু হয়েছে!');
    } else {
      Alert.alert('❌', 'Notification permission দিন।\nPhone Settings → Apps → MyAstrology → Notifications');
    }
  };

  const SETTINGS_GROUPS = [
    {
      title: '🔔 Notification সেটিংস',
      items: [
        { key: 'panjikaNotif', label: 'পঞ্জিকা আপডেট', sub: 'প্রতিদিন সকালে তিথি-নক্ষত্র', icon: '📅' },
        { key: 'blogNotif', label: 'নতুন ব্লগ পোস্ট', sub: 'নতুন পোস্ট প্রকাশিত হলে', icon: '📝' },
        { key: 'youtubeNotif', label: 'নতুন YouTube ভিডিও', sub: 'নতুন ভিডিও আপলোড হলে', icon: '🎬' },
        { key: 'festivalNotif', label: 'উৎসব ও পার্বণ', sub: 'বিশেষ অনুষ্ঠানের আগের দিন', icon: '🎊' },
        { key: 'rashifalNotif', label: 'দৈনিক রাশিফল', sub: 'প্রতিদিন সকাল ৭টায়', icon: '🔮' },
      ],
    },
    {
      title: '⚙️ App সেটিংস',
      items: [
        { key: 'darkMode', label: 'Dark Mode', sub: 'রাতের থিম', icon: '🌙' },
      ],
    },
  ];

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>⚙️ সেটিংস</Text>

      {/* Push notification setup */}
      <View style={styles.notifCard}>
        <Text style={{ fontSize: 30, marginBottom: 8 }}>🔔</Text>
        <Text style={styles.notifTitle}>Push Notification</Text>
        <Text style={styles.notifSub}>
          {pushToken || 'Notification এখনও চালু হয়নি'}
        </Text>
        <TouchableOpacity style={styles.enableBtn} onPress={enableNotifications}>
          <Text style={styles.enableBtnText}>
            {pushToken ? '✅ চালু আছে · পুনরায় নিবন্ধন' : '🔔 Notification চালু করুন'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Settings groups */}
      {SETTINGS_GROUPS.map((group, gi) => (
        <View key={gi} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {group.items.map((item, ii) => (
            <View key={ii} style={[styles.settingRow, ii < group.items.length - 1 && styles.settingBorder]}>
              <Text style={{ fontSize: 22, marginRight: 12 }}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Text style={styles.settingSub}>{item.sub}</Text>
              </View>
              <Switch
                value={settings[item.key]}
                onValueChange={(v) => updateSetting(item.key, v)}
                trackColor={{ false: '#374151', true: Colors.gold + '88' }}
                thumbColor={settings[item.key] ? Colors.gold : '#9ca3af'}
              />
            </View>
          ))}
        </View>
      ))}

      {/* About */}
      <View style={styles.group}>
        <Text style={styles.groupTitle}>📱 App সম্পর্কে</Text>
        {[
          { label: 'Website', value: 'myastrology.in', action: () => Linking.openURL('https://www.myastrology.in') },
          { label: 'YouTube', value: '@myastrology', action: () => Linking.openURL('https://youtube.com/@myastrology') },
          { label: 'WhatsApp', value: '+91 93331 22768', action: () => Linking.openURL('https://wa.me/919333122768') },
          { label: 'App Version', value: Constants.expoConfig?.version || '1.0.0', action: null },
        ].map((item, i) => (
          <TouchableOpacity key={i}
            style={[styles.settingRow, i < 3 && styles.settingBorder]}
            onPress={item.action}
            disabled={!item.action}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>{item.label}</Text>
            </View>
            <Text style={{ fontSize: 13, color: Colors.gold }}>{item.value}</Text>
            {item.action && <Text style={{ color: Colors.textSub, marginLeft: 6 }}>→</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Privacy Policy ও Terms of Use আলাদা */}
      <View style={styles.legalGroup}>
        <TouchableOpacity style={styles.legalRow}
          onPress={() => Linking.openURL('https://www.myastrology.in/privacy-policy.html')}
        >
          <Text style={styles.legalText}>🔒 Privacy Policy</Text>
        </TouchableOpacity>
        <View style={styles.legalDivider} />
        <TouchableOpacity style={styles.legalRow}
          onPress={() => Linking.openURL('https://www.myastrology.in/terms-of-use.html')}
        >
          <Text style={styles.legalText}>📝 Terms of Use</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  title: { fontSize: 22, fontWeight: '700', color: Colors.goldLight, padding: 16, paddingBottom: 8 },
  notifCard: {
    margin: 16, borderRadius: 16,
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.goldBorder,
    padding: 16, alignItems: 'center',
  },
  notifTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  notifSub: { fontSize: 11, color: Colors.textSub, marginTop: 4, marginBottom: 12, textAlign: 'center' },
  enableBtn: {
    backgroundColor: Colors.goldGlow,
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  enableBtnText: { fontSize: 13, color: Colors.goldLight, fontWeight: '700' },
  group: {
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.goldBorder,
    overflow: 'hidden',
  },
  groupTitle: {
    fontSize: 13, color: Colors.gold, fontWeight: '700',
    padding: 12, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: Colors.goldBorder,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14,
  },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.1)' },
  settingLabel: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  settingSub: { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  legalGroup: {
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.goldBorder,
    overflow: 'hidden',
  },
  legalRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16,
  },
  legalText: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  legalDivider: { height: 1, backgroundColor: 'rgba(201,168,76,0.1)', marginHorizontal: 16 },
});
