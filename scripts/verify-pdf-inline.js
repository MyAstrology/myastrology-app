#!/usr/bin/env node
/* PDF-এর আগে নেটের ছবি/CSS/ফন্ট ভিতরে বসে কি না — webPrint.js-এর inlineRemote()।

   কেন (২০২৬-০৯-২৫): সহকর্মী — "ডাউনলোডের আগে পর্যন্ত ঠিক, ডাউনলোড করলে খারাপ"।
   expo-print (Android) PDF বানানোর সময় নেট থেকে কিছু নামায় না, তাই লোগো,
   গণেশ, দেবতার ছবি, পাতার ফ্রেম (print-a4.css) — সব ফাঁকা।

   এখানে আসল inlineRemote চলে (vm-এ), কেবল ফোনের নামানো (expo-file-system)
   বদলে ../services-এর ফাইল পড়া হয়। তারপর ফল ব্রাউজারে **নেট আটকে** আঁকা:
   একটাও ছবি ফাঁকা নয়, বাইরের স্টাইলশিট নেই, আর CSS সত্যিই খেটেছে।
   নিজেদের সাইট ছাড়া অন্য ঠিকানা ছোঁয়া হয় না — সেটাও দেখা হয়। */
const fs = require('fs'), path = require('path'), vm = require('vm');
const SVC = path.resolve(__dirname, '..', '..', 'services');
const { chromium } = require(path.join(SVC, 'node_modules', '@playwright', 'test'));
const PW_EXE = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;

function local(url) {
  const m = /^https:\/\/(?:www\.)?myastrology\.in(\/[^?#]*)/.exec(url);
  return m ? path.join(SVC, decodeURIComponent(m[1])) : null;
}
const store = {};
const FileSystem = {
  cacheDirectory: 'cache/',
  EncodingType: { Base64: 'base64' },
  async downloadAsync(url, dest) {
    const f = local(url);
    if (!f || !fs.existsSync(f)) return { status: 404, uri: dest };
    store[dest] = fs.readFileSync(f); return { status: 200, uri: dest };
  },
  async readAsStringAsync(uri) { return store[uri].toString('base64'); },
};
let fetched = [];
async function fakeFetch(url) {
  fetched.push(url);
  const f = local(url);
  if (!f || !fs.existsSync(f)) return { ok: false, text: async () => '' };
  return { ok: true, text: async () => fs.readFileSync(f, 'utf8') };
}
function load() {
  let src = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'webPrint.js'), 'utf8');
  src = src.replace(/^import .*;$/mg, '').replace(/^export (const|function|async function) /mg, '$1 ');
  src += '\nmodule.exports={inlineRemote};';
  const ctx = { module: { exports: {} }, FileSystem, fetch: fakeFetch, URL, Promise, setTimeout, clearTimeout,
    JSON, Object, String, Set, getPriceMap: () => null, priceJS: () => '' };
  vm.runInNewContext(src, ctx);
  return ctx.module.exports.inlineRemote;
}

(async () => {
  const inlineRemote = load();
  let bad = 0;
  const fail = m => { bad++; console.log('❌ ' + m); };
  /* সংখ্যা জ্যোতিষের ছাপার পাতার আকৃতি: <base>, দুই স্টাইলশিট, আপেক্ষিক ও
     পূর্ণ ঠিকানার ছবি (তথ্য থেকে আসা দেবতা), <style>-এর url(), আর বাইরের সাইট */
  const html = `<!DOCTYPE html><html><head><base href="https://myastrology.in/">
<link rel="stylesheet" href="/css/print-a4.css?v=3"><link rel="stylesheet" href="https://myastrology.in/css/noto-sans-font.css">
<style>.bg{background:url('/images/mya-logo-print.jpg');width:10px;height:10px}</style></head><body>
<div class="pg"><img id="a" src="/images/mya-logo-print.jpg"><img id="b" src="https://myastrology.in/gallery/shukra_dev.webp">
<img id="c" src="gallery/ganesh-print.jpg"><img id="x" src="https://example.com/evil.png"><div class="bg"></div></div></body></html>`;
  const out = await inlineRemote(html);
  if (/<link[^>]*stylesheet/i.test(out)) fail('স্টাইলশিট এখনো বাইরের ঠিকানায়');
  for (const id of ['a', 'b', 'c']) if (!new RegExp(`id="${id}" src="data:image/`).test(out)) fail(`ছবি #${id} ভিতরে বসেনি`);
  if (!/id="x" src="https:\/\/example\.com\/evil\.png"/.test(out)) fail('বাইরের সাইটের ছবি বদলে গেছে');
  if (fetched.some(u => !/myastrology\.in/.test(u))) fail('বাইরের সাইট থেকে আনা হয়েছে: ' + fetched.join(', '));
  if (/url\(\s*['"]?\/images/.test(out)) fail('<style>-এর url() বসেনি');
  if (/url\(['"]?\.\.\/fonts/.test(out)) fail('ফন্টের url() বসেনি');
  /* নেট না থাকলেও HTML ফেরত আসে (PDF আটকে থাকে না) */
  const same = await inlineRemote('<html><body><img src="/nope.jpg"></body></html>');
  if (!/src="\/nope\.jpg"/.test(same)) fail('না-নামা ছবির ঠিকানা হারিয়ে গেছে');

  const br = await chromium.launch({ executablePath: PW_EXE });
  const pg = await br.newPage();
  await pg.route(u => /^https?:/.test(u.href), r => r.abort());
  await pg.setContent(out, { waitUntil: 'load' });
  const r = await pg.evaluate(() => ({
    broken: [...document.images].filter(i => i.id !== 'x' && !(i.complete && i.naturalWidth > 0)).map(i => i.id),
    pgStyled: getComputedStyle(document.querySelector('.pg')).position !== 'static' || getComputedStyle(document.querySelector('.pg')).width !== getComputedStyle(document.body).width,
  }));
  await br.close();
  if (r.broken.length) fail('নেট ছাড়া ফাঁকা ছবি: ' + r.broken.join(', '));
  if (!r.pgStyled) fail('print-a4.css নেট ছাড়া খাটেনি (.pg-র চেহারা বদলায়নি)');
  if (bad) { console.log(`\n✗ ${bad}টি সমস্যা — PDF-এ ছবি/নকশা ফাঁকা আসবে`); process.exit(1); }
  console.log('✓ স্টাইলশিট, ছবি (আপেক্ষিক, পূর্ণ, তথ্য থেকে আসা), <style>-এর url() ও ফন্ট — সব PDF-এর ভিতরে');
  console.log('✓ নেট আটকে আঁকা: একটাও ছবি ফাঁকা নয়, print-a4.css খেটেছে · বাইরের সাইট ছোঁয়া হয়নি');
})();
