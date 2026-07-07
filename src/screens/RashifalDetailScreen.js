import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import { RASHI_SIGNS, rashifalUrl } from '../data/rashifalSigns';
import { colors } from '../theme/colors';

// rashifal/<slug>.html ও rashifal/saptahik/<slug>.html সাইটের বট প্রতিদিন
// নতুন করে জেনারেট করে (তারিখ/সপ্তাহ-ভিত্তিক কনটেন্ট) — তাই এটিকে বান্ডল করা
// অফলাইন কপির বদলে সরাসরি লাইভ ইউআরএল থেকে লোড করা হচ্ছে, যাতে সবসময় আজকের
// আসল কনটেন্ট দেখা যায় এবং সাইটের নিজস্ব CSS/ছবিও (absolute https:// path)
// এমনিতেই ঠিকভাবে লোড হয়।
const APP_CSS = `
.site-header,.sidenav,.sidenav-overlay,.breadcrumb,.rp-nav-wrap,
.author-byline-bar,.site-footer,.share-prompt-card,.ctx-services,
.trust,.rp-blog-link,.sw-link-row{display:none!important;}
html{height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none!important;max-width:100vw!important;}
body{height:auto!important;min-height:100vh!important;padding:0!important;margin:0!important;overflow-x:hidden!important;background:#FAF8F3!important;}
main,#main-content{padding:10px 12px 24px!important;margin:0!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
*{-webkit-tap-highlight-color:transparent!important;box-sizing:border-box!important;}
`;

function buildInjectedJS(css) {
  return `(function(){
  var st=document.getElementById('__rfNative__');
  if(!st){st=document.createElement('style');st.id='__rfNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};
})();true;`;
}

const INJECTED_JS = buildInjectedJS(APP_CSS);

export function RashifalDetailScreen() {
  const route = useRoute();
  const initialIndex = route.params?.rashiIndex ?? 0;
  const [rashiIndex] = useState(initialIndex);
  const [mode, setMode] = useState('daily');

  const sign = RASHI_SIGNS[rashiIndex];
  const url = rashifalUrl(rashiIndex, mode);

  return (
    <View style={s.root}>
      <AppHeader />
      <View style={s.modeRow}>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'daily' && s.modeBtnOn]}
          onPress={() => setMode('daily')}
          activeOpacity={0.8}
        >
          <Text style={[s.modeBtnText, mode === 'daily' && s.modeBtnTextOn]}>আজকের রাশিফল</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'weekly' && s.modeBtnOn]}
          onPress={() => setMode('weekly')}
          activeOpacity={0.8}
        >
          <Text style={[s.modeBtnText, mode === 'weekly' && s.modeBtnTextOn]}>সাপ্তাহিক রাশিফল</Text>
        </TouchableOpacity>
      </View>
      <LocalWebView
        key={mode}
        name={`rashifal-${mode}-${sign.dailySlug}`}
        remoteUrl={url}
        style={s.wv}
        injectedJS={INJECTED_JS}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
  modeRow: {
    flexDirection: 'row', gap: 5, margin: 12, marginBottom: 0,
    backgroundColor: '#f5efe0', padding: 4, borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(201,146,42,.2)',
  },
  modeBtn: {
    flex: 1, paddingVertical: 9, paddingHorizontal: 10,
    borderRadius: 50, alignItems: 'center', justifyContent: 'center',
  },
  modeBtnOn: {
    backgroundColor: colors.primary,
  },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  modeBtnTextOn: { color: '#fff' },
});
