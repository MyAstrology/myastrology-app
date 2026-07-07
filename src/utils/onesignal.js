import AsyncStorage from '@react-native-async-storage/async-storage';

// Same OneSignal app as the website (js/push-init.js at the repo root) — the
// existing daily GitHub Actions cron jobs (notify-panjika.yml etc.) already
// broadcast to `included_segments: ['All']` under this app id, so a mobile
// subscriber here starts receiving them with zero new server-side code.
const ONESIGNAL_APP_ID = '8e9deb3f-3a79-4bfd-bc24-8ec30f055c6c';
const PREF_KEY = '@myastrology_notif_pref_v1';

// react-native-onesignal is a native module — absent under Expo Go until the
// user builds a custom dev client. Guard every access so the app keeps
// working (notifications silently unavailable) instead of crashing on load.
let OneSignal = null;
try {
  OneSignal = require('react-native-onesignal').OneSignal;
} catch (_) {
  OneSignal = null;
}

let initialized = false;

function applyPreference(enabled) {
  if (!OneSignal) return;
  try {
    if (enabled) {
      OneSignal.Notifications.requestPermission(true);
      OneSignal.User.pushSubscription.optIn();
    } else {
      OneSignal.User.pushSubscription.optOut();
    }
  } catch (_) {}
}

// Call once from App.js after mount.
export function initOneSignal() {
  if (!OneSignal || initialized) return;
  try {
    OneSignal.initialize(ONESIGNAL_APP_ID);
    initialized = true;
    getNotificationPreference().then(applyPreference).catch(() => {});
  } catch (_) {}
}

export async function getNotificationPreference() {
  try {
    const v = await AsyncStorage.getItem(PREF_KEY);
    return v === '1';
  } catch (_) {
    return false;
  }
}

export async function setNotificationsEnabled(enabled) {
  await AsyncStorage.setItem(PREF_KEY, enabled ? '1' : '0');
  applyPreference(enabled);
}
