// src/screens/ToolsScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');

const TOOLS = [
  {
    section: '🔯 কুণ্ডলী বিশ্লেষণ',
    items: [
      { icon: '🔯', label: 'জন্মকুষ্ঠি',  sub: 'লগ্ন, ভাব, দশা',      screen: 'Kundali',     color: Colors.saturn },
      { icon: '💑', label: 'কুষ্ঠি মিলন',  sub: '৩৬ গুণ মিলান',       screen: 'MatchMaking', color: Colors.venus },
      { icon: '📅', label: 'বর্ষফল',    sub: 'বার্ষিক রাশিফল',    screen: 'Varshaphala', color: Colors.sun },
      { icon: '🪐', label: 'গ্রহ গোচর',  sub: 'বর্তমান গ্রহস্থান', screen: 'Gochar',      color: Colors.rahu },
    ],
  },
  {
    section: '🗓️ পঞ্জিকা ও তন্ত্রশাস্ত্র',
    items: [
      { icon: '🗓️', label: 'পঞ্জিকা',    sub: 'তিথি, নক্ষত্র, যোগ',   screen: 'Panjika',    color: Colors.gold },
      { icon: '🔢', label: 'নিউমেরোলজি', sub: 'সংখ্যা বিশ্লেষণ',  screen: 'Numerology', color: Colors.mercury },
      { icon: '💎', label: 'রত্নপাথর',  sub: 'নবরত্ন গাইড',    screen: 'Gemstone',   color: '#06b6d4' },
    ],
  },
];

export default function ToolsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🔮 জ্যোতিষ টুলস</Text>
          <Text style={styles.headerSub}>বৈদিক জ্যোতিষের সব হাতিয়ার</Text>
        </View>
        {user?.name && (
          <Text style={styles.userName}>{user.name.split(' ')[0]}র টুলস</Text>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {TOOLS.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.grid}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.card, { borderColor: item.color + '44' }]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconWrap, { backgroundColor: item.color + '22' }]}>
                    <Text style={{ fontSize: 30 }}>{item.icon}</Text>
                  </View>
                  <Text style={styles.cardLabel}>{item.label}</Text>
                  <Text style={styles.cardSub}>{item.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.goldBorder,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.goldLight },
  headerSub: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  userName: { fontSize: 12, color: Colors.gold },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 13, color: Colors.textSub, paddingHorizontal: 16, marginBottom: 10 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 10,
  },
  card: {
    width: (width - 44) / 2,
    backgroundColor: Colors.bgCard,
    borderRadius: 18, borderWidth: 1.5,
    padding: 16, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  iconWrap: {
    width: 62, height: 62, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  cardLabel: { fontSize: 15, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  cardSub: { fontSize: 10, color: Colors.textSub, textAlign: 'center' },
});
