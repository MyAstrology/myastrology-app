import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import html from '../web-html/numerology';
import { colors } from '../theme/colors';

const APP_CSS = `
/* ── Hide website chrome ── */
header.site-header,nav.nav,#nm,#no,.nav-ov,#navOverlay,.nav-overlay{display:none!important;}
.wa-float,#btt,.bc{display:none!important;}
/* ── Hide SEO & CTA sections ── */
.cta-sec,.cta-section,#ctaSection{display:none!important;}
#faqSection,.faq-sec{display:none!important;}
#seoSection,.seo-section{display:none!important;}
#eeatSection,.eeat-sec{display:none!important;}
footer,.site-footer,.fb{display:none!important;}
/* ── Hide external "আমাদের পরিষেবা" service-scroll strip — links to other
   website pages (palmistry/vastu/gemstone) that aren't screens in this app.
   Left unstyled/unhidden before, it rendered as overlapping broken text. ── */
.svc-scroll-sect{display:none!important;}
/* ── Hero — restyled for a single-column mobile layout instead of hidden.
   The website lays the wheel image + title as an absolute-positioned overlay
   inside .nc-left (38%-wide column on desktop); stacked here with the wheel
   as a centered circular backdrop behind the title/subtitle/badges. ── */
.wheel-bg{display:none!important;} /* the big whole-hero background wheel — skip, keep only the card's own wheel for a cleaner mobile look */
.nhero{
  background:linear-gradient(135deg,#fffaf0 0%,#fff5e0 40%,#fffbf0 100%)!important;
  padding:14px 12px 18px!important;border-top:4px solid #c9922a!important;
  border-bottom:2px solid rgba(201,146,42,.2)!important;position:relative!important;overflow:hidden!important;
}
.nhero::after{display:none!important;}
.nc{
  display:flex!important;flex-direction:column!important;gap:12px!important;
  max-width:100%!important;margin:0!important;background:#fff!important;
  border-radius:18px!important;padding:16px 12px!important;
  border:1.5px solid rgba(201,146,42,.3)!important;
  box-shadow:0 6px 24px rgba(0,0,0,.08)!important;position:relative!important;
  overflow:hidden!important;animation:none!important;
}
.nc-left{
  position:relative!important;flex:none!important;width:100%!important;
  display:flex!important;padding-top:0!important;
  min-height:200px!important;align-items:center!important;justify-content:center!important;
}
.nc-wheel-wrap{
  position:absolute!important;top:50%!important;left:50%!important;
  transform:translate(-50%,-50%)!important;width:200px!important;height:200px!important;
  pointer-events:none!important;z-index:0!important;
}
.nc-wheel-img{width:100%!important;height:100%!important;opacity:.4!important;border-radius:50%!important;display:block!important;}
.nc-left-inner{
  display:flex!important;flex-direction:column!important;gap:6px!important;
  position:relative!important;z-index:1!important;
  background:radial-gradient(ellipse 95% 85% at 50% 50%,rgba(255,255,255,.72) 0%,rgba(255,255,255,.32) 55%,rgba(255,255,255,0) 100%)!important;
  padding:14px 10px!important;align-items:center!important;text-align:center!important;width:100%!important;
}
.nc-kicker{font-size:.66rem!important;font-weight:800!important;letter-spacing:.16em!important;color:#a06010!important;text-transform:uppercase!important;margin-bottom:2px!important;}
.nc-title{display:flex!important;flex-direction:column!important;gap:2px!important;line-height:1.1!important;text-align:center!important;margin-bottom:0!important;}
.nc-title span{color:#c9922a!important;}
.nc-t1{font-size:1.1rem!important;font-weight:700!important;color:#1a1232!important;display:block!important;}
.nc-t2{font-size:1.9rem!important;font-weight:800!important;display:block!important;background:linear-gradient(135deg,#7a4200 0%,#c9922a 30%,#f5c340 55%,#c9922a 78%,#7a4200 100%)!important;-webkit-background-clip:text!important;-webkit-text-fill-color:transparent!important;background-clip:text!important;}
.nc-divider{width:36px!important;height:3px!important;background:linear-gradient(90deg,#c9922a,#e8a820)!important;border-radius:2px!important;margin:2px auto!important;}
.nc-sub{font-size:.78rem!important;line-height:1.6!important;max-width:280px!important;color:#2a2040!important;text-align:center!important;margin:0 auto!important;}
.nc-badges{display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin-top:6px!important;justify-content:center!important;}
.nc-badge{background:rgba(255,255,255,.9)!important;border:1px solid rgba(201,146,42,.4)!important;color:#8a5a10!important;font-size:.66rem!important;font-weight:700!important;padding:4px 10px!important;border-radius:50px!important;}
.nc-right{width:100%!important;min-width:0!important;flex:1!important;}
/* ── Page base ── */
html{height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none!important;max-width:100vw!important;}
body{height:auto!important;min-height:100vh!important;background:#FAF8F3!important;padding:0!important;margin:0!important;overflow-x:hidden!important;}
#main,main{padding:0 12px 20px!important;margin:0!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
*{-webkit-tap-highlight-color:transparent!important;box-sizing:border-box!important;}
/* ── Analysis mode tabs ── */
.mrow{
  display:flex!important;gap:5px!important;margin-bottom:12px!important;
  background:#f5efe0!important;padding:4px!important;
  border-radius:50px!important;border:1px solid rgba(201,146,42,.2)!important;
}
.mb{
  flex:1!important;padding:8px 12px!important;border:none!important;
  border-radius:50px!important;font-family:inherit!important;
  font-size:.84rem!important;font-weight:600!important;cursor:pointer!important;
  color:#8a6a50!important;background:transparent!important;
  display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;
}
.mb.on,.mb[aria-selected="true"]{
  background:#7a2e2e!important;color:#fff!important;
  box-shadow:0 2px 8px rgba(122,46,46,.3)!important;
}
/* ── Input field ── */
.irow{margin-bottom:10px!important;}
.ig{margin-bottom:8px!important;}
.il{font-size:.8rem!important;font-weight:600!important;color:#5c3d2e!important;display:block!important;margin-bottom:4px!important;line-height:1.4!important;}
.inp{
  width:100%!important;padding:8px 12px!important;
  border:1.5px solid #e0cdbc!important;border-radius:10px!important;
  background:#fefcf9!important;font-size:.9rem!important;
  color:#3a2218!important;font-family:inherit!important;outline:none!important;
}
.inp:focus{border-color:#c8a87a!important;box-shadow:0 0 0 3px rgba(200,168,122,.15)!important;}
/* ── VS divider ── */
.vsmid{display:flex!important;align-items:center!important;justify-content:center!important;padding:3px 0!important;}
.vsdot{
  width:28px!important;height:28px!important;border-radius:50%!important;
  background:#7a2e2e!important;display:flex!important;align-items:center!important;
  justify-content:center!important;font-size:.7rem!important;font-weight:700!important;color:#fff!important;
}
/* ── Analyse button ── */
.gobtn{
  width:100%!important;padding:12px 20px!important;
  background:#7a2e2e!important;border:none!important;border-radius:12px!important;
  font-family:inherit!important;font-size:.95rem!important;font-weight:700!important;
  color:#fff!important;cursor:pointer!important;margin-bottom:12px!important;
  display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;
  box-shadow:0 4px 16px rgba(122,46,46,.3)!important;animation:none!important;
}
/* ── Quick example chips ── */
.ext{font-size:.8rem!important;color:#8a6a50!important;margin-bottom:5px!important;}
.chips{display:flex!important;flex-wrap:wrap!important;gap:5px!important;margin-bottom:8px!important;}
.chip{
  padding:4px 10px!important;background:#fff!important;
  border:1.5px solid #e0cdbc!important;border-radius:20px!important;
  font-size:.8rem!important;color:#5c3d2e!important;cursor:pointer!important;
  font-family:inherit!important;
}
.chip:hover,.chip:active{background:#fdf1ec!important;border-color:#7a2e2e!important;color:#7a2e2e!important;}
/* ── Hide the SEO article (contains .num-faq and .num-author nested) — this
   was leaking through unhidden as a full educational article below the form,
   since it's a distinct block from the already-hidden section.seow/.faq. ── */
.num-seo{display:none!important;}
/* ── Hide promotional/SEO sections below form ── */
.daily-box{display:none!important;}
.stats{display:none!important;}
.catsw{display:none!important;}
section.how{display:none!important;}
section.numsw{display:none!important;}
section.planw{display:none!important;}
section.seow{display:none!important;}
section.faq{display:none!important;}
section.ctaw{display:none!important;}
/* ── Results area ── */
#results,.results,.res-wrap{padding:0!important;}
/* ── Number badge ── */
.snum{
  width:44px!important;height:44px!important;border-radius:50%!important;
  background:#7a2e2e!important;color:#fff!important;
  font-weight:700!important;font-size:1rem!important;
  display:flex!important;align-items:center!important;justify-content:center!important;
  margin:0 auto 10px!important;
}
/* ── Result cards ── */
.cc{
  background:#fff!important;border-radius:14px!important;
  border:1.5px solid #e0cdbc!important;padding:14px!important;
  margin-bottom:10px!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important;
  cursor:pointer!important;text-align:center!important;
}
/* ── Tables ── */
table{display:table!important;width:100%!important;border-collapse:collapse!important;font-size:.82rem!important;}
thead{display:table-header-group!important;}tbody{display:table-row-group!important;}
tr{display:table-row!important;}
th,td{display:table-cell!important;padding:6px 8px!important;vertical-align:middle!important;}
th{background:#7a2e2e!important;color:#fff!important;font-size:.76rem!important;text-align:left!important;font-weight:600!important;}
td{border-bottom:1px solid #f0e4d4!important;color:#2c1a0e!important;}
tr:nth-child(even) td{background:#fdf8f3!important;}
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
