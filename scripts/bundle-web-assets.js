#!/usr/bin/env node
/**
 * Bundles website HTML pages (from the sibling `services` repo) into JS
 * modules that export the HTML as a string, for the app's WebView screens.
 *
 * Usage: node scripts/bundle-web-assets.js
 * Output: src/web-html/*.js  (each exports a string)
 *
 * ⚠️  SAFETY — READ BEFORE RUNNING bundle() FOR ANY PAGE OTHER THAN panjika:
 * kundali/match-making/namakaran/numerology/varshaphala/prashna/
 * match-making-print all have substantial HAND-APPLIED patches sitting on
 * top of a raw bundle — image embeds (offline pages can't resolve relative
 * paths), hero/chrome restoration, PDF export pipelines, Razorpay payment
 * wiring, screen-navigation bridging. None of that is reproducible by
 * re-running this script from scratch. Blindly calling bundle() for those
 * pages WILL SILENTLY DESTROY that work.
 *
 * Safe way to pull in a website change for an already-hand-patched page:
 * generate a throwaway regen to a scratch dir, diff it against the current
 * bundle, and hand-apply only the specific, verified-safe delta (e.g. an
 * icon SVG swap) directly onto the existing bundle file — never overwrite
 * it wholesale. panjika.html has no such patches, so it's the one page
 * that's safe to fully regenerate this way.
 */

const fs   = require('fs');
const path = require('path');

const WEBSITE_DIR = path.resolve(__dirname, '..', '..', 'services');
const OUTPUT_DIR  = path.resolve(__dirname, '..', 'src', 'web-html');

