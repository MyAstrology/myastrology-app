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
      try{raw=localStorage.getItem('match_print_data')||'';}catch(e){}
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({__rn:'open',url:url,raw:raw}));
      }
      return{focus:function(){},closed:false,close:function(){}};
    }
    return _o?_o.call(window,url,target,f):null;
  };
})();
</script>`;

const REMOVE_SRC = ['googletagmanager','razorpay','push-init','social-data','cloudflare-static','cdn-cgi','checkout.razorpay'];
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

function bundle(htmlFile, outName) {
  console.log(`\nBundling: ${htmlFile}`);
  let html = fs.readFileSync(path.join(WEBSITE_DIR, htmlFile), 'utf8');
  html = html.replace(/<noscript>[\s\S]*?googletagmanager[\s\S]*?<\/noscript>\n?/g, '');
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
  html = html.replace(/src="images\//g, 'src="https://myastrology.in/images/');
  html = html.replace('<head>', '<head>\n' + APP_CSS + '\n');

  // Output as JS module exporting string
  const jsContent = '// AUTO-GENERATED — do not edit manually\n// Run: node scripts/bundle-web-assets.js\nexport default ' + JSON.stringify(html) + ';\n';
  const outPath = path.join(OUTPUT_DIR, outName + '.js');
  fs.writeFileSync(outPath, jsContent, 'utf8');
  console.log(`  => ${outPath} (${Math.round(Buffer.byteLength(jsContent)/1024)} KB)`);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Only panjika.html has no hand-applied patches sitting on top of the raw
// bundle — see the safety note at the top of this file before uncommenting
// any of the other bundle() calls below.
bundle('panjika.html', 'panjika');

// bundle('kundali.html',             'kundali');
// bundle('match-making.html',        'match-making');
// bundle('namakaran.html',           'namakaran');
// bundle('numerology.html',          'numerology');
// bundle('varshaphala.html',         'varshaphala');
// bundle('prashna.html',             'prashna');
// bundle('match-making-print.html',  'match-making-print');

console.log('\nDone.');
