import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import html from '../web-html/prashna';
import { colors } from '../theme/colors';

const APP_CSS = `
/* ── Hide website chrome ── */
header.site-header,nav.nav,#navMenu,#navOverlay,.nav-overlay{display:none!important;}
.fab-wrap,.fab-bubble,#fabWrap,.wa-float,#btt{display:none!important;}
/* ── Hide hero & extras ── */
.hero{display:none!important;}
.cta-box,.whatsapp-cta,.btn-wa{display:none!important;}
.author-byline,.author-byline-bottom{display:none!important;}
#eeatSection,#seoSection,#faqSection{display:none!important;}
footer,.site-footer{display:none!important;}
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
.section-title,.card-title{
  font-size:.9rem!important;font-weight:700!important;color:#3a2218!important;
  margin:0 0 10px!important;padding-bottom:6px!important;
  border-bottom:1.5px solid #ede0ce!important;
  display:flex!important;align-items:center!important;gap:6px!important;
}
/* ── Fields ── */
.field{margin-bottom:10px!important;}
.field>label,.field>.lbl{font-size:.8rem!important;font-weight:600!important;color:#5c3d2e!important;display:block!important;margin-bottom:3px!important;}
/* ── Question input ── */
.inp-ctrl,input[type=text]{
  width:100%!important;padding:8px 10px!important;
  border:1.5px solid #e0cdbc!important;border-radius:9px!important;
  background:#fefcf9!important;font-size:.9rem!important;
  color:#3a2218!important;font-family:inherit!important;outline:none!important;
}
.inp-ctrl:focus,input[type=text]:focus{border-color:#c8a87a!important;box-shadow:0 0 0 3px rgba(200,168,122,.15)!important;}
/* ── Question type select ── */
.sel-ctrl,select{
  width:100%!important;padding:7px 8px!important;
  border:1.5px solid #e0cdbc!important;border-radius:9px!important;
  background:#fefcf9!important;font-size:.88rem!important;
  color:#3a2218!important;font-family:inherit!important;
}
/* ── Form dividers ── */
.form-sep{border:none!important;border-top:1px solid #ede0ce!important;margin:10px 0!important;}
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
.coord-row{display:flex!important;gap:8px!important;}
.coord-row .field{flex:1!important;margin-bottom:0!important;}
input[type=number]{
  width:100%!important;padding:7px 8px!important;
  border:1.5px solid #e0cdbc!important;border-radius:9px!important;
  background:#fefcf9!important;font-size:.88rem!important;
  color:#3a2218!important;font-family:inherit!important;
}
/* ── Button row ── */
.btn-row{margin-top:12px!important;}
.btn.btn-primary,#askBtn{
  width:100%!important;padding:12px 20px!important;background:#7a2e2e!important;
  color:#fff!important;border:none!important;border-radius:12px!important;
  font-size:.95rem!important;font-weight:700!important;font-family:inherit!important;
  cursor:pointer!important;display:flex!important;align-items:center!important;
  justify-content:center!important;gap:8px!important;
}
.btn.btn-primary:disabled,#askBtn:disabled{background:#bbb!important;cursor:not-allowed!important;}
/* ── Results section ── */
#resultsSection{margin-top:4px!important;}
.timestamp{font-size:.75rem!important;color:#8a6a50!important;margin-bottom:8px!important;}
/* ── Verdict card ── */
/* ── ফলাফল (উত্তর) কার্ড ──
   আগে: একটা ২.২rem ইমোজি সরাসরি কার্ডের উপর ভাসত, আর নিচের .verdict-text
   সব ক্ষেত্রেই গাঢ় বাদামি করা হতো — ফলে ওয়েবসাইটের সবুজ/কমলা/ধূসর/লাল
   অর্থপূর্ণ রঙগুলো (হ্যাঁ / হতে পারে / অনিশ্চিত / না) সম্পূর্ণ হারিয়ে যেত
   এবং "অনিশ্চিত"-এর নীলচে-ধূসর অ্যাপের উষ্ণ আইভরি থিমের সাথে বেমানান লাগত।
   এখন: ইমোজিটা একটা নরম রঙিন বৃত্তের ভিতরে বসানো (দুর্ঘটনাবশত পড়ে থাকা
   ইমোজির বদলে ইচ্ছাকৃত ব্যাজ মনে হয়), কার্ডের উপরে একটা রঙিন পটি, আর
   লেখাটা তার নিজস্ব অর্থপূর্ণ রঙেই — কিন্তু উষ্ণ, নরম সুরে। */
#verdictCard{background:#fff!important;border-radius:14px!important;border:1.5px solid #e0cdbc!important;margin-bottom:10px!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important;overflow:hidden!important;}
.verdict-card{padding:16px 16px 18px!important;text-align:center!important;border:none!important;border-top:4px solid var(--vc,#c8a87a)!important;background:linear-gradient(180deg,var(--vw,#fdf8f0),#fff 62%)!important;}
.verdict-icon{
  font-size:1.5rem!important;line-height:1!important;
  width:56px!important;height:56px!important;margin:0 auto 10px!important;
  display:flex!important;align-items:center!important;justify-content:center!important;
  border-radius:50%!important;background:#fff!important;
  border:2px solid var(--vc,#c8a87a)!important;
  box-shadow:0 2px 10px rgba(0,0,0,.08)!important;
}
.verdict-text{font-size:1.08rem!important;font-weight:700!important;line-height:1.4!important;color:var(--vc,#3a2218)!important;}
/* প্রতিটা ধরনের নিজস্ব রঙ — --vc: মূল রঙ, --vw: কার্ডের উপরের হালকা আভা */
.verdict-green {--vc:#1f7a4d;--vw:#eef9f2;}
.verdict-orange{--vc:#a85f12;--vw:#fdf5e6;}
.verdict-gray  {--vc:#7a6249;--vw:#faf6ee;}
.verdict-red   {--vc:#a33227;--vw:#fdf0ee;}
/* ── Score card ── */
.score-section{text-align:center!important;}
.score-label{margin-bottom:8px!important;}
.score-value-badge{display:inline-flex!important;background:#7a2e2e!important;color:#fff!important;padding:4px 14px!important;border-radius:20px!important;font-weight:700!important;}
.score-bar-bg{height:10px!important;background:#f0e4d4!important;border-radius:5px!important;overflow:hidden!important;margin-top:8px!important;}
.score-bar-fill{height:100%!important;background:linear-gradient(90deg,#c8a87a,#7a2e2e)!important;border-radius:5px!important;transition:width .6s!important;}
/* ── Detail & prediction cards ── */
.detail-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;}
.pred-box{background:#fdf8f3!important;border-radius:10px!important;border:1px solid #ede0ce!important;padding:12px!important;font-size:.85rem!important;line-height:1.7!important;color:#3a2218!important;}
/* ── গ্রহ-বিচার (কারণসমূহ) তালিকা ──
   এখানে বাঁ দিকের padding কমানো যাবে না। ওয়েবসাইটের পাতা প্রতিটা লাইনের
   আগে একটা ✦ চিহ্ন বসায় `position:absolute;left:8px` দিয়ে, আর লেখাটাকে
   `padding-left:30px` দিয়ে সরিয়ে রাখে। আগে এখানে `padding:5px 0` লেখা
   ছিল — চিহ্নটা তবু বাঁ দিকেই বসত, ফলে **চিহ্নটা লেখার উপরে চেপে বসে
   প্রথম অক্ষরগুলো ঢেকে দিত** ("মঙ্গল ৭ম ভাবে" → "ম✦ল ৭ম ভাবে")। */
.reasons-list{padding-left:0!important;list-style:none!important;}
.reasons-list li{
  padding:8px 12px 8px 30px!important;position:relative!important;
  font-size:.85rem!important;line-height:1.65!important;color:#3a2218!important;
  background:#fdf8f2!important;border-left:3px solid #b8860b!important;
  border-radius:0 8px 8px 0!important;margin-bottom:7px!important;
}
.reasons-list li::before{left:10px!important;top:9px!important;color:#b8860b!important;}
/* ── Reset button ── */
.btn.btn-reset{
  width:100%!important;padding:12px 20px!important;background:#fff!important;
  color:#7a2e2e!important;border:1.5px solid #7a2e2e!important;
  border-radius:12px!important;font-weight:600!important;font-family:inherit!important;
  cursor:pointer!important;margin-top:8px!important;
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
  var st=document.getElementById('__prNative__');
  if(!st){st=document.createElement('style');st.id='__prNative__';document.head.appendChild(st);}
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
            if(typeof validatePrashnaForm==='function')validatePrashnaForm();
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
            if(typeof validatePrashnaForm==='function')validatePrashnaForm();
          });
          sugg.appendChild(li);
        });
        sugg.style.display='block';
      });
      document.addEventListener('click',function(e){
        if(!inp.contains(e.target)&&!sugg.contains(e.target))sugg.style.display='none';
      });
    }
    /* Hide form when results appear */
    var prForm=document.getElementById('formSection');
    var prRes=document.getElementById('resultsSection');
    if(prRes){
      var prSync=function(){
        var v=prRes.style.display==='block';
        if(prForm)prForm.style.cssText=v?'display:none!important':'';
      };
      prSync();
      new MutationObserver(prSync).observe(prRes,{attributes:true,attributeFilter:['style']});
    }
  },500);
})();true;`;
}

const INJECTED_JS = buildInjectedJS(APP_CSS);

export function PrashnaScreen() {
  return (
    <View style={s.root}>
      <AppHeader />
      <LocalWebView name="prashna" html={html} style={s.wv} injectedJS={INJECTED_JS} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