const APP_CSS = `<meta name="color-scheme" content="light">
<style id="__app_mode__">
:root{color-scheme:light;}
.topbar,.sidenav,.sidenav-overlay,#topbar,#sideNav,#navOverlay,
.site-header,.nav,.nav-overlay,
.pay-overlay,#pdfPromoOverlay,
.push-btn,.share-row,.social-share,
.about-topbar,.hero{display:none!important;}
body{padding-top:0!important;margin-top:0!important;color-scheme:light;}
/* ফর্মের নিচে ফাঁকা জায়গা এড়াতে সাধারণ (kundali/namakaran/match-making/
   prashna/varshaphala-স্টাইল) footer-কে সম্পূর্ণ লুকানোর বদলে শুধু ব্র্যান্ড/
   ফোন লাইনটা (প্রথম child) রেখে বাকি (nav-links, social icons, copyright)
   লুকানো হচ্ছে — এতে নিচে একটা ছোট সৌজন্যমূলক স্ট্রিপ থাকে, পুরো ফাঁকা পাতা না।
   numerology.html-এর মতো বড়/multi-column (.fg) footer এখনও পুরো লুকানো থাকে
   (relative/external লিংকে ভরা, অ্যাপে অপ্রাসঙ্গিক ও অসামঞ্জস্যপূর্ণ)। */
.site-footer:not(:has(.fg)){display:block!important;background:#FAF8F3!important;color:#6b5a42!important;}
.site-footer:not(:has(.fg)) > div:nth-child(n+2){display:none!important;}
.site-footer:has(.fg),footer:not(.site-footer){display:none!important;}
/* ব্র্যান্ড-নাম লাইনটার নিজস্ব inline color (#c8d8f0) গাঢ় নেভি ব্যাকগ্রাউন্ডের
   জন্য বানানো — আমরা footer-কে হালকা/আইভরি রাখছি বলে সেই ফ্যাকাশে রংটা এখানে
   প্রায় অদৃশ্য হয়ে যেত ("ঘুমন্ত" দেখাচ্ছিল), তাই গাঢ় রঙে override করা হলো। */
.site-footer:not(:has(.fg)) > div:first-child > div:nth-child(2){color:#3a2218!important;}
.pj-tabs{top:0!important;position:sticky;}
.k-tabs,.kundali-tabs{top:0!important;}
#tabNav{top:0!important;}
svg.label-icon{width:14px!important;height:14px!important;min-width:14px!important;max-width:14px!important;fill:none!important;flex-shrink:0!important}
svg.title-icon{width:20px!important;height:20px!important;min-width:20px!important;max-width:20px!important;fill:none!important;flex-shrink:0!important}
svg.tab-icon{width:18px!important;height:18px!important;min-width:18px!important;max-width:18px!important;flex-shrink:0!important}
</style>
<script id="__app_bridge_early__">
/* App bridge: replace Razorpay gate with a toast — runs before page JS */
(function(){
  /* Toast helper — used by openRzp override */
  function _appToast(msg){
    var t=document.createElement('div');
    t.style.cssText='position:fixed;bottom:76px;left:14px;right:14px;background:#0a192f;color:#ffd700;'+
      'padding:13px 16px;border-radius:10px;font-size:.88rem;z-index:99999;border:1px solid #b8860b;'+
      'text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.35);';
    t.textContent=msg;
    document.body.appendChild(t);
    setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},3200);
  }
  /* Replace Razorpay-dependent calls with a redirect toast */
  window.openRzp=function(){
    _appToast('💼 পেমেন্টের জন্য myastrology.in ওয়েবসাইট ব্যবহার করুন');
  };
  window.proceedToRazorpay=window.openRzp;
  /* window.open interceptor — posts message to React Native */
  var _o=window.open;
  window.open=function(url,target,f){
    if(url&&typeof url==='string'&&/\.html/.test(url)){
      var raw='';
      /* ⛔ এখানে দুটো হাতে-লেখা তালিকা ছিল, আর দুটোর মাপ সমান ছিল না:
         মিলন · কুণ্ডলী · সংখ্যা-জ্যোতিষ — তিনটের window-ফলব্যাক ছিল, কিন্তু
         **বর্ষফল ও নামকরণের ছিল না**। তাই ওই দুটোয় localStorage একটুও
         নড়লে raw ফাঁকা যেত — অর্থাৎ টাকা কাটা হয়েও PDF আসত না
         (মালিকের অভিযোগ, ২০২৬-০৯-২২: "পেমেন্ট নিয়ে, pdf দিচ্ছে না")।

         CLAUDE.md-এর নিয়ম: যে তালিকা অসম্পূর্ণ হলে নীরবে কিছু বাদ পড়ে,
         সেটা হাতে লেখা রাখা চলবে না। এখন পাঁচটাই এক লুপে, আর প্রতিটির
         localStorage ও window — দুটো পথই দেখা হয়। */
      var KEYS=[
        ['match_print_data',       '_matchPrintData'],
        ['kundali_print_data',     '_kundaliPrintData'],
        ['numerology_print_data',  '_nuPrintData'],
        ['varshaphala_print_data', '_vpPrintData'],
        ['namakaran_print_data',   '_nkPrintData']
      ];
      for(var ki=0; ki<KEYS.length && !raw; ki++){
        try{ raw=localStorage.getItem(KEYS[ki][0])||''; }catch(e){}
        try{ if(!raw && window[KEYS[ki][1]]) raw=JSON.stringify(window[KEYS[ki][1]]); }catch(e){}
      }
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({__rn:'open',url:url,raw:raw}));
      }
      return{focus:function(){},closed:false,close:function(){}};
    }
    return _o?_o.call(window,url,target,f):null;
  };
})();
</script>`;

/* ⚠️ js/i18n.js ও js/engine-i18n.js ইচ্ছে করেই বাদ — অ্যাপে বান্ডল কেবল
   বাংলার জন্য (en/hi-তে LocalWebView লাইভ পাতা খোলে)। ওগুলো রাখলে
   file://-এ অভিধান খুঁজতে গিয়ে ব্যর্থ হতো, বান্ডলও ভারী হতো, আর
   verify-app-i18n-এর "বান্ডলে অনুবাদ-যন্ত্রপাতি নেই" নিয়মটা ভাঙত।
   পাতার প্রতিটি ডাক পাহারা-দেওয়া (window.MyaI18n && ...), তাই না
   থাকলে বাংলাটাই দেখা যায় — যা অ্যাপে ঠিক আচরণ। */
