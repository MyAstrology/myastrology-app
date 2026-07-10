import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, BackHandler, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import KUNDALI_HTML from '../web-html/kundali';
import KUNDALI_PRINT_HTML from '../web-html/kundali-print';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { MENU_ITEMS } from '../navigation/menuItems';
import { haptics } from '../utils/haptics';

const LOGO = require('../../assets/logo.png');

function injectDataIntoPrintHtml(printDataJson) {
  let html = KUNDALI_PRINT_HTML;
  // Encode < as < so the HTML parser never sees </script> inside the JSON
  // payload. The JS engine correctly decodes < back to <.
  // We use function replacements (not string replacements) so that any $
  // characters in the JSON payload are never misinterpreted as back-references.
  const safeJs = JSON.stringify(printDataJson).replace(/</g, '\\u003c');
  html = html.replace('<head>', () => `<head><script>window.__kData=${safeJs};<\/script>`);
  html = html.replace(
    "try{raw=localStorage.getItem('kundali_print_data');}catch(e){}",
    () => `try{raw=window.__kData||null;}catch(e){}`
  );
  return html;
}

// ── File URI (written once per session) ──────────────────────────────────────

const WEB_DIR = FileSystem.documentDirectory + 'myastro/';
let _kUri = null;
let _kPromise = null;

// The main app script is in the HTML without a <script> opener. Worse: the first
// ~450 chars after the navamsha </script> are broken cut-off fragments (s.onerror,
// })); etc.) that cause a SyntaxError, preventing the whole block from executing.
// Fix: skip the broken prefix, inject <script> + clean stubs, then append the
// valid code starting from if('requestIdleCallback'...) — verified SYNTAX OK.
function fixKundaliHtml(html) {
  const navamshaClose = html.indexOf('</script>\nvar CALC_SCRIPTS=[];');
  if (navamshaClose < 0) return html;
  const orphanEnd  = navamshaClose + 9; // end of </script>
  const validStart = html.indexOf("if('requestIdleCallback' in window){", orphanEnd);
  if (validStart < 0) return html;
  return (
    html.substring(0, orphanEnd) +
    '\n<script>\n' +
    'var CALC_SCRIPTS=[];\nvar _calcScriptsPromise=null;\n' +
    'function loadCalcScripts(){' +
      'if(_calcScriptsPromise)return _calcScriptsPromise;' +
      '_calcScriptsPromise=Promise.resolve();' +
      'return _calcScriptsPromise;' +
    '}\n' +
    html.substring(validStart)
  );
}

async function getKUri() {
  if (_kUri) return _kUri;
  if (!_kPromise) {
    _kPromise = (async () => {
      await FileSystem.makeDirectoryAsync(WEB_DIR, { intermediates: true });
      const dest = WEB_DIR + 'kundali_app.html';
      await FileSystem.writeAsStringAsync(dest, fixKundaliHtml(KUNDALI_HTML),
        { encoding: FileSystem.EncodingType.UTF8 });
      _kUri = dest;
      return dest;
    })();
  }
  return _kPromise;
}

function useKUri() {
  const [uri, setUri] = useState(_kUri);
  useEffect(() => { getKUri().then(u => setUri(u)); }, []);
  return uri;
}

// ── CSS injected into WebView — hide website chrome, keep form + results ─────
// Explicit selectors only — NO body>*:not(main) to avoid hiding script tags

