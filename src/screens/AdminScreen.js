import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { AppHeader } from '../components/AppHeader';
import { app, db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { ADMIN_EMAILS } from '../config/adminEmails';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { shadows } from '../theme/shadows';
import { typography } from '../theme/typography';

// Deliberately narrow scope for this pass: shows registered users only (the
// one thing genuinely centralized once Firebase login exists). Premium /
// match-making order data still lives in each browser's localStorage on the
// website (premium-admin.html, match-making-admin.js) — surfacing that here
// would require migrating the website's order forms to Firestore too, a
// separate, larger change to the live payment flow, not done in this pass.

const functions = getFunctions(app, 'asia-south1');
const setUserBlockedFn = httpsCallable(functions, 'adminSetUserBlocked');
const deleteUserFn     = httpsCallable(functions, 'adminDeleteUser');

function UserRow({ item, selfUid, onBlock, onDelete, busy }) {
  const joined = item.updatedAt?.toDate
    ? item.updatedAt.toDate().toLocaleDateString('bn-BD')
    : '—';
  const isSelf = item.id === selfUid;
  return (
    <View style={s.row}>
      <View style={s.rowTop}>
        <View style={s.avatar}>
          <MaterialCommunityIcons name="account" size={20} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{item.name || 'নাম নেই'}</Text>
          <Text style={s.email}>{item.email}</Text>
        </View>
        <Text style={s.date}>{joined}</Text>
      </View>
      {item.blocked && (
        <View style={s.blockedTag}>
          <MaterialCommunityIcons name="cancel" size={12} color="#B71C1C" />
          <Text style={s.blockedTagText}>ব্লক করা</Text>
        </View>
      )}
      {!isSelf && (
        <View style={s.actions}>
          <Pressable
            disabled={busy}
            onPress={() => onBlock(item)}
            style={({ pressed }) => [s.actionBtn, pressed && s.actionBtnPressed]}
          >
            <MaterialCommunityIcons
              name={item.blocked ? 'lock-open-variant-outline' : 'lock-outline'}
              size={14} color={colors.textSecondary}
            />
            <Text style={s.actionText}>{item.blocked ? 'আনব্লক' : 'ব্লক'}</Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => onDelete(item)}
            style={({ pressed }) => [s.actionBtn, s.deleteBtn, pressed && s.actionBtnPressed]}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={14} color="#B71C1C" />
            <Text style={[s.actionText, { color: '#B71C1C' }]}>ডিলিট</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function AdminScreen() {
  const { user } = useAuth();
  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [busyUid, setBusyUid] = useState(null);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    const q = query(collection(db, 'users'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => { setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (e)    => { setError(String(e?.message || e)); setLoading(false); },
    );
    return unsub;
  }, [isAdmin]);

  const handleBlock = useCallback((item) => {
    const nextBlocked = !item.blocked;
    Alert.alert(
      nextBlocked ? 'ব্যবহারকারীকে ব্লক করবেন?' : 'ব্লক তুলে দেবেন?',
      (item.name || item.email) + (nextBlocked ? ' — ব্লক করলে তিনি আর সাইন-ইন করতে পারবেন না।' : ' — আনব্লক করলে আবার সাইন-ইন করতে পারবেন।'),
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: nextBlocked ? 'ব্লক করুন' : 'আনব্লক করুন',
          style: nextBlocked ? 'destructive' : 'default',
          onPress: async () => {
            setBusyUid(item.id);
            try {
              await setUserBlockedFn({ uid: item.id, blocked: nextBlocked });
            } catch (e) {
              Alert.alert('ব্যর্থ', String(e?.message || e));
            } finally {
              setBusyUid(null);
            }
          },
        },
      ],
    );
  }, []);

  const handleDelete = useCallback((item) => {
    Alert.alert(
      'ব্যবহারকারী ডিলিট করবেন?',
      (item.name || item.email) + ' — এই তথ্য স্থায়ীভাবে মুছে যাবে, ফিরিয়ে আনা যাবে না।',
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'ডিলিট করুন',
          style: 'destructive',
          onPress: async () => {
            setBusyUid(item.id);
            try {
              await deleteUserFn({ uid: item.id });
            } catch (e) {
              Alert.alert('ব্যর্থ', String(e?.message || e));
            } finally {
              setBusyUid(null);
            }
          },
        },
      ],
    );
  }, []);

  if (!isAdmin) {
    return (
      <View style={s.container}>
        <AppHeader />
        <View style={s.center}>
          <MaterialCommunityIcons name="shield-lock-outline" size={40} color={colors.textSecondary} />
          <Text style={s.deniedText}>এই পাতা দেখার অনুমতি আপনার নেই।</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <AppHeader />
      <View style={s.header}>
        <Text style={s.title}>নিবন্ধিত ব্যবহারকারী</Text>
        <Text style={s.count}>{users.length}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={colors.gold} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={s.errorText}>লোড ব্যর্থ: {error}</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserRow
              item={item}
              selfUid={user?.uid}
              onBlock={handleBlock}
              onDelete={handleDelete}
              busy={busyUid === item.id}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View style={s.divider} />}
          ListEmptyComponent={<Text style={s.emptyText}>এখনো কোনো ব্যবহারকারী সাইন-ইন করেননি।</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  deniedText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: 8,
  },
  title: { ...typography.sectionTitle, color: colors.text },
  count: { ...typography.heading, color: colors.gold },

  row: {
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: 14, paddingVertical: 12,
    ...shadows.card,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 36, height: 36, borderRadius: radii.md,
    backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center',
  },
  name:  { ...typography.value, fontSize: 14 },
  email: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  date:  { ...typography.caption, color: colors.textSecondary },
  divider: { height: 10 },
  errorText: { ...typography.body, color: '#B71C1C', textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 40 },

  blockedTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: '#FDECEA', borderRadius: radii.pill,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 8,
  },
  blockedTagText: { ...typography.caption, color: '#B71C1C', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.pill,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  actionBtnPressed: { opacity: 0.6 },
  deleteBtn: { borderColor: '#F5C2BD' },
  actionText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
});
