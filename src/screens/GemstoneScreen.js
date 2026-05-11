// src/screens/GemstoneScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Rashis } from '../theme';
import { useUser, RashiLucky } from '../context/UserContext';

const { width } = Dimensions.get('window');

const GemData = [
  {
    gem: 'মাণিক্য', en: 'Ruby', planet: 'সূর্য', color: '#f97316', icon: '🔴',
    rashis: [4],
    benefit: 'আত্মবিশ্বাস, নেতৃত্বগুণ ও স্বাস্থ্য বৃদ্ধি করে। পিতৃসুখ দেয়।',
    day: 'রবিবার', metal: 'সোনা', finger: 'অনামিকা', weight: 'ন্যূনতম ৩ রতি',
  },
  {
    gem: 'মুক্তো', en: 'Pearl', planet: 'চন্দ্র', color: '#e2e8f0', icon: '⚪',
    rashis: [3],
    benefit: 'মানসিক শান্তি, স্মৃতিশক্তি ও মাতৃসুখ দেয়। ঘুমের সমস্যা দূর করে।',
    day: 'সোমবার', metal: 'রূপা', finger: 'কনিষ্ঠা', weight: 'ন্যূনতম ২ রতি',
  },
  {
    gem: 'প্রবাল', en: 'Red Coral', planet: 'মঙ্গল', color: '#ef4444', icon: '🪸',
    rashis: [0, 7],
    benefit: 'সাহস, শক্তি বৃদ্ধি করে। রক্তরোগ সারায়। শত্রু দমন করে।',
    day: 'মঙ্গলবার', metal: 'সোনা বা রূপা', finger: 'অনামিকা', weight: 'ন্যূনতম ৬ রতি',
  },
  {
    gem: 'পান্না', en: 'Emerald', planet: 'বুধ', color: '#22c55e', icon: '💚',
    rashis: [2, 5],
    benefit: 'বুদ্ধিমত্তা, বাণিজ্যসুখ ও কথাশক্তি বাড়ায়। ব্যবসায় সাফল্য দেয়।',
    day: 'বুধবার', metal: 'সোনা', finger: 'কনিষ্ঠা', weight: 'ন্যূনতম ৩ রতি',
  },
  {
    gem: 'পোখরাজ', en: 'Yellow Sapphire', planet: 'বৃহস্পতি', color: '#c9922a', icon: '💛',
    rashis: [8, 11],
    benefit: 'জ্ঞান, বিবাহযোগ ও সন্তানসুখ দেয়। আর্থিক উন্নতি করে।',
    day: 'বৃহস্পতিবার', metal: 'সোনা', finger: 'তর্জনী', weight: 'ন্যূনতম ৩ রতি',
  },
  {
    gem: 'হীরা', en: 'Diamond', planet: 'শুক্র', color: '#c7d2fe', icon: '💎',
    rashis: [1, 6],
    benefit: 'ভালোবাসা, বিলাসিতা ও শিল্পকলায় উন্নতি। দাম্পত্যসুখ দেয়।',
    day: 'শুক্রবার', metal: 'সোনা বা প্লাটিনাম', finger: 'মধ্যমা', weight: 'ন্যূনতম ০.৫ রতি',
  },
  {
    gem: 'নীলা', en: 'Blue Sapphire', planet: 'শনি', color: '#8b5cf6', icon: '🔵',
    rashis: [9, 10],
    benefit: 'কর্মজীবনে সাফল্য, দীর্ঘায়ু। দুর্ভাগ্য দূর করে। তবে পরীক্ষা করে পরতে হয়।',
    day: 'শনিবার', metal: 'পঞ্চধাতু', finger: 'মধ্যমা', weight: 'ন্যূনতম ৪ রতি',
  },
  {
    gem: 'গোমেদ', en: 'Hessonite (Gomed)', planet: 'রাহু', color: '#92400e', icon: '🟤',
    rashis: [],
    benefit: 'রাহুর কুপ্রভাব নষ্ট করে। ব্যবসায় সাফল্য ও সরকারি সুবিধা দেয়।',
    day: 'শনিবার', metal: 'অষ্টধাতু', finger: 'মধ্যমা', weight: 'ন্যূনতম ৬ রতি',
  },
  {
    gem: 'বৈদূর্য', en: "Cat's Eye (Vaidurya)", planet: 'কেতু', color: '#65a30d', icon: '🟢',
    rashis: [],
    benefit: 'কেতুর প্রভাব হ্রাস করে। আধ্যাত্মিকতা বৃদ্ধি। মোক্ষলাভে সহায়তা করে।',
    day: 'মঙ্গলবার', metal: 'অষ্টধাতু', finger: 'অনামিকা', weight: 'ন্যূনতম ৩ রতি',
  },
];