const APP_CSS = `
/* ── Hide website chrome ── */
header.site-header,nav.nav,#navMenu,.nav-overlay,#navOverlay,
footer,.site-footer{display:none!important;}
.author-byline{display:none!important;}
section.k-wrap{display:none!important;}
#moreServicesCard{display:none!important;}
#ganeshabanner{display:none!important;}
.fab-wrap,.fab{display:none!important;}
.kf-alt-actions{display:none!important;}
#inputSection > div:first-child{display:none!important;}
#inputSection > p{display:none!important;}
#printCoverPage{display:none!important;}
.premium-promo{display:none!important;}
/* ── Page base + scroll ── */
html{height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none!important;max-width:100vw!important;}
body{height:auto!important;min-height:100vh!important;background:#FAF8F3!important;padding:0!important;margin:0!important;overflow-y:auto!important;overflow-x:hidden!important;max-width:100vw!important;}
main{padding:0 0 80px!important;margin:0!important;height:auto!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
*{-webkit-tap-highlight-color:transparent!important;}
/* ── Tab panels: height/overflow ONLY — never set display; JS owns show/hide ── */
.tab-panel{height:auto!important;overflow:visible!important;min-height:0!important;}
#mainKundaliSection{height:auto!important;overflow:visible!important;}
#resultsArea{height:auto!important;overflow:visible!important;padding-top:52px!important;}
/* ── Tab nav: pill-button style ── */
#tabNav{
  background:#7a2e2e!important;
  border-bottom:2px solid rgba(200,168,122,0.5)!important;
  padding:8px 6px!important;
  gap:5px!important;
  scrollbar-width:none!important;
  box-shadow:0 2px 8px rgba(0,0,0,0.22)!important;
  align-items:center!important;
  flex-wrap:nowrap!important;
}
#tabNav::-webkit-scrollbar{display:none!important;}
.tab-btn{
  background:rgba(255,255,255,0.13)!important;
  color:rgba(255,255,255,0.8)!important;
  border:1px solid rgba(255,255,255,0.22)!important;
  padding:6px 10px!important;
  height:auto!important;
  font-size:0.71rem!important;
  font-weight:600!important;
  font-family:inherit!important;
  white-space:nowrap!important;
  cursor:pointer!important;
  display:inline-flex!important;
  align-items:center!important;
  gap:4px!important;
  border-radius:16px!important;
  flex-shrink:0!important;
  outline:none!important;
  -webkit-appearance:none!important;
  letter-spacing:0.01em!important;
  box-sizing:border-box!important;
  transition:background .15s,color .15s!important;
}
svg.tab-icon{stroke:rgba(255,255,255,0.55)!important;fill:none!important;width:13px!important;height:13px!important;flex-shrink:0!important;}
.tab-btn[aria-selected="true"],.tab-btn.active{
  background:rgba(255,255,255,0.93)!important;
  color:#5a1e1e!important;
  border-color:transparent!important;
}
.tab-btn[aria-selected="true"] svg.tab-icon,.tab-btn.active svg.tab-icon{
  stroke:#5a1e1e!important;
}
/* ── Hide external-navigation tabs (যোটক, পঞ্জিকা, বর্ষফল, প্রশ্ন, রাশিফল) ── */
.tab-btn[aria-label*="পেজে যান"],
.tab-btn[onclick*="goToYotak"],
.tab-btn[onclick*="goToVarshaphala"],
.tab-btn[onclick*="panjika.html"],
.tab-btn[onclick*="prashna.html"],
.tab-btn[onclick*="rashifal"]{display:none!important;}
/* ── Box-sizing ── */
div.k-wrap#inputSection,div.k-wrap#inputSection *{box-sizing:border-box!important;}
.card{box-sizing:border-box!important;}
input[type=number],input[type=text],input[type=search]{min-width:0!important;width:100%!important;box-sizing:border-box!important;}
/* ── Form card & input styles ── */
div.k-wrap#inputSection{padding:8px 12px 0!important;}
.card{background:#fff!important;border-radius:14px!important;border:1.5px solid #e0cdbc!important;padding:16px!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important;margin-bottom:12px!important;}
.ig{margin-bottom:10px!important;}
.sel-ctrl{width:100%!important;padding:9px 10px!important;border:1.5px solid #e0cdbc!important;border-radius:9px!important;background:#fefcf9!important;font-size:.95rem!important;color:#3a2218!important;font-family:inherit!important;}
#userName{width:100%!important;padding:9px 10px!important;border:1.5px solid #e0cdbc!important;border-radius:9px!important;background:#fefcf9!important;font-size:.95rem!important;color:#3a2218!important;font-family:inherit!important;outline:none!important;}
#userName:focus{border-color:#c8a87a!important;box-shadow:0 0 0 3px rgba(200,168,122,.15)!important;}
.btn.btn-primary,.btn-primary{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;width:100%!important;padding:14px 20px!important;background:#7a2e2e!important;color:#fff!important;border:none!important;border-radius:12px!important;font-size:1rem!important;font-weight:700!important;font-family:inherit!important;cursor:pointer!important;margin:12px 0 4px!important;}
.btn-loading{opacity:.75!important;}
.spinner{display:inline-block!important;width:16px!important;height:16px!important;border:2px solid rgba(255,255,255,.4)!important;border-top-color:#fff!important;border-radius:50%!important;animation:kspin .7s linear infinite!important;flex-shrink:0!important;}
@keyframes kspin{to{transform:rotate(360deg);}}
/* ── Result section headings ── */
.section-title{font-size:1rem!important;font-weight:700!important;color:#3a2218!important;margin:0 0 12px!important;padding-bottom:8px!important;border-bottom:1.5px solid #ede0ce!important;display:flex!important;align-items:center!important;gap:7px!important;line-height:1.4!important;}
svg.title-icon{stroke:#7a2e2e!important;fill:none!important;width:18px!important;height:18px!important;flex-shrink:0!important;}
/* ── Panchang summary 2-column grid ── */
.pg-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px 12px!important;margin:4px 0 8px!important;}
.pg-item{display:flex!important;flex-direction:column!important;gap:2px!important;}
.pg-item .lbl{font-size:0.72rem!important;color:#8a6a50!important;font-weight:500!important;line-height:1.2!important;}
.pg-item .val{font-size:0.94rem!important;font-weight:700!important;color:#2c1a0e!important;line-height:1.3!important;}
/* ── All tables: force correct display ── */
table{display:table!important;width:100%!important;border-collapse:collapse!important;font-size:0.82rem!important;}
thead{display:table-header-group!important;}
tbody{display:table-row-group!important;}
tr{display:table-row!important;}
th,td{display:table-cell!important;padding:6px 8px!important;border-bottom:1px solid #f0e4d4!important;color:#2c1a0e!important;vertical-align:middle!important;}
th{background:#7a2e2e!important;color:#fff!important;font-weight:600!important;font-size:0.74rem!important;text-align:left!important;}
tr:nth-child(even) td{background:#fdf8f3!important;}
/* ── দশা accordion: website CSS classes not loaded in file:// — inject all ── */
.ds-md-tbl{width:100%!important;border-collapse:collapse!important;margin-bottom:14px!important;font-size:0.81rem!important;}
.ds-md-tbl th{background:#7a2e2e!important;color:#fff!important;padding:7px 8px!important;text-align:left!important;font-size:0.74rem!important;}
.ds-md-tbl td{padding:6px 8px!important;border-bottom:1px solid #f0e4d4!important;color:#2c1a0e!important;}
tr.ds-cur-md>td{background:#fff8ee!important;font-weight:700!important;}
.ds-sec-hdr{font-weight:700!important;color:#5a1e1e!important;font-size:0.87rem!important;margin:14px 0 7px!important;padding-bottom:4px!important;border-bottom:2px solid #e0cdbc!important;}
.ds-ad-grid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:6px!important;margin-bottom:10px!important;}
.ds-ad-box{border:1px solid #e0cdbc!important;border-radius:8px!important;overflow:hidden!important;background:#fff!important;}
.ds-ad-box-hdr{background:#7a2e2e!important;color:#fff!important;padding:5px 7px!important;font-weight:700!important;font-size:0.7rem!important;text-align:center!important;}
.ds-ad-row{display:flex!important;justify-content:space-between!important;align-items:center!important;padding:4px 6px!important;border-bottom:1px solid #f0e4d4!important;font-size:0.71rem!important;cursor:pointer!important;gap:2px!important;}
.ds-ad-row:last-child{border-bottom:none!important;}
.ds-ad-row>span:first-child{color:#2c1a0e!important;font-weight:500!important;flex-shrink:0!important;}
.ds-ad-row>span:last-child{color:#8a6a50!important;font-size:0.67rem!important;white-space:nowrap!important;text-align:right!important;}
.ds-cur-md-box{border-color:#c8a87a!important;box-shadow:0 0 0 2px rgba(122,46,46,0.18)!important;}
.ds-cur-md-box>.ds-ad-box-hdr{background:#b84020!important;}
.ds-ad-row.ds-cur-ad{background:#fff3e0!important;}
.ds-ad-row.ds-sel{background:#f5e6d3!important;}
.ds-pd-panel{background:#fdf8f3!important;border:1.5px solid #e0cdbc!important;border-radius:8px!important;padding:10px!important;margin:6px 0!important;}
.ds-pd-panel-hdr{display:flex!important;justify-content:space-between!important;align-items:center!important;margin-bottom:8px!important;}
.ds-pd-panel-title{font-weight:700!important;color:#5a1e1e!important;font-size:0.81rem!important;}
.ds-pd-back-btn{background:none!important;border:1px solid #c8a87a!important;border-radius:5px!important;padding:3px 8px!important;font-size:0.71rem!important;color:#7a2e2e!important;cursor:pointer!important;}
.ds-pd-tbl{width:100%!important;border-collapse:collapse!important;font-size:0.78rem!important;}
.ds-pd-tbl th{background:#7a2e2e!important;color:#fff!important;padding:6px 8px!important;text-align:left!important;font-size:0.73rem!important;}
.ds-pd-tbl td{padding:5px 8px!important;border-bottom:1px solid #f0e4d4!important;color:#2c1a0e!important;}
tr.ds-cur-pd>td{background:#fff3e0!important;font-weight:700!important;}
.dasha-info{margin-bottom:10px!important;font-size:0.83rem!important;color:#2c1a0e!important;line-height:1.6!important;}
.dasha-info p{margin:3px 0!important;}
/* ── Planet table (more specific — overrides generic above) ── */
.planet-table{width:100%!important;border-collapse:collapse!important;font-size:0.81rem!important;}
.planet-table th{background:#7a2e2e!important;color:#fff!important;padding:7px 6px!important;text-align:left!important;font-weight:600!important;font-size:0.74rem!important;white-space:nowrap!important;}
.planet-table td{padding:7px 6px!important;border-bottom:1px solid #f0e4d4!important;color:#2c1a0e!important;vertical-align:middle!important;}
.planet-table tr:nth-child(even) td{background:#fdf8f3!important;}
/* ── Kundali chart layout — vertical stack ── */
.chart-section{display:flex!important;flex-direction:column!important;align-items:center!important;gap:16px!important;margin:8px 0!important;}
.chart-box{width:100%!important;max-width:320px!important;flex:none!important;}
.chart-box svg{width:100%!important;height:auto!important;max-width:320px!important;}
/* ── Premium popup classes (injected, since file:// can't load external CSS) ── */
.info-row{display:flex!important;align-items:flex-start!important;gap:12px!important;margin-bottom:10px!important;}
.icon-large{font-size:1.6rem!important;flex-shrink:0!important;line-height:1.2!important;width:28px!important;text-align:center!important;}
.text-lavender{color:#d8b4fe!important;font-size:0.88rem!important;font-weight:600!important;margin-bottom:2px!important;display:block!important;}
.text-dim{color:rgba(255,255,255,0.68)!important;font-size:0.78rem!important;line-height:1.5!important;display:block!important;}
/* ── City search ── */
.city-wrap{position:relative!important;}
.suggestions{position:absolute!important;z-index:999!important;background:#fff!important;border:1.5px solid #e0cdbc!important;border-radius:10px!important;list-style:none!important;margin:2px 0 0!important;padding:0!important;width:100%!important;box-shadow:0 4px 14px rgba(0,0,0,.12)!important;max-height:220px!important;overflow-y:auto!important;}
.suggestions li{padding:10px 12px!important;cursor:pointer!important;border-bottom:1px solid #f0e8d8!important;font-size:.9rem!important;color:#3a2218!important;}
.suggestions li:last-child{border-bottom:none!important;}
/* ── Toast ── */
#toastStack{position:fixed!important;bottom:90px!important;left:12px!important;right:12px!important;z-index:9999!important;pointer-events:none!important;}
.toast{display:flex!important;align-items:flex-start!important;gap:8px!important;background:#fff!important;border:1.5px solid #e0cdbc!important;border-radius:10px!important;padding:10px 12px!important;margin-bottom:8px!important;box-shadow:0 2px 10px rgba(0,0,0,.1)!important;font-size:.88rem!important;pointer-events:all!important;opacity:0!important;transition:opacity .25s!important;}
.toast.show{opacity:1!important;}
.toast-error{border-color:#e0a0a0!important;background:#fff9f9!important;}
.toast-success{border-color:#a0c8a0!important;}
`;

