import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { MENU_ITEMS, MenuIcon } from '../navigation/menuItems';
import { useAuth } from '../context/AuthContext';

const LOGO = require('../../assets/logo.png');

// ওয়েবসাইটের site-header-এর মতোই (myaAuth div) — লগইন/প্রোফাইল বোতাম সরাসরি
// প্রতিটা পেজের হেডারে, Settings-এর গভীরে না লুকিয়ে। লগ-আউট থাকলে ট্যাপেই
// সরাসরি Google সাইন-ইন শুরু হয়ে যায়; লগইন থাকলে প্রোফাইল ছবি/অক্ষর দেখায়
// এবং ট্যাপে Settings-এর অ্যাকাউন্ট সেকশনে নিয়ে যায় (সাইন-আউট/প্রোফাইল দেখতে)।
function HeaderAuthButton() {
  const navigation = useNavigation();
  const { user, loading, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);

  const handlePress = useCallback(async () => {
    if (user) { navigation.navigate('Settings'); return; }
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      Alert.alert('লগইন ব্যর্থ', String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }, [user, signInWithGoogle, navigation]);

  if (loading) return <View style={s.iconBtn} />;

  return (
    <TouchableOpacity style={s.iconBtn} onPress={handlePress} activeOpacity={0.7} disabled={busy}>
      {busy ? (
        <ActivityIndicator size="small" color={colors.gold} />
      ) : user ? (
        user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={s.avatar} />
        ) : (
          <View style={s.avatarFallback}>
            <Text style={s.avatarInitial}>{(user.displayName || user.email || 'U').trim().charAt(0).toUpperCase()}</Text>
          </View>
        )
      ) : (
        <MaterialCommunityIcons name="account-circle-outline" size={24} color={colors.gold} />
      )}
    </TouchableOpacity>
  );
}

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Image source={LOGO} style={s.logo} />
        <View style={s.headerCenter}>
          <Text style={s.brand}>MYASTROLOGY</Text>
          <Text style={s.tagline}>জ্যোতিষ · পঞ্জিকা · কুণ্ডলী</Text>
        </View>
        <HeaderAuthButton />
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
          <MaterialCommunityIcons name="bell-outline" size={22} color={colors.gold} />
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={() => setMenuOpen(true)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="menu" size={24} color={colors.gold} />
        </TouchableOpacity>
      </View>

      {menuOpen && (
        <View style={s.drawerOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setMenuOpen(false)} activeOpacity={1} />
          <View style={[s.drawer, { paddingTop: insets.top + 8 }]}>
            <View style={s.drawerHeader}>
              <Text style={s.drawerTitle}>MENU</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={s.drawerDivider} />
            {MENU_ITEMS.map(item => (
              <TouchableOpacity
                key={item.tab}
                style={s.menuItem}
                onPress={() => { setMenuOpen(false); navigation.navigate(item.tab); }}
                activeOpacity={0.7}
              >
                <MenuIcon tab={item.tab} icon={item.icon} size={20} color={colors.primary} />
                <Text style={s.menuLabel}>{item.label}</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.headerBg,
    paddingHorizontal: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: colors.headerBorder,
  },
  logo:         { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.gold + 'AA' },
  headerCenter: { flex: 1, alignItems: 'center' },
  brand:        { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  tagline:      { fontSize: 9, color: colors.textSecondary, letterSpacing: 1.2, marginTop: 1,
                  fontFamily: 'NotoSerifBengali-Regular' },
  iconBtn:      { width: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
  avatar:         { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.goldBorder },
  avatarFallback: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary,
                    alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { fontSize: 12, fontWeight: '800', color: colors.white },

  drawerOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row-reverse', zIndex: 100 },
  drawer: {
    width: '75%', backgroundColor: colors.card,
    paddingHorizontal: 18, paddingBottom: 32,
    borderLeftWidth: 1, borderLeftColor: colors.cardBorder,
    elevation: 16, shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.12, shadowRadius: 12,
  },
  drawerHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  drawerTitle:   { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  drawerDivider: { height: 1, backgroundColor: colors.cardBorder, marginBottom: 14 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  menuLabel: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600',
               fontFamily: 'NotoSerifBengali-Regular' },
});