function GemCard({ gem, isRecommended }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.gemCard, isRecommended && { borderColor: gem.color + '99' }]}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.85}
    >
      {isRecommended && (
        <View style={[styles.recommendBadge, { backgroundColor: gem.color + '33', borderBottomColor: gem.color + '44' }]}>
          <Text style={[styles.recommendText, { color: gem.color }]}>✓ আপনার রাশির শুভ রত্ন</Text>
        </View>
      )}
      <View style={styles.gemHeader}>
        <View style={[styles.gemIconWrap, { backgroundColor: gem.color + '22' }]}>
          <Text style={{ fontSize: 30 }}>{gem.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.gemName}>{gem.gem}</Text>
          <Text style={styles.gemEn}>{gem.en}</Text>
          <View style={[styles.planetBadge, { backgroundColor: gem.color + '18' }]}>
            <Text style={[styles.planetText, { color: gem.color }]}>গ্রহ: {gem.planet}</Text>
          </View>
        </View>
        <Text style={{ color: Colors.textSub, fontSize: 14 }}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {expanded && (
        <View style={styles.gemDetail}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>✨ উপকার</Text>
            <Text style={styles.detailValue}>{gem.benefit}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 ধারণের দিন</Text>
            <Text style={styles.detailValue}>{gem.day}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💍 কোন আঙুলে</Text>
            <Text style={styles.detailValue}>{gem.finger}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🔩 কোন ধাতুতে</Text>
            <Text style={styles.detailValue}>{gem.metal}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⚖️ ওজন</Text>
            <Text style={styles.detailValue}>{gem.weight}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function GemstoneScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [filter, setFilter] = useState('all');
  const myRashi = user?.rashiIndex ?? -1;

  const displayed = filter === 'mine' && myRashi >= 0
    ? GemData.filter(g => g.rashis.includes(myRashi))
    : GemData;

  return (
    <View style={[styles.container, { paddingTop: 8 }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={styles.banner}>
          <Text style={{ fontSize: 34 }}>💎</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>নবরত্ন গাইড</Text>
            <Text style={styles.bannerSub}>নবগ্রহের ৯টি রত্নপাথরের সম্পূর্ণ বিবরণ</Text>
          </View>
        </View>

        {myRashi >= 0 && (
          <View style={styles.filterRow}>
            {[
              { id: 'all', label: 'সব রত্ন (৯টি)' },
              { id: 'mine', label: `${Rashis[myRashi].symbol} আমার রাশির রত্ন` },
            ].map(f => (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
                onPress={() => setFilter(f.id)}
              >
                <Text style={[styles.filterBtnText, filter === f.id && styles.filterBtnTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ রত্নপাথর ধারণের আগে অভিজ্ঞ জ্যোতিষীর পরামর্শ নেওয়া অত্যন্ত জরুরি।
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {displayed.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>🔍</Text>
              <Text style={{ color: Colors.textSub, fontSize: 14 }}>এই রাশির জন্য সাধারণ নবরত্ন প্রযোজ্য</Text>
            </View>
          ) : (
            displayed.map((g, i) => (
              <GemCard key={i} gem={g} isRecommended={g.rashis.includes(myRashi)} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    margin: 16, padding: 16,
    backgroundColor: 'rgba(201,146,42,0.08)',
    borderRadius: 18, borderWidth: 1, borderColor: Colors.goldBorder,
  },
  bannerTitle: { fontSize: 20, fontWeight: '700', color: Colors.goldLight },
  bannerSub: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  filterBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.goldBorder,
    alignItems: 'center', backgroundColor: Colors.bgCard,
  },
  filterBtnActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  filterBtnText: { fontSize: 12, color: Colors.textSub },
  filterBtnTextActive: { color: '#fff', fontWeight: '700' },
  warningBox: {
    marginHorizontal: 16, marginBottom: 14, padding: 12,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  warningText: { fontSize: 12, color: '#fca5a5', lineHeight: 18 },
  gemCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16, borderWidth: 1.5, borderColor: Colors.goldBorder,
    marginBottom: 12, overflow: 'hidden',
  },
  recommendBadge: {
    paddingHorizontal: 14, paddingVertical: 5,
    borderBottomWidth: 1,
  },
  recommendText: { fontSize: 11, fontWeight: '700' },
  gemHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  gemIconWrap: {
    width: 58, height: 58, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  gemName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  gemEn: { fontSize: 12, color: Colors.textSub },
  planetBadge: {
    marginTop: 4, alignSelf: 'flex-start',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  planetText: { fontSize: 11, fontWeight: '600' },
  gemDetail: {
    borderTopWidth: 1, borderTopColor: Colors.goldBorder,
    padding: 14, gap: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  detailRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  detailLabel: { fontSize: 12, color: Colors.textSub, width: 110, flexShrink: 0 },
  detailValue: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },
  emptyBox: { alignItems: 'center', paddingVertical: 32 },
});
