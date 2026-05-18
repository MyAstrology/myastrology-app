// src/screens/OnboardingScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, Dimensions, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Rashis } from '../theme';
import { useUser } from '../context/UserContext';

const { width, height } = Dimensions.get('window');

function CosmicBg() {
  const stars = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      key: i,
      top: Math.random() * height,
      left: Math.random() * width,
      size: Math.random() * 2.5 + 0.5,
      anim: new Animated.Value(Math.random()),
    }))
  ).current;

  useEffect(() => {
    stars.forEach(star => {
      const twinkle = () => Animated.sequence([
        Animated.timing(star.anim, { toValue: 0.05 + Math.random() * 0.3, duration: 1500 + Math.random() * 2000, useNativeDriver: true }),
        Animated.timing(star.anim, { toValue: 0.5 + Math.random() * 0.5, duration: 1500 + Math.random() * 2000, useNativeDriver: true }),
      ]).start(twinkle);
      twinkle();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map(s => (
        <Animated.View key={s.key} style={{
          position: 'absolute', top: s.top, left: s.left,
          width: s.size, height: s.size, borderRadius: s.size,
          backgroundColor: '#fff', opacity: s.anim,
        }} />
      ))}
    </View>
  );
}

function WelcomeStep({ onNext }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Animated.Text style={[styles.bigOm, { transform: [{ rotate: spin }] }]}>🕉️</Animated.Text>
      <Text style={styles.welcomeTitle}>স্বাগতম</Text>
      <Text style={styles.appName}>MyAstrology</Text>
      <Text style={styles.welcomeSubtitle}>
        বৈদিক জ্যোতিষের আলোয়{'\n'}আপনার জীবনপথ জানুন
      </Text>
      <View style={styles.featureList}>
        {[
          { icon: '📅', text: 'দৈনিক পঞ্জিকা ও ব্যক্তিগত রাশিফল' },
          { icon: '🔯', text: 'জন্মকুষ্ঠি, দশা ও গ্রহ বিশ্লেষণ' },
          { icon: '🤖', text: 'AI জ্যোতিষী সহায়তা (Gemini)' },
          { icon: '💎', text: 'রত্নপাথর ও প্রতিকার গাইড' },
        ].map((f, i) => (
          <View key={i} style={styles.featureItem}>
            <Text style={{ fontSize: 20 }}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>শুরু করুন →</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function PersonalStep({ onNext, onBack }) {
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const canNext = name.trim().length > 0 && day && month && year && year.length === 4;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={styles.stepContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepIcon}>✨</Text>
        <Text style={styles.stepTitle}>আপনার পরিচয়</Text>
        <Text style={styles.stepSubtitle}>সঠিক তথ্য দিলে সঠিক ফলাফল পাবেন</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>আপনার নাম</Text>
          <TextInput
            style={styles.input}
            placeholder="যেমন: রাজীব চক্রবর্তী"
            placeholderTextColor={Colors.textSub}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>জন্মতারিখ</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="দিন"
              placeholderTextColor={Colors.textSub}
              keyboardType="numeric"
              maxLength={2}
              value={day}
              onChangeText={setDay}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="মাস"
              placeholderTextColor={Colors.textSub}
              keyboardType="numeric"
              maxLength={2}
              value={month}
              onChangeText={setMonth}
            />
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="সাল (১৯৯০)"
              placeholderTextColor={Colors.textSub}
              keyboardType="numeric"
              maxLength={4}
              value={year}
              onChangeText={setYear}
            />
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>💡 জন্মসময় ও জন্মস্থান পরে Settings থেকে যোগ করা যাবে</Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, !canNext && styles.primaryBtnDisabled]}
          onPress={() => canNext && onNext({ name: name.trim(), day: parseInt(day), month: parseInt(month), year: parseInt(year) })}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>পরবর্তী →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← ফিরে যান</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

function RashiStep({ onComplete, onBack }) {
  const [selected, setSelected] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.ScrollView
      style={{ flex: 1, opacity: fadeAnim }}
      contentContainerStyle={styles.stepContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepIcon}>🌟</Text>
      <Text style={styles.stepTitle}>আপনার রাশি বেছে নিন</Text>
      <Text style={styles.stepSubtitle}>চন্দ্র রাশি (জন্মকালীন চাঁদের অবস্থান)</Text>

      <View style={styles.rashiGrid}>
        {Rashis.map((r, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.rashiOption,
              selected === i && { borderColor: r.color, backgroundColor: r.color + '22' },
            ]}
            onPress={() => setSelected(i)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 26 }}>{r.symbol}</Text>
            <Text style={[styles.rashiOptionName, { color: selected === i ? r.color : Colors.text }]}>{r.name}</Text>
            <Text style={styles.rashiOptionLord}>{r.lord}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, selected === null && styles.primaryBtnDisabled]}
        onPress={() => selected !== null && onComplete({ rashiIndex: selected })}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>সম্পন্ন করুন ✓</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backBtnText}>← ফিরে যান</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </Animated.ScrollView>
  );
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [personalData, setPersonalData] = useState(null);
  const insets = useSafeAreaInsets();
  const { saveUser } = useUser();

  async function finish(rashiData) {
    await saveUser({
      ...personalData,
      ...rashiData,
      onboardingDone: true,
      createdAt: Date.now(),
    });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <CosmicBg />
      <View style={styles.progress}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
        ))}
      </View>
      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
      {step === 1 && (
        <PersonalStep
          onNext={data => { setPersonalData(data); setStep(2); }}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <RashiStep
          onComplete={finish}
          onBack={() => setStep(1)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.goldBorder },
  dotActive: { width: 24, backgroundColor: Colors.gold },

  stepContainer: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 16 },
  bigOm: { fontSize: 80, marginBottom: 16 },
  welcomeTitle: { fontSize: 18, color: Colors.textSub, marginBottom: 4 },
  appName: { fontSize: 36, fontWeight: '700', color: Colors.goldLight, marginBottom: 12 },
  welcomeSubtitle: { fontSize: 16, color: Colors.text, textAlign: 'center', lineHeight: 26, marginBottom: 28 },

  featureList: { width: '100%', gap: 10, marginBottom: 36 },
  featureItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  featureText: { fontSize: 14, color: Colors.text },

  stepIcon: { fontSize: 52, marginBottom: 12 },
  stepTitle: { fontSize: 26, fontWeight: '700', color: Colors.goldLight, marginBottom: 8, textAlign: 'center' },
  stepSubtitle: { fontSize: 14, color: Colors.textSub, textAlign: 'center', marginBottom: 24 },

  inputGroup: { width: '100%', marginBottom: 18 },
  inputLabel: { fontSize: 14, color: Colors.textSub, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 12, padding: 14,
    fontSize: 16, color: Colors.text,
  },

  noteBox: {
    width: '100%', backgroundColor: 'rgba(201,146,42,0.08)',
    borderRadius: 12, padding: 12, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  noteText: { fontSize: 12, color: Colors.textSub },

  rashiGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, marginBottom: 24, justifyContent: 'center',
  },
  rashiOption: {
    width: (width - 68) / 3, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.goldBorder,
    padding: 10, gap: 4,
  },
  rashiOptionName: { fontSize: 13, fontWeight: '700' },
  rashiOptionLord: { fontSize: 10, color: Colors.textSub },

  primaryBtn: {
    width: '100%', backgroundColor: Colors.gold,
    borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12,
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  backBtn: { padding: 12 },
  backBtnText: { fontSize: 14, color: Colors.textSub },
});
