// src/engine/cities.js — myastrology.in/src/cities.js থেকে শহর লোড করে, AsyncStorage-এ cache করে

import AsyncStorage from '@react-native-async-storage/async-storage';

const CITIES_URL = 'https://www.myastrology.in/src/cities.js';
const CACHE_KEY  = 'cities_cache';
const CACHE_TTL  = 7 * 24 * 60 * 60 * 1000; // ৭ দিন

let _cache = null; // in-memory cache

// cities.js থেকে array parse করা (JS object literal → JSON)
function parseCitiesJS(raw) {
  // `var _CITY_RAW = [...];` থেকে array অংশ বের করা
  const match = raw.match(/var\s+_CITY_RAW\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return [];
  let arrayStr = match[1];
  // JS object keys (unquoted) → JSON keys (quoted)
  arrayStr = arrayStr
    .replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":')  // key quoting
    .replace(/:\s*'([^']*)'/g, ':"$1"')                   // single → double quotes
    .replace(/:\s*'([^']*)'/g, ':"$1"');                   // second pass
  try {
    return JSON.parse(arrayStr);
  } catch {
    return [];
  }
}

export async function loadCities() {
  if (_cache) return _cache;

  // AsyncStorage থেকে cache পড়া
  try {
    const stored = await AsyncStorage.getItem(CACHE_KEY);
    if (stored) {
      const { ts, data } = JSON.parse(stored);
      if (Date.now() - ts < CACHE_TTL && data.length > 0) {
        _cache = data;
        return _cache;
      }
    }
  } catch (_) {}

  // Network থেকে fetch
  try {
    const res = await fetch(CITIES_URL);
    const raw = await res.text();
    const cities = parseCitiesJS(raw);
    if (cities.length > 10) {
      _cache = cities;
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: cities }));
      return _cache;
    }
  } catch (_) {}

  // Fallback — প্রধান শহরগুলো hardcode
  _cache = FALLBACK_CITIES;
  return _cache;
}

// শহর নাম দিয়ে search (case-insensitive, Bengali + English)
export function searchCities(cities, query) {
  if (!query || query.length < 2) return cities.slice(0, 30);
  const q = query.toLowerCase();
  return cities
    .filter(c => c.n.toLowerCase().includes(q) || (c.district || '').includes(q))
    .slice(0, 40);
}

// AsyncStorage-এ নির্বাচিত শহর সংরক্ষণ
export async function saveUserCity(city) {
  await AsyncStorage.setItem('userCity', JSON.stringify(city));
}

export async function loadUserCity() {
  try {
    const s = await AsyncStorage.getItem('userCity');
    return s ? JSON.parse(s) : FALLBACK_CITIES[0]; // default: রাণাঘাট
  } catch {
    return FALLBACK_CITIES[0];
  }
}

// Fallback — সার্ভার না পাওয়া গেলে এগুলো দেখাবে
const FALLBACK_CITIES = [
  { n:'Ranaghat',    district:'নদিয়া',       state:'পশ্চিমবঙ্গ', country:'ভারত', lat:23.18, lng:88.55 },
  { n:'Kolkata',     district:'কলকাতা',      state:'পশ্চিমবঙ্গ', country:'ভারত', lat:22.5726, lng:88.3639 },
  { n:'Siliguri',    district:'দার্জিলিং',   state:'পশ্চিমবঙ্গ', country:'ভারত', lat:26.7271, lng:88.3953 },
  { n:'Durgapur',    district:'পশ্চিম বর্ধমান', state:'পশ্চিমবঙ্গ', country:'ভারত', lat:23.5204, lng:87.3119 },
  { n:'Asansol',     district:'পশ্চিম বর্ধমান', state:'পশ্চিমবঙ্গ', country:'ভারত', lat:23.6739, lng:86.9524 },
  { n:'Krishnanagar',district:'নদিয়া',       state:'পশ্চিমবঙ্গ', country:'ভারত', lat:23.4009, lng:88.5014 },
  { n:'Burdwan',     district:'পূর্ব বর্ধমান',state:'পশ্চিমবঙ্গ', country:'ভারত', lat:23.2324, lng:87.8615 },
  { n:'Barasat',     district:'উত্তর ২৪ পরগনা',state:'পশ্চিমবঙ্গ',country:'ভারত', lat:22.7220, lng:88.4790 },
  { n:'Howrah',      district:'হাওড়া',       state:'পশ্চিমবঙ্গ', country:'ভারত', lat:22.5958, lng:88.2636 },
  { n:'Kharagpur',   district:'পশ্চিম মেদিনীপুর',state:'পশ্চিমবঙ্গ',country:'ভারত', lat:22.3460, lng:87.3237 },
  { n:'Haldia',      district:'পূর্ব মেদিনীপুর',state:'পশ্চিমবঙ্গ',country:'ভারত', lat:22.0667, lng:88.0700 },
  { n:'Dhaka',       district:'ঢাকা',         state:'ঢাকা',       country:'বাংলাদেশ', lat:23.8103, lng:90.4125 },
  { n:'Chittagong',  district:'চট্টগ্রাম',    state:'চট্টগ্রাম',  country:'বাংলাদেশ', lat:22.3569, lng:91.7832 },
  { n:'Sylhet',      district:'সিলেট',        state:'সিলেট',      country:'বাংলাদেশ', lat:24.8949, lng:91.8687 },
  { n:'Delhi',       district:'দিল্লি',       state:'দিল্লি',     country:'ভারত', lat:28.6139, lng:77.2090 },
  { n:'Mumbai',      district:'মুম্বাই',      state:'মহারাষ্ট্র', country:'ভারত', lat:19.0760, lng:72.8777 },
  { n:'Chennai',     district:'চেন্নাই',      state:'তামিলনাড়ু', country:'ভারত', lat:13.0827, lng:80.2707 },
  { n:'Guwahati',    district:'কামরূপ',       state:'আসাম',       country:'ভারত', lat:26.1445, lng:91.7362 },
  { n:'Agartala',    district:'পশ্চিম ত্রিপুরা',state:'ত্রিপুরা', country:'ভারত', lat:23.8315, lng:91.2868 },
];
