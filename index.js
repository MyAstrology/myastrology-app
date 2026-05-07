// src/theme/index.js
// MyAstrology App — Design System

export const Colors = {
  // Primary palette
  bg: '#070e1a',
  bgCard: 'rgba(255,255,255,0.04)',
  bgDeep: '#0d1f35',

  // Gold accent (primary brand color)
  gold: '#c9a84c',
  goldLight: '#f0d080',
  goldDark: '#8b5e1a',
  goldBorder: 'rgba(201,168,76,0.25)',
  goldGlow: 'rgba(201,168,76,0.12)',

  // Text
  textPrimary: '#e8dcc8',
  textSecondary: '#8899aa',
  textMuted: 'rgba(232,220,200,0.5)',

  // Status colors
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  purple: '#8b5cf6',

  // WhatsApp
  whatsapp: '#25d366',
};

export const Typography = {
  // Bengali font stack
  bengali: 'NotoSerifBengali',
  // Display sizes
  display: { fontSize: 28, fontWeight: '700', color: Colors.goldLight },
  h1: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  h2: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  h3: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400', color: Colors.textPrimary },
  small: { fontSize: 13, fontWeight: '400', color: Colors.textSecondary },
  tiny: { fontSize: 11, fontWeight: '400', color: Colors.textMuted },
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 999,
};

export const Shadow = {
  gold: {
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
