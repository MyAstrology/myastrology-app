import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import html from '../web-html/match-making';
import PRINT_HTML from '../web-html/match-making-print';
import { colors } from '../theme/colors';

// Injects the print data directly into the HTML so it doesn't need localStorage.
function buildPrintHtml(rawJson) {
  let out = PRINT_HTML;
  const safe = JSON.stringify(rawJson).replace(/</g, '\\u003c');
  out = out.replace('<head>', () => `<head><script>window.__mmRaw=${safe};<\/script>`);
  out = out.replace(
    "try{raw=localStorage.getItem('match_print_data');}catch(e){}",
    () => `try{raw=window.__mmRaw||null;}catch(e){}`
  );
  return out;
}

const MM_CSS = `
/* ── Hide website chrome ── */
header.site-header,nav.nav,#navMenu,#navOverlay,.nav-overlay{display:none!important;}
.fab-wrap,.fab-bubble,#fabWrap,.wa-float,#btt{display:none!important;}
/* ── Hide hero/description ── */
#mmFormHeader,#mmFormSub{display:none!important;}
.mm-quicklinks,.mm-alt-actions,.mm-alt-links{display:none!important;}
.mm-quicklink-btn{display:none!important;}
/* ── Hide premium/special tabs ── */
.mm-tab-premium,.mm-tab-special{display:none!important;}
/* ── Hide author byline & SEO sections (below results) ── */
.author-byline{display:none!important;}
#seoSection,#faqSection,#testimonialSection{display:none!important;}
footer,.site-footer{display:none!important;}
/* ── Page base ── */
html{height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none!important;max-width:100vw!important;}
body{height:auto!important;min-height:100vh!important;background:#FAF8F3!important;padding:0!important;margin:0!important;overflow-x:hidden!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
*{-webkit-tap-highlight-color:transparent!important;box-sizing:border-box!important;}
/* ── Tab bar ── */
.mm-tabbar{
  position:sticky!important;top:0!important;z-index:100!important;
  background:#0a192f!important;border-bottom:2px solid #b8860b!important;
  display:flex!important;gap:5px!important;flex-wrap:nowrap!important;
  overflow-x:auto!important;padding:8px 8px!important;
  scrollbar-width:none!important;box-shadow:0 2px 8px rgba(0,0,0,.25)!important;
}
.mm-tabbar::-webkit-scrollbar{display:none!important;}
.mm-tab-btn{
  background:rgba(255,255,255,0.1)!important;
  color:rgba(255,255,255,0.75)!important;
  border:1px solid rgba(255,255,255,0.18)!important;
  padding:6px 11px!important;border-radius:16px!important;
  font-size:0.71rem!important;font-weight:600!important;
  white-space:nowrap!important;cursor:pointer!important;
  flex-shrink:0!important;font-family:inherit!important;
  outline:none!important;-webkit-appearance:none!important;
}
.mm-tab-btn.active,.mm-tab-btn[aria-selected="true"]{
  background:rgba(255,255,255,0.92)!important;
  color:#0a192f!important;border-color:transparent!important;
}
/* ── Outer container ── */
.k-wrap{padding:8px 12px 20px!important;}
/* ── Dual-panel: stack vertically on mobile ── */
.dual-panel{
  display:flex!important;flex-direction:column!important;
  gap:10px!important;width:100%!important;
}
/* ── Each panel becomes a card ── */
.panel{
  background:#fff!important;border-radius:14px!important;
  border:1.5px solid #e0cdbc!important;padding:12px!important;
  box-shadow:0 2px 8px rgba(0,0,0,.06)!important;width:100%!important;
}
/* ── Panel headings ── */
.panel h2,.panel h3,.panel-hdr,.boy-panel>h2,.girl-panel>h2{
  font-size:.9rem!important;font-weight:700!important;
  color:#3a2218!important;margin:0 0 10px!important;
  padding-bottom:6px!important;border-bottom:1.5px solid #ede0ce!important;
}
/* ── Labels ── */
label{font-size:.8rem!important;font-weight:600!important;color:#5c3d2e!important;display:block!important;margin-bottom:3px!important;}
/* ── Selects ── */
.sel-ctrl,select{
  width:100%!important;padding:7px 8px!important;
  border:1.5px solid #e0cdbc!important;border-radius:8px!important;
  background:#fefcf9!important;font-size:.85rem!important;
  color:#3a2218!important;font-family:inherit!important;
}
/* ── Text inputs ── */
input[type=text],input[type=number]{
  width:100%!important;padding:7px 8px!important;
  border:1.5px solid #e0cdbc!important;border-radius:8px!important;
  background:#fefcf9!important;font-size:.88rem!important;
  color:#3a2218!important;font-family:inherit!important;
}
/* ── Date/time grids ── */
.mm-dt-grid-date,.mm-dt-grid-time{display:flex!important;gap:5px!important;}
.mm-dt-grid-date .sel-ctrl,.mm-dt-grid-time .sel-ctrl{flex:1!important;}
/* ── Coords grid — lat & lon side by side ── */
.coords{display:flex!important;flex-direction:row!important;gap:8px!important;}
.coords>div{flex:1!important;display:flex!important;flex-direction:column!important;gap:2px!important;}
/* ── GPS button ── */
.mm-gps-btn{
  background:#7a2e2e!important;border:none!important;border-radius:8px!important;
  padding:7px 9px!important;cursor:pointer!important;flex-shrink:0!important;
  min-width:38px!important;min-height:38px!important;
  display:flex!important;align-items:center!important;justify-content:center!important;
}
.mm-gps-btn svg,.mm-gps-btn polygon{stroke:#fff!important;}
/* ── City wrap ── */
.city-wrap{position:relative!important;}
.city-wrap>div{display:flex!important;gap:5px!important;align-items:center!important;}
.city-wrap input[type=text]{flex:1!important;}
.city-suggestions{
  position:absolute!important;z-index:999!important;background:#fff!important;
  border:1.5px solid #e0cdbc!important;border-radius:10px!important;
  list-style:none!important;margin:2px 0 0!important;padding:0!important;
  width:100%!important;box-shadow:0 4px 14px rgba(0,0,0,.12)!important;
  max-height:200px!important;overflow-y:auto!important;
}
.city-suggestions li{padding:9px 12px!important;cursor:pointer!important;border-bottom:1px solid #f0e8d8!important;font-size:.85rem!important;color:#3a2218!important;}
/* ── GPS message ── */
.mm-gps-msg{font-size:.75rem!important;color:#5c3d2e!important;display:block!important;min-height:1.1em!important;}
/* ── Calculate button ── */
.calc-btn{
  width:100%!important;padding:12px 20px!important;background:#7a2e2e!important;
  color:#fff!important;border:none!important;border-radius:12px!important;
  font-size:.95rem!important;font-weight:700!important;font-family:inherit!important;
  cursor:pointer!important;margin-top:10px!important;display:block!important;
}
/* ── Results area — hidden until calculate ── */
#resultsArea{display:none;padding:8px 0!important;}
/* ── Tab panels — only active panel visible ── */
.mm-tab-panel{display:none!important;}
.mm-tab-panel.active{display:block!important;}
.score-hero{background:#fff!important;border-radius:14px!important;border:1.5px solid #e0cdbc!important;padding:14px!important;margin-bottom:10px!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important;}
.mm-shloka-box{margin-bottom:10px!important;}
.card{background:#fff!important;border-radius:14px!important;border:1.5px solid #e0cdbc!important;padding:12px!important;margin-bottom:10px!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important;}
.section-title{font-size:.9rem!important;font-weight:700!important;color:#3a2218!important;margin:0 0 10px!important;padding-bottom:6px!important;border-bottom:1.5px solid #ede0ce!important;}
/* ── জন্মতথ্য comparison card (mm-pc) ── */
.mm-pc{background:#fff!important;border-radius:14px!important;border:1.5px solid #e0cdbc!important;padding:12px!important;margin-bottom:10px!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important;}
.mm-pc-title{font-size:.9rem!important;font-weight:700!important;color:#3a2218!important;margin:0 0 10px!important;padding-bottom:6px!important;border-bottom:1.5px solid #ede0ce!important;}
.mm-pc table{display:table!important;width:100%!important;border-collapse:collapse!important;font-size:.82rem!important;}
.mm-pc th{background:#f5ede0!important;color:#7a2e2e!important;font-size:.78rem!important;font-weight:700!important;text-align:left!important;padding:7px 8px!important;}
.mm-pc td{display:table-cell!important;padding:6px 8px!important;border-bottom:1px solid #f0e4d4!important;color:#2c1a0e!important;vertical-align:middle!important;}
.mm-pc tr:nth-child(even) td{background:#fdf8f3!important;}
.mm-pc-hl-amber td{color:#b8860b!important;font-weight:600!important;}
.mm-pc-hl-green td{color:#1a7a2e!important;font-weight:600!important;}
.mm-pc-hl-blue td{color:#1565c0!important;font-weight:600!important;}
/* ── Tables ── */
table{display:table!important;width:100%!important;border-collapse:collapse!important;font-size:.82rem!important;}
thead{display:table-header-group!important;}tbody{display:table-row-group!important;}
tr{display:table-row!important;}
th,td{display:table-cell!important;padding:6px 8px!important;vertical-align:middle!important;}
th{background:#7a2e2e!important;color:#fff!important;font-size:.76rem!important;text-align:left!important;font-weight:600!important;}
td{border-bottom:1px solid #f0e4d4!important;color:#2c1a0e!important;}
tr:nth-child(even) td{background:#fdf8f3!important;}
/* ── Charts ── */
.mm-charts-grid{display:flex!important;flex-direction:column!important;gap:16px!important;}
.chart-pair{display:flex!important;flex-direction:column!important;align-items:center!important;gap:10px!important;}
svg{max-width:100%!important;}
`;

