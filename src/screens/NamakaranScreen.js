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
/* ── Hero banner — was hidden entirely; restyled+shown instead so the screen
   opens with the same "premium" gold/navy banner the website has ── */
.hero{
  display:block!important;
  text-align:center!important;padding:1rem 1rem .9rem!important;
  background:linear-gradient(168deg,#080e1e 0%,#0f1e3a 30%,#1e0830 65%,#2c0808 100%)!important;
  border-radius:16px!important;margin-bottom:10px!important;
  box-shadow:0 6px 28px rgba(0,0,0,.45)!important;position:relative!important;overflow:hidden!important;
  border:1px solid rgba(212,175,55,.18)!important;
}
.hero-stars{font-size:.6rem!important;color:rgba(255,215,0,.35)!important;letter-spacing:.5em!important;margin-bottom:.35rem!important;display:block!important;}
.hero-om{font-size:1.25rem!important;color:rgba(255,215,0,.55)!important;line-height:1!important;margin-bottom:.05rem!important;}
.hero-mantra{font-size:.58rem!important;color:rgba(255,200,130,.4)!important;letter-spacing:.16em!important;margin-bottom:.4rem!important;}
.hero h1{font-size:1.35rem!important;color:#ffd700!important;line-height:1.2!important;margin-bottom:.35rem!important;}
.hero-baby-wrap{margin:.1rem auto .35rem!important;position:relative!important;display:inline-block!important;}
.hero-baby-img{width:64px!important;height:64px!important;border-radius:50%!important;object-fit:cover!important;object-position:center 15%!important;border:3px solid rgba(255,215,0,.6)!important;box-shadow:0 0 0 4px rgba(255,215,0,.1),0 0 18px rgba(255,215,0,.22)!important;display:block!important;}
.hero-baby-wrap::after{content:'✦'!important;position:absolute!important;bottom:-2px!important;right:-2px!important;width:18px!important;height:18px!important;background:rgba(255,215,0,.9)!important;border-radius:50%!important;font-size:.42rem!important;display:flex!important;align-items:center!important;justify-content:center!important;color:#5c3000!important;font-weight:900!important;}
.hero-rule{display:flex!important;align-items:center!important;gap:.5rem!important;justify-content:center!important;margin:.3rem 0 .45rem!important;}
.hero-rule::before,.hero-rule::after{content:''!important;flex:1!important;max-width:55px!important;height:1px!important;background:linear-gradient(90deg,transparent,rgba(212,175,55,.45))!important;}
.hero-rule::after{background:linear-gradient(90deg,rgba(212,175,55,.45),transparent)!important;}
.hero-rule span{color:rgba(212,175,55,.55)!important;font-size:.55rem!important;letter-spacing:.2em!important;}
.hero .subtitle{font-size:.8rem!important;color:#8fabc8!important;line-height:1.65!important;margin-bottom:.55rem!important;}
.hero-eyebrow{font-size:.62rem!important;color:rgba(140,160,190,.45)!important;letter-spacing:.1em!important;text-transform:uppercase!important;}
/* ── গণেশ প্রণাম কার্ড — এটাও অস্টাইল করা ছিল, সাদামাটা লেখা দেখাচ্ছিল ── */
.ganesh-card{display:flex!important;align-items:center!important;background:#FFFCF8!important;border:1.5px solid #D4AF37!important;border-radius:14px!important;overflow:hidden!important;box-shadow:0 2px 16px rgba(180,140,30,.22)!important;margin-bottom:10px!important;position:relative!important;}
.gc-left{background:linear-gradient(160deg,#FEF9F0,#FDF0DE)!important;padding:.9rem .8rem!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:.25rem!important;min-width:70px!important;flex-shrink:0!important;border-right:1px dashed #D4AF37!important;}
.gc-om{font-size:1.8rem!important;color:#7B241C!important;line-height:1!important;}
.gc-lotus{width:34px!important;height:34px!important;border-radius:50%!important;background:radial-gradient(circle,#fff8ee,#f5cba7)!important;border:1.5px solid #D4AF37!important;display:flex!important;align-items:center!important;justify-content:center!important;margin-top:.2rem!important;}
.gc-right{padding:.8rem 1rem!important;flex:1!important;min-width:0!important;}
.gc-title{font-size:.95rem!important;font-weight:700!important;color:#7B241C!important;margin-bottom:.18rem!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
.gc-sub{font-size:.78rem!important;font-weight:700!important;color:#B9770E!important;margin-bottom:.18rem!important;}
.gc-attr{font-size:.72rem!important;color:#6E2C00!important;line-height:1.4!important;margin-bottom:.25rem!important;}
.gc-sans{font-size:.8rem!important;color:#9C640C!important;font-weight:700!important;letter-spacing:.12em!important;}
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
/* ── Hide booking/payment overlays (outside main) ── */
#book-overlay,#book-modal,#rzp-success-overlay,#rzp-success-modal{display:none!important;}
.field:has(#tzOffset){display:none!important;}
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
.form-sub-label{display:none!important;}
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
/* ── জন্মকালীন পঞ্চাঙ্গ লিস্ট, নামকরণ সার্টিফিকেট, নক্ষত্র/পাদ কার্ড —
   এই ক্লাসগুলোর CSS-ই বান্ডেলড কপিতে ছিল না (ওয়েবসাইটে root CSS ভ্যারিয়েবলও
   অনুপস্থিত এখানে, তাই var(--gold) ইত্যাদির বদলে সরাসরি রং ব্যবহার করা হয়েছে),
   তাই ফলাফল একটা সাদামাটা বুলেট-লিস্ট হিসেবে দেখাচ্ছিল। ── */
.pan-list{list-style:none!important;margin-bottom:.7rem!important;border:1px solid #ddd0b5!important;border-radius:12px!important;overflow:hidden!important;box-shadow:0 2px 8px rgba(184,134,11,.07)!important;}
.pan-list li{display:flex!important;justify-content:space-between!important;align-items:center!important;padding:.55rem .9rem!important;border-bottom:1px solid #ede4d0!important;}
.pan-list li:last-child{border-bottom:none!important;}
.pan-list li:nth-child(odd){background:#fffdf6!important;}
.pan-list li:nth-child(even){background:#fff!important;}
.pan-list .pl-label{font-size:.8rem!important;color:#8b6914!important;font-weight:700!important;letter-spacing:.02em!important;}
.pan-list .pl-val{font-size:.88rem!important;font-weight:700!important;color:#2c1810!important;text-align:right!important;max-width:60%!important;}
.nama-cert{background:linear-gradient(170deg,#fffdf5 0%,#fef8e7 50%,#fdf3d8 100%)!important;border:2px solid #d4af37!important;border-radius:18px!important;padding:0 0 .75rem!important;text-align:center!important;margin-bottom:1rem!important;position:relative!important;overflow:hidden!important;box-shadow:0 4px 28px rgba(180,140,30,.18),0 1px 4px rgba(180,140,30,.12)!important;}
.nc-header-band{background:linear-gradient(135deg,#7a2000 0%,#5c1500 100%)!important;padding:.5rem 1rem .45rem!important;margin-bottom:.6rem!important;}
.nc-eyebrow{font-size:.58rem!important;color:rgba(255,230,180,.65)!important;letter-spacing:.18em!important;text-transform:uppercase!important;font-weight:700!important;margin-bottom:.2rem!important;}
.nc-name{font-size:.9rem!important;color:#ffe8b0!important;font-weight:800!important;letter-spacing:.04em!important;}
.nc-nak{font-size:.78rem!important;color:#2c1200!important;background:rgba(255,215,0,.15)!important;border:1px solid rgba(212,175,55,.4)!important;border-radius:20px!important;display:inline-block!important;padding:.15rem .65rem!important;margin:.3rem 0 .2rem!important;font-weight:700!important;}
.nc-sep{font-size:.62rem!important;color:#a07820!important;letter-spacing:.12em!important;text-transform:uppercase!important;font-weight:700!important;margin:.2rem 0 .35rem!important;display:flex!important;align-items:center!important;gap:.4rem!important;justify-content:center!important;padding:0 1rem!important;}
.nc-sep::before,.nc-sep::after{content:''!important;flex:1!important;height:1px!important;background:linear-gradient(90deg,transparent,#d4af37,transparent)!important;}
.letter-ring{display:flex!important;align-items:center!important;justify-content:center!important;width:96px!important;height:96px!important;border-radius:50%!important;border:3px solid #d4af37!important;box-shadow:0 0 0 5px rgba(212,175,55,.12),0 0 0 8px rgba(212,175,55,.05),0 4px 18px rgba(180,140,30,.22)!important;margin:0 auto .35rem!important;background:radial-gradient(circle,#fff8e8 0%,#fff3d0 60%,#ffe8a0 100%)!important;position:relative!important;}
.rh-syllable{font-size:3rem!important;color:#7a2000!important;font-weight:700!important;line-height:1!important;letter-spacing:.05em!important;text-shadow:0 2px 8px rgba(122,32,0,.2)!important;}
.rh-syllable-en{font-size:.85rem!important;color:#8b5c00!important;letter-spacing:.22em!important;margin-bottom:.35rem!important;font-weight:700!important;}
.rh-tagline{font-size:.74rem!important;color:#5c3500!important;line-height:1.45!important;letter-spacing:.01em!important;background:rgba(212,175,55,.1)!important;border:1px solid rgba(212,175,55,.3)!important;border-radius:14px!important;display:inline-block!important;padding:.2rem .75rem!important;margin:0 .8rem!important;}
.nc-seo-note{font-size:.62rem!important;color:#a07830!important;margin-top:.45rem!important;letter-spacing:.02em!important;line-height:1.55!important;opacity:.65!important;}
.desc-box{background:linear-gradient(135deg,#fffef5 0%,#fdf8ed 100%)!important;border:1px solid #e0cda0!important;border-left:5px solid #b8860b!important;border-radius:12px!important;padding:1rem 1rem 1rem 1.2rem!important;margin-bottom:.8rem!important;font-size:.9rem!important;line-height:1.85!important;color:#2c1810!important;position:relative!important;}
.desc-box::before{content:'❝'!important;position:absolute!important;top:-6px!important;left:10px!important;font-size:2.2rem!important;color:rgba(184,134,11,.18)!important;line-height:1!important;}
.nak-detail-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:.5rem!important;margin-bottom:.8rem!important;}
.nd-item{background:#fff!important;border:1px solid #e8d5b0!important;border-top:3px solid #b8860b!important;border-radius:10px!important;padding:.65rem .8rem!important;}
.nd-item .nd-label{font-size:.7rem!important;color:#8b6914!important;font-weight:700!important;letter-spacing:.02em!important;margin-bottom:.2rem!important;}
.nd-item .nd-val{font-size:.88rem!important;color:#2c1810!important;font-weight:700!important;line-height:1.35!important;}
.nd-desc{font-size:.78rem!important;font-weight:400!important;color:#6b4400!important;margin-top:.3rem!important;line-height:1.5!important;}
.pada-list{display:flex!important;flex-wrap:wrap!important;gap:.55rem!important;margin-bottom:.6rem!important;}
.pada-bubble{display:flex!important;flex-direction:column!important;align-items:center!important;background:#fff!important;border:2px solid #e0cdb5!important;border-radius:14px!important;padding:.55rem .75rem!important;min-width:64px!important;}
.pada-bubble.active{border-color:#b8860b!important;background:linear-gradient(135deg,#fff9e6 0%,#fff4ca 100%)!important;box-shadow:0 4px 14px rgba(184,134,11,.22)!important;}
.pada-bubble .pb-num{font-size:.6rem!important;color:#8b6914!important;font-weight:700!important;margin-bottom:.12rem!important;letter-spacing:.04em!important;}
.pada-bubble .pb-bn{font-size:1.5rem!important;color:#3d1f0a!important;font-weight:700!important;line-height:1!important;}
.pada-bubble.active .pb-bn{color:#8b5e0a!important;}
.pada-bubble .pb-en{font-size:.65rem!important;color:#a07830!important;margin-top:.1rem!important;font-weight:600!important;}
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
    /* Hide orphan elements outside hero/formSection/resultSection */
    var pw=document.querySelector('main.p-wrap');
    if(pw){Array.from(pw.children).forEach(function(el){
      if(el.id!=='formSection'&&el.id!=='resultSection'&&!el.classList.contains('hero'))el.style.cssText='display:none!important';
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