function buildInjectedJS(css) {
  return `(function(){
  /* 1 — CSS */
  var st=document.getElementById('__kNative__');
  if(!st){st=document.createElement('style');st.id='__kNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};

  /* 2 — toastStack (showToast uses it) */
  if(!document.getElementById('toastStack')){
    var ts=document.createElement('div');ts.id='toastStack';document.body.appendChild(ts);
  }

  /* 3 — Premium popups: keep originals active (CSS injected via APP_CSS above) */

  /* 4 — Block window.open — WebView has no multi-window support; _doPrint handles PDF */
  window.open=function(){return null;};

  /* 4 — Fallbacks: run after page scripts, fill any gaps */
  setTimeout(function(){

    /* 4a — Populate select dropdowns if the main script didn't */
    var d=document.getElementById('dobDay');
    if(d&&d.options.length<=1){for(var i=1;i<=31;i++){var o=document.createElement('option');o.value=i;o.textContent=i;d.appendChild(o);}}

    var mo=document.getElementById('dobMonth');
    if(mo&&mo.options.length<=1){
      ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন',
       'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'
      ].forEach(function(m,i){var o=document.createElement('option');o.value=i+1;o.textContent=m;mo.appendChild(o);});
    }

    var y=document.getElementById('dobYear');
    if(y&&y.options.length<=1){var cy=new Date().getFullYear();for(var yr=cy;yr>=1900;yr--){var o=document.createElement('option');o.value=yr;o.textContent=yr;y.appendChild(o);}}

    var h=document.getElementById('tobHour');
    if(h&&h.options.length<=1){for(var hh=0;hh<24;hh++){var o=document.createElement('option');o.value=hh;o.textContent=String(hh).padStart(2,'0');h.appendChild(o);}}

    var mn=document.getElementById('tobMin');
    if(mn&&mn.options.length<=1){for(var mm=0;mm<60;mm++){var o=document.createElement('option');o.value=mm;o.textContent=String(mm).padStart(2,'0');mn.appendChild(o);}}

    var sc=document.getElementById('tobSec');
    if(sc&&sc.options.length<=1){for(var ss=0;ss<60;ss++){var o=document.createElement('option');o.value=ss;o.textContent=String(ss).padStart(2,'0');sc.appendChild(o);}}

    /* 4b — GPS fallback */
    if(typeof getGPSLocation==='undefined'){
      window.getGPSLocation=function(){
        var msg=document.getElementById('gpsMsg');
        if(!navigator.geolocation){if(msg)msg.textContent='GPS সমর্থন নেই';return;}
        if(msg)msg.textContent='লোকেশন অনুসন্ধান হচ্ছে...';
        navigator.geolocation.getCurrentPosition(
          function(pos){
            var la=document.getElementById('lat'),lo=document.getElementById('lon');
            if(la)la.value=pos.coords.latitude.toFixed(4);
            if(lo)lo.value=pos.coords.longitude.toFixed(4);
            if(msg)msg.textContent='লোকেশন পাওয়া গেছে';
            if(typeof validateForm==='function')validateForm();
          },
          function(){if(msg)msg.textContent='লোকেশন পাওয়া যায়নি';}
        );
      };
    }

    /* 4c — City search fallback (guarded so original listener isn't doubled) */
    var inp=document.getElementById('citySearch');
    var sugg=document.getElementById('citySuggestions');
    if(inp&&sugg&&!inp.__csOk){
      inp.__csOk=true;
      inp.addEventListener('input',function(){
        var q=this.value.trim().toLowerCase();
        sugg.innerHTML='';
        if(q.length<3){sugg.style.display='none';return;}
        var cd=(typeof CITY_DB!=='undefined')?CITY_DB:[];
        var hits=cd.filter(function(c){return(c.n||'').toLowerCase().startsWith(q);}).slice(0,8);
        if(!hits.length){sugg.style.display='none';return;}
        hits.forEach(function(c){
          var li=document.createElement('li');
          li.textContent=c.n+(c.g?' ('+c.g+')':'');
          li.addEventListener('click',function(){
            inp.value=c.n;
            var la=document.getElementById('lat'),lo=document.getElementById('lon');
            if(la)la.value=parseFloat(c.lat).toFixed(4);
            if(lo)lo.value=parseFloat(c.lng).toFixed(4);
            sugg.style.display='none';
            if(typeof validateForm==='function')validateForm();
          });
          sugg.appendChild(li);
        });
        sugg.style.display='block';
      });
      document.addEventListener('click',function(e){
        if(!inp.contains(e.target)&&!sugg.contains(e.target))sugg.style.display='none';
      });
    }

    /* 5 — Override _doPrint: use expo-print instead of window.open.
           downloadPDF keeps its original ₹29 Razorpay payment flow intact.
           _doPrint is called after payment (or promo) when the user clicks
           "রিপোর্ট খুলুন" in the _pdfOpenOverlay. */
    (function(){
      window._doPrint=function(){
        if(typeof _preparePayload==='function'){try{_preparePayload();}catch(e){}}
        var printData=null;
        try{printData=localStorage.getItem('kundali_print_data');}catch(e){}
        if(!printData&&window._kundaliPrintData){
          try{printData=JSON.stringify(window._kundaliPrintData);}catch(e){}
        }
        if(!printData){
          if(typeof showToast==='function')showToast('কুষ্ঠির তথ্য পাওয়া যায়নি। প্রথমে কুষ্ঠি গণনা করুন।','error');
          return;
        }
        if(window.ReactNativeWebView){
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'generatePdf',printData:printData}));
        }
      };

      /* Load Razorpay checkout.js — absent from app bundle; needs network */
      if(typeof Razorpay==='undefined'&&!document.querySelector('script[src*="checkout.razorpay"]')){
        var s=document.createElement('script');
        s.src='https://checkout.razorpay.com/v1/checkout.js';
        document.head.appendChild(s);
      }
    })();

  },600);
})();true;`;
}

