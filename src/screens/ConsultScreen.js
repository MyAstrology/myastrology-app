// src/screens/ConsultScreen.js
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../theme';

const SERVICES = [
  { icon: '🔯', title: 'জন্মকুষ্ঠি বিশ্লেষণ', desc: 'সম্পূর্ণ কুষ্ঠি, দশা ও ফলাদেশ', price: '₹৫০০', duration: '৩০-৪৫ মিনিট', color: Colors.saturn },
  { icon: '✋', title: 'হস্তরেখা বিশ্লেষণ', desc: 'হাতের রেখা ও চিহ্নের বিচার', price: '₹৪০০', duration: '২০-৩০ মিনিট', color: Colors.venus },
  { icon: '💑', title: 'বিবাহ সামঞ্জস্য', desc: 'কুষ্ঠি মিলন ও মাঙ্গলিক বিচার', price: '₹৬০০', duration: '৪৫-৬০ মিনিট', color: '#ec4899' },
  { icon: '🏠', title: 'বাস্তু পরামর্শ', desc: 'বাড়ি ও অফিসের বাস্তু দোষ', price: '₹৮০০', duration: '৬০ মিনিট', color: Colors.mercury },
  { icon: '💎', title: 'রত্নপাথর পরামর্শ', desc: 'রাশি অনুযায়ী রত্নপাথর নির্বাচন', price: '₹৩০০', duration: '১৫-২০ মিনিট', color: Colors.gold },
  { icon: '🔢', title: 'নিউমেরোলজি', desc: 'নাম ও জন্মতারিখ অনুযায়ী বিচার', price: '₹৩৫০', duration: '২০ মিনিট', color: '#06b6d4' },
];