function buildInjectedJS(css) {
  return `(function(){
  var st=document.getElementById('__mmNative__');
  if(!st){st=document.createElement('style');st.id='__mmNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};
  setTimeout(function(){
    if(typeof window._doMatchPrint==='function'){
      window.downloadMatchPDF=function(){window._doMatchPrint();};
    }
    /* Hide form/tabbar; show tab nav when results appear */
    var mmTabbar=document.getElementById('mmTabbar');
    var mmInput=document.getElementById('mmInputSection');
    var mmCalcBtn=document.querySelector('.calc-btn');
    var mmRes=document.getElementById('resultsArea');
    if(mmRes){
      var mmSync=function(){
        var v=mmRes.style.display==='block';
        if(mmTabbar)mmTabbar.style.cssText=v?'display:flex!important':'display:none!important';
        if(mmInput)mmInput.style.cssText=v?'display:none!important':'';
        if(mmCalcBtn)mmCalcBtn.style.cssText=v?'display:none!important':'';
      };
      mmSync();
      new MutationObserver(mmSync).observe(mmRes,{attributes:true,attributeFilter:['style']});
      var origSwitch=window._mmSwitchTab;
      if(typeof origSwitch==='function'){
        window._mmSwitchTab=function(tab){
          origSwitch.call(this,tab);
          if(tab==='form')mmRes.style.display='none';
        };
      }
    }
  },400);
})();true;`;
}

const INJECTED_JS = buildInjectedJS(MM_CSS);

export function MatchMakingScreen() {
  const [generating, setGenerating] = useState(false);

  const handlePrint = useCallback(async (rawJson) => {
    if (generating) return;
    if (!rawJson) {
      Alert.alert('ত্রুটি', 'PDF ডেটা পাওয়া যায়নি। আগে কুষ্ঠি মিলন গণনা করুন।');
      return;
    }
    setGenerating(true);
    try {
      const printHtml = buildPrintHtml(rawJson);
      const { uri } = await Print.printToFileAsync({
        html: printHtml,
        base64: false,
        width: 595,
        height: 842,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'কুষ্ঠি মিলন রিপোর্ট সংরক্ষণ করুন',
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (e) {
      Alert.alert('ত্রুটি', 'PDF তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setGenerating(false);
    }
  }, [generating]);

  return (
    <View style={s.root}>
      <AppHeader />
      <LocalWebView
        name="match-making"
        html={html}
        style={s.wv}
        onPrint={handlePrint}
        injectedJS={INJECTED_JS}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
