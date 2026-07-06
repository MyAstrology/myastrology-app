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
/* ── Fix hero layout: hide images, show only the form ── */
.wheel-bg{display:none!important;}
.nc-left,.nc-wheel-wrap,.nc-wheel-img{display:none!important;}
.nhero{
  background:#FAF8F3!important;border:none!important;padding:6px 12px!important;
}
.nhero::before,.nhero::after{display:none!important;}
.nc{
  display:block!important;background:transparent!important;border:none!important;
  box-shadow:none!important;padding:0!important;border-radius:0!important;
  animation:none!important;
}
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
