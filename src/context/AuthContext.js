import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut as fbSignOut,
  deleteUser, reauthenticateWithCredential,
} from 'firebase/auth';
import {
  doc, setDoc, deleteDoc, collection, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { auth, db, GOOGLE_WEB_CLIENT_ID } from '../config/firebase';

// expo-auth-session's browser-redirect Google sign-in was swapped out for
// this native module — the redirect-based flow is a long-standing, still-
// open Expo/Android reliability bug (completes the consent screen but
// never hands control back to the app on a meaningful share of devices).
// GoogleSignin talks to Play Services directly, no browser round-trip.
GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await GoogleSignin.hasPlayServices();
    const { data } = await GoogleSignin.signIn();
    const credential = GoogleAuthProvider.credential(data.idToken);
    const { user: u } = await signInWithCredential(auth, credential);
    await setDoc(doc(db, 'users', u.uid), {
      name:      u.displayName || '',
      email:     u.email || '',
      photoURL:  u.photoURL || '',
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch(() => {});
  }, []);

  const signOut = useCallback(async () => {
    await GoogleSignin.signOut().catch(() => {});
    await fbSignOut(auth);
  }, []);

  // Google Play-র Data deletion নীতি: যে অ্যাপে অ্যাকাউন্ট তৈরি করা যায়,
  // সেখানে অ্যাপের ভেতর থেকেই অ্যাকাউন্ট ও তার ডেটা মোছার পথ থাকতেই হবে —
  // নইলে রিভিউতে আটকায় বা পরে অ্যাপ সরিয়ে দেওয়া হয়। তাই এই ফাংশন।
  //
  // ক্রম গুরুত্বপূর্ণ: Firestore ডক আগে, Auth অ্যাকাউন্ট পরে। উল্টো করলে
  // Auth মুছে যাওয়ার পর request.auth null হয়ে যায়, আর firestore.rules-এ
  // users/{uid} লেখার শর্ত request.auth.uid == uid — ফলে ডকটা চিরতরে
  // থেকে যেত, কেউ আর মুছতে পারত না।
  const deleteAccount = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) throw new Error('no-user');

    // ওয়েবসাইটের mya-cloud-sync.js সেভ-করা কুণ্ডলী রাখে
    // users/{uid}/data/kundaliProfiles-এ। সাব-কালেকশন ক্লায়েন্ট থেকে
    // এক কমান্ডে মোছা যায় না — ডকগুলো তালিকা করে একে একে মুছতে হয়।
    try {
      const snap = await getDocs(collection(db, 'users', u.uid, 'data'));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref).catch(() => {})));
    } catch (_) {}
    await deleteDoc(doc(db, 'users', u.uid)).catch(() => {});

    try {
      await deleteUser(u);
    } catch (e) {
      // Firebase পুরনো সেশনে অ্যাকাউন্ট মুছতে দেয় না (auth/requires-recent-
      // login)। ব্যবহারকারীকে ব্যর্থতা না দেখিয়ে চুপচাপ আবার Google সাইন-ইন
      // করিয়ে নিয়ে দ্বিতীয়বার চেষ্টা করি — এটাই Firebase-এর সুপারিশ করা পথ।
      if (e && e.code === 'auth/requires-recent-login') {
        await GoogleSignin.hasPlayServices();
        const { data } = await GoogleSignin.signIn();
        const credential = GoogleAuthProvider.credential(data.idToken);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await deleteUser(auth.currentUser);
      } else {
        throw e;
      }
    }

    // ডিভাইসে Google-এর সেশনও ছেড়ে দিই, নইলে পরের বার সাইন-ইন চাপলে
    // আগের অ্যাকাউন্টেই নীরবে ঢুকে যেত।
    await GoogleSignin.signOut().catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
