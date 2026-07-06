import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import html from '../web-html/varshaphala';
import { colors } from '../theme/colors';

const APP_CSS = `
/* ── Hide website chrome ── */
header.site-header,nav.nav,#navMenu,#navOverlay,.nav-overlay{display:none!important;}
.fab-wrap,.fab-bubble,#fabWrap,#fabItems,.fab-overlay,.wa-float,#btt{display:none!important;}
/* ── Hide hero & extra sections ── */
.hero-banner{display:none!important;}
.author-byline{display:none!important;}
.whatsapp-cta{display:none!important;}
.disclaimer{display:none!important;}
#seoSection,#eeatSection,#faqSection{display:none!important;}
footer,.site-footer{display:none!important;}
/* ── Hide second card (info card "বর্ষফল কী?") ── */
div.k-wrap#inputSection .card:last-child{display:none!important;}
/* ── Page base ── */
html{height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none!important;max-width:100vw!important;}
body{height:auto!important;min-height:100vh!important;background:#FAF8F3!important;padding:0!important;margin:0!important;overflow-x:hidden!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
*{-webkit-tap-highlight-color:transparent!important;box-sizing:border-box!important;}
/* ── Outer container ── */
div.k-wrap{padding:6px 12px 20px!important;}
/* ── Form card ── */
.card{
  background:#fff!important;border-radius:14px!important;
  border:1.5px solid #e0cdbc!important;padding:12px!important;
  box-shadow:0 2px 8px rgba(0,0,0,.06)!important;margin-bottom:10px!important;
}
.section-title{
  font-size:.9rem!important;font-weight:700!important;color:#3a2218!important;
  margin:0 0 10px!important;padding-bottom:6px!important;
  border-bottom:1.5px solid #ede0ce!important;
  display:flex!important;align-items:center!important;gap:6px!important;
}
/* ── Field groups ── */
.ig{margin-bottom:8px!important;}
label{font-size:.8rem!important;font-weight:600!important;color:#5c3d2e!important;display:block!important;margin-bottom:3px!important;}
/* ── Name input ── */
#userName{
  width:100%!important;padding:8px 10px!important;
  border:1.5px solid #e0cdbc!important;border-radius:9px!important;
  background:#fefcf9!important;font-size:.9rem!important;
  color:#3a2218!important;font-family:inherit!important;outline:none!important;
}
#userName:focus{border-color:#c8a87a!important;box-shadow:0 0 0 3px rgba(200,168,122,.15)!important;}
/* ── Selects ── */
.sel-ctrl,select{
  width:100%!important;padding:7px 8px!important;
  border:1.5px solid #e0cdbc!important;border-radius:9px!important;
  background:#fefcf9!important;font-size:.85rem!important;
  color:#3a2218!important;font-family:inherit!important;
}
/* ── Date/time/tz row ── */
.dob-row,.tob-row{display:flex!important;gap:5px!important;}
.dob-row .sel-ctrl,.tob-row .sel-ctrl{flex:1!important;}
/* ── City search ── */
.city-wrap{position:relative!important;}
.city-wrap>div{display:flex!important;gap:5px!important;align-items:center!important;margin-bottom:3px!important;}
#citySearch{
  flex:1!important;padding:7px 8px!important;
  border:1.5px solid #e0cdbc!important;border-radius:9px!important;
  background:#fefcf9!important;font-size:.85rem!important;
  color:#3a2218!important;font-family:inherit!important;outline:none!important;
}
.city-wrap button{
  background:#7a2e2e!important;border:none!important;border-radius:9px!important;
  padding:0 10px!important;cursor:pointer!important;flex-shrink:0!important;
  min-width:40px!important;min-height:40px!important;font-size:1rem!important;
  display:flex!important;align-items:center!important;justify-content:center!important;
}
.suggestions{
  position:absolute!important;z-index:999!important;background:#fff!important;
  border:1.5px solid #e0cdbc!important;border-radius:10px!important;
  list-style:none!important;margin:2px 0 0!important;padding:0!important;
  width:100%!important;box-shadow:0 4px 14px rgba(0,0,0,.12)!important;
  max-height:200px!important;overflow-y:auto!important;
}
.suggestions li{padding:9px 12px!important;cursor:pointer!important;border-bottom:1px solid #f0e8d8!important;font-size:.85rem!important;color:#3a2218!important;}
/* ── Lat/lon inputs ── */
#lat,#lon{
  width:100%!important;padding:7px 8px!important;
  border:1.5px solid #e0cdbc!important;border-radius:9px!important;
  background:#fefcf9!important;font-size:.85rem!important;
  color:#3a2218!important;font-family:inherit!important;
}
/* ── Year radio — horizontal row ── */
.radio-row,.year-options,.radio-group{display:flex!important;flex-direction:row!important;gap:6px!important;margin-top:4px!important;}
.radio-row>label,.year-options>label{
  flex:1!important;display:flex!important;align-items:center!important;gap:6px!important;
  background:#fefcf9!important;border:1.5px solid #e0cdbc!important;
  border-radius:9px!important;padding:8px 10px!important;
  font-size:.85rem!important;font-weight:500!important;color:#3a2218!important;
  cursor:pointer!important;
}
/* Override inline styles on year option labels */
label:has(#year2026),label:has(#year2027){
  flex:1!important;padding:8px 10px!important;font-size:.85rem!important;
  border-radius:9px!important;border:1.5px solid #e0cdbc!important;
}
div:has(#year2026){
  flex-direction:row!important;gap:6px!important;
}
/* ── Calculate button ── */
.btn-row{margin-top:10px!important;}
.btn.btn-primary,#calcBtn{
  width:100%!important;padding:12px 20px!important;background:#7a2e2e!important;
  color:#fff!important;border:none!important;border-radius:12px!important;
  font-size:.95rem!important;font-weight:700!important;font-family:inherit!important;
  cursor:pointer!important;display:flex!important;align-items:center!important;
  justify-content:center!important;gap:8px!important;
}
.btn.btn-primary:disabled,#calcBtn:disabled{background:#bbb!important;cursor:not-allowed!important;opacity:.7!important;}
/* ── Results area ── */
#resultsArea{padding:0!important;}
.result-header{background:#fff!important;border-radius:14px!important;border:1.5px solid #e0cdbc!important;padding:14px!important;margin-bottom:10px!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important;}
.person-name{font-size:1.05rem!important;font-weight:700!important;color:#3a2218!important;}
.year-badge{display:inline-flex!important;align-items:center!important;background:#7a2e2e!important;color:#ffd700!important;padding:4px 12px!important;border-radius:20px!important;font-weight:700!important;font-size:.85rem!important;margin-top:6px!important;}
/* ── Prediction box ── */
.prediction-box{background:#fdf8f3!important;border-radius:10px!important;border:1px solid #ede0ce!important;padding:12px!important;font-size:.85rem!important;line-height:1.7!important;color:#3a2218!important;}
/* ── Lord/muntha cards ── */
.lord-card,.muntha-card{background:#fdf8f3!important;border-radius:10px!important;border:1px solid #ede0ce!important;padding:12px!important;margin-bottom:10px!important;}
.lord-planet,.muntha-rashi{font-size:1.05rem!important;font-weight:700!important;color:#7a2e2e!important;}
.effect-badge{display:inline-flex!important;background:#7a2e2e!important;color:#fff!important;padding:2px 10px!important;border-radius:12px!important;font-size:.78rem!important;margin-left:8px!important;}
/* ── Tables ── */
table{display:table!important;width:100%!important;border-collapse:collapse!important;font-size:.82rem!important;}
thead{display:table-header-group!important;}tbody{display:table-row-group!important;}
tr{display:table-row!important;}
th,td{display:table-cell!important;padding:6px 8px!important;vertical-align:middle!important;}
th{background:#7a2e2e!important;color:#fff!important;font-size:.76rem!important;text-align:left!important;font-weight:600!important;}
td{border-bottom:1px solid #f0e4d4!important;color:#2c1a0e!important;}
tr:nth-child(even) td{background:#fdf8f3!important;}
/* ── Back button ── */
.btn.btn-secondary{
  padding:10px 20px!important;background:#fff!important;
  color:#7a2e2e!important;border:1.5px solid #7a2e2e!important;
  border-radius:10px!important;font-weight:600!important;font-family:inherit!important;
}
`;

function buildInjectedJS(css) {
  return `(function(){
  var st=document.getElementById('__vpNative__');
  if(!st){st=document.createElement('style');st.id='__vpNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};
  setTimeout(function(){
    /* GPS fallback */
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
    /* City search fallback */
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
  },500);
})();true;`;
}

const INJECTED_JS = buildInjectedJS(APP_CSS);

export function VarshaphalaScreen() {
  return (
    <View style={s.root}>
      <AppHeader />
      <LocalWebView name="varshaphala" html={html} style={s.wv} injectedJS={INJECTED_JS} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
