// src/screens/ConsultScreen.js
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, Alert, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import RazorpayCheckout from 'react-native-razorpay';
import { Colors } from '../theme';

const { width } = Dimensions.get('window');
const CARD_IMAGE_HEIGHT = 180;

const RAZORPAY_KEY_ID = 'rzp_live_SN8p6DJxPYFVL1';
const WA_NUMBER = '919333122768';
const LOGO = 'https://www.myastrology.in/images/MyAstrology-Ranghat-logo.png';

const SERVICES = [
  {
    key: 'kundali',
    title: 'জন্মকুণ্ডলী বিচার (Birth Chart)',
    image: 'https://www.myastrology.in/images/birth-chart-reading-vedic-astrology.webp',
    desc: 'নাম, জন্ম তারিখ, সময় ও জন্মস্থান পাঠান। ৩০-৩৫ পাতার জন্মকুণ্ডলী PDF ও ফোনে বিস্তারিত আলোচনা।',
    price: '₹১,৫০১',
    oldPrice: '₹২,০০১',
    saveAmount: '₹৫০০',
    duration: '৩০ মিনিট',
    color: Colors.saturn,
    offerLabel: '⭐ প্রিমিয়াম',
    amount: 150100,
    quote: '“উপরের তারারা আপনার অন্তরের গভীরতম সত্যের প্রতিধ্বনি।”',
  },
  {
    key: 'kundaliPalmistry',
    title: 'জন্মকুণ্ডলী + হস্তরেখা বিচার',
    image: 'https://www.myastrology.in/images/birth-chart-reading-vedic-astrology.webp',
    desc: 'নাম, জন্ম তথ্য ও উভয় হাতের ছবি পাঠান। ৩০-৩৫ পাতার PDF ও উভয় বিচারের শাস্ত্রীয় বিশ্লেষণ।',
    price: '₹২,০০১',
    oldPrice: '₹৩,০০১',
    saveAmount: '₹১,০০০',
    duration: '৩০ মিনিট',
    color: '#8b5cf6',
    offerLabel: '🌟 বেস্ট ডিল',
    amount: 200100,
    quote: '“কুণ্ডলী মহাজাগতিক মানচিত্র, হস্তরেখা সেই মানচিত্রের পার্থিব প্রতিধ্বনি।”',
  },
  {
    key: 'palmistry',
    title: 'হস্তরেখা বিচার (Palmistry)',
    image: 'https://www.myastrology.in/images/Palm%20Reading%20Consultation.webp',
    desc: 'দুই হাতের সামনে ও পেছনের ছবি পাঠান। ৩-৪ ঘণ্টার মধ্যে ফোনে হৃদয়রেখা, মস্তিষ্করেখা, জীবনরেখা ও ভাগ্যরেখার বিচার।',
    price: '₹১,০০১',
    oldPrice: '₹১,৫০১',
    saveAmount: '₹৫০০',
    duration: '২০ মিনিট',
    color: Colors.venus,
    offerLabel: '🔥 হট ডিল',
    amount: 100100,
    quote: '“আপনার হাত একটি ত্রিকালিক মানচিত্র — অতীত, বর্তমান ও সম্ভাবনা।”',
  },
  {
    key: 'marriage',
    title: 'যোটোক বিচার (কুণ্ডলী মিলন)',
    image: 'https://www.myastrology.in/images/kundli-matching-bengali-astrology.webp',
    desc: 'ছেলে ও মেয়ের জন্ম তথ্য পাঠান। উভয়ের কুণ্ডলী PDF, যোটোক রিপোর্ট ও মাঙ্গলিক দোষ বিচার।',
    price: '₹২,০০১',
    oldPrice: '₹২,৫০১',
    saveAmount: '₹৫০০',
    duration: '৩০ মিনিট',
    color: '#ec4899',
    offerLabel: '💍 স্পেশাল',
    amount: 200100,
    quote: '“সুসামঞ্জস্য কুণ্ডলী মিলন একটি স্থায়ী দাম্পত্যের ভিত্তি।”',
  },
  {
    key: 'loveMarriage',
    title: 'প্রেম ও বিবাহ সমস্যার সমাধান',
    image: 'https://www.myastrology.in/images/love-marriage-astrology-specialist.webp',
    desc: 'বিলম্বিত বিবাহ, সম্পর্কের দ্বন্দ্ব, পারিবারিক বাধা বা বিচ্ছেদের জ্যোতিষ নির্ণয়। সপ্তম ভাব, শুক্র ও মঙ্গলের শাস্ত্রীয় বিশ্লেষণ সহ ব্যক্তিগত মন্ত্র ও রত্নপাথর পরামর্শ।',
    price: '₹১,০০১',
    oldPrice: '₹১,৫০১',
    saveAmount: '₹৫০০',
    duration: '২০ মিনিট',
    color: '#be185d',
    offerLabel: '❤️ অফার',
    amount: 100100,
    quote: '“মহাবিশ্বের সাথে সামঞ্জস্যপূর্ণ মিলন চিরন্তন বন্ধন।”',
  },
  {
    key: 'career',
    title: 'ক্যারিয়ার ও ব্যবসা জ্যোতিষ',
    image: 'https://www.myastrology.in/images/career-astrology-business-success.webp',
    desc: 'চাকরি পরিবর্তন, ব্যবসার সিদ্ধান্ত, উচ্চশিক্ষার জন্য সঠিক সময় ও দিকনির্দেশ। দশম ভাব ও ধন যোগ বিশ্লেষণ।',
    price: '₹১,০০১',
    oldPrice: '₹১,৫০১',
    saveAmount: '₹৫০০',
    duration: '২০ মিনিট',
    color: '#0d9488',
    offerLabel: '💼 বেস্ট ডিল',
    amount: 100100,
    quote: '“আপনার জীবিকা তারায় লিখিত — তাকে চিনে নিন।”',
  },
  {
    key: 'gemstone',
    title: 'রত্নপাথর পরামর্শ (Gemstone)',
    image: 'https://www.myastrology.in/images/best-gemstone-astrologer-india.webp',
    desc: 'গভীর জন্মকুণ্ডলী বিশ্লেষণে স্বাস্থ্য, অর্থ ও ক্যারিয়ারে উপকারী গ্রহীয় শক্তি বাড়াতে উপযুক্ত রত্নপাথর নির্বাচন।',
    price: '₹১,০০১',
    oldPrice: '₹১,৫০১',
    saveAmount: '₹৫০০',
    duration: '১৫-২০ মিনিট',
    color: Colors.gold,
    offerLabel: '💎 প্রিমিয়াম',
    amount: 100100,
    quote: '“সঠিক রত্নপাথর গ্রহীয় রশ্মিকে আপনার অনুকূলে আমন্ত্রণ জানায়।”',
  },
  {
    key: 'vastu',
    title: 'বাস্তু শাস্ত্র পরামর্শ',
    image: 'https://www.myastrology.in/images/vastu-consultant-ranaghat-west-bengal.webp',
    desc: 'আপনার ফ্লোর প্ল্যান অনলাইনে পাঠান। বাস্তু দোষ চিহ্নিত করে বৈজ্ঞানিক প্রতিকার দেওয়া হবে।',
    price: 'প্রয়োজন অনুযায়ী',
    oldPrice: null,
    saveAmount: null,
    duration: 'প্রয়োজন অনুযায়ী',
    color: Colors.mercury,
    offerLabel: '🏠 অফার',
    amount: 0,
    quote: '“বাস্তু-সুষম স্থান সুখ ও সমৃদ্ধির ভিত্তি।”',
  },
  {
    key: 'muhurta',
    title: 'শুভ মুহূর্ত নির্বাচন (Muhurta)',
    image: 'https://www.myastrology.in/images/shubh-muhurta-panjika-timing.webp',
    desc: 'বিবাহ, গৃহপ্রবেশ, ব্যবসার উদ্বোধন, যাত্রা বা যেকোনো পবিত্র কার্যের জন্য পঞ্চাঙ্গ অনুযায়ী শুভ মুহূর্ত নির্বাচন।',
    price: '₹৫০১',
    oldPrice: '₹৮০১',
    saveAmount: '₹৩০০',
    duration: '১৫ মিনিট',
    color: '#d97706',
    offerLabel: '🕐 সেভিংস',
    amount: 50100,
    quote: '“সঠিক মুহূর্তে শুরু করা কাজ সর্বোচ্চ ফল দেয়।”',
  },
];

