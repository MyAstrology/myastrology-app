import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Firebase project config ──────────────────────────────────────────────
// Fill these in from: Firebase console (console.firebase.google.com) →
// create a project → Project settings → General → "Your apps" → add a Web
// app → SDK setup and configuration → Config. These values are safe to
// commit — Firebase's own docs note the web config is not a secret; access
// is controlled by Firestore/Auth security rules, not by hiding these
// strings.
const firebaseConfig = {
  apiKey:            'AIzaSyDKG5yYBjgB_dXwfOOn7R1962ZtfTaLMEo',
  authDomain:        'myastrology-addd3.firebaseapp.com',
  projectId:         'myastrology-addd3',
  storageBucket:     'myastrology-addd3.firebasestorage.app',
  messagingSenderId: '455926974196',
  appId:             '1:455926974196:web:9879e1fc7dfb842e39c0a1',
};

// Firebase console → Authentication → Sign-in method → enable "Google" auto-
// creates a Google Cloud project with OAuth clients — used by
// expo-auth-session in context/AuthContext.js for the sign-in flow.
// Web client ID: always required (Firebase console → Authentication →
// Sign-in method → Google → "Web SDK configuration").
// Android client ID: needed once testing moves off Expo Go's auth proxy
// (i.e. once the OneSignal dev-client build from Phase B is in use) —
// Google Cloud Console → APIs & Services → Credentials → OAuth client
// (Android), using the dev client's package name (in.myastrology.app) and
// its signing certificate's SHA-1.
export const GOOGLE_WEB_CLIENT_ID     = '455926974196-a7quruldvd5n1ol42ipoq707scsujk7g.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = 'REPLACE_ME.apps.googleusercontent.com';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