const REMOVE_SRC = ['googletagmanager','razorpay','push-init','social-data','cloudflare-static','cdn-cgi','checkout.razorpay','js/i18n.js','js/engine-i18n.js'];
const shouldRemove = src => REMOVE_SRC.some(p => src.includes(p));

function readLocal(srcPath) {
  const clean   = srcPath.replace(/\?.*$/,'');
  const relPath = clean.startsWith('/') ? clean.slice(1) : clean;
  if (!relPath.startsWith('src/') && !relPath.startsWith('js/')) return null;
  const full = path.join(WEBSITE_DIR, relPath);
  if (!fs.existsSync(full)) { console.log(`    [skip] ${relPath}`); return null; }
  const content = fs.readFileSync(full,'utf8');
  console.log(`    [inline] ${relPath} (${Math.round(content.length/1024)} KB)`);
  return { relPath, content };
}

function processStaticScripts(html) {
  return html.replace(
    /<script([^>]*)\bsrc=["']([^"']+)["']([^>]*)(?:><\/script>|>)/g,
    (match, a1, src) => {
      if (shouldRemove(src)) { console.log(`    [remove] ${src.substring(0,60)}`); return ''; }
      const f = readLocal(src);
      if (f) return `<script>/*${f.relPath}*/\n${f.content}\n</script>`;
      return match;
    }
  );
}

function inlineCalcScripts(html) {
  const m = html.match(/var CALC_SCRIPTS=\[([\s\S]*?)\];/);
  if (!m) return html;
  console.log('    [kundali] inlining CALC_SCRIPTS...');
  const srcPaths = [];
  const re = /['"]([^'"]+)['"]/g; let x;
  while ((x = re.exec(m[1])) !== null) srcPaths.push(x[1]);
  let inlined = '\n';
  for (const sp of srcPaths) {
    const f = readLocal(sp);
    if (f) inlined += `<script>/*${f.relPath}*/\n${f.content}\n</script>\n`;
  }
  html = html.replace(/var CALC_SCRIPTS=\[[\s\S]*?\];/, 'var CALC_SCRIPTS=[];');
  html = html.replace(
    /function loadCalcScripts\(\)\{[\s\S]*?\}/,
    'function loadCalcScripts(){if(_calcScriptsPromise)return _calcScriptsPromise;_calcScriptsPromise=Promise.resolve();return _calcScriptsPromise;}'
  );
  html = html.replace('var CALC_SCRIPTS=[];', inlined + 'var CALC_SCRIPTS=[];');
  return html;
}

/* শহর-তালিকা গেঁথে দেওয়া — উপরের ব্যাখ্যা দ্রষ্টব্য।
   _ensureCityDB() প্রথমেই `window.CITY_DB` আছে কি না দেখে, তাই তালিকা
   আগে থেকে বসানো থাকলে ওই ডায়নামিক <script> আর কখনো তৈরিই হয় না —
   ফাংশনটা বদলানোর দরকার নেই। */
function inlineCityDb(html) {
  if (!html.includes("s.src='src/cities.js'")) return html;
  const full = path.join(WEBSITE_DIR, 'src', 'cities.js');
  if (!fs.existsSync(full)) { console.log('    [skip] src/cities.js'); return html; }
  const content = fs.readFileSync(full, 'utf8');
  console.log(`    [inline] src/cities.js (${Math.round(content.length/1024)} KB) — অফলাইনে শহর-তালিকা`);
  return html.replace('</head>', `<script>/*src/cities.js*/\n${content}\n</script>\n</head>`);
}

