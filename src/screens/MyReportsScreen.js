/*  আমার রিপোর্ট — ক্রেতা নিজের অর্ডার ও তার অবস্থা দেখেন।
 *
 *  কেন দরকার: ₹৫০১ ও ₹১৫০১-এর রিপোর্ট ড. আচার্য অ্যাডমিন পাতা থেকে হাতে
 *  বানিয়ে ২৪ ঘণ্টায় পাঠান। অ্যাপের ভিতরে টাকা নেওয়ার পরে ২৪ ঘণ্টা কিছুই
 *  না দেখানো দু'দিক থেকেই খারাপ — ক্রেতা ভাবেন টাকাটা হারিয়ে গেল, আর
 *  Play-র নিয়মেও "ভিতরে কেনা, ভিতরে কিছু নেই" একটা সমস্যা।
 *
 *  ⚠️ কাজটা অ্যাপের বাইরে হওয়া কোনো সমস্যা নয় — **দেখা যাওয়াটা** ভিতরে
 *  হতে হয়। তাই এখানে অর্ডারটা, তার অবস্থা আর প্রস্তুত হলে রিপোর্টটা
 *  দেখানো হয়।
 *
 *  ⚠️ status ক্রেতা বদলাতে পারেন না (firestore.rules — read only)।
 *  নইলে যে কেউ নিজের অর্ডারকে 'done' লিখে দিতে পারতেন।
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Pressable, RefreshControl, Linking, Modal, TextInput } from 'react-native';
import { Text } from '../i18n/Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppHeader } from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAlert } from '../i18n/Text';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { typography } from '../theme/typography';

/* অর্ডারের status → পাঠকের ভাষার লেখা ও রঙ।
   'new' লেখে ওয়েবসাইট/অ্যাপ কেনার সময়; 'done' লেখে অ্যাডমিন পাতা। */
const STATUS = {
  new:      { label: 'অপেক্ষমাণ',      color: '#B8860B', icon: 'clock-outline' },
  working:  { label: 'তৈরি হচ্ছে',      color: '#2980B9', icon: 'progress-clock' },
  done:     { label: 'প্রস্তুত',        color: '#1E874B', icon: 'check-circle-outline' },
};
const PID_LABEL = {
  premiumKundali:  'প্রিমিয়াম কুণ্ডলী রিপোর্ট',
  solutionKundali: 'VIP পরামর্শ ও সমাধান',
  kundaliPdf:      'জন্মকুণ্ডলী PDF',
  mmPdf:           'কোষ্ঠী মিলন PDF',
};

