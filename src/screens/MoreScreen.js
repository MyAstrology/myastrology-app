import React from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { shadows } from '../theme/shadows';
import { typography } from '../theme/typography';
import { haptics } from '../utils/haptics';

const SECTIONS = [
  {
    title: 'জ্যোতিষ সেবা',
    items: [
      { label: 'জ্যোতিষ শাস্ত্র', icon: 'star-four-points-outline', screen: 'VedicAstrology' },
      { label: 'হস্তরেখা বিচার', icon: 'hand-back-right-outline', screen: 'Palmistry'  },
      { label: 'নামকরণ',        icon: 'baby-face-outline',      screen: 'Namakaran'   },
      { label: 'বিবাহ মিলাপ',   icon: 'heart-multiple-outline', screen: 'MatchMaking' },
      { label: 'সংখ্যাতত্ত্ব',  icon: 'numeric',                screen: 'Numerology'  },
      { label: 'বর্ষফল',         icon: 'chart-timeline-variant', screen: 'Varshaphala' },
      { label: 'প্রশ্ন জ্যোতিষ', icon: 'help-circle-outline',   screen: 'Prashna'     },
      { label: 'রত্নপাথর পরামর্শ', icon: 'diamond-stone',        screen: 'Gemstone'    },
      { label: 'বাস্তু শাস্ত্র', icon: 'home-city-outline',      screen: 'Vastu'       },
      { label: 'ব্লগ',           icon: 'post-outline',           screen: 'Blog'        },
      { label: 'ভিডিও',          icon: 'youtube',                screen: 'Video'       },
    ],
  },
  {
    title: 'AI ও পরামর্শ',
    items: [
      { label: 'AI জ্যোতিষী',   icon: 'robot-outline',         url: 'https://www.myastrology.in' },
      { label: 'পরামর্শ বুকিং', icon: 'phone-in-talk-outline', screen: 'Booking' },
    ],
  },
  {
    title: 'অন্যান্য',
    items: [
      { label: 'সেটিংস',           icon: 'cog-outline',            screen: 'Settings' },
      { label: 'ওয়েবসাইট',        icon: 'web',                   url: 'https://www.myastrology.in' },
      { label: 'জ্যোতিষী সম্পর্কে', icon: 'account-star-outline', screen: 'AboutAstrologer' },
    ],
  },
];

function MenuItem({ item }) {
  const navigation = useNavigation();
  const onPress = () => {
    haptics.tap();
    if (item.screen) navigation.navigate(item.screen);
    else if (item.url) Linking.openURL(item.url).catch(() => {});
  };
  return (
    <Pressable
      style={({ pressed }) => [s.item, pressed && s.itemPressed]}
      onPress={onPress}
    >
      <View style={s.iconWrap}>
        <MaterialCommunityIcons name={item.icon} size={22} color={colors.gold} />
      </View>
      <Text style={s.itemLabel}>{item.label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
    </Pressable>
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
  sectionTitle: { ...typography.sectionTitle, color: colors.textSecondary, marginBottom: 8 },
  card: {
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden',
    ...shadows.card,
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: spacing.md,
  },
  itemPressed: { backgroundColor: colors.goldWash },
  iconWrap: {
    width: 38, height: 38, borderRadius: radii.md,
    backgroundColor: colors.goldLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  itemLabel: { ...typography.body, flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  divider:   { height: 1, backgroundColor: colors.divider, marginLeft: 66 },
});
