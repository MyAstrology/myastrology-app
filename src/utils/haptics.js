import * as Haptics from 'expo-haptics';

// পাতলা wrapper — প্রতিটা কল-সাইটে try/catch ও Haptics-এর নিজস্ব enum মনে
// রাখতে না হয়। haptics API কিছু ডিভাইসে/ওয়েব প্রিভিউতে না থাকতে পারে, তাই
// প্রতিটা ফাংশন silently fail করে, কখনো ক্র্যাশ করে না।
export const haptics = {
  tap()     { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {} },
  success() { try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {} },
  error()   { try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch (_) {} },
};
