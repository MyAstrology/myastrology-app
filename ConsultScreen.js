// src/screens/ConsultScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../theme';

const SERVICES = [
  {
    icon: '🔯', title: 'জন্মকুষ্ঠি বিশ্লেষণ',
    desc: 'সম্পূর্ণ জন্মকুষ্ঠি, দশা-অন্তর্দশা, গোচর ও ফলাদেশ',
    price: '₹৫০০', duration: '৩০-৪৫ মিনিট',
    rzpAmount: 50000, // পয়সায়
  },
  {
    icon: '✋', title: 'হস্তরেখা বিশ্লেষণ',
    desc: 'হাতের রেখা, পর্বত ও চিহ্নের বিস্তারিত বিচার',
    price: '₹৪০০', duration: '২০-৩০ মিনিট',
    rzpAmount: 40000,
  },
  {
    icon: '💑', title: 'বিবাহ সামঞ্জস্য',
    desc: 'কুষ্ঠি মিলন, মাঙ্গলিক দোষ ও বিবাহযোগ বিচার',
    price: '₹৬০০', duration: '৪৫-৬০ মিনিট',
    rzpAmount: 60000,
  },
  {
    icon: '🏠', title: 'বাস্তু পরামর্শ',
    desc: 'বাড়ি বা অফিসের বাস্তু দোষ নির্ণয় ও সমাধান',
    price: '₹৮০০', duration: '৬০ মিনিট',
    rzpAmount: 80000,
  },
  {
    icon: '💎', title: 'রত্নপাথর পরামর্শ',
    desc: 'ব্যক্তিগত রাশি ও গ্রহ অনুযায়ী রত্নপাথর নির্বাচন',
    price: '₹৩০০', duration: '১৫-২০ মিনিট',
    rzpAmount: 30000,
  },
  {
    icon: '🔢', title: 'নিউমেরোলজি',
    desc: 'নাম ও জন্মতারিখ অনুযায়ী সংখ্যা জ্যোতিষ বিচার',
    price: '₹৩৫০', duration: '২০ মিনিট',
    rzpAmount: 35000,
  },
];

const CONTACT_INFO = [
  { icon: '📍', label: 'ঠিকানা', value: 'নাসরা মাগুর খালি, তুঁত বাগান\nরাণাঘাট, নদিয়া — ৭৪১২০২' },
  { icon: '🕐', label: 'সময়', value: 'সকাল ৯টা — রাত ৯টা\nসপ্তাহের প্রতিদিন' },
];

