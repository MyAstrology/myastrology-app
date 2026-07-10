import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../theme/colors';

// learning/index.html লাইভ থেকে লোড হচ্ছে (bundle না করে) — Gemstone/Vastu/
// Palmistry/VedicAstrology স্ক্রিনের মতোই, কারণ এটাও শুধু ব্রাউজ করার মতো একটা
// কনটেন্ট পেজ (কোনো ফর্ম-নির্ভর হিসাব নেই), লাইভ রাখলে সাইটের নতুন বিষয়/লিংক
// যোগ হলে অ্যাপ রিবিল্ড ছাড়াই আপডেট থাকবে।
const APP_CSS = `
header,footer{display:none!important;}
#main-nav,#_nav,.nav,#navMenu,#navOverlay,.menu,.wa-float,#btt{display:none!important;}
html{height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none!important;max-width:100vw!important;}
body{height:auto!important;min-height:100vh!important;padding-top:0!important;margin:0!important;overflow-x:hidden!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
*{-webkit-tap-highlight-color:transparent!important;box-sizing:border-box!important;}
`;

function buildInjectedJS(css) {
  return `(function(){
  var st=document.getElementById('__learningNative__');
  if(!st){st=document.createElement('style');st.id='__learningNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};
})();true;`;
}

const INJECTED_JS = buildInjectedJS(APP_CSS);

export function LearningScreen() {
  return (
    <View style={s.root}>
      <AppHeader />
      <LocalWebView name="learning" remoteUrl="https://myastrology.in/learning" style={s.wv} injectedJS={INJECTED_JS} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
