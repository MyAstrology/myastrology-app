import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import html from '../web-html/namakaran';
import { colors } from '../theme/colors';

const APP_CSS = `
/* ── Hide website chrome ── */
header.site-header,nav.nav,#navMenu,#navOverlay,.nav-overlay{display:none!important;}
.fab-wrap,.fab-bubble,#fabWrap,.wa-float,#btt{display:none!important;}
/* ── Hide hero & extras ── */
.hero{display:none!important;}
.related-links{display:none!important;}
.cta-box{display:none!important;}
.disclaimer{display:none!important;}
.author-byline,.author-byline-bottom{display:none!important;}
#eeatSection,#seoSection,#faqSection{display:none!important;}
footer,.site-footer{display:none!important;}
/* ── Hide extra form content ── */
#formSection > div:first-child{display:none!important;}
#formSection .card p{display:none!important;}
.city-wrap>label{display:none!important;}
/* ── Initially hide result section (shown by website JS on calculate) ── */
#resultSection{display:none;}
/* ── Hide promo/cross-sell cards inside results ── */
.card:has(#kundaliLink){display:none!important;}
.card:has(.related-links){display:none!important;}
.card:has(.share-row){display:none!important;}
/* ── Hide SEO article & disclaimer ── */
article.seo-article{display:none!important;}
/* ── Page base ── */
html{height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none!important;max-width:100vw!important;}
body{height:auto!important;min-height:100vh!important;background:#FAF8F3!important;padding:0!important;margin:0!important;overflow-x:hidden!important;}
main.p-wrap{max-width:100%!important;padding:6px 12px 20px!important;margin:0!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
*{-webkit-tap-highlight-color:transparent!important;box-sizing:border-box!important;}
/* ── Form card ── */
.card{
  background:#fff!important;border-radius:14px!important;
  border:1.5px solid #e0cdbc!important;padding:12px!important;
  box-shadow:0 2px 8px rgba(0,0,0,.06)!important;margin-bottom:10px!important;
}
.card-title{
  font-size:.9rem!important;font-weight:700!important;color:#3a2218!important;
  margin:0 0 10px!important;padding-bottom:6px!important;
  border-bottom:1.5px solid #ede0ce!important;
  display:flex!important;align-items:center!important;gap:6px!important;
}
/* ── Fields — compact ── */
.field{margin-bottom:8px!important;}
.field>label,.field>.lbl{font-size:.8rem!important;font-weight:600!important;color:#5c3d2e!important;display:block!important;margin-bottom:3px!important;}
/* ── Name input ── */
.inp-ctrl,input[type=text]{
  width:100%!important;padding:8px 10px!important;
  border:1.5px solid #e0cdbc!important;border-radius:9px!important;
  background:#fefcf9!important;font-size:.9rem!important;
  color:#3a2218!important;font-family:inherit!important;outline:none!important;
}
.inp-ctrl:focus,input[type=text]:focus{border-color:#c8a87a!important;box-shadow:0 0 0 3px rgba(200,168,122,.15)!important;}
/* ── Gender radio ── */
.gender-row{display:flex!important;gap:6px!important;margin-top:3px!important;}
.gender-opt{
  flex:1!important;display:flex!important;align-items:center!important;gap:4px!important;
  background:#fefcf9!important;border:1.5px solid #e0cdbc!important;
  border-radius:9px!important;padding:5px 8px!important;
  cursor:pointer!important;font-size:.8rem!important;font-weight:500!important;
  color:#3a2218!important;
}
.gender-opt.selected,.gender-opt:has(input:checked){
  border-color:#7a2e2e!important;background:#fdf1ec!important;color:#7a2e2e!important;
}
.gender-opt input[type=radio]{display:none!important;}
/* ── Form dividers ── */
.form-sep{border:none!important;border-top:1px solid #ede0ce!important;margin:8px 0!important;}
.form-sub-label{
  font-size:.8rem!important;font-weight:700!important;color:#5c3d2e!important;
  margin-bottom:6px!important;display:flex!important;align-items:center!important;gap:5px!important;
}
/* ── Date/time input rows ── */
.input-row,.input-row2{display:flex!important;gap:5px!important;}
.input-row .sel-ctrl,.input-row2 .sel-ctrl{flex:1!important;}
/* ── Selects ── */
.sel-ctrl,select{
  width:100%!important;padding:7px 8px!important;
  border:1.5px solid #e0cdbc!important;border-radius:9px!important;
  background:#fefcf9!important;font-size:.85rem!important;
  color:#3a2218!important;font-family:inherit!important;
}
/* ── City search ── */
.city-wrap{position:relative!important;}
.city-row{display:flex!important;gap:5px!important;align-items:center!important;margin-bottom:3px!important;}
.city-row .inp-ctrl{flex:1!important;}
.gps-btn{
  background:#7a2e2e!important;border:none!important;border-radius:9px!important;
  padding:0 10px!important;cursor:pointer!important;flex-shrink:0!important;
  min-width:40px!important;min-height:40px!important;font-size:1rem!important;
  display:flex!important;align-items:center!important;justify-content:center!important;
  color:#fff!important;
}
.gps-msg{font-size:.75rem!important;color:#5c3d2e!important;display:block!important;min-height:1.1em!important;}
.suggestions{
  position:absolute!important;z-index:999!important;background:#fff!important;
  border:1.5px solid #e0cdbc!important;border-radius:10px!important;
  list-style:none!important;margin:2px 0 0!important;padding:0!important;
  width:100%!important;box-shadow:0 4px 14px rgba(0,0,0,.12)!important;
  max-height:200px!important;overflow-y:auto!important;
}
.suggestions li{padding:9px 12px!important;cursor:pointer!important;border-bottom:1px solid #f0e8d8!important;font-size:.85rem!important;color:#3a2218!important;}
/* ── Lat/lon ── */
input[type=number]{
  width:100%!important;padding:7px 8px!important;
  border:1.5px solid #e0cdbc!important;border-radius:9px!important;
  background:#fefcf9!important;font-size:.88rem!important;
  color:#3a2218!important;font-family:inherit!important;
}
/* ── Button row ── */
.btn-row{display:flex!important;gap:8px!important;margin-top:10px!important;}
.btn-primary{
  flex:1!important;padding:12px 14px!important;background:#7a2e2e!important;
  color:#fff!important;border:none!important;border-radius:12px!important;
  font-size:.92rem!important;font-weight:700!important;font-family:inherit!important;
  cursor:pointer!important;display:flex!important;align-items:center!important;
  justify-content:center!important;gap:6px!important;
}
.btn-primary:disabled{background:#bbb!important;cursor:not-allowed!important;}
.btn-reset,.btn-secondary{
  padding:12px 14px!important;background:#fff!important;
  color:#7a2e2e!important;border:1.5px solid #7a2e2e!important;
  border-radius:12px!important;font-weight:600!important;font-family:inherit!important;
  cursor:pointer!important;
}
/* ── Result section ── */
#resultSection{margin-top:8px!important;}
.result-card,.result-box{background:#fff!important;border-radius:14px!important;border:1.5px solid #e0cdbc!important;padding:14px!important;margin-bottom:10px!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important;}
.result-title,.res-title{font-size:.92rem!important;font-weight:700!important;color:#3a2218!important;margin:0 0 8px!important;padding-bottom:6px!important;border-bottom:1.5px solid #ede0ce!important;}
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
  var st=document.getElementById('__nmNative__');
  if(!st){st=document.createElement('style');st.id='__nmNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};
  setTimeout(function(){
    /* Populate selects if not already filled */
    var d=document.getElementById('dobDay');
    if(d&&d.options.length<=1){for(var i=1;i<=31;i++){var o=document.createElement('option');o.value=i;o.textContent=i;d.appendChild(o);}}
    var mo=document.getElementById('dobMonth');
    if(mo&&mo.options.length<=1){
      ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর']
      .forEach(function(m,i){var o=document.createElement('option');o.value=i+1;o.textContent=m;mo.appendChild(o);});
    }
    var y=document.getElementById('dobYear');
    if(y&&y.options.length<=1){var cy=new Date().getFullYear();for(var yr=cy;yr>=1900;yr--){var o=document.createElement('option');o.value=yr;o.textContent=yr;y.appendChild(o);}}
    var h=document.getElementById('tobHour');
    if(h&&h.options.length<=1){for(var hh=0;hh<24;hh++){var o=document.createElement('option');o.value=hh;o.textContent=String(hh).padStart(2,'0')+':00';h.appendChild(o);}}
    var mn=document.getElementById('tobMin');
    if(mn&&mn.options.length<=1){for(var mm=0;mm<60;mm++){var o=document.createElement('option');o.value=mm;o.textContent=String(mm).padStart(2,'0');mn.appendChild(o);}}
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
    /* Hide orphan elements outside formSection/resultSection */
    var pw=document.querySelector('main.p-wrap');
    if(pw){Array.from(pw.children).forEach(function(el){
      if(el.id!=='formSection'&&el.id!=='resultSection')el.style.cssText='display:none!important';
    });}
    /* Hide form when results appear */
    var nmForm=document.getElementById('formSection');
    var nmRes=document.getElementById('resultSection');
    if(nmRes){
      var nmSync=function(){
        var v=nmRes.style.display==='block';
        if(nmForm)nmForm.style.cssText=v?'display:none!important':'';
      };
      nmSync();
      new MutationObserver(nmSync).observe(nmRes,{attributes:true,attributeFilter:['style']});
    }
  },500);
})();true;`;
}

const INJECTED_JS = buildInjectedJS(APP_CSS);

export function NamakaranScreen() {
  return (
    <View style={s.root}>
      <AppHeader />
      <LocalWebView name="namakaran" html={html} style={s.wv} injectedJS={INJECTED_JS} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
