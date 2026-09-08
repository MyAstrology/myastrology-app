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
import { deviceLang } from '../utils/deviceLang';

const LanguageContext = createContext(null);
const STORAGE_KEY = '@myastrology_lang_v1';
/* পাঠক একবার নিজে ভাষা বেছেছেন কি না — প্রথম চালুর পর্দাটা ঠিক একবারই
   দেখানোর জন্য। ভাষার চাবির থেকে আলাদা রাখা হয়েছে, কারণ "বাংলা বেছেছেন"
   আর "কিছুই বাছেননি, তাই বাংলা" — এই দুটো এক জিনিস নয়। */
const CHOSEN_KEY = '@myastrology_lang_chosen_v1';

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('bn');
  /* chosen=false মানে প্রথম চালু — ভাষা বাছাইয়ের পর্দাটা দেখানো হবে */
  const [chosen, setChosen] = useState(true);
  /* ready — সংরক্ষিত পছন্দ পড়া শেষ কি না। এটা ছাড়া প্রথম রেন্ডারে বাংলা
     দেখিয়ে তারপর ইংরেজিতে বদলে যেত (ওয়েবসাইটের "প্রথমে বাংলা, তারপর
     ইংরেজি" ঝলকানির নেটিভ রূপ)। */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(CHOSEN_KEY)])
      .then(([v, c]) => {
        if (v && LANGS.indexOf(v) >= 0) setLangState(v);
        else {
          /* প্রথম চালু — ফোনের ভাষাটা কেবল **আগে থেকে বাছা** থাকে,
             নিজে থেকে বসে যায় না; পাঠক পর্দায় নিশ্চিত করবেন। */
          const d = deviceLang();
          if (d) setLangState(d);
        }
        if (!c) setChosen(false);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setLang = useCallback(async (next) => {
    if (LANGS.indexOf(next) < 0) return;
    setLangState(next);
    setChosen(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
      await AsyncStorage.setItem(CHOSEN_KEY, '1');
    } catch (e) {}
  }, []);

  /* হুকের বাইরের কোড (buyOnWebBridge, tGlobal, numText …) যেন একই ভাষা পায়।
     ⚠️ এটা আগে useEffect-এ ছিল, আর effect চলে **রেন্ডারের পরে** — তাই
     ভাষা বদলের ঠিক পরের রেন্ডারে মডিউলের মান পুরনোটাই থাকত। ফল: পর্দার
     লেবেল বাংলা অথচ সময় "Morning 5:24" আর অঙ্ক ল্যাটিন — একই কার্ডে
     দুই ভাষা। রেন্ডারের সময়েই বসানোয় দুটো আর কখনো আলাদা হতে পারে না।
     (একটা মডিউল-চলকে একই মান বসানো idempotent, তাই রেন্ডারে নিরাপদ।) */
  setCurrentLang(lang);

  const value = useMemo(() => ({
    lang,
    ready,
    chosen,
    setLang,
    LANGS,
    LANG_LABEL,
    t:   (s) => translate(lang, s),
    n:   (v) => numText(lang, v),
    has: (s) => hasTranslation(lang, s),
  }), [lang, ready, chosen, setLang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/* Provider-এর বাইরে ডাকা হলেও যেন ভাঙে না — বাংলাটাই ফেরে। */
const FALLBACK = {
  lang: 'bn', ready: true, chosen: true, setLang: () => {}, LANGS, LANG_LABEL,
  t: (s) => s, n: (v) => numText('bn', v), has: () => true,
};

export const useLanguage = () => useContext(LanguageContext) || FALLBACK;

/** কেবল t() লাগলে — সবচেয়ে বেশি ব্যবহৃত রূপ */
export const useT = () => useLanguage().t;
