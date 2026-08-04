import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import html from '../web-html/numerology';
import { colors } from '../theme/colors';

const APP_CSS = `
/* ওয়েবসাইটের হেডার/মেনু/ভাসমান বোতাম — অ্যাপের নিজের হেডার আছে */
header.site-header,nav.nav,#nm,#no,.nav-ov,#navOverlay,.nav-overlay{display:none!important;}
.wa-float,#btt,.bc{display:none!important;}

/* "আমাদের পরিষেবা" পটি — হস্তরেখা/বাস্তু/রত্ন ইত্যাদি ওয়েবসাইটের পাতায়
   নিয়ে যায়, অ্যাপে ওগুলো আলাদা স্ক্রিন নয়; খোলা রাখলে ভাঙা লিঙ্ক */
.svc-scroll-sect{display:none!important;}

/* প্রচারমূলক ও SEO অংশ — অ্যাপে ক্যালকুলেটরটাই মুখ্য, লম্বা পাঠ্য নয় */
.daily-box,.stats,.catsw,.num-seo{display:none!important;}
section.how,section.numsw,section.planw,section.seow,section.faq,section.ctaw{display:none!important;}
footer,.site-footer,.fb{display:none!important;}

/* পাতার গোড়া — WebView-এ স্ক্রলবার ও ছোঁয়ার ঝিলিক বেমানান */
html{height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none!important;max-width:100vw!important;}
body{height:auto!important;min-height:100vh!important;padding:0!important;margin:0!important;overflow-x:hidden!important;}
#main,main{padding:0 0 20px!important;margin:0!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
*{-webkit-tap-highlight-color:transparent!important;}

/* হিরোর কার্ডটা অ্যাপে পর্দার কিনারা ঘেঁষে — দু'পাশে বাড়তি ফাঁক লাগে না */
.nhero{margin-top:0!important;}
.nc{border-radius:0!important;border-left:none!important;border-right:none!important;}

`;

function buildInjectedJS(css) {
  return `(function(){
  var st=document.getElementById('__nuNative__');
  if(!st){st=document.createElement('style');st.id='__nuNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};
  /* The disclaimer note ("দ্রষ্টব্য: জ্যোতিষশাস্ত্র একটি ঐতিহ্যবাহী...") has no
     class/id to target with CSS — it's the plain <div> right before .num-seo. */
  (function(){
    var seo=document.querySelector('.num-seo');
    var prev=seo&&seo.previousElementSibling;
    if(prev&&!prev.className)prev.style.cssText='display:none!important';
  })();
  setTimeout(function(){
    var nuHero=document.querySelector('.nhero');
    var nuRes=document.getElementById('results');
    if(nuHero&&nuRes){
      var nuSync=function(){
        var hasContent=nuRes.children.length>0;
        nuHero.style.cssText=hasContent?'display:none!important':'';
      };
      nuSync();
      new MutationObserver(nuSync).observe(nuRes,{childList:true,attributes:true,attributeFilter:['style']});
    }
  },500);
})();true;`;
}

const INJECTED_JS = buildInjectedJS(APP_CSS);

export function NumerologyScreen() {
  return (
    <View style={s.root}>
      <AppHeader />
      <LocalWebView name="numerology" html={html} style={s.wv} injectedJS={INJECTED_JS} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