const INJECTED_JS = buildInjectedJS(APP_CSS);

// ── Main Screen ───────────────────────────────────────────────────────────────

export function KundaliScreen() {
  const navigation    = useNavigation();
  const route         = useRoute();
  const insets        = useSafeAreaInsets();
  const [menuOpen, setMenuOpen]           = useState(false);
  const [webCanGoBack, setWebCanGoBack]   = useState(false);
  const [pdfRenderState, setPdfRenderState] = useState(null); // { printData: string }
  const [pdfGenerating, setPdfGenerating]   = useState(false); // drives the "PDF তৈরি হচ্ছে…" overlay
  const webViewRef    = useRef(null);
  const pdfWebViewRef = useRef(null);
  const pdfBusyRef    = useRef(false); // prevent double-tap
  const pdfChunksRef  = useRef([]);    // accumulates chunked HTML from the PDF renderer until complete
  const lastPrefillRef = useRef(null);

  const kUri = useKUri();
  const [sourceUri, setSourceUri] = useState(null);

  // Coming from another screen (e.g. "কুষ্ঠি দেখুন" in match-making) with birth
  // details in route.params — load kundali.html with those as a query string so
  // its own prefillFromURL()+auto-calc (auto=1) shows that person's chart
  // directly, instead of landing on a blank form.
  useEffect(() => {
    if (!kUri) return;
    const prefillQuery = route.params?.prefillQuery;
    if (prefillQuery && prefillQuery !== lastPrefillRef.current) {
      lastPrefillRef.current = prefillQuery;
      setSourceUri(kUri + '?' + prefillQuery);
    } else if (!sourceUri) {
      setSourceUri(kUri);
    }
  }, [kUri, route.params?.prefillQuery]);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webCanGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [webCanGoBack]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Image source={LOGO} style={s.logo} />
        <View style={s.headerCenter}>
          <Text style={s.brand}>MYASTROLOGY</Text>
          <Text style={s.tagline}>জ্যোতিষ · পঞ্জিকা · কুণ্ডলী</Text>
        </View>
        <TouchableOpacity style={s.hamBtn} onPress={() => setMenuOpen(true)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="menu" size={24} color={colors.gold} />
        </TouchableOpacity>
      </View>

      {/* ── WebView ── */}
      <View style={s.content}>
        {!sourceUri ? (
          <View style={s.loadCenter}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={s.loadMsg}>লোড হচ্ছে…</Text>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: sourceUri }}
            style={s.wv}
            originWhitelist={['file://*', 'about:*', 'https://*', 'http://*']}
            allowFileAccess={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            mixedContentMode="always"
            javaScriptEnabled={true}
            domStorageEnabled={true}
            cacheEnabled={false}
            startInLoadingState={true}
            geolocationEnabled={true}
            scrollEnabled={true}
            injectedJavaScript={INJECTED_JS}
            onNavigationStateChange={state => setWebCanGoBack(state.canGoBack)}
            onShouldStartLoadWithRequest={req => {
              return req.url.startsWith('file://') || req.url === 'about:blank';
            }}
            onMessage={(event) => {
              try {
                const msg = JSON.parse(event.nativeEvent.data);
                if (msg.type === 'generatePdf') {
                  if (!msg.printData || msg.printData === '{}' || msg.printData === 'null') {
                    Alert.alert('ত্রুটি', 'কুষ্ঠির তথ্য পাওয়া যায়নি। প্রথমে কুষ্ঠি গণনা করুন।');
                    return;
                  }
                  if (pdfBusyRef.current) return;
                  pdfBusyRef.current = true;
                  setPdfGenerating(true);
                  // Trigger the hidden WebView to render kundali-print.html with
                  // real JavaScript. After rendering we capture the static DOM and
                  // hand it to expo-print — no scripts needed at print time.
                  setPdfRenderState({ printData: msg.printData });
                }
              } catch (_) {}
            }}
            renderLoading={() => (
              <View style={[s.loadCenter, StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.gold} />
                <Text style={s.loadMsg}>গণনা হচ্ছে…</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* ── Hidden PDF renderer ────────────────────────────────────────────────
           Renders kundali-print.html in a real WebView (full JS execution).
           After #printRoot is populated we strip scripts and capture the static
           DOM, then hand that to expo-print so it only needs to render HTML+CSS.
      ── */}
      {pdfRenderState && (
        <WebView
          ref={pdfWebViewRef}
          style={s.pdfRenderer}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          source={{ html: injectDataIntoPrintHtml(pdfRenderState.printData) }}
          onLoadEnd={() => {
            // kundali-print.js waits for document.fonts.ready then setTimeout(go, 600).
            // Poll until #printRoot has children, then capture.
            pdfWebViewRef.current?.injectJavaScript(`
              (function poll() {
                var root = document.getElementById('printRoot');
                if (root && root.children.length > 0) {
                  // Strip all <script> elements — content already in DOM
                  [].slice.call(document.querySelectorAll('script')).forEach(function(s) {
                    s.parentNode && s.parentNode.removeChild(s);
                  });
                  // একবারে পুরো (৭০+ পাতার) HTML postMessage করলে কম RAM-এর
                  // ফোনে bridge ওভারলোড হয়ে অ্যাপ ক্র্যাশ করে — তাই ছোট
                  // টুকরোয় ভেঙে পাঠানো হচ্ছে, React Native পাশে জোড়া লাগবে।
                  var __html = document.documentElement.outerHTML;
                  var __CHUNK = 200000;
                  var __total = Math.ceil(__html.length / __CHUNK) || 1;
                  for (var __c = 0; __c < __total; __c++) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'pdfStaticHtmlChunk',
                      i: __c, total: __total,
                      chunk: __html.substring(__c * __CHUNK, (__c + 1) * __CHUNK)
                    }));
                  }
                } else {
                  setTimeout(poll, 400);
                }
              })();
              true;
            `);
          }}
          onMessage={async (e) => {
            try {
              const m = JSON.parse(e.nativeEvent.data);
              if (m.type !== 'pdfStaticHtmlChunk') return;
              pdfChunksRef.current[m.i] = m.chunk;
              if (Object.keys(pdfChunksRef.current).length < m.total) return; // still waiting for more chunks
              const fullHtml = pdfChunksRef.current.join('');
              pdfChunksRef.current = [];
              setPdfRenderState(null);
              pdfBusyRef.current = false;
              const { uri } = await Print.printToFileAsync({ html: fullHtml, base64: false, width: 595, height: 842 });
              setPdfGenerating(false);
              haptics.success();
              Alert.alert(
                'PDF তৈরি হয়েছে',
                'কী করতে চান?',
                [
                  {
                    text: 'সংরক্ষণ করুন',
                    onPress: async () => {
                      try {
                        const { StorageAccessFramework } = FileSystem;
                        const perm = await StorageAccessFramework.requestDirectoryPermissionsAsync();
                        if (perm.granted) {
                          const destUri = await StorageAccessFramework.createFileAsync(
                            perm.directoryUri, 'MyAstrology_kundali.pdf', 'application/pdf'
                          );
                          const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                          await FileSystem.writeAsStringAsync(destUri, b64, { encoding: FileSystem.EncodingType.Base64 });
                          Alert.alert('সংরক্ষিত!', 'PDF ফোল্ডারে সেভ হয়েছে।');
                        }
                      } catch (_) {
                        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
                      }
                    },
                  },
                  {
                    text: 'শেয়ার করুন',
                    onPress: () => Sharing.shareAsync(uri, {
                      mimeType: 'application/pdf',
                      dialogTitle: 'কুণ্ডলী PDF শেয়ার করুন',
                      UTI: 'com.adobe.pdf',
                    }),
                  },
                  { text: 'বাতিল', style: 'cancel', onPress: () => { pdfBusyRef.current = false; } },
                ]
              );
            } catch (_) {
              haptics.error();
              setPdfRenderState(null);
              pdfBusyRef.current = false;
              setPdfGenerating(false);
            }
          }}
        />
      )}

      {/* ── PDF generation overlay — otherwise the wait (rendering 70+ pages,
           then handing off to expo-print) looks like the app has frozen ── */}
      {pdfGenerating && (
        <View style={s.pdfOverlay}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={s.pdfOverlayText}>PDF তৈরি হচ্ছে…{'\n'}একটু অপেক্ষা করুন</Text>
        </View>
      )}

      {/* ── Drawer ── */}
      {menuOpen && (
        <View style={s.drawerOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setMenuOpen(false)} activeOpacity={1} />
          <View style={[s.drawer, { paddingTop: insets.top + 8 }]}>
            <View style={s.drawerHeader}>
              <Text style={s.drawerTitle}>MENU</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={s.drawerDivider} />
            {MENU_ITEMS.map(item => (
              <TouchableOpacity key={item.tab} style={s.menuItem}
                onPress={() => { setMenuOpen(false); navigation.navigate(item.tab); }}
                activeOpacity={0.7}>
                <MaterialCommunityIcons name={item.icon} size={20} color={colors.primary} />
                <Text style={s.menuLabel}>{item.label}</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.headerBg,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.headerBorder,
  },
  logo:         { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.gold + 'AA' },
  headerCenter: { flex: 1, alignItems: 'center' },
  brand:        { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  tagline:      { fontSize: 9, color: colors.textSecondary, letterSpacing: 1.2, marginTop: 1,
                  fontFamily: 'NotoSerifBengali-Regular' },
  hamBtn:       { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  /* Content */
  content:   { flex: 1 },
  wv:        { flex: 1 },
  /* Off-screen hidden WebView for PDF rendering — real JS execution */
  pdfRenderer: { position: 'absolute', left: -9999, top: -9999, width: 1, height: 1, opacity: 0 },
  pdfOverlay: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(20,14,4,0.72)', zIndex: 200,
  },
  pdfOverlayText: {
    marginTop: 14, color: '#fff', fontSize: 15, textAlign: 'center', lineHeight: 22,
    fontFamily: 'NotoSerifBengali-Regular',
  },
  loadCenter: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadMsg: { marginTop: 12, color: colors.textSecondary, fontSize: 13,
             fontFamily: 'NotoSerifBengali-Regular' },

  /* Drawer */
  drawerOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row-reverse', zIndex: 100 },
  drawer: {
    width: '75%', backgroundColor: colors.card,
    paddingHorizontal: 18, paddingBottom: 32,
    borderLeftWidth: 1, borderLeftColor: colors.cardBorder,
    elevation: 16, shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.12, shadowRadius: 12,
  },
  drawerHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  drawerTitle:   { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  drawerDivider: { height: 1, backgroundColor: colors.cardBorder, marginBottom: 14 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  menuLabel: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600',
               fontFamily: 'NotoSerifBengali-Regular' },
});
