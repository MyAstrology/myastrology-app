// src/screens/SettingsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Switch, Alert, Linking, Modal, FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Rashis } from '../theme';
import {
  registerForPushNotifications,
  schedulePanjikaNotification,
  scheduleTithiChangeNotification,
  scheduleRashifalNotification,
  cancelAllScheduled,
} from '../NotificationService';
import { loadCities, searchCities, saveUserCity, loadUserCity } from '../engine/cities';

const DEFAULT_CITY = { n: 'Ranaghat', district: 'নদিয়া', state: 'পশ্চিমবঙ্গ', country: 'ভারত', lat: 23.18, lng: 88.55 };

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState({
    panjikaNotif: true, tithiNotif: true,
    blogNotif: true, youtubeNotif: true,
    festivalNotif: true, rashifalNotif: false,
  });
  const [pushToken, setPushToken] = useState('');
  const [userCity, setUserCity] = useState(DEFAULT_CITY);
  const [userRashi, setUserRashi] = useState(null); // { name, symbol, ... }

  // city picker modal
  const [cityModal, setCityModal] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [allCities, setAllCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // rashi picker modal
  const [rashiModal, setRashiModal] = useState(false);

  useEffect(() => {
    _init();
  }, []);

  async function _init() {
    try {
      const saved = await AsyncStorage.getItem('appSettings');
      if (saved) setSettings(JSON.parse(saved));
    } catch {}
    try {
      const token = await AsyncStorage.getItem('pushToken');
      if (token) setPushToken(token.slice(0, 28) + '…');
    } catch {}
    setUserCity(await loadUserCity());
    try {
      const r = await AsyncStorage.getItem('userRashi');
      if (r) setUserRashi(JSON.parse(r));
    } catch {}
  }

  const updateSetting = useCallback(async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await AsyncStorage.setItem('appSettings', JSON.stringify(updated));
    if (key === 'panjikaNotif' && value) schedulePanjikaNotification();
    if (key === 'tithiNotif' && value) scheduleTithiChangeNotification();
    if (key === 'rashifalNotif') {
      if (value) {
        if (!userRashi) { setRashiModal(true); return; }
        scheduleRashifalNotification(userRashi.name);
      } else {
        await cancelAllScheduled();
      }
    }
  }, [settings, userRashi]);

  const enableNotifications = async () => {
    const token = await registerForPushNotifications();
    if (token) {
      setPushToken(token.slice(0, 28) + '…');
      Alert.alert('✅ সফল', 'Push notification চালু হয়েছে!');
    } else {
      Alert.alert('❌', 'Phone Settings → Apps → MyAstrology → Notifications চালু করুন।');
    }
  };

  // City picker
  const openCityPicker = async () => {
    setCityModal(true);
    if (allCities.length === 0) {
      setCitiesLoading(true);
      const c = await loadCities();
      setAllCities(c);
      setCitiesLoading(false);
    }
  };

  const selectCity = async (city) => {
    setUserCity(city);
    await saveUserCity(city);
    setCityModal(false);
    setCityQuery('');
    Alert.alert('✅', `${city.n} (${city.district}) সেট হয়েছে।\nপঞ্জিকা এখন এই শহরের সময় অনুযায়ী দেখাবে।`);
  };

  const filteredCities = searchCities(allCities, cityQuery);

  // Rashi picker
  const selectRashi = async (rashi) => {
    setUserRashi(rashi);
    await AsyncStorage.setItem('userRashi', JSON.stringify(rashi));
    setRashiModal(false);
    const updated = { ...settings, rashifalNotif: true };
    setSettings(updated);
    await AsyncStorage.setItem('appSettings', JSON.stringify(updated));
    scheduleRashifalNotification(rashi.name);
    Alert.alert('✅', `${rashi.name} রাশিফল — প্রতিদিন সকাল ৭টায় notification পাবেন।`);
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>⚙️ সেটিংস</Text>

      {/* Push Token Card */}
      <View style={styles.card}>
        <Text style={{ fontSize: 28, marginBottom: 6 }}>🔔</Text>
        <Text style={styles.cardTitle}>Push Notification</Text>
        <Text style={styles.cardSub}>{pushToken || 'এখনও চালু হয়নি'}</Text>
        <TouchableOpacity style={styles.enableBtn} onPress={enableNotifications}>
          <Text style={styles.enableBtnText}>
            {pushToken ? '✅ চালু আছে · পুনরায় নিবন্ধন' : '🔔 Notification চালু করুন'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* City Selector */}
      <View style={styles.group}>
        <Text style={styles.groupTitle}>📍 আমার শহর (পঞ্জিকা সময়)</Text>
        <TouchableOpacity style={styles.cityRow} onPress={openCityPicker}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cityName}>{userCity.n}</Text>
            <Text style={styles.citySub}>{userCity.district}, {userCity.state}</Text>
          </View>
          <Text style={{ color: Colors.gold, fontSize: 13 }}>পরিবর্তন →</Text>
        </TouchableOpacity>
      </View>

      {/* Rashi Selector */}
      <View style={styles.group}>
        <Text style={styles.groupTitle}>🌟 আমার রাশি (রাশিফল notification)</Text>
        <TouchableOpacity style={styles.cityRow} onPress={() => setRashiModal(true)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cityName}>
              {userRashi ? `${userRashi.symbol} ${userRashi.name}` : 'রাশি বেছে নিন'}
            </Text>
            <Text style={styles.citySub}>
              {userRashi ? `অধিপতি: ${userRashi.lord}` : 'প্রতিদিন সকাল ৭টায় notification'}
            </Text>
          </View>
          <Text style={{ color: Colors.gold, fontSize: 13 }}>বেছে নিন →</Text>
        </TouchableOpacity>
      </View>

      {/* Notification Settings */}
      <View style={styles.group}>
        <Text style={styles.groupTitle}>🔔 Notification</Text>
        {[
          { key: 'panjikaNotif', icon: '📅', label: 'পঞ্জিকা আপডেট', sub: 'প্রতিদিন ভোর ৬টায়' },
          { key: 'tithiNotif',  icon: '🌙', label: 'তিথি পরিবর্তন',  sub: 'তিথি বদলের সময় জানুন' },
          { key: 'rashifalNotif',icon:'🔮', label: 'দৈনিক রাশিফল',  sub: 'প্রতিদিন সকাল ৭টায়' },
          { key: 'blogNotif',   icon: '📝', label: 'নতুন ব্লগ পোস্ট',sub: 'নতুন পোস্ট প্রকাশিত হলে' },
          { key: 'youtubeNotif',icon: '🎬', label: 'নতুন YouTube ভিডিও', sub: 'নতুন ভিডিও আপলোড হলে' },
          { key: 'festivalNotif',icon:'🎊', label: 'উৎসব ও পার্বণ', sub: 'বিশেষ অনুষ্ঠানের আগে' },
        ].map((item, i, arr) => (
          <View key={item.key} style={[styles.settingRow, i < arr.length - 1 && styles.rowBorder]}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Text style={styles.settingSub}>{item.sub}</Text>
            </View>
            <Switch
              value={!!settings[item.key]}
              onValueChange={v => updateSetting(item.key, v)}
              trackColor={{ false: '#374151', true: Colors.gold + '88' }}
              thumbColor={settings[item.key] ? Colors.gold : '#9ca3af'}
            />
          </View>
        ))}
      </View>

      {/* About */}
      <View style={styles.group}>
        <Text style={styles.groupTitle}>📱 App সম্পর্কে</Text>
        {[
          { label: 'Website', value: 'myastrology.in', url: 'https://www.myastrology.in' },
          { label: 'YouTube', value: '@myastrology',   url: 'https://youtube.com/@myastrology' },
          { label: 'WhatsApp',value: '+91 93331 22768',url: 'https://wa.me/919333122768' },
          { label: 'Version', value: '1.1.0' },
        ].map((item, i) => (
          <TouchableOpacity key={i}
            style={[styles.settingRow, i < 3 && styles.rowBorder]}
            onPress={item.url ? () => Linking.openURL(item.url) : undefined}
            disabled={!item.url}
          >
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Text style={{ color: Colors.gold, fontSize: 13 }}>{item.value}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={{ margin: 16, alignItems: 'center' }}
        onPress={() => Linking.openURL('https://www.myastrology.in/privacy-policy.html')}
      >
        <Text style={{ fontSize: 12, color: Colors.textMuted }}>🔒 Privacy Policy</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />

      {/* ── City Picker Modal ── */}
      <Modal visible={cityModal} animationType="slide" onRequestClose={() => setCityModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📍 শহর বেছে নিন</Text>
            <TouchableOpacity onPress={() => { setCityModal(false); setCityQuery(''); }}>
              <Text style={{ color: Colors.gold, fontSize: 16 }}>✕ বন্ধ</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            value={cityQuery}
            onChangeText={setCityQuery}
            placeholder="শহরের নাম লিখুন..."
            placeholderTextColor={Colors.textMuted}
            autoFocus
          />
          {citiesLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color={Colors.gold} size="large" />
              <Text style={{ color: Colors.textSub, marginTop: 12 }}>শহরের তালিকা লোড হচ্ছে...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredCities}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.cityItem} onPress={() => selectCity(item)}>
                  <Text style={styles.cityItemName}>{item.n}</Text>
                  <Text style={styles.cityItemSub}>{item.district || ''}{item.district ? ', ' : ''}{item.state} · {item.country}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </Modal>

      {/* ── Rashi Picker Modal ── */}
      <Modal visible={rashiModal} animationType="slide" onRequestClose={() => setRashiModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🌟 আপনার রাশি বেছে নিন</Text>
            <TouchableOpacity onPress={() => setRashiModal(false)}>
              <Text style={{ color: Colors.gold, fontSize: 16 }}>✕ বন্ধ</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={Rashis}
            keyExtractor={(_, i) => String(i)}
            numColumns={3}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.rashiItem, userRashi?.name === item.name && styles.rashiItemActive]}
                onPress={() => selectRashi(item)}
              >
                <Text style={{ fontSize: 28 }}>{item.symbol}</Text>
                <Text style={[styles.rashiItemName, { color: item.color }]}>{item.name}</Text>
                <Text style={styles.rashiItemLord}>{item.lord}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  title: { fontSize: 22, fontWeight: '700', color: Colors.goldLight, padding: 16, paddingBottom: 8 },

  card: { margin: 16, borderRadius: 16, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.goldBorder, padding: 16, alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardSub: { fontSize: 11, color: Colors.textSub, marginTop: 4, marginBottom: 12, textAlign: 'center' },
  enableBtn: { backgroundColor: Colors.goldGlow, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: Colors.goldBorder },
  enableBtnText: { fontSize: 13, color: Colors.goldLight, fontWeight: '700' },

  group: { marginHorizontal: 16, marginBottom: 14, borderRadius: 16, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.goldBorder, overflow: 'hidden' },
  groupTitle: { fontSize: 13, color: Colors.gold, fontWeight: '700', padding: 12, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: Colors.goldBorder },

  cityRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  cityName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  citySub: { fontSize: 11, color: Colors.textSub, marginTop: 2 },

  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.1)' },
  settingLabel: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  settingSub: { fontSize: 11, color: Colors.textSub, marginTop: 2 },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.goldBorder },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.goldLight },
  searchInput: { margin: 12, backgroundColor: Colors.bgCard, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.goldBorder },
  cityItem: { paddingHorizontal: 16, paddingVertical: 12 },
  cityItemName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cityItemSub: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  sep: { height: 1, backgroundColor: 'rgba(201,168,76,0.1)', marginHorizontal: 16 },

  rashiItem: { flex: 1, margin: 6, borderRadius: 14, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.goldBorder, padding: 12, alignItems: 'center', gap: 4 },
  rashiItemActive: { borderColor: Colors.gold, backgroundColor: Colors.goldGlow },
  rashiItemName: { fontSize: 13, fontWeight: '700' },
  rashiItemLord: { fontSize: 10, color: Colors.textSub },
});