export default function ConsultScreen() {
  const insets = useSafeAreaInsets();

  const openWhatsApp = (service = null) => {
    const msg = service
      ? `নমস্কার Dr. Acharya 🙏 আমি "${service.title}" (${service.price}) পরামর্শ নিতে চাই।`
      : 'নমস্কার Dr. Acharya 🙏 আমি পরামর্শ নিতে চাই।';
    Linking.openURL(`https://wa.me/919333122768?text=${encodeURIComponent(msg)}`);
  };

  const handleBook = (service) => {
    Alert.alert(
      service.title,
      `মূল্য: ${service.price}\nসময়: ${service.duration}\n\nকীভাবে বুকিং করবেন?`,
      [
        { text: 'বাতিল', style: 'cancel' },
        { text: '💬 WhatsApp', onPress: () => openWhatsApp(service) },
        { text: '📞 কল করুন', onPress: () => Linking.openURL('tel:+919333122768') },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📞 পরামর্শ বুকিং</Text>
        <Text style={styles.subtitle}>ড. প্রদ্যুৎ আচার্য — ৩০+ বছরের অভিজ্ঞতা</Text>
      </View>

      {/* Doctor card */}
      <View style={styles.doctorCard}>
        <Text style={{ fontSize: 50 }}>👨‍🏫</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.doctorName}>ড. প্রদ্যুৎ আচার্য</Text>
          <Text style={styles.doctorTitle}>জ্যোতিষী ও হস্তরেখাবিদ</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ color: Colors.gold, fontSize: 12, fontWeight: '700' }}>⭐ ৪.৯</Text>
            <Text style={{ color: Colors.textSub, fontSize: 12 }}> • ৫০০+ পরামর্শ</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn} onPress={() => openWhatsApp()}>
          <Text style={{ fontSize: 22 }}>💬</Text>
        </TouchableOpacity>
      </View>

      {/* WhatsApp CTA */}
      <TouchableOpacity style={styles.whatsappCTA} onPress={() => openWhatsApp()} activeOpacity={0.8}>
        <Text style={{ fontSize: 28 }}>💬</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.waTitle}>এখনই WhatsApp করুন</Text>
          <Text style={styles.waSub}>দ্রুত উত্তর · বিনামূল্যে প্রাথমিক পরামর্শ</Text>
        </View>
        <Text style={{ color: Colors.whatsapp, fontSize: 20 }}>→</Text>
      </TouchableOpacity>

      {/* Services */}
      <Text style={styles.sectionTitle}>পরামর্শ সেবাসমূহ</Text>
      {SERVICES.map((s, i) => (
        <TouchableOpacity key={i} style={[styles.serviceCard, { borderLeftColor: s.color, borderLeftWidth: 3 }]}
          onPress={() => handleBook(s)} activeOpacity={0.85}
        >
          <Text style={{ fontSize: 28, marginRight: 12 }}>{s.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceTitle}>{s.title}</Text>
            <Text style={styles.serviceDesc}>{s.desc}</Text>
            <Text style={[styles.serviceDuration, { color: s.color }]}>⏱ {s.duration}</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={styles.servicePrice}>{s.price}</Text>
            <View style={[styles.bookBtn, { backgroundColor: s.color + '33' }]}>
              <Text style={[styles.bookBtnText, { color: s.color }]}>বুক</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {/* Contact */}
      <Text style={styles.sectionTitle}>যোগাযোগ</Text>
      <View style={styles.contactCard}>
        <Text style={{ fontSize: 20, marginRight: 12 }}>📍</Text>
        <View>
          <Text style={{ fontSize: 12, color: Colors.gold, fontWeight: '700' }}>ঠিকানা</Text>
          <Text style={{ fontSize: 13, color: Colors.text, lineHeight: 20, marginTop: 2 }}>
            নাসরা মাগুর খালি, তুঁত বাগান{'\n'}রাণাঘাট, নদিয়া — ৭৪১২০২
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.mapBtn}
        onPress={() => Linking.openURL('https://maps.google.com/?q=23.1676,88.5809')}
      >
        <Text style={{ fontSize: 14, color: Colors.gold, fontWeight: '600' }}>
          🗺️ Google Maps-এ দেখুন
        </Text>
      </TouchableOpacity>

      <View style={styles.privacyNote}>
        <Text style={{ fontSize: 11, color: Colors.textMuted, textAlign: 'center' }}>
          🔒 আপনার সমস্ত ব্যক্তিগত তথ্য সম্পূর্ণ গোপনীয়
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.goldLight },
  subtitle: { fontSize: 13, color: Colors.textSub, marginTop: 2 },
  doctorCard: {
    margin: 16, borderRadius: 16,
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.goldBorder,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  doctorName: { fontSize: 16, fontWeight: '700', color: Colors.goldLight },
  doctorTitle: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  callBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.whatsappBg,
    borderWidth: 1, borderColor: 'rgba(37,211,102,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  whatsappCTA: {
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 14, backgroundColor: Colors.whatsappBg,
    borderWidth: 1, borderColor: 'rgba(37,211,102,0.3)',
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  waTitle: { fontSize: 15, fontWeight: '700', color: Colors.whatsapp },
  waSub: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.text,
    paddingHorizontal: 16, marginBottom: 8,
  },
  serviceCard: {
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 14, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.goldBorder,
    padding: 14, flexDirection: 'row', alignItems: 'center',
  },
  serviceTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  serviceDesc: { fontSize: 12, color: Colors.textSub, lineHeight: 18, marginTop: 2 },
  serviceDuration: { fontSize: 11, marginTop: 4 },
  servicePrice: { fontSize: 14, fontWeight: '700', color: Colors.goldLight },
  bookBtn: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  bookBtnText: { fontSize: 12, fontWeight: '700' },
  contactCard: {
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 12, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.goldBorder,
    padding: 14, flexDirection: 'row', alignItems: 'flex-start',
  },
  mapBtn: {
    marginHorizontal: 16, marginTop: 4, marginBottom: 8,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.goldBorder,
    padding: 12, alignItems: 'center', backgroundColor: Colors.bgCard,
  },
  privacyNote: {
    margin: 16, padding: 10,
    backgroundColor: Colors.goldGlow, borderRadius: 12,
  },
});
