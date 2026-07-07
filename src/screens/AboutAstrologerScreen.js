import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Linking, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { shadows } from '../theme/shadows';
import { typography } from '../theme/typography';
import { haptics } from '../utils/haptics';

// সব তথ্য myastrology.in/about.html-এর নিজস্ব JSON-LD Person schema থেকে —
// কোনো নতুন/অযাচাইকৃত দাবি যোগ করা হয়নি, শুধু একই সত্য তথ্য অ্যাপেও দেখানো হচ্ছে।
const PHOTO_URL = 'https://myastrology.in/gallery/best-astrologer-in-west-bengal-dr-prodyut-acharya.webp';
const PHONE = '+919333122768';

const STATS = [
  { value: '১৫+',      label: 'বছরের অভিজ্ঞতা' },
  { value: '১০,০০০+', label: 'পরামর্শ প্রদত্ত' },
  { value: '৩০৪+',     label: 'যাচাইকৃত রিভিউ' },
  { value: '২২৪K+',   label: 'ইউটিউব সাবস্ক্রাইবার' },
];

const CREDENTIALS = [
  'PhD (জ্যোতিষ) — South Kolkata Astrology & Vastu Science Academy (SKAVSA)',
  'ARP ডিপ্লোমা — Astrology Research Project',
  'জেম থেরাপি সার্টিফিকেট — SKAVSA',
  'গোল্ড মেডেলিস্ট, জ্যোতিষ ও হস্তরেখা বিভাগ',
];

const SOCIALS = [
  { icon: 'youtube',  label: 'YouTube',   url: 'https://www.youtube.com/@myastrology' },
  { icon: 'facebook', label: 'Facebook',  url: 'https://www.facebook.com/Dr.ProdyutAcharya' },
  { icon: 'instagram',label: 'Instagram', url: 'https://www.instagram.com/myastrology.in' },
  { icon: 'linkedin', label: 'LinkedIn',  url: 'https://www.linkedin.com/in/ProdyutAcharya' },
];

function InfoRow({ icon, label, sub, onPress, isLast }) {
  return (
    <Pressable
      style={({ pressed }) => [s.row, !isLast && s.rowDivider, pressed && onPress && s.rowPressed]}
      onPress={onPress ? () => { haptics.tap(); onPress(); } : undefined}
    >
      <View style={s.rowIconWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      {onPress ? <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} /> : null}
    </Pressable>
  );
}

export function AboutAstrologerScreen() {
  return (
    <View style={s.container}>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        <View style={s.hero}>
          <Image source={{ uri: PHOTO_URL }} style={s.photo} />
          <Text style={s.name}>ড. প্রদ্যুৎ আচার্য</Text>
          <Text style={s.title}>বৈদিক জ্যোতিষী · হস্তরেখাবিদ · সংখ্যাতত্ত্ববিদ · বাস্তু বিশেষজ্ঞ</Text>
        </View>

        <View style={s.statsRow}>
          {STATS.map(st => (
            <View key={st.label} style={s.statBox}>
              <Text style={s.statValue} numberOfLines={1} adjustsFontSizeToFit>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>পরিচিতি</Text>
          <View style={s.card}>
            <Text style={s.bodyText}>
              রানাঘাট, পশ্চিমবঙ্গের গোল্ড মেডেলিস্ট PhD জ্যোতিষী ও হস্তরেখাবিদ। বৈদিক জ্যোতিষ, হস্তরেখা
              বিচার, কুণ্ডলী বিশ্লেষণ, সংখ্যাতত্ত্ব, রত্ন থেরাপি ও বাস্তু শাস্ত্রে ১৫ বছরের বেশি অভিজ্ঞতা।
            </Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>শিক্ষাগত যোগ্যতা</Text>
          <View style={s.card}>
            {CREDENTIALS.map((c, i) => (
              <InfoRow key={c} icon="certificate-outline" label={c} isLast={i === CREDENTIALS.length - 1} />
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>যোগাযোগ ও সোশ্যাল</Text>
          <View style={s.card}>
            <InfoRow
              icon="phone-outline"
              label="ফোন করুন"
              sub={PHONE}
              onPress={() => Linking.openURL(`tel:${PHONE}`).catch(() => {})}
            />
            <InfoRow
              icon="whatsapp"
              label="WhatsApp-এ যোগাযোগ করুন"
              onPress={() => Linking.openURL(
                `https://wa.me/${PHONE.replace('+', '')}?text=${encodeURIComponent('নমস্কার, আমি MyAstrology অ্যাপ থেকে যোগাযোগ করছি। ')}`
              ).catch(() => {})}
            />
            {SOCIALS.map((soc, i) => (
              <InfoRow
                key={soc.label}
                icon={soc.icon}
                label={soc.label}
                onPress={() => Linking.openURL(soc.url).catch(() => {})}
                isLast={i === SOCIALS.length - 1}
              />
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  hero: { alignItems: 'center', paddingTop: spacing.lg, paddingHorizontal: spacing.md },
  photo: {
    width: 96, height: 96, borderRadius: radii.pill,
    borderWidth: 2, borderColor: colors.goldBorder, backgroundColor: colors.goldWash,
  },
  name:  { ...typography.heading, fontSize: 19, marginTop: 10, textAlign: 'center' },
  title: { ...typography.label, color: colors.textSecondary, marginTop: 3, textAlign: 'center' },

  statsRow: {
    flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: spacing.md,
    marginTop: spacing.md, gap: 8,
  },
  statBox: {
    flexBasis: '47%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center',
    paddingVertical: 12, ...shadows.card,
  },
  statValue: { ...typography.heading, fontSize: 18, color: colors.gold },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },

  section:      { marginHorizontal: spacing.md, marginTop: spacing.md },
  sectionTitle: { ...typography.sectionTitle, color: colors.textSecondary, marginBottom: 8 },
  card: {
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden',
    ...shadows.card,
  },
  bodyText: { ...typography.body, color: colors.text, padding: spacing.md, lineHeight: 22 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: spacing.md,
  },
  rowPressed:  { backgroundColor: colors.goldWash },
  rowDivider:  { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowIconWrap: {
    width: 34, height: 34, borderRadius: radii.md, backgroundColor: colors.goldLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { ...typography.body, fontSize: 14, color: colors.text, fontWeight: '500' },
  rowSub:   { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