export function MyReportsScreen({ navigation }) {
  const { user, loading: authLoading } = useAuth() || {};
  const { t, n } = useLanguage();
  const alertT = useAlert();
  const [rows, setRows] = useState(null);
  /* ₹১৫০১-এর বুকিং — নতুন পর্দা না বানিয়ে এখানেই একটা ছোট ফর্ম, যাতে
     ক্রেতা যেখানে ছিলেন সেখানেই থাকেন। */
  const [bookFor, setBookFor] = useState(null);   // orderId
  const [wa, setWa] = useState('');
  const [slot, setSlot] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    if (!user) { setRows([]); return; }
    setBusy(true); setErr(null);
    try {
      /* ⚠️ where('uid','==',…) বাধ্যতামূলক — firestore.rules অন্য কোনো
         কোয়েরি ফিরিয়ে দেবে (অন্যের অর্ডার পড়া আটকাতে)। */
      const q = query(
        collection(db, 'orders'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setErr(String((e && e.message) || e));
      setRows([]);
    } finally { setBusy(false); }
  }, [user]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  if (authLoading || rows === null) {
    return (
      <View style={s.root}>
        <AppHeader />
        <View style={s.center}><ActivityIndicator size="large" color={colors.gold} /></View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={s.root}>
        <AppHeader />
        <View style={s.center}>
          <MaterialCommunityIcons name="account-circle-outline" size={44} color={colors.textSecondary} />
          <Text style={s.emptyTitle}>সাইন-ইন করলে আপনার রিপোর্ট এখানে দেখা যাবে</Text>
          <Pressable style={s.cta} onPress={() => navigation.navigate('Settings')}>
            <Text style={s.ctaText}>সেটিংসে সাইন-ইন করুন</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <AppHeader />
      <FlatList
        data={rows}
        keyExtractor={r => r.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={load} tintColor={colors.gold} />}
        ListEmptyComponent={
          <View style={s.center}>
            <MaterialCommunityIcons name="file-document-outline" size={44} color={colors.textSecondary} />
            <Text style={s.emptyTitle}>এখনো কোনো রিপোর্ট নেই</Text>
            <Text style={s.emptySub}>কুণ্ডলী বা কোষ্ঠী মিলনের রিপোর্ট কিনলে এখানে দেখা যাবে</Text>
          </View>
        }
        ListHeaderComponent={
          err ? <Text style={s.err}>{'তালিকা আনা যায়নি — পরে আবার চেষ্টা করুন।'}</Text> : null
        }
        renderItem={({ item }) => {
          const st = STATUS[item.status] || STATUS.new;
          const when = item.createdAt && item.createdAt.toDate
            ? item.createdAt.toDate() : null;
          return (
            <View style={s.card}>
              <View style={s.cardTop}>
                <Text style={s.title} numberOfLines={2}>
                  {PID_LABEL[item.pid] || item.pid || 'রিপোর্ট'}
                </Text>
                <View style={[s.badge, { borderColor: st.color }]}>
                  <MaterialCommunityIcons name={st.icon} size={13} color={st.color} />
                  <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>

              {when ? (
                <Text style={s.meta}>
                  {n(when.getDate()) + '/' + n(when.getMonth() + 1) + '/' + n(when.getFullYear())}
                </Text>
              ) : null}

              {item.status !== 'done' ? (
                <Text style={s.wait}>
                  আপনার রিপোর্ট তৈরি হচ্ছে — ২৪ ঘণ্টার মধ্যে প্রস্তুত হলে জানানো হবে।
                </Text>
              ) : null}

              {/* ⚠️ ₹১৫০১-এ ফোন/হোয়াটসঅ্যাপে পরামর্শ থাকে, সেটা অ্যাপের বাইরে
                  হয়। তাই বুকিং দেওয়া আছে কি না এখানেই দেখানো হয় — নইলে
                  ক্রেতা জানতেনই না যে তাঁর সময় দেওয়া বাকি। */}
              {item.pid === 'solutionKundali' && !item.booking ? (
                <Pressable style={s.cta} onPress={() => { setBookFor(item.id); setWa(''); setSlot(''); }}>
                  <Text style={s.ctaText}>পরামর্শের সময় জানান</Text>
                </Pressable>
              ) : null}

              {item.status === 'done' && item.deliveryUrl ? (
                <Pressable style={s.cta} onPress={() => Linking.openURL(item.deliveryUrl).catch(() => {})}>
                  <Text style={s.ctaText}>রিপোর্ট দেখুন</Text>
                </Pressable>
              ) : null}
            </View>
          );
        }}
      />

      {/* ── পরামর্শের বুকিং ──
          ⚠️ এখানে কেবল `booking` ঘরটাই লেখা হয় — firestore.rules
          affectedKeys().hasOnly(['booking']) দিয়ে বাকি সব আটকে রেখেছে,
          নইলে ক্রেতা নিজের অর্ডারের status বা দাম বদলে দিতে পারতেন। */}
      <Modal visible={!!bookFor} transparent animationType="fade" onRequestClose={() => setBookFor(null)}>
        <View style={s.mBack}>
          <View style={s.mCard}>
            <Text style={s.mTitle}>পরামর্শের সময় জানান</Text>
            <Text style={s.mSub}>
              ড. আচার্য এই নম্বরে হোয়াটসঅ্যাপ বা ফোনে যোগাযোগ করবেন।
            </Text>
            <TextInput
              style={s.input}
              value={wa}
              onChangeText={setWa}
              keyboardType="phone-pad"
              placeholder={t('হোয়াটসঅ্যাপ নম্বর')}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t('হোয়াটসঅ্যাপ নম্বর')}
            />
            <TextInput
              style={s.input}
              value={slot}
              onChangeText={setSlot}
              placeholder={t('কখন কথা বলা সুবিধাজনক')}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t('কখন কথা বলা সুবিধাজনক')}
            />
            <View style={s.mRow}>
              <Pressable style={[s.cta, s.ctaGhost]} onPress={() => setBookFor(null)}>
                <Text style={s.ctaGhostText}>বাতিল</Text>
              </Pressable>
              <Pressable
                style={[s.cta, saving && { opacity: 0.6 }]}
                disabled={saving}
                onPress={async () => {
                  const num = wa.replace(/[^0-9+]/g, '');
                  /* ⚠️ নম্বরটা না থাকলে বুকিংয়ের কোনো মানে নেই — ড. আচার্য
                     কাকে ফোন করবেন তা জানা যেত না। */
                  if (num.length < 10) { alertT('ত্রুটি', 'সঠিক হোয়াটসঅ্যাপ নম্বর দিন।'); return; }
                  setSaving(true);
                  try {
                    await updateDoc(doc(db, 'orders', bookFor), {
                      booking: { whatsapp: num, slot: slot.trim(), at: Date.now() },
                    });
                    setBookFor(null);
                    alertT('সম্পন্ন', 'আপনার সময় জানানো হয়েছে।');
                    load();
                  } catch (e) {
                    alertT('ত্রুটি', 'সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
                  } finally { setSaving(false); }
                }}
              >
                <Text style={s.ctaText}>{saving ? t('সংরক্ষণ হচ্ছে…') : t('পাঠান')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 30, gap: 10 },
  list:   { padding: spacing.md, gap: 10 },
  card: {
    backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1,
    borderColor: colors.cardBorder, padding: 14, gap: 6, ...shadows.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title:  { ...typography.value, flex: 1, fontSize: 14, color: colors.text },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta:  { ...typography.label, color: colors.textSecondary },
  wait:  { ...typography.label, color: colors.textSecondary, lineHeight: 17 },
  err:   { ...typography.label, color: colors.danger, marginBottom: 8 },
  emptyTitle: { ...typography.value, fontSize: 14, color: colors.text, textAlign: 'center' },
  emptySub:   { ...typography.label, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  cta: {
    marginTop: 6, alignSelf: 'flex-start', backgroundColor: colors.gold,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: radii.pill,
  },
  ctaText: { fontSize: 13, fontWeight: '800', color: '#2a1206' },
  ctaGhost:     { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.cardBorder },
  ctaGhostText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  mBack:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  mCard:  { width: '100%', maxWidth: 420, backgroundColor: colors.card, borderRadius: radii.lg, padding: 18, gap: 10 },
  mTitle: { ...typography.value, fontSize: 15, color: colors.text },
  mSub:   { ...typography.label, color: colors.textSecondary, lineHeight: 18 },
  mRow:   { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  input: {
    borderWidth: 1.5, borderColor: colors.cardBorder, borderRadius: radii.md,
    paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 14,
    backgroundColor: colors.background,
  },
});