export default function ConsultScreen() {
  const insets = useSafeAreaInsets();
  const [selectedService, setSelectedService] = useState(null);

  const openWhatsApp = (service = null) => {
    const msg = service
      ? `নমস্কার Dr. Acharya, আমি "${service.title}" পরামর্শ নিতে চাই।`
      : 'নমস্কার Dr. Acharya, আমি পরামর্শ নিতে চাই।';
    Linking.openURL(`https://wa.me/919333122768?text=${encodeURIComponent(msg)}`);
  };

  const handleRazorpay = async (service) => {
    // Razorpay payment — production-এ RazorpayCheckout.open() ব্যবহার করুন
    // এখন WhatsApp-এ redirect করা হচ্ছে
    Alert.alert(
      `${service.title}`,
      `মূল্য: ${service.price}\n\nএখন WhatsApp-এ বুকিং করুন অথবা সরাসরি পেমেন্ট করুন।`,
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: '💬 WhatsApp বুকিং',
          onPress: () => openWhatsApp(service),
        },
        {
          text: '💳 অনলাইন পেমেন্ট',
          onPress: () => Linking.openURL('https://www.myastrology.in/contact.html'),
        },
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
        <Text style={styles.subtitle}>
          ড. প্রদ্যুৎ আচার্য — ৩০+ বছরের অভিজ্ঞতা
        </Text>
      </View>

      {/* Dr. Acharya card */}
      <View style={styles.doctorCard}>
        <Text style={styles.doctorIcon}>👨‍🏫</Text>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>ড. প্রদ্যুৎ আচার্য</Text>
          <Text style={styles.doctorTitle}>জ্যোতিষী ও হস্তরেখাবিদ</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐ ৪.৯</Text>
            <Text style={styles.ratingCount}>• ৫০০+ পরামর্শ</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn}
          onPress={() => openWhatsApp()}
        >
          <Text style={styles.callBtnText}>💬</Text>
        </TouchableOpacity>
      </View>

      {/* Quick WhatsApp CTA */}
      <TouchableOpacity style={styles.whatsappCTA}
        onPress={() => openWhatsApp()}
      >
        <Text style={styles.whatsappIcon}>💬</Text>
        <View style={styles.whatsappText}>
          <Text style={styles.whatsappTitle}>এখনই WhatsApp করুন</Text>
          <Text style={styles.whatsappSub}>দ্রুত উত্তর · বিনামূল্যে প্রাথমিক পরামর্শ</Text>
        </View>
        <Text style={styles.whatsappArrow}>→</Text>
      </TouchableOpacity>

      {/* Services */}
      <Text style={styles.sectionTitle}>পরামর্শ সেবাসমূহ</Text>

      {SERVICES.map((service, i) => (
        <TouchableOpacity key={i} style={styles.serviceCard}
          onPress={() => handleRazorpay(service)}
        >
          <View style={styles.serviceLeft}>
            <Text style={styles.serviceIcon}>{service.icon}</Text>
          </View>
          <View style={styles.serviceMiddle}>
            <Text style={styles.serviceTitle}>{service.title}</Text>
            <Text style={styles.serviceDesc}>{service.desc}</Text>
            <Text style={styles.serviceDuration}>⏱ {service.duration}</Text>
          </View>
          <View style={styles.serviceRight}>
            <Text style={styles.servicePrice}>{service.price}</Text>
            <View style={styles.bookBtn}>
              <Text style={styles.bookBtnText}>বুক</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {/* Contact info */}
      <Text style={styles.sectionTitle}>যোগাযোগের তথ্য</Text>

      {CONTACT_INFO.map((info, i) => (
        <View key={i} style={styles.contactCard}>
          <Text style={styles.contactIcon}>{info.icon}</Text>
          <View>
            <Text style={styles.contactLabel}>{info.label}</Text>
            <Text style={styles.contactValue}>{info.value}</Text>
          </View>
        </View>
      ))}

      {/* Map link */}
      <TouchableOpacity style={styles.mapBtn}
        onPress={() => Linking.openURL('https://maps.google.com/?q=23.1676,88.5809')}
      >
        <Text style={styles.mapBtnText}>🗺️ Google Maps-এ দেখুন</Text>
      </TouchableOpacity>

      {/* Privacy note */}
      <View style={styles.privacyNote}>
        <Text style={styles.privacyText}>
          🔒 আপনার সমস্ত ব্যক্তিগত তথ্য সম্পূর্ণ গোপনীয় ও সুরক্ষিত
        </Text>
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.md, paddingBottom: Spacing.sm },
  title: {
    fontSize: 22, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight,
  },
  subtitle: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, marginTop: 2,
  },

  // Doctor card
  doctorCard: {
    margin: Spacing.md, borderRadius: 16,
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.goldBorder,
    padding: Spacing.md, flexDirection: 'row',
    alignItems: 'center', gap: Spacing.sm,
  },
  doctorIcon: { fontSize: 44 },
  doctorInfo: { flex: 1 },
  doctorName: {
    fontSize: 16, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight,
  },
  doctorTitle: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, marginTop: 2,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  rating: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.gold, fontWeight: '700',
  },
  ratingCount: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary,
  },
  callBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(37,211,102,0.15)',
    borderWidth: 1, borderColor: 'rgba(37,211,102,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  callBtnText: { fontSize: 20 },

  // WhatsApp CTA
  whatsappCTA: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    borderRadius: 14, backgroundColor: 'rgba(37,211,102,0.08)',
    borderWidth: 1, borderColor: 'rgba(37,211,102,0.3)',
    padding: Spacing.md, flexDirection: 'row',
    alignItems: 'center', gap: Spacing.sm,
  },
  whatsappIcon: { fontSize: 28 },
  whatsappText: { flex: 1 },
  whatsappTitle: {
    fontSize: 15, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: '#25d366',
  },
  whatsappSub: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, marginTop: 2,
  },
  whatsappArrow: { fontSize: 20, color: '#25d366' },

  // Services
  sectionTitle: {
    fontSize: 16, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.textPrimary,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  serviceCard: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    borderRadius: 14, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.goldBorder,
    padding: Spacing.md, flexDirection: 'row',
    alignItems: 'center', gap: Spacing.sm,
  },
  serviceLeft: { width: 40, alignItems: 'center' },
  serviceIcon: { fontSize: 28 },
  serviceMiddle: { flex: 1 },
  serviceTitle: {
    fontSize: 14, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.textPrimary,
  },
  serviceDesc: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, lineHeight: 18, marginTop: 2,
  },
  serviceDuration: {
    fontSize: 11, fontFamily: 'NotoSerifBengali',
    color: Colors.gold, marginTop: 4,
  },
  serviceRight: { alignItems: 'center', gap: 6 },
  servicePrice: {
    fontSize: 14, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight,
  },
  bookBtn: {
    backgroundColor: Colors.gold, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  bookBtnText: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: '#0f172a',
  },

  // Contact
  contactCard: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    borderRadius: 12, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.goldBorder,
    padding: Spacing.md, flexDirection: 'row',
    alignItems: 'flex-start', gap: Spacing.sm,
  },
  contactIcon: { fontSize: 22, marginTop: 2 },
  contactLabel: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.gold, fontWeight: '700',
  },
  contactValue: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.textPrimary, lineHeight: 22, marginTop: 2,
  },
  mapBtn: {
    marginHorizontal: Spacing.md, marginTop: Spacing.sm,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.goldBorder,
    padding: Spacing.sm, alignItems: 'center',
    backgroundColor: Colors.bgCard,
  },
  mapBtnText: {
    fontSize: 14, fontFamily: 'NotoSerifBengali',
    color: Colors.gold, fontWeight: '600',
  },
  privacyNote: {
    margin: Spacing.md, padding: Spacing.sm,
    backgroundColor: Colors.goldGlow, borderRadius: 12,
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary, textAlign: 'center',
  },
});
