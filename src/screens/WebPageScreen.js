import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../theme/colors';

/* ═══════════════════════════════════════════════════════════════
   যে পাতার নিজস্ব পর্দা নেই — তার জন্য নিরাপত্তা-জাল

   App Links চালু হওয়ার পর myastrology.in-এর *প্রতিটা* লিংক অ্যাপে আসে।
   কিন্তু ওয়েবসাইটে ৫০০-র বেশি পাতা, আর অ্যাপে পর্দা মোটে দুই ডজন —
   উৎসবের ৯৬টা পাতা, দৈনিক/সাপ্তাহিক রাশিফলের তারিখ-ভিত্তিক পাতা,
   শহরভিত্তিক পাতা, কোনোটারই নিজস্ব পর্দা নেই। এদের জন্য কিছু না রাখলে
   React Navigation ঠিকানাটা মেলাতে না পেরে ব্যবহারকারীকে হোম স্ক্রিনে
   ফেলে দিত — অর্থাৎ লিংকে চাপ দিয়ে ভুল জায়গায় পৌঁছানো, যা ব্রাউজারে
   খোলার চেয়েও খারাপ।

   এখানে সেই পাতাটাই অ্যাপের ভিতরে দেখানো হয়। ফল: deep link কখনো ভুল
   জায়গায় নিয়ে যায় না — সবচেয়ে খারাপ ক্ষেত্রেও ব্যবহারকারী ঠিক যে
   পাতাটা চেয়েছিলেন সেটাই পান।

   🔒 ঠিকানা তৈরি হয় শুধু *পথ* থেকে, origin সবসময় নিজেদের সাইট।
   myastrology:// স্কিমটা যেকোনো ওয়েবসাইট ট্রিগার করতে পারে, তাই
   প্যারামিটার থেকে গোটা URL নিলে কেউ ক্ষতিকর পাতা অ্যাপের ভিতরে
   খুলিয়ে দিতে পারত।
   ═══════════════════════════════════════════════════════════════ */
const ORIGIN = 'https://myastrology.in';

const APP_CSS = `
.site-header,.nav,.nav-overlay,.sidenav,.sidenav-overlay,.fs-overlay,
.breadcrumb,.site-footer,footer,.wa-float,#scroll-bar,#btt,
.author-byline-bar,.share-prompt-card{display:none!important;}
:root{--nav-h:0px!important;--hdr-h:0px!important;}
html{height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none!important;max-width:100vw!important;}
body{height:auto!important;min-height:100vh!important;padding:0!important;margin:0!important;overflow-x:hidden!important;background:#FAF8F3!important;}
main,#main-content{padding:10px 12px 24px!important;margin:0!important;max-width:100%!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
*{-webkit-tap-highlight-color:transparent!important;box-sizing:border-box!important;}
`;

const INJECTED_JS = `(function(){
  var st=document.getElementById('__pageNative__');
  if(!st){st=document.createElement('style');st.id='__pageNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(APP_CSS)};
})();true;`;

/* পথটা পরিষ্কার করা — শুরুর স্ল্যাশ, প্রোটোকল-সদৃশ কিছু, বা উপরে ওঠার
   চেষ্টা (..) বাদ। ফাঁকা হলে হোমপেজ। */
function safePath(raw) {
  const p = String(raw || '').trim();
  // পরীক্ষাগুলো স্ল্যাশ ছাঁটার *আগে* — নইলে "//evil.example/x" ছেঁটে
  // "evil.example/x" হয়ে যেত আর '//' পরীক্ষাটা কখনো ধরতই না।
  if (!p || /^[a-z][a-z0-9+.-]*:/i.test(p) || p.startsWith('//') || p.includes('..')) return '';
  return p.replace(/^\/+/, '');
}

export function WebPageScreen({ route }) {
  const path = safePath(route?.params?.path);
  const url = ORIGIN + '/' + path;
  return (
    <View style={s.root}>
      <AppHeader />
      <LocalWebView key={url} name="webpage" remoteUrl={url} style={s.wv} injectedJS={INJECTED_JS} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
