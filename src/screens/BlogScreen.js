import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../theme/colors';

// blog-list.html ও individual blog/<slug>.html পোস্ট দুটোই লাইভ ওয়েবসাইট থেকে
// লোড করা হচ্ছে (bundle না করে) — ব্লগ তালিকায় নতুন পোস্ট নিয়মিত যোগ হয়, এবং
// প্রতিটা পোস্টের নিজস্ব chrome (header/sidebar/footer) থাকায় in-page navigation
// (তালিকা → পোস্ট → "আরও পড়ুন") স্বাভাবিকভাবেই একই WebView-এর মধ্যে ঘটে; app CSS
// প্রতিটা নতুন পেজ-লোডেই re-inject হয় (LocalWebView-এর onLoadEnd দেখুন)।
const APP_CSS = `
/* ── ব্লগ তালিকা পেজের chrome (blog-list.html-এর নিজস্ব ইনলাইন স্টাইল) ── */
header,#sidebar,#overlay,#srch-bar,#btt,.hero-outer,footer{display:none!important;}
:root{--hdr-h:0px!important;}
.cat-nav-outer{top:0!important;}
/* ── আলাদা পোস্ট পেজের chrome (blog/blog.css) ── */
.site-header,.nav,.nav-overlay,.site-footer,.wa-float{display:none!important;}
.breadcrumb{display:none!important;}
/* ── পোস্টের নিচে থাকা promo/cross-link ব্লক — মূল লেখা ও "আরও পড়ুন" ছাড়া বাকিটা হাইড ── */
.pjk-strip,.cta-box,.author-bio,.svc-interlink,.related,.sidebar-widget{display:none!important;}
/* ── Page base ── */
html{height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none!important;max-width:100vw!important;}
body{height:auto!important;min-height:100vh!important;padding:0!important;padding-top:0!important;margin:0!important;overflow-x:hidden!important;background:#FAF8F3!important;}
main,#main-content{padding:10px 12px 24px!important;margin:0!important;max-width:100%!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
*{-webkit-tap-highlight-color:transparent!important;box-sizing:border-box!important;}
`;

function buildInjectedJS(css) {
  return `(function(){
  var st=document.getElementById('__blogNative__');
  if(!st){st=document.createElement('style');st.id='__blogNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};
})();true;`;
}

const INJECTED_JS = buildInjectedJS(APP_CSS);

export function BlogScreen({ route }) {
  const slug = route?.params?.slug;
  const url = slug
    ? `https://myastrology.in/blog/${slug}.html`
    : 'https://myastrology.in/blog-list.html';
  return (
    <View style={s.root}>
      <AppHeader />
      <LocalWebView name="blog-list" remoteUrl={url} style={s.wv} injectedJS={INJECTED_JS} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
