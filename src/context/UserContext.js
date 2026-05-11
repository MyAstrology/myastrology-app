// src/context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext(null);
const STORAGE_KEY = '@myastrology_user_v2';

export const RashiLucky = [
  { rashi: 0,  color: '#ef4444', colorName: 'লাল',           number: 9, gem: 'প্রবাল',   gemEn: 'Red Coral',        dir: 'দক্ষিণ' },
  { rashi: 1,  color: '#ec4899', colorName: 'গোলাপি',        number: 6, gem: 'হীরা',     gemEn: 'Diamond',          dir: 'দক্ষিণ-পূর্ব' },
  { rashi: 2,  color: '#22c55e', colorName: 'সবুজ',          number: 5, gem: 'পান্না',   gemEn: 'Emerald',          dir: 'উত্তর' },
  { rashi: 3,  color: '#e2e8f0', colorName: 'সাদা',          number: 2, gem: 'মুক্তো',   gemEn: 'Pearl',            dir: 'উত্তর-পশ্চিম' },
  { rashi: 4,  color: '#f97316', colorName: 'সোনালি',        number: 1, gem: 'মাণিক্য',  gemEn: 'Ruby',             dir: 'পূর্ব' },
  { rashi: 5,  color: '#84cc16', colorName: 'হালকা সবুজ',   number: 5, gem: 'পান্না',   gemEn: 'Emerald',          dir: 'উত্তর' },
  { rashi: 6,  color: '#f472b6', colorName: 'সাদা',          number: 6, gem: 'হীরা',     gemEn: 'Diamond',          dir: 'দক্ষিণ-পূর্ব' },
  { rashi: 7,  color: '#dc2626', colorName: 'গাঢ় লাল',      number: 9, gem: 'প্রবাল',   gemEn: 'Red Coral',        dir: 'দক্ষিণ' },
  { rashi: 8,  color: '#c9922a', colorName: 'হলুদ',          number: 3, gem: 'পোখরাজ',  gemEn: 'Yellow Sapphire',  dir: 'উত্তর-পূর্ব' },
  { rashi: 9,  color: '#8b5cf6', colorName: 'নীল',           number: 8, gem: 'নীলা',     gemEn: 'Blue Sapphire',    dir: 'পশ্চিম' },
  { rashi: 10, color: '#6366f1', colorName: 'ইন্ডিগো',       number: 8, gem: 'নীলা',     gemEn: 'Blue Sapphire',    dir: 'পশ্চিম' },
  { rashi: 11, color: '#06b6d4', colorName: 'হলুদ',          number: 3, gem: 'পোখরাজ',  gemEn: 'Yellow Sapphire',  dir: 'উত্তর-পূর্ব' },
];

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(d => { if (d) setUser(JSON.parse(d)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveUser(data) {
    const updated = { ...user, ...data };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  }

  async function clearUser() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, loading, saveUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
