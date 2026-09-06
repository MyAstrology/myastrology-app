/*  প্রথম চালুর ভাষা-পর্দা — ঠিক একবার।
 *
 *  কেন দরকার: আগে অ্যাপ সবসময় বাংলায় খুলত, আর হিন্দি/ইংরেজিভাষী পাঠককে
 *  নিজে থেকে সেটিংস খুঁজে বের করতে হতো — বাংলা লেখা পড়তে না পেরে।
 *  এটাই আন্তর্জাতিক অ্যাপের চেনা নিয়ম: প্রথমবার একবার জিজ্ঞেস করা।
 *
 *  ⚠️ ফোনের ভাষা কেবল **আগে থেকে বাছা** থাকে, নিজে থেকে বসে যায় না।
 *  বহু বাংলাভাষী পাঠকের ফোন ইংরেজিতে সেট করা — নীরবে বদলে দিলে তাঁরা
 *  হঠাৎ অন্য ভাষার অ্যাপ পেতেন, আর সেটা এই দুই রিপোর সবচেয়ে বেশিবার
 *  নথিভুক্ত ব্যর্থতা ("নীরবে ভুল ভাষা দেখানো")।
 *
 *  ⚠️ প্রতিটি বোতামে ভাষার নাম **সেই ভাষাতেই** — নইলে যিনি বাংলা পড়তে
 *  পারেন না, তিনি নিজের ভাষাটা চিনতেই পারতেন না। তাই এখানে কোনো লেখা
 *  অনুবাদ করা হয় না; তিন ভাষার লাইনই পাশাপাশি দেখানো হয়।
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../theme/colors';
import { radii } from '../theme/radii';
import { haptics } from '../utils/haptics';

const LOGO = require('../../assets/icon.png');

/* তিন ভাষায় একই কথা — অনুবাদ-সারণী ছাড়াই, কারণ পাঠক এখনো ভাষাই বাছেননি */
const LINES = [
  { code: 'bn', label: 'বাংলা',   title: 'ভাষা বেছে নিন',      sub: 'পরে সেটিংস থেকে বদলানো যাবে' },
  { code: 'hi', label: 'हिन्दी',  title: 'भाषा चुनें',          sub: 'बाद में सेटिंग्स से बदल सकते हैं' },
  { code: 'en', label: 'English', title: 'Choose your language', sub: 'You can change this later in Settings' },
];

export function LanguageGate() {
  const { lang, chosen, ready, setLang } = useLanguage();
  const [sel, setSel] = useState(lang);
  if (!ready || chosen) return null;

  const cur = LINES.find(l => l.code === sel) || LINES[0];

  return (
    <View style={s.root}>
      <View style={s.card}>
        <Image source={LOGO} style={s.logo} resizeMode="contain" />
        <Text style={s.brand}>MyAstrology</Text>

        {/* তিন ভাষার শিরোনামই দেখানো হয় — পাঠক যেটা পড়তে পারেন সেটাই পড়বেন */}
        {LINES.map(l => (
          <Text key={l.code} style={[s.title, l.code === sel && s.titleOn]}>{l.title}</Text>
        ))}

        <View style={s.row}>
          {LINES.map((l) => {
            const on = l.code === sel;
            return (
              <Pressable
                key={l.code}
                onPress={() => { haptics.tap(); setSel(l.code); }}
                style={[s.pill, on && s.pillOn]}
                accessibilityRole="button"
                accessibilityLabel={l.label}
                accessibilityState={{ selected: on }}
              >
                <Text style={[s.pillText, on && s.pillTextOn]}>{l.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => { haptics.tap(); setLang(sel); }}
          style={s.go}
          accessibilityRole="button"
          accessibilityLabel={cur.code === 'en' ? 'Continue' : cur.code === 'hi' ? 'आगे बढ़ें' : 'এগিয়ে যান'}
        >
          <Text style={s.goText}>
            {sel === 'en' ? 'Continue' : sel === 'hi' ? 'आगे बढ़ें' : 'এগিয়ে যান'}
          </Text>
        </Pressable>

        <Text style={s.note}>{cur.sub}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 22, zIndex: 60,
  },
  card:  { width: '100%', maxWidth: 420, alignItems: 'center' },
  logo:  { width: 68, height: 68, borderRadius: 16, marginBottom: 10 },
  brand: { fontSize: 20, fontWeight: '800', color: colors.gold, letterSpacing: 0.5, marginBottom: 18 },
  title:   { fontSize: 15, color: colors.textSecondary, lineHeight: 24, textAlign: 'center' },
  titleOn: { color: colors.text, fontWeight: '700' },
  row:   { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 22, width: '100%' },
  pill:  {
    flex: 1, paddingVertical: 13, borderRadius: radii.pill, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.cardBorder,
  },
  pillOn:     { borderColor: colors.gold, backgroundColor: 'rgba(200,168,122,0.16)' },
  pillText:   { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  pillTextOn: { color: colors.gold, fontWeight: '800' },
  go: {
    width: '100%', paddingVertical: 14, borderRadius: radii.pill,
    backgroundColor: colors.gold, alignItems: 'center',
  },
  goText: { fontSize: 15, fontWeight: '800', color: '#2a1206' },
  note:   { marginTop: 14, fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
});
