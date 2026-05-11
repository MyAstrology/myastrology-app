// src/theme/index.js — বৈদিক জ্যোতিষ Design System
// রং ওয়েবসাইটের (myastrology.in) CSS variables-এর সাথে মানানসই
// Website: --gold:#c9922a  --gold-lt:#e8bc5a  --navy:#12122a  --navy-mid:#1e1e3a

export const Colors = {
  // রাতের আকাশ — website navy palette-এর সাথে aligned
  bg: '#0e0e2a',          // website --navy: #12122a — গাঢ় purple-navy
  bgDeep: '#08081a',
  bgCard: 'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(255,255,255,0.07)',

  // Header gradient — website logo-box gradient থেকে নেওয়া
  headerBg: '#12122a',    // website --navy
  headerGrad1: '#1e0e3a', // website logo gradient start
  headerGrad2: '#2e1a5e', // website logo gradient mid
  headerGrad3: '#12122a', // website logo gradient end

  // বৃহস্পতি — সোনালী (ওয়েবসাইটের exact gold)
  gold: '#c9922a',                        // website --gold
  goldLight: '#e8bc5a',                   // website --gold-lt
  goldDark: '#8b5e1a',
  goldBorder: 'rgba(201,146,42,0.25)',    // website border style
  goldGlow: 'rgba(201,146,42,0.10)',
  goldGlowStrong: 'rgba(201,146,42,0.25)',

  // সূর্য — কমলা
  sun: '#f97316',
  sunLight: '#fed7aa',

  // চন্দ্র — রুপালী
  moon: '#e2e8f0',
  moonDim: 'rgba(226,232,240,0.6)',

  // মঙ্গল — লাল
  mars: '#ef4444',
  marsLight: '#fca5a5',

  // বুধ — সবুজ
  mercury: '#22c55e',
  success: '#22c55e',
  danger: '#ef4444',

  // শনি — বেগুনি
  saturn: '#8b5cf6',
  saturnLight: '#c4b5fd',

  // শুক্র — গোলাপি
  venus: '#ec4899',
  venusLight: '#f9a8d4',

  // রাহু — ধূসর
  rahu: '#64748b',

  // টেক্সট
  text: '#e8dcc8',
  textPrimary: '#e8dcc8',
  textSub: '#8899aa',
  textSecondary: '#8899aa',
  textMuted: 'rgba(232,220,200,0.4)',

  // WhatsApp
  whatsapp: '#25d366',
  whatsappBg: 'rgba(37,211,102,0.10)',
};

// নবগ্রহ
export const Planets = {
  sun:     { symbol: '☀️', name: 'সূর্য',     color: '#f97316', day: 'রবিবার' },
  moon:    { symbol: '🌙', name: 'চন্দ্র',    color: '#e2e8f0', day: 'সোমবার' },
  mars:    { symbol: '♂',  name: 'মঙ্গল',     color: '#ef4444', day: 'মঙ্গলবার' },
  mercury: { symbol: '☿',  name: 'বুধ',       color: '#22c55e', day: 'বুধবার' },
  jupiter: { symbol: '♃',  name: 'বৃহস্পতি',  color: '#c9922a', day: 'বৃহস্পতিবার' },
  venus:   { symbol: '♀',  name: 'শুক্র',     color: '#ec4899', day: 'শুক্রবার' },
  saturn:  { symbol: '♄',  name: 'শনি',       color: '#8b5cf6', day: 'শনিবার' },
  rahu:    { symbol: '☊',  name: 'রাহু',      color: '#64748b', day: '' },
  ketu:    { symbol: '☋',  name: 'কেতু',      color: '#78716c', day: '' },
};

// ১২ রাশি
export const Rashis = [
  { name: 'মেষ',     symbol: '♈', lord: 'মঙ্গল',    color: '#ef4444', element: 'অগ্নি', en: 'Aries' },
  { name: 'বৃষ',     symbol: '♉', lord: 'শুক্র',    color: '#ec4899', element: 'পৃথিবী', en: 'Taurus' },
  { name: 'মিথুন',   symbol: '♊', lord: 'বুধ',      color: '#22c55e', element: 'বায়ু', en: 'Gemini' },
  { name: 'কর্কট',   symbol: '♋', lord: 'চন্দ্র',   color: '#e2e8f0', element: 'জল', en: 'Cancer' },
  { name: 'সিংহ',    symbol: '♌', lord: 'সূর্য',    color: '#f97316', element: 'অগ্নি', en: 'Leo' },
  { name: 'কন্যা',   symbol: '♍', lord: 'বুধ',      color: '#84cc16', element: 'পৃথিবী', en: 'Virgo' },
  { name: 'তুলা',    symbol: '♎', lord: 'শুক্র',    color: '#f472b6', element: 'বায়ু', en: 'Libra' },
  { name: 'বৃশ্চিক', symbol: '♏', lord: 'মঙ্গল',    color: '#dc2626', element: 'জল', en: 'Scorpio' },
  { name: 'ধনু',     symbol: '♐', lord: 'বৃহস্পতি', color: '#c9922a', element: 'অগ্নি', en: 'Sagittarius' },
  { name: 'মকর',     symbol: '♑', lord: 'শনি',      color: '#8b5cf6', element: 'পৃথিবী', en: 'Capricorn' },
  { name: 'কুম্ভ',   symbol: '♒', lord: 'শনি',      color: '#6366f1', element: 'বায়ু', en: 'Aquarius' },
  { name: 'মীন',     symbol: '♓', lord: 'বৃহস্পতি', color: '#06b6d4', element: 'জল', en: 'Pisces' },
];

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const Radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, full: 999 };

export const Shadow = {
  gold: {
    shadowColor: '#c9922a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
};
