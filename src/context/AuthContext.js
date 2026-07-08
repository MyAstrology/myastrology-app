import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut as fbSignOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
