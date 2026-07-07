import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut as fbSignOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId:     GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Google sign-in is a two-step flow: promptAsync() opens the browser and
  // resolves when it closes, but the actual credential arrives via this
  // `response` effect — so the Firestore profile upsert happens here, not
  // inline after promptAsync().
  useEffect(() => {
    if (response?.type !== 'success') return;
    const { id_token } = response.params;
    const credential = GoogleAuthProvider.credential(id_token);
    signInWithCredential(auth, credential)
      .then(({ user: u }) => setDoc(doc(db, 'users', u.uid), {
        name:      u.displayName || '',
        email:     u.email || '',
        photoURL:  u.photoURL || '',
        updatedAt: serverTimestamp(),
      }, { merge: true }).catch(() => {}))
      .catch(() => {});
  }, [response]);

  const signInWithGoogle = useCallback(() => promptAsync(), [promptAsync]);
  const signOut          = useCallback(() => fbSignOut(auth), []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
