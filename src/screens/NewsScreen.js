import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../theme/colors';

// news/index.html ও individual news/<slug>.html পোস্ট দুটোই BlogScreen.js-এর
// মতোই লাইভ ওয়েবসাইট থেকে লোড করা হচ্ছে (bundle না করে) — নতুন মহাজাগতিক সংবাদ
// (গ্রহণ/গ্রহ-বক্রী) পোস্ট নিয়মিত অটো-জেনারেট হয়ে যোগ হয়, app rebuild ছাড়াই
// এখানে দেখা যাবে। এই পেজগুলো ব্লগের chrome (blog.html/blog-list.html-এর
// header/.hero-outer/.cat-nav-outer) না, বরং রাশিফল টেমপ্লেটের chrome
// (header.site-header/nav.sidenav/footer.site-footer) পুনর্ব্যবহার করে —
// তাই আলাদা CSS দরকার। .hero-banner ইচ্ছাকৃতভাবে হাইড করা হয়নি — এটা
// পেজের/পোস্টের আসল শিরোনাম, blog-list.html-এর প্রোমো হিরোর মতো decorative না।
const APP_CSS = `
/* ── রাশিফল টেমপ্লেটের chrome (header/sidenav/footer/hamburger/btt) ── */
header.site-header,.sidenav,.sidenav-overlay,footer.site-footer,.wa-float,#btt{display:none!important;}
:root{--hdr-h:0px!important;}
/* ── পোস্টের কনসালটেশন CTA ব্লক — অ্যাপের নিজস্ব বুকিং ফ্লো থাকায় ডুপ্লিকেট এড়াতে হাইড ── */
.cta-box{display:none!important;}
/* ── Page base ── */
html{height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none!important;max-width:100vw!important;}
body{height:auto!important;min-height:100vh!important;padding:0!important;padding-top:0!important;margin:0!important;overflow-x:hidden!important;background:#FAF8F3!important;}
main,#main-content{padding:10px 12px 24px!important;margin:0!important;max-width:100%!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
*{-webkit-tap-highlight-color:transparent!important;box-sizing:border-box!important;}
`;

function buildInjectedJS(css) {
  return `(function(){
  var st=document.getElementById('__newsNative__');
  if(!st){st=document.createElement('style');st.id='__newsNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};
})();true;`;
}

const INJECTED_JS = buildInjectedJS(APP_CSS);

export function NewsScreen({ route }) {
  const slug = route?.params?.slug;
  const url = slug
    ? `https://myastrology.in/news/${slug}.html`
    : 'https://myastrology.in/news/';
  return (
    <View style={s.root}>
      <AppHeader />
      <LocalWebView name="news-list" remoteUrl={url} style={s.wv} injectedJS={INJECTED_JS} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