function bundle(htmlFile, outName, post) {
  console.log(`\nBundling: ${htmlFile}`);
  let html = fs.readFileSync(path.join(WEBSITE_DIR, htmlFile), 'utf8');
  // একটাই <noscript> উপাদানের ভিতরে সীমাবদ্ধ — নইলে পাতার মাথার ফাঁকা
  // <noscript> থেকে শুরু করে নিচের GTM-এর </noscript> পর্যন্ত সব মুছে যেত
  // (result.html-এ ৪৮ KB, <style> সহ; numerology.html-এ গোটা <head>)
  html = html.replace(/<noscript>(?:(?!<\/?noscript)[\s\S])*?googletagmanager(?:(?!<\/?noscript)[\s\S])*?<\/noscript>\n?/g, '');
  // GTM-এর inline লোডার <script src="..."> নয় (নিজে থেকে script tag বানায়),
  // তাই REMOVE_SRC/processStaticScripts ধরতে পারে না — আলাদাভাবে সরানো হলো
  // (দুটো ভ্যারিয়েন্ট: সাধারণ single-line স্নিপেট, আর panjika-স্টাইল deferred
  // window.addEventListener('load',...) সংস্করণ — পেজভেদে দুটোই দেখা গেছে)।
  html = html.replace(/<link rel="dns-prefetch" href="\/\/www\.googletagmanager\.com">\n?/g, '');
  html = html.replace(/<script>\(function\(w,d,s,l,i\)\{[\s\S]*?googletagmanager\.com\/gtm\.js[\s\S]*?\}\)\(window,document,'script','dataLayer','GTM-[A-Z0-9]+'\);<\/script>\n?/g, '');
  html = html.replace(/<script>\s*window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\];[\s\S]*?googletagmanager\.com\/gtm\.js[\s\S]*?<\/script>\n?/g, '');
  html = processStaticScripts(html);
  html = inlineCalcScripts(html);
  html = html.replace(/<link[^>]+rel=["']preload["'][^>]*>/gi, '');
  html = html.replace(/<link[^>]+(hind-siliguri|noto-sans|icons\.css)[^>]*>/gi, '');
  // "images/..." রিলেটিভ পাথ ওয়েবসাইটে ঠিক কাজ করে (একই origin), কিন্তু অ্যাপে
  // এই HTML একটা লোকাল file:// (কোনো images/ ফোল্ডার ছাড়া) থেকে লোড হয়, তাই
  // ভাঙা ইমেজ দেখায় (যেমন ফুটারের লোগো) — লাইভ সাইটের absolute URL-এ বদলানো হলো।

  /* ⚠️ স্টাইলশিটও ইনলাইন করতে হয়। পাতায় `<link href="/css/print-a4.css?v=3">`
     রয়ে যেত, আর অ্যাপে কোনো সার্ভার নেই — তাই A4 নকশার CSS-টা
     কখনো লোডই হত না আর PDF এলোমেলো দেখাত (সহকর্মীর অভিযোগ,
     ২০২৬-০৯-১৬)। ২০০ KB-এর বড় হলে ছোঁয়া হয় না — বান্ডল ফুলে যেত। */
  html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi,
    function (m, href) {
      if (/^https?:|^\/\//.test(href)) return m;                 /* বাইরের হলে থাকুক */
      try {
        const rel = href.split('?')[0].replace(/^\//, '');
        const f = path.join(WEBSITE_DIR, rel);
        const st = fs.statSync(f);
        if (st.size > 200 * 1024) return m;
        console.log('    [inline-css] ' + rel + ' (' + Math.round(st.size / 1024) + ' KB)');
        return '<style>/*' + rel + '*/\n' + fs.readFileSync(f, 'utf8') + '\n</style>';
      } catch (e) { return m; }
    });

  /* ⚠️ মূল-থেকে-লেখা ছবির পথ (src="/gallery/…", src="/images/…") অ্যাপে
     কিছুতেই খোলে না — অ্যাপের পাতা অফলাইনে চলে, কোনো সার্ভার নেই। তাই
     ছোট ছবিগুলো (≤ ২০০ KB) সরাসরি base64-এ বসিয়ে দেওয়া হয়। মেপে ধরা
     পড়েছে: মলাটের লোগো ও গণেশ দুটোই naturalWidth ০ দেখাচ্ছিল। */
  html = html.replace(/src=(["'])(\/?(?:gallery|images)\/[^"']+)\1/g, function (m, q, p1) {
    try {
      const f = path.join(WEBSITE_DIR, p1.replace(/^\//, ''));
      const st = fs.statSync(f);
      if (st.size > 200 * 1024) return m;
      const ext = path.extname(f).slice(1).toLowerCase();
      const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : 'image/' + ext;
      return 'src=' + q + 'data:' + mime + ';base64,' + fs.readFileSync(f).toString('base64') + q;
    } catch (e) { return m; }
  });

  /* ⚠️ যেগুলো base64 হলো না (২০০ KB-এর বড়, বা অন্য ফোল্ডারের) সেগুলোর
     রিলেটিভ পথ অ্যাপে ভাঙা ছবি দেখাত — অন্তত লাইভ সাইট থেকে নামুক।
     ⛔ ক্রমটা গুরুত্বপূর্ণ: base64 **আগে**, নইলে `src="images/…"` আগেই
     remote URL হয়ে যেত আর কোনো ছবিই আর এম্বেড হতো না। */
  html = html.replace(/src="(?:images|gallery)\//g, function (m) {
    return 'src="https://myastrology.in/' + m.slice(5);
  });
  html = html.replace('<head>', '<head>\n' + APP_CSS + '\n');
  html = inlineCityDb(html);
  if (post) html = post(html);

  // Output as JS module exporting string
  const jsContent = '// AUTO-GENERATED — do not edit manually\n// Run: node scripts/bundle-web-assets.js\nexport default ' + JSON.stringify(html) + ';\n';
  const outPath = path.join(OUTPUT_DIR, outName + '.js');
  fs.writeFileSync(outPath, jsContent, 'utf8');
  console.log(`  => ${outPath} (${Math.round(Buffer.byteLength(jsContent)/1024)} KB)`);
}


/* ─────────────────────────────────────────────────────────────────────
   kundali-print.html — অ্যাপের নিজস্ব নয়টি সংশোধন, ঘোষিত ও গণনা-সহ।

   ⚠️ ২০২৬-০৯-১৫: এই বান্ডলটা "হাতে-প্যাচ করা, নতুন করে বানাবেন না"
   শ্রেণিতে ছিল, তাই সেটা ওয়েবসাইটের ৬৪% আকারে এক সপ্তাহ পিছিয়ে
   পড়ে ছিল — কবচ-কার্ডের অনুবাদ, PDF-এর ফাইল-নাম, কিছুই আসেনি।
   প্যাচগুলো এখানে কোডে লেখা, তাই পাতাটা আবার নিরাপদে তৈরি করা যায়।
   প্রতিটি প্রতিস্থাপনের গণনা মিলিয়ে দেখা হয় — ওয়েবসাইটের লেখা
   সরে গেলে নীরবে বাদ না পড়ে সরাসরি থেমে যায়।                       */
function numerologyPatches(html) {
  /* হিরোর ছবিটা ফাইলের ভিতরেই বসানো হয় — অ্যাপে পাতাটা একটা
     স্ট্রিং থেকে চলে, তাই `gallery/...` আপেক্ষিক পথ কোথাও পৌঁছায় না আর
     হিরো ফাঁকা দেখায়। এটাই বান্ডলের একমাত্র হাতে-বসানো প্যাচ ছিল
     (মেপে দেখা, ২০২৬-০৯-২১) — হাতে নয়, এখন কোডে লেখা, তাই পরের বার
     নতুন করে বানালেও হারাবে না। */
  const rel = 'gallery/numerology-hero.webp';
  const from = 'url("' + rel + '")';
  const c = html.split(from).length - 1;
  if (c !== 1) throw new Error('numerology patch "hero": expected 1, found ' + c);
  const buf = fs.readFileSync(path.join(WEBSITE_DIR, rel));
  console.log('    [inline-img] ' + rel + ' (' + Math.round(buf.length / 1024) + ' KB)');
  return html.split(from).join('url("data:image/webp;base64,' + buf.toString('base64') + '")');
}

function kundaliPrintPatches(html) {
  const rep = (name, from, to, expect) => {
    const c = html.split(from).length - 1;
    if (c !== expect) throw new Error('kundali-print patch "' + name + '": expected ' + expect + ', found ' + c);
    html = html.split(from).join(to);
  };

  /* ১. বান্ডলারের <head>-সংযোজন (APP_CSS + Razorpay-সেতু) এই পাতায়
        অপ্রাসঙ্গিক — ছাপার পাতা নিজেই তার chrome আড়াল করে আর এখানে
        কোনো পেমেন্ট-বোতামই নেই। */
  const hi = html.indexOf('<head>'), mc = html.indexOf('<meta charset="UTF-8">');
  if (hi < 0 || mc < 0 || mc < hi) throw new Error('kundali-print: <head> anchors not found');
  html = html.slice(0, hi) + '<head>\n' + html.slice(mc);

  /* ২. অ্যাপে পাতাটা অফলাইন স্ট্রিং থেকে চলে, তাই রুট-নিরঙ্কুশ fetch
        লাইভ সাইটে পাঠানো হয় — নইলে অভিধান কখনো আসে না। */
  rep('fetch-shim', '<head>\n',
    '<head>\n<script>/* app: root-absolute fetch -> live site */\n'
    + "(function(){var f=window.fetch;if(!f)return;window.fetch=function(u,o){try{if(typeof u==='string'&&u.charAt(0)==='/')u='https://myastrology.in'+u;}catch(e){}return f.call(this,u,o);};})();</script>\n", 1);

  /* ৩. js/i18n.js পাতার নাম URL থেকে নেয় — অ্যাপে পথ নেই, তাই নাম ধরে। */
  rep('html-attr', '<html lang="bn-IN">', '<html lang="bn-IN" data-i18n-page="kundali-print">', 1);

  /* ৪. ফন্ট-স্টাইলশিট preload আকারে ছিল বলে বান্ডলার ওটা ফেলে দেয়। */
  rep('noto-font', '<title>\u099c\u09a8\u09cd\u09ae\u0995\u09cb\u09b7\u09cd\u09a0\u09c0 \u2014 MyAstrology</title>\n',
    '<title>\u099c\u09a8\u09cd\u09ae\u0995\u09cb\u09b7\u09cd\u09a0\u09c0 \u2014 MyAstrology</title>\n'
    + '<link rel="stylesheet" href="https://myastrology.in/css/noto-sans-font.css">\n', 1);

  /* ৫. WebView সরাসরি ছাপায় — পর্দায় লুকানো থাকলে কিছুই দেখা যেত না। */
  rep('printRoot', '@media screen{#printRoot{display:none}}', '#printRoot{display:block!important}', 1);

  /* ৬-৭. আপেক্ষিক পথ অ্যাপে খোলে না। */
  rep('loadMsg-href', 'href="kundali" style="color:#7a2e2e"', 'href="https://myastrology.in/kundali" style="color:#7a2e2e"', 1);
  rep('ganesh-img', 'src="gallery/ganesh.png"', 'src="https://myastrology.in/gallery/ganesh.png"', 1);

  /* ৮. GTM-এর খালি noscript মন্তব্য অ্যাপে অর্থহীন। */
  rep('gtm-noscript', '<!-- Google Tag Manager (noscript) -->\n<!-- End Google Tag Manager (noscript) -->\n', '', 1);

  /* ৯. REMOVE_SRC দুটো স্ক্রিপ্ট ফেলে দেয় — লাইভ সাইট থেকে ফিরিয়ে আনা।
        js/i18n.js ছাড়া কবচ-কার্ড ও শিরোনাম অনূদিত হতে পারে না। */
  const SD = (fs.readFileSync(path.join(WEBSITE_DIR, 'kundali-print.html'), 'utf8')
    .match(/js\/social-data\.js\?v=(\d+)/) || [, '3'])[1];
  const I18 = (fs.readFileSync(path.join(WEBSITE_DIR, 'kundali-print.html'), 'utf8')
    .match(/js\/i18n\.js\?v=(\d+)/) || [, '29'])[1];
  rep('social-data', '</script>\n\n<!-- \u09ad\u09be\u09b7\u09be \u09b8\u09cd\u09a4\u09b0',
    '</script>\n<script src="https://myastrology.in/js/social-data.js?v=' + SD + '" defer></script>\n<!-- \u09ad\u09be\u09b7\u09be \u09b8\u09cd\u09a4\u09b0', 1);
  rep('i18n-js', '-->\n\n</body>',
    '-->\n<script src="https://myastrology.in/js/i18n.js?v=' + I18 + '" defer></script>\n</body>', 1);

  return html;
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Only panjika.html has no hand-applied patches sitting on top of the raw
// bundle — see the safety note at the top of this file before uncommenting
// any of the other bundle() calls below.
bundle('panjika.html', 'panjika');
/* numerology-print.html সম্পূর্ণ নতুন পাতা, কোনো হাতে-বসানো প্যাচ নেই —
   তাই এটি নিরাপদে প্রতিবার নতুন করে বানানো যায়। */
bundle('numerology-print.html', 'numerology-print');
/* বর্ষফল ও নামকরণের ছাপার পাতাও নতুন — কোনো হাতে-বসানো প্যাচ নেই।
   ⚠️ এগুলো অ্যাপে ছিলই না — তাই বর্ষফলের PDF সাজানো হত না আর
   নামকরণে ডাউনলোডের বোতামটাই খুঁজে পাওয়া যেত না (২০২৬-০৯-১৬)। */
bundle('varshaphala-print.html', 'varshaphala-print');
bundle('namakaran-print.html', 'namakaran-print');
/* kundali-print.html — প্যাচগুলো উপরে কোডে লেখা, তাই এটিও নিরাপদ। */
/* ⛔ এই লাইনটা বন্ধ (২০২৬-০৯-২১)। kundali-print.js-এর আসল জেনারেটর
   `scripts/build-kundali-print.js` — সে আটটা প্যাচ বসায় (GTM বাদ দেওয়া সহ)।
   এখানের কপিটা ওগুলোর কয়েকটা করত না, তাই `node scripts/bundle-web-assets.js`
   চালালেই বান্ডলটা নীরবে পিছিয়ে যেত — `verify-print-bundle` ধরেছে
   ("GTM বাদ — রয়ে গেছে")। একটা ফাইলের দুটো জেনারেটর রাখা যায় না।
// bundle('kundali-print.html', 'kundali-print', kundaliPrintPatches); */

// bundle('kundali.html',             'kundali');
// bundle('match-making.html',        'match-making');
// bundle('namakaran.html',           'namakaran');
/* হাতে-বসানো একমাত্র প্যাচটা (হিরো-ছবি) এখন কোডে, তাই এটি নিরাপদ। */
bundle('numerology.html',          'numerology', numerologyPatches);
// bundle('varshaphala.html',         'varshaphala');
// bundle('prashna.html',             'prashna');
/* ⚠️ ২০২৬-০৯-২১ — বান্ডলটা ১৩ সেপ্টেম্বরের ছিল, আর সাইটে তারপর
   localStorage ব্যর্থ হলে window._matchPrintData থেকে পড়ার ফলব্যাকটা
   বসেছিল। সেটা না থাকায় অ্যাপে মলাট+সূচিপত্র+বিজ্ঞাপনের **চার পাতার
   ফাঁকা PDF** তৈরি হতো (মালিকের অভিযোগ খ৭)। হাতে-প্যাচ বলতে ছিল কেবল
   দুটো ছবি base64 — সেটা এখন bundle() নিজেই করে, তাই চালু করা হলো। */
bundle('match-making-print.html',  'match-making-print');

console.log('\nDone.');
