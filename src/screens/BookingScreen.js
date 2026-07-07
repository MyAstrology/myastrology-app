import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../theme/colors';

// booking.html লাইভ থেকে লোড হচ্ছে (bundle না করে) — দাম/সেবার তালিকা পরিবর্তন
// হতে পারে, এবং এর real Razorpay checkout (openRzp → বুকিং মোডাল → নাম/ফোন →
// proceedToRazorpay → checkout.js dynamically load → rzp.open()) নেটওয়ার্ক ছাড়া
// আদৌ কাজ করে না — তাই এটা অন্য পেজের মতো "পেমেন্ট ব্লক করে টোস্ট" প্যাটার্নের
// বদলে সত্যিকারের পেমেন্ট চলতে দেওয়া হচ্ছে (match-making-এর real payment flow-এর
// মতো), যেহেতু পেজটা লাইভ লোড হওয়ায় checkout.js নিজে থেকেই ঠিকভাবে লোড হয়।
const APP_CSS = `
.nav,.fs-overlay,footer,#scroll-bar{display:none!important;}
:root{--nav-h:0px!important;}
html{height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none!important;max-width:100vw!important;}
body{height:auto!important;min-height:100vh!important;margin:0!important;overflow-x:hidden!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
*{-webkit-tap-highlight-color:transparent!important;box-sizing:border-box!important;}
`;

function buildInjectedJS(css) {
  return `(function(){
  var st=document.getElementById('__bookNative__');
  if(!st){st=document.createElement('style');st.id='__bookNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};
})();true;`;
}

const INJECTED_JS = buildInjectedJS(APP_CSS);

export function BookingScreen() {
  return (
    <View style={s.root}>
      <AppHeader />
      <LocalWebView name="booking" remoteUrl="https://myastrology.in/booking.html" style={s.wv} injectedJS={INJECTED_JS} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
