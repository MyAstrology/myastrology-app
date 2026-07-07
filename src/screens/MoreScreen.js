import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const SECTIONS = [
  {
    title: 'জ্যোতিষ সেবা',
    items: [
      { label: 'নামকরণ',        icon: 'baby-face-outline',      screen: 'Namakaran'   },
      { label: 'বিবাহ মিলাপ',   icon: 'heart-multiple-outline', screen: 'MatchMaking' },
      { label: 'সংখ্যাতত্ত্ব',  icon: 'numeric',                screen: 'Numerology'  },
      { label: 'বর্ষফল',         icon: 'chart-timeline-variant', screen: 'Varshaphala' },
      { label: 'প্রশ্ন জ্যোতিষ', icon: 'help-circle-outline',   screen: 'Prashna'     },
      { label: 'ব্লগ',           icon: 'post-outline',           screen: 'Blog'        },
      { label: 'গোচর',          icon: 'orbit',                  url: 'https://www.myastrology.in/gochar.html' },
    ],
  },
  {
    title: 'AI ও পরামর্শ',
    items: [
      { label: 'AI জ্যোতিষী',   icon: 'robot-outline',         url: 'https://www.myastrology.in/ai-jyotishi.html' },
      { label: 'পরামর্শ বুকিং', icon: 'phone-in-talk-outline', screen: 'Booking' },
    ],
  },
  {
    title: 'অন্যান্য',
    items: [
      { label: 'ওয়েবসাইট',        icon: 'web',                url: 'https://www.myastrology.in' },
      { label: 'আমাদের সম্পর্কে', icon: 'information-outline', url: 'https://www.myastrology.in' },
    ],
  },
];

function MenuItem({ item }) {
  const navigation = useNavigation();
  const onPress = () => {
    if (item.screen) navigation.navigate(item.screen);
    else if (item.url) Linking.openURL(item.url).catch(() => {});
  };
  return (
    <TouchableOpacity style={s.item} onPress={onPress} activeOpacity={0.7}>
      <View style={s.iconWrap}>
        <MaterialCommunityIcons name={item.icon} size={22} color={colors.gold} />
      </View>
      <Text style={s.itemLabel}>{item.label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export function MoreScreen() {
  return (
    <View style={s.container}>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false}>
      {SECTIONS.map((sec, si) => (
        <View key={si} style={s.section}>
          <Text style={s.sectionTitle}>{sec.title}</Text>
          <View style={s.card}>
            {sec.items.map((item, ii) => (
              <View key={ii}>
                <MenuItem item={item} />
                {ii < sec.items.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  section:      { marginHorizontal: spacing.md, marginTop: spacing.md },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden',
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: spacing.md,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.goldLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  itemLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  divider:   { height: 1, backgroundColor: colors.divider, marginLeft: 66 },
});
