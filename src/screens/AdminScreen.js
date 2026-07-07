import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { AppHeader } from '../components/AppHeader';
import { db } from '../config/firebase';
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
function UserRow({ item }) {
  const joined = item.updatedAt?.toDate
    ? item.updatedAt.toDate().toLocaleDateString('bn-BD')
    : '—';
  return (
    <View style={s.row}>
      <View style={s.avatar}>
        <MaterialCommunityIcons name="account" size={20} color={colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.name}>{item.name || 'নাম নেই'}</Text>
        <Text style={s.email}>{item.email}</Text>
      </View>
      <Text style={s.date}>{joined}</Text>
    </View>
  );
}

export function AdminScreen() {
  const { user } = useAuth();
  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

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
          renderItem={({ item }) => <UserRow item={item} />}
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
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: 14, paddingVertical: 12,
    ...shadows.card,
  },
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
});