export default function ConsultScreen() {
  const insets = useSafeAreaInsets();

  const openRazorpay = (service) => {
    if (service.amount === 0) {
      openWhatsApp(service);
      return;
    }

    if (typeof RazorpayCheckout === 'undefined') {
      Alert.alert('অপেক্ষা করুন', 'পেমেন্ট গেটওয়ে লোড হচ্ছে...');
      return;
    }

    const options = {
      description: service.title,
      image: LOGO,
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      amount: service.amount,
      name: 'MyAstrology',
      prefill: { email: '', contact: '', name: '' },
      theme: { color: Colors.gold },
    };

    RazorpayCheckout.open(options)
      .then((data) => {
        const msg = `🙏 নমস্কার! আমি ${service.title}-এর জন্য পেমেন্ট সম্পন্ন করেছি।\n\n` +
          `🛎️ সেবা: ${service.title}\n` +
          `💰 মূল্য: ${service.price}\n` +
          `🆔 Payment ID: ${data.razorpay_payment_id}\n\n` +
          `📋 অনুগ্রহ করে পরামর্শের তারিখ ও সময় জানান। ধন্যবাদ! 🙏`;

        Alert.alert('✅ পেমেন্ট সফল', `Payment ID: ${data.razorpay_payment_id}`, [
          { text: 'ঠিক আছে', style: 'cancel' },
          { text: '💬 WhatsApp-এ তথ্য পাঠান', onPress: () => Linking.openURL(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`) },
        ]);
      })
      .catch((error) => {
        Alert.alert('❌ পেমেন্ট বিফল', error.description || 'আবার চেষ্টা করুন।');
      });
  };

  const openWhatsApp = (service = null) => {
    const msg = service
      ? `নমস্কার Dr. Acharya 🙏 আমি "${service.title}" সম্পর্কে জানতে চাই।`
      : 'নমস্কার Dr. Acharya 🙏 আমি পরামর্শ নিতে চাই।';
    Linking.openURL(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
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
        <TouchableOpacity key={i} style={[styles.serviceCard]} onPress={() => openRazorpay(s)} activeOpacity={0.9}>
          {/* Card Image */}
          <Image source={{ uri: s.image }} style={styles.serviceImage} contentFit="cover" />

          {/* Offer Badge */}
          <View style={[styles.offerBadge, { backgroundColor: s.color + 'EE' }]}>
            <Text style={styles.offerBadgeText}>{s.offerLabel}</Text>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            <Text style={styles.serviceTitle}>{s.title}</Text>
            <Text style={styles.serviceDesc}>{s.desc}</Text>
            <Text style={[styles.serviceDuration, { color: s.color }]}>⏱ {s.duration}</Text>

            {/* Pricing */}
            <View style={styles.pricingRow}>
              {s.oldPrice && <Text style={styles.oldPrice}>{s.oldPrice}</Text>}
              {s.oldPrice && <Text style={styles.arrow}>→</Text>}
              <Text style={styles.newPrice}>মাত্র {s.price}</Text>
            </View>
            {s.saveAmount && (
              <Text style={styles.saveText}>আপনি সাশ্রয় করছেন {s.saveAmount} 💰</Text>
            )}

            {/* Quote */}
            <Text style={styles.quoteText}>{s.quote}</Text>

            {/* Action Button */}
            {s.amount > 0 ? (
              <TouchableOpacity style={[styles.bookBtn, { backgroundColor: s.color }]} onPress={() => openRazorpay(s)}>
                <Text style={styles.bookBtnText}>এখনই বুক করুন →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.bookBtn, { backgroundColor: '#25D366' }]} onPress={() => openWhatsApp(s)}>
                <Text style={styles.bookBtnText}>WhatsApp করুন</Text>
              </TouchableOpacity>
            )}
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
        onPress={() => Linking.openURL('https://maps.google.com/?q=23.1676,88.5809')}>
        <Text style={{ fontSize: 14, color: Colors.gold, fontWeight: '600' }}>🗺️ Google Maps-এ দেখুন</Text>
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
    fontSize: 18, fontWeight: '700', color: Colors.text,
    paddingHorizontal: 16, marginBottom: 12, marginTop: 4,
  },
  serviceCard: {
    marginHorizontal: 16, marginBottom: 20,
    borderRadius: 16, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.goldBorder,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT,
  },
  offerBadge: {
    position: 'absolute', top: 12, right: 12,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  offerBadgeText: {
    color: '#FFFFFF', fontSize: 11, fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardBody: { padding: 14 },
  serviceTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  serviceDesc: { fontSize: 13, color: Colors.textSub, lineHeight: 20, marginBottom: 8 },
  serviceDuration: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  pricingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4,
  },
  oldPrice: {
    fontSize: 15, color: Colors.textMuted,
    textDecorationLine: 'line-through', textDecorationColor: '#ef4444',
  },
  arrow: { fontSize: 14, color: Colors.goldLight, fontWeight: '700' },
  newPrice: {
    fontSize: 18, fontWeight: '800', color: Colors.goldLight,
  },
  saveText: {
    fontSize: 12, color: '#22c55e', fontWeight: '600',
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 13, fontStyle: 'italic', color: Colors.textSub,
    lineHeight: 20, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: Colors.gold,
    paddingLeft: 10,
  },
  bookBtn: {
    borderRadius: 25, paddingVertical: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  bookBtnText: {
    color: '#FFFFFF', fontSize: 15, fontWeight: '800',
  },
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
