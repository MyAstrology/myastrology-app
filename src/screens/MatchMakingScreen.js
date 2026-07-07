import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
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
/* ── mm-shloka-box is print-only on the website (.mm-shloka-box{display:none}
   there; the print stylesheet is what makes it visible) — that rule is missing
   from the bundled copy, so it was showing as stray unstyled text on the live
   results screen between the score card and the birth-chart card. ── */
.mm-shloka-box{display:none!important;}
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
/* ── জন্মতথ্য / অষ্টকূট comparison card (mm-pc) — mirrors the website's own
   gold-bordered .mm-pc styling (was falling back to the generic tan card
   look, and forced !important colors were stomping the score color-coding
   inline styles / .pts classes the page's own JS sets). ── */
.mm-pc{background:#fff!important;border-radius:10px!important;border:2px solid #B45309!important;padding:0!important;margin-bottom:14px!important;box-shadow:0 3px 12px rgba(180,83,9,.08)!important;overflow:hidden!important;}
.mm-pc-title{background:#FDF8E7!important;color:#78350F!important;font-weight:800!important;font-size:.92rem!important;padding:12px 14px!important;border-bottom:2px solid #B45309!important;margin:0!important;}
.mm-pc table{display:table!important;width:100%!important;border-collapse:collapse!important;font-size:.74rem!important;}
.mm-pc th{background:#FFFDF9!important;color:#92400E!important;font-size:.72rem!important;font-weight:800!important;text-align:center!important;padding:8px 4px!important;border:1px solid #EFE7C8!important;word-break:break-word!important;}
.mm-pc td{display:table-cell!important;padding:8px 4px!important;border-bottom:1px solid #EFE7C8!important;vertical-align:middle!important;text-align:center!important;word-break:break-word!important;}
.mm-pc td:first-child{text-align:left!important;font-weight:700!important;color:#B45309!important;background:#FFFDF9!important;padding-left:8px!important;}
.mm-pc tr.mm-pc-hl-green td{background:#F0FDF4!important;}
.mm-pc tr.mm-pc-hl-green td:nth-child(2),.mm-pc tr.mm-pc-hl-green td:nth-child(3){color:#047857!important;font-weight:800!important;}
.mm-pc tr.mm-pc-hl-blue td{background:#EFF6FF!important;}
.mm-pc tr.mm-pc-hl-blue td:nth-child(2),.mm-pc tr.mm-pc-hl-blue td:nth-child(3){color:#1D4ED8!important;font-weight:800!important;}
.mm-pc tr.mm-pc-hl-amber td:nth-child(2),.mm-pc tr.mm-pc-hl-amber td:nth-child(3){color:#D97706!important;font-weight:800!important;}
/* ── সর্বমোট স্কোর ব্যানার ও মঙ্গল দোষ/সিদ্ধান্ত সেকশন — website-এ আছে,
   বান্ডেলড কপিতে এই CSS-ই ছিল না, তাই সাদামাটা লেখা হিসেবে দেখাচ্ছিল ── */
.mm-pc-score-banner{background:linear-gradient(135deg,#047857,#059669)!important;color:#fff!important;display:flex!important;justify-content:space-between!important;align-items:center!important;gap:10px!important;flex-wrap:wrap!important;padding:14px 16px!important;margin:14px!important;border-radius:8px!important;border:1px solid #B45309!important;}
.mm-pc-score-banner .mm-pc-score-val{font-size:1.3rem!important;font-weight:900!important;color:#FDE047!important;}
.mm-pc-section{margin:0 14px 14px!important;}
.mm-pc-section-head{background:#FDF8E7!important;border:1px solid #B45309!important;color:#78350F!important;font-weight:800!important;padding:8px 12px!important;font-size:.86rem!important;border-radius:6px 6px 0 0!important;}
.mm-pc-section-body{border:1px solid #EFE7C8!important;border-top:none!important;padding:12px!important;border-radius:0 0 6px 6px!important;font-size:.85rem!important;color:#374151!important;background:#fff!important;}
.mm-pc-section-body.mm-pc-conclusion{background:#F0FDF4!important;border-color:#A7F3D0!important;font-weight:700!important;color:#045F46!important;font-size:.92rem!important;}
/* ── প্রাপ্ত পয়েন্ট রঙ (শুভ/মধ্যম/অশুভ) — JS class দিয়ে সেট করে ── */
.pts{font-weight:700!important;font-size:1rem!important;}
.pts.good{color:#2e7d32!important;}
.pts.avg{color:#f57c00!important;}
.pts.bad{color:#c62828!important;}
/* ── Tables (generic — plain অষ্টকূট বিবরণ, planet tables ইত্যাদি) ── */
table{display:table!important;width:100%!important;border-collapse:collapse!important;font-size:.74rem!important;}
thead{display:table-header-group!important;}tbody{display:table-row-group!important;}
tr{display:table-row!important;}
th,td{display:table-cell!important;padding:6px 4px!important;vertical-align:middle!important;word-break:break-word!important;}
th{background:#7a2e2e!important;color:#fff!important;font-size:.74rem!important;text-align:left!important;font-weight:600!important;}
td{border-bottom:1px solid #f0e4d4!important;}
tr:nth-child(even) td{background:#fdf8f3!important;}
/* ── Charts ── */
.mm-charts-grid{display:flex!important;flex-direction:column!important;gap:16px!important;}
.chart-pair{display:flex!important;flex-direction:column!important;align-items:center!important;gap:10px!important;}
svg{max-width:100%!important;}
/* ── Wide tables (অষ্টকূট ছক ইত্যাদি) — scroll horizontally instead of getting cut off ── */
.mm-tbl-scroll{width:100%!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch!important;}
.mm-tbl-scroll table{width:auto!important;min-width:100%!important;}
/* ── Premium/Special promo cards — missing from the bundled copy of the page,
   so these classes were rendering as unstyled plain text. Mirrors the current
   website's CSS (mobile breakpoint values applied unconditionally, since the
   app is always phone-sized). ── */
.premium-promo{position:relative!important;display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:10px!important;background:linear-gradient(135deg,#2d0060,#1a0040)!important;border:1px solid rgba(255,215,0,.35)!important;border-radius:14px!important;padding:16px 14px 12px!important;}
.premium-promo-badge{position:absolute!important;top:-8px!important;right:10px!important;background:#ffd700!important;color:#1a0040!important;font-size:.6rem!important;font-weight:800!important;padding:2px 8px!important;border-radius:20px!important;box-shadow:0 2px 8px rgba(0,0,0,.25)!important;white-space:nowrap!important;}
.premium-promo-icon{font-size:1.5rem!important;flex-shrink:0!important;}
.premium-promo-text{flex:1!important;min-width:0!important;}
.premium-promo-title{color:#ffd700!important;font-weight:800!important;font-size:.85rem!important;margin-bottom:2px!important;line-height:1.4!important;}
.premium-promo-sub{font-size:.74rem!important;color:rgba(255,255,255,.75)!important;line-height:1.55!important;}
.premium-promo-old{text-decoration:line-through!important;opacity:.5!important;margin-right:4px!important;}
.premium-promo-new{color:#ffd700!important;font-weight:800!important;font-size:1.02rem!important;}
.premium-promo-btn{width:100%!important;background:linear-gradient(135deg,#ffd700,#ff8f00)!important;color:#1a0040!important;border:none!important;border-radius:50px!important;padding:9px 16px!important;font-size:.85rem!important;font-weight:900!important;cursor:pointer!important;font-family:inherit!important;white-space:nowrap!important;flex-shrink:0!important;}
.premium-promo-urgency{display:inline-flex!important;align-items:center!important;gap:5px!important;margin-top:6px!important;font-size:.7rem!important;font-weight:700!important;color:#ffd700!important;background:rgba(255,215,0,.12)!important;border:1px solid rgba(255,215,0,.3)!important;border-radius:20px!important;padding:2px 10px!important;}
.csp-promo{background:linear-gradient(135deg,#7a2e2e,#4a1414)!important;border:1px solid rgba(255,215,0,.4)!important;}
.csp-promo .premium-promo-badge{background:#ffd700!important;color:#4a1414!important;}
.csp-promo .premium-promo-new{color:#ffd700!important;}
.mm-promo-mini-wrap{display:grid!important;grid-template-columns:1fr!important;gap:12px!important;margin-top:1.4rem!important;}
.mm-promo-mini{display:flex!important;align-items:center!important;gap:12px!important;border-radius:14px!important;padding:14px 16px!important;cursor:pointer!important;border:1px solid rgba(255,215,0,.3)!important;}
.mm-promo-mini.mm-promo-prem{background:linear-gradient(135deg,#2d0060,#1a0040)!important;}
.mm-promo-mini.mm-promo-spec{background:linear-gradient(135deg,#7a2e2e,#4a1414)!important;}
.mm-promo-mini-icon{font-size:1.6rem!important;flex-shrink:0!important;}
.mm-promo-mini-text{flex:1!important;min-width:0!important;}
.mm-promo-mini-title{color:#ffd700!important;font-weight:800!important;font-size:.84rem!important;line-height:1.4!important;}
.mm-promo-mini-sub{font-size:.74rem!important;color:rgba(255,255,255,.75)!important;margin-top:2px!important;}
.mm-promo-mini-arrow{color:#ffd700!important;font-size:1.1rem!important;flex-shrink:0!important;}
`;

function buildInjectedJS(css) {
  return `(function(){
  var st=document.getElementById('__mmNative__');
  if(!st){st=document.createElement('style');st.id='__mmNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};
  /* wrap wide tables so overflowing columns scroll instead of getting clipped */
  function mmWrapTables(){
    document.querySelectorAll('table').forEach(function(t){
      var p=t.parentElement;
      if(p&&p.classList.contains('mm-tbl-scroll'))return;
      var w=document.createElement('div');
      w.className='mm-tbl-scroll';
      t.parentNode.insertBefore(w,t);
      w.appendChild(t);
    });
  }
  mmWrapTables();
  new MutationObserver(mmWrapTables).observe(document.body,{childList:true,subtree:true});
  /* Load Razorpay checkout.js — absent from the offline app bundle, needs network.
     downloadMatchPDF()/_mmStartPayment() instantiate "new Razorpay(...)" directly
     (not via the blocked openRzp/proceedToRazorpay helpers above), so once this
     script is present the real ₹৫১/₹৫০১/₹১৫০১ payment flows work like the website. */
  if(typeof Razorpay==='undefined'&&!document.querySelector('script[src*="checkout.razorpay"]')){
    var rzpScript=document.createElement('script');
    rzpScript.src='https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(rzpScript);
  }
  /* On slow connections checkout.js can take several seconds to arrive — the
     page's own code only checks "typeof Razorpay==='undefined'" synchronously
     and silently skips straight to the free/no-payment path if it isn't ready
     yet. Wrap the payment entry points so they wait (with a small toast) for
     Razorpay to actually be loaded before handing off to the original function. */
  function mmToast(msg){
    var t=document.createElement('div');
    t.style.cssText='position:fixed;bottom:76px;left:14px;right:14px;background:#0a192f;color:#ffd700;'+
      'padding:13px 16px;border-radius:10px;font-size:.88rem;z-index:99999;border:1px solid #b8860b;'+
      'text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.35);';
    t.textContent=msg;
    document.body.appendChild(t);
    return t;
  }
  function mmWaitForRazorpay(cb){
    if(typeof Razorpay!=='undefined'){cb();return;}
    var toast=mmToast('⏳ পেমেন্ট গেটওয়ে লোড হচ্ছে, ধীর ইন্টারনেটে কিছুটা সময় লাগতে পারে…');
    var triesLeft=150; // ~90s — checkout.js can be very slow on a weak connection
    (function poll(){
      if(typeof Razorpay!=='undefined'){
        if(toast.parentNode)toast.parentNode.removeChild(toast);
        cb();
        return;
      }
      if(triesLeft<=0){
        if(toast.parentNode)toast.parentNode.removeChild(toast);
        /* Do NOT call cb() here — falling through to the original function
           would skip Razorpay's "typeof Razorpay==='undefined'" check and
           print/share the report for free. Fail closed instead. */
        mmToast('❌ পেমেন্ট গেটওয়ে লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।');
        return;
      }
      triesLeft--;
      setTimeout(poll,600);
    })();
  }
  setTimeout(function(){
    var origDownload=window.downloadMatchPDF;
    if(typeof origDownload==='function'){
      window.downloadMatchPDF=function(){
        var args=arguments,self=this;
        mmWaitForRazorpay(function(){origDownload.apply(self,args);});
      };
    }
    var origStartPayment=window._mmStartPayment;
    if(typeof origStartPayment==='function'){
      window._mmStartPayment=function(kind){
        mmWaitForRazorpay(function(){origStartPayment(kind);});
      };
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

// Polls the hidden pre-render WebView until match-making-print.js has finished
// building #printRoot (it waits on document.fonts.ready + a setTimeout before
// calling window.print()), then strips <script> tags and hands back static
// HTML. expo-print's internal renderer doesn't reliably run page JS before
// snapshotting, so printing the *unrendered* template (with only data
// injected) produces a blank/loading PDF — this mirrors the working
// KundaliScreen approach of pre-rendering in a real WebView first.
const CAPTURE_JS = `(function poll(){
  var root=document.getElementById('printRoot');
  if(root&&root.children.length>0){
    [].slice.call(document.querySelectorAll('script')).forEach(function(s){s.parentNode&&s.parentNode.removeChild(s);});
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'mmPdfStaticHtml',html:document.documentElement.outerHTML}));
  } else {
    setTimeout(poll,400);
  }
})();true;`;

export function MatchMakingScreen() {
  const [generating, setGenerating] = useState(false);
  const [pdfRenderHtml, setPdfRenderHtml] = useState(null);
  const pdfWebViewRef = useRef(null);
  const pdfBusyRef = useRef(false);

  const handlePrint = useCallback((rawJson) => {
    if (pdfBusyRef.current) return;
    if (!rawJson) {
      Alert.alert('ত্রুটি', 'PDF ডেটা পাওয়া যায়নি। আগে কুষ্ঠি মিলন গণনা করুন।');
      return;
    }
    pdfBusyRef.current = true;
    setGenerating(true);
    setPdfRenderHtml(buildPrintHtml(rawJson));
  }, []);

  const handlePdfRendered = useCallback(async (e) => {
    let m;
    try { m = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (m.type !== 'mmPdfStaticHtml') return;
    setPdfRenderHtml(null);
    try {
      const { uri } = await Print.printToFileAsync({
        html: m.html,
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
    } catch (e2) {
      Alert.alert('ত্রুটি', 'PDF তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      pdfBusyRef.current = false;
      setGenerating(false);
    }
  }, []);

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
      {generating && (
        <View style={s.pdfOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={s.pdfOverlayText}>PDF তৈরি হচ্ছে…</Text>
        </View>
      )}
      {pdfRenderHtml != null && (
        <WebView
          ref={pdfWebViewRef}
          style={s.pdfRenderer}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          source={{ html: pdfRenderHtml }}
          onLoadEnd={() => {
            pdfWebViewRef.current?.injectJavaScript(CAPTURE_JS);
          }}
          onMessage={handlePdfRendered}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  pdfRenderer: { position: 'absolute', left: -9999, top: -9999, width: 1, height: 1, opacity: 0 },
  pdfOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(10,25,47,0.55)',
  },
  pdfOverlayText: { marginTop: 10, color: '#fff', fontSize: 13, fontWeight: '600' },
  wv:   { flex: 1 },
});
