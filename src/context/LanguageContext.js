/*  অ্যাপের ভাষা — বাংলা (ডিফল্ট) · हिन्दी · English
 *
 *  UserContext.js-এর ধাঁচেই: AsyncStorage-এ রাখা, তাই অ্যাপ বন্ধ করে খুললেও
 *  পাঠকের পছন্দ থাকে। ডিফল্ট **বাংলা** — অ্যাপটা বাংলাভাষী পাঠকের জন্যই
 *  তৈরি, আর ফোনের ভাষা দেখে নিজে থেকে বদলে দিলে যিনি বাংলা চান তিনি হঠাৎ
 *  ইংরেজি পাতা পেতেন।
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate, numText, hasTranslation, setCurrentLang, LANGS, LANG_LABEL } from '../i18n';

const LanguageContext = createContext(null);
const STORAGE_KEY = '@myastrology_lang_v1';

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('bn');
  /* ready — সংরক্ষিত পছন্দ পড়া শেষ কি না। এটা ছাড়া প্রথম রেন্ডারে বাংলা
     দেখিয়ে তারপর ইংরেজিতে বদলে যেত (ওয়েবসাইটের "প্রথমে বাংলা, তারপর
     ইংরেজি" ঝলকানির নেটিভ রূপ)। */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => { if (v && LANGS.indexOf(v) >= 0) setLangState(v); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setLang = useCallback(async (next) => {
    if (LANGS.indexOf(next) < 0) return;
    setLangState(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, next); } catch (e) {}
  }, []);

  /* হুকের বাইরের কোড (buyOnWebBridge ইত্যাদি) যেন একই ভাষা পায় */
  useEffect(() => { setCurrentLang(lang); }, [lang]);

  const value = useMemo(() => ({
    lang,
    ready,
    setLang,
    LANGS,
    LANG_LABEL,
    t:   (s) => translate(lang, s),
    n:   (v) => numText(lang, v),
    has: (s) => hasTranslation(lang, s),
  }), [lang, ready, setLang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/* Provider-এর বাইরে ডাকা হলেও যেন ভাঙে না — বাংলাটাই ফেরে। */
const FALLBACK = {
  lang: 'bn', ready: true, setLang: () => {}, LANGS, LANG_LABEL,
  t: (s) => s, n: (v) => numText('bn', v), has: () => true,
};

export const useLanguage = () => useContext(LanguageContext) || FALLBACK;

/** কেবল t() লাগলে — সবচেয়ে বেশি ব্যবহৃত রূপ */
export const useT = () => useLanguage().t;
