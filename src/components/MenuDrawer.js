import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '../i18n/Text';
import { useLanguage } from '../context/LanguageContext';
import { MENU_ITEMS, MenuIcon } from '../navigation/menuItems';
import { colors } from '../theme/colors';

/* হ্যামবার্গার মেনুর ড্রয়ার — একটাই কপি।
   ⛔ ২০২৬-০৯-০৮ পর্যন্ত এই ব্লকটা AppHeader.js ও PanchangScreen.js
   দু'জায়গায় হুবহু লেখা ছিল। ০৯-০৭-এ ScrollView বসানো হয় শুধু
   AppHeader-এ, তাই পঞ্জিকা পর্দার মেনু তখনো "জ্যাম" — নিচের সারিগুলো
   কাটা যেত আর টেনে তোলা যেত না। এই রিপোর সবচেয়ে বেশিবার নথিভুক্ত
   রোগ: দ্বিতীয় কপি একদিন সরে যায়। */
export function MenuDrawer({ visible, onClose, navigation, insetTop = 0 }) {
  const { lang, t } = useLanguage();
  if (!visible) return null;
  return (
    <View style={s.drawerOverlay}>
      {/* পর্দাজোড়া অদৃশ্য ব্যাকড্রপ — লেবেল ছাড়া স্ক্রিন-রিডার এটাকে
          নামহীন একটা বোতাম হিসেবে পড়ত। */}
      <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1}
        accessibilityRole="button" accessibilityLabel={t('মেনু বন্ধ করুন')} />
      <View style={[s.drawer, { paddingTop: insetTop + 8 }]}>
        <View style={s.drawerHeader}>
          <Text style={s.drawerTitle} noTranslate>MENU</Text>
          <TouchableOpacity onPress={onClose}
            accessibilityRole="button" accessibilityLabel={t('মেনু বন্ধ করুন')}>
            <MaterialCommunityIcons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={s.drawerDivider} />
        {/* ⛔ ২২টি সারি — সাধারণ <View>-এ থাকলে পর্দার নিচের সারিগুলো কেটে
            যায় আর টেনে উপরে তোলা যায় না। nestedScrollEnabled কারণ কিছু
            পর্দা নিজেই ScrollView-এর ভিতরে বসে। */}
        <ScrollView
          style={s.drawerScroll}
          contentContainerStyle={s.drawerScrollBody}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.tab}
              style={s.menuItem}
              onPress={() => { onClose(); navigation.navigate(item.tab); }}
              activeOpacity={0.7}
            >
              <MenuIcon tab={item.tab} icon={item.icon} size={20} color={colors.primary} />
              <Text style={s.menuLabel}>{item.label}</Text>
              {/* ⚠️ যে পাতাগুলোর ইংরেজি/হিন্দি সংস্করণ নেই সেগুলো মেনু থেকে
                  তুলে দেওয়া হয়নি — তুললে ওই পাঠক জিনিসটার অস্তিত্বই জানতেন
                  না। বদলে চাপার **আগেই** বলা হয়, পরে নয়। লেবেলটা ভাষার নাম,
                  তাই অনূদিত হয় না — নইলে ইংরেজি পাঠক "Bengali" দেখতেন আর
                  সেটা আর চিনতেন না। */}
              {item.bnOnly && lang !== 'bn' && (
                <Text style={s.bnChip} noTranslate>বাংলা</Text>
              )}
              <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  drawerOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row-reverse', zIndex: 100 },
  drawer: {
    width: '75%', height: '100%', backgroundColor: colors.card,
    paddingHorizontal: 18, paddingBottom: 32,
    borderLeftWidth: 1, borderLeftColor: colors.cardBorder,
    elevation: 16, shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.12, shadowRadius: 12,
  },
  /* flex:1 — না দিলে ScrollView নিজের ভিতরের উচ্চতাতেই বেড়ে যেত আর আবার
     কেটে যেত; বাকি জায়গাটা নিলে তবেই ভিতরে স্ক্রোল হয়। */
  drawerScroll:     { flex: 1 },
  /* নিচে একটু ফাঁকা — শেষ সারিটা bottom-tab বারের নিচে চাপা পড়ে যেত */
  drawerScrollBody: { paddingBottom: 24 },
  drawerHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  drawerTitle:   { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  drawerDivider: { height: 1, backgroundColor: colors.cardBorder, marginBottom: 14 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  menuLabel: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600',
               fontFamily: 'NotoSerifBengali-Regular' },
  bnChip: { fontSize: 10, color: colors.textSecondary, fontWeight: '700',
            borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 8,
            paddingHorizontal: 6, paddingVertical: 1,
            fontFamily: 'NotoSerifBengali-Regular' },
});
