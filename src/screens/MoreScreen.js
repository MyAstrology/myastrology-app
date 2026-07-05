import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../theme';

const ITEMS = [
  { label: 'বিবাহ মিলাপ',   icon: 'heart-outline',       url: 'https://www.myastrology.in/kundali-matching.html' },
  { label: 'নামকরণ',        icon: 'person-add-outline',  url: 'https://www.myastrology.in/namkaran.html'         },
  { label: 'বর্ষফল',        icon: 'trending-up-outline', url: 'https://www.myastrology.in/varshafal.html'        },
  { label: 'গোচর',          icon: 'planet-outline',      url: 'https://www.myastrology.in/gochar.html'           },
  { label: 'AI জ্যোতিষী',   icon: 'chatbubble-outline',  url: 'https://www.myastrology.in/ai-jyotishi.html'     },
  { label: 'পরামর্শ বুকিং', icon: 'call-outline',        url: 'https://www.myastrology.in/consult.html'          },
  { label: 'ওয়েবসাইট',     icon: 'globe-outline',       url: 'https://www.myastrology.in'                       },
];

export default function MoreScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>আরও সেবা</Text>
        <View style={s.goldLine} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.list}>
          {ITEMS.map((item, i) => (
            <TouchableOpacity key={i} style={s.row} onPress={() => Linking.openURL(item.url)} activeOpacity={0.7}>
              <View style={s.iconWrap}>
                <Ionicons name={item.icon} size={20} color={COLORS.gold} />
              </View>
              <Text style={s.label}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.subtleMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: COLORS.cream },
  header:   { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.lg },
  title:    { fontSize: 22, fontWeight: '700', color: COLORS.charcoal, marginBottom: SPACING.sm },
  goldLine: { height: 1, width: 40, backgroundColor: COLORS.gold, opacity: 0.5 },
  list:     { paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingBottom: SPACING.xl },
  row:      { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, elevation: 1, shadowColor: '#1C1C2E', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.goldLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  label:    { flex: 1, fontSize: 15, color: COLORS.charcoal, fontWeight: '500' },
});
