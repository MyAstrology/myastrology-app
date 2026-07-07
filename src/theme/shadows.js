import { colors } from './colors';

// একটাই ৩-ধাপের depth স্কেল — কার্ড/ড্রয়ারে ছড়িয়ে থাকা ভিন্ন ভিন্ন
// shadow/elevation সংখ্যার বদলে সব জায়গায় এই ৩টার একটা ব্যবহার করা উচিত।
export const shadows = {
  card: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  raised: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  drawer: {
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 16,
  },
};
