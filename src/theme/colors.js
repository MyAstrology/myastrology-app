export const colors = {
  background:   '#FAF8F3',   // warm ivory
  card:         '#FFFFFF',
  cardBorder:   '#E2CFA0',   // warm gold border
  primary:      '#B8960C',   // deep gold
  primaryLight: '#D4AF37',   // medium gold
  headerBg:     '#FAF8F3',   // light cream header (unified with background)
  headerBorder: '#E2CFA0',   // thin gold divider
  text:         '#1E1408',   // very dark warm brown
  textSecondary:'#7B6B4E',   // warm taupe
  divider:      '#EDE0C4',   // soft gold-tinted divider
  gold:         '#C9A84C',   // accent gold
  goldLight:    '#8C6A00',   // dark gold for light-bg text
  tabBg:        '#FFFFFF',   // pure white tab bar
  white:        '#FFFFFF',
  goldBorder:   'rgba(201,168,76,0.65)', // logo/avatar ring — replaces the colors.gold+'AA' string-concat hack
  goldWash:     'rgba(201,168,76,0.10)', // subtle gradient/tint wash on hero cards
  overlay:      'rgba(0,0,0,0.35)',      // drawer/modal backdrop

  // অর্থপূর্ণ (semantic) রঙ — "শুভ" ও "অশুভ/সতর্কতা"। এগুলো আগে
  // HomeScreen, RashifalScreen, SettingsScreen, AdminScreen-এ আলাদা আলাদা
  // করে হার্ডকোড করা ছিল (একই মান, চার জায়গায়) — একটা বদলাতে হলে সবগুলো
  // খুঁজে বের করতে হতো, আর একটা বাদ পড়লেই রঙ বেমানান হয়ে যেত।
  good:         '#2E7D32',               // শুভ — গাঢ় সবুজ (লেখা/আইকন)
  goodWash:     '#E8F5E9',               // শুভ — হালকা সবুজ (ব্যাকগ্রাউন্ড)
  goodBorder:   '#8FCB93',
  danger:       '#B71C1C',               // অশুভ/সতর্কতা — গাঢ় লাল
  dangerWash:   '#FCE4EC',               // অশুভ — হালকা গোলাপি (ব্যাকগ্রাউন্ড)
  dangerBorder: '#EF9AB5',
  shadow:       '#000',                  // ছায়ার রঙ (elevation)
};
