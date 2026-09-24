#!/usr/bin/env node
/* ইংরেজি/হিন্দি পাঠকের PDF — অ্যাপের আসল পথ, ব্রাউজারে অনুকরণ করে।

   কেন (২০২৬-০৯-২৪): অ্যাপে en/hi ক্যালকুলেটর চলে লাইভ ওয়েবসাইটে, কিন্তু
   (১) লাইভ পাতায় window.open-সেতু ছিল না — PDF অনুরোধ onPrint-এ পৌঁছতই না;
   (২) PDF বানানো হতো বাংলা ছাপার বান্ডল দিয়ে — মলাট, সূচি, বিজ্ঞাপন বাংলায়
   (সহকর্মীর ৬ ও ১৬ নম্বর অভিযোগ)। এখন সেতু বসে (OPEN_BRIDGE_JS) আর
   en/hi-তে লুকোনো WebView লাইভ অনূদিত ছাপার পাতা খোলে (printSource)।

   অ্যাপ এখানে চালানো যায় না, তাই ঠিক সেই তিনটে জিনিস — webPrint.js-এর
   OPEN_BRIDGE_JS, printSource ও makeCaptureJS — **হুবহু** ব্রাউজারে চালানো হয়,
   ওয়েবসাইট রিপো (../services) স্থানীয় সার্ভারে "সাইট" হয়ে:
     ১. /<lang>/match-making-এ গণনা → _doMatchPrint() → সেতুর বার্তায় raw আছে?
     ২. printSource(...) → before-স্ক্রিপ্ট আগে বসিয়ে লাইভ ছাপার পাতা খোলা
     ৩. makeCaptureJS-এর টুকরো জোড়া লাগিয়ে HTML → আসল PDF: পাতা ও বাংলা গোনা

   চালানো:  node scripts/verify-live-print.js   (../services-এর node_modules লাগে) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { spawn } = require('child_process');
const SVC = path.resolve(__dirname, '..', '..', 'services');
const { chromium } = require(path.join(SVC, 'node_modules', '@playwright', 'test'));
const PW_EXE = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const PORT = 8981, ORIGIN = 'http://127.0.0.1:' + PORT;
const BN = /[অ-হৎড়-য়]/;

/* webPrint.js — import/export ছেঁটে vm-এ; বাকিটা হুবহু, যাতে পরীক্ষা আর কোড আলাদা না হয় */
function loadWebPrint() {
  let src = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'webPrint.js'), 'utf8');
  src = src.replace(/^import .*;$/mg, '')
    .replace(/^export (const|function|async function) /mg, '$1 ');
  src += '\nmodule.exports={OPEN_BRIDGE_JS,printSource,livePrintSource,makeCaptureJS,SITE_ORIGIN};';
  const ctx = { module: { exports: {} }, JSON, Object, String,
    /* localPrices.js — ভারতীয় পাঠক (map null): দাম-বদল নেই */
    getPriceMap: () => null, priceJS: () => '' };
  vm.runInNewContext(src, ctx);
  return ctx.module.exports;
}


/* ⛔ ২০২৬-০৯-২৫ — expo-print (Android) ছাপার সময় নেট থেকে কিছু নামায় না।
   তাই ধরা HTML-কে এখানে **নেট ছাড়া** আঁকা হয় — আগে এটা স্থানীয় সার্ভার থেকে
   ছবি-CSS পেয়ে সবুজ দেখাত, অথচ সহকর্মীর ফোনে লোগো-গণেশ-ফ্রেম সব ফাঁকা। */
async function offline(p) { await p.route(u => /^https?:/.test(u.href), r => r.abort()); }
let brokenBad = 0;
async function brokenImgs(p, tag) {
  const r = await p.evaluate(() => ({
    imgs: [...document.images].filter(i => i.getAttribute('src') && !(i.complete && i.naturalWidth > 0)).map(i => i.getAttribute('src').slice(0, 60)),
    links: document.querySelectorAll('link[rel~="stylesheet"]').length,
  }));
  if (r.imgs.length || r.links) {
    brokenBad++;
    console.log(`❌ ${tag || ''} — নেট ছাড়া: ${r.imgs.length}টি ছবি ফাঁকা (${r.imgs.slice(0, 2).join(', ')}) · বাইরের স্টাইলশিট ${r.links}`);
  }
}

(async () => {
  const W = loadWebPrint();
  const srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: SVC, stdio: 'ignore' });
  const stop = () => { try { srv.kill(); } catch (e) {} };
  process.on('exit', stop);
  await new Promise(r => setTimeout(r, 1500));
  let bad = 0, br;
  try {
    br = await chromium.launch({ executablePath: PW_EXE });
    for (const lang of ['en', 'hi']) {
      const ctx = await br.newContext({ viewport: { width: 412, height: 900 } });
      /* ১. লাইভ ক্যালকুলেটর + সেতু */
      const pg = await ctx.newPage();
      await pg.addInitScript(() => { window.__rnMsgs = []; window.ReactNativeWebView = { postMessage: m => window.__rnMsgs.push(m) }; });
      await pg.goto(`${ORIGIN}/${lang}/match-making.html`, { waitUntil: 'domcontentloaded' });
      await pg.waitForTimeout(4000);
      await pg.evaluate(W.OPEN_BRIDGE_JS);
      await pg.evaluate(() => {
        const S = (id, v) => { const e = document.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); } };
        S('boyName', 'Rahul'); S('boyDobDay', '12'); S('boyDobMonth', '3'); S('boyDobYear', '1994'); S('boyTobHour', '10'); S('boyTobMin', '30'); S('boyCity', 'Kolkata'); S('boyLat', '22.5726'); S('boyLon', '88.3639');
        S('girlName', 'Priya'); S('girlDobDay', '5'); S('girlDobMonth', '8'); S('girlDobYear', '1996'); S('girlTobHour', '6'); S('girlTobMin', '15'); S('girlCity', 'Kolkata'); S('girlLat', '22.5726'); S('girlLon', '88.3639');
        runMatchCalc();
      });
      await pg.waitForTimeout(12000);
      await pg.evaluate(() => _doMatchPrint());
      const msg = await pg.evaluate(() => (window.__rnMsgs || []).map(m => JSON.parse(m)).find(m => m.__rn === 'open'));
      const tag = `${lang} মিলন`;
      if (!msg || !/match-making-print/.test(msg.url) || !msg.raw || msg.raw.length < 1000) {
        bad++; console.log(`❌ ${tag} — সেতু: বার্তা ${msg ? `এল, raw ${msg.raw ? msg.raw.length : 0}` : 'আসেনি'}`); await ctx.close(); continue;
      }
      /* ২. printSource — অ্যাপ যে উৎস বানায় সেটাই, কেবল সাইটের ঠিকানা স্থানীয় */
      const src = W.printSource('match-making-print', '<html><head></head><body></body></html>', msg.raw, lang);
      if (!src.uri) { bad++; console.log(`❌ ${tag} — printSource লাইভ পাতা দেয়নি`); await ctx.close(); continue; }
      const pr = await ctx.newPage();
      await pr.addInitScript(() => { window.__rnMsgs = []; window.ReactNativeWebView = { postMessage: m => window.__rnMsgs.push(m) }; });
      await pr.addInitScript({ content: src.before });
      /* আগের কোনো সঠিক তথ্য localStorage-এ থেকে গিয়ে পরীক্ষাকে ধোঁকা না দেয় */
      await pg.evaluate(() => localStorage.removeItem('match_print_data'));
      await pr.goto(src.uri.replace(W.SITE_ORIGIN, ORIGIN), { waitUntil: 'domcontentloaded' });
      /* ৩. অ্যাপের capture */
      await pr.evaluate(W.makeCaptureJS('mmPdfChunk'));
      await pr.waitForFunction(() => {
        const ms = (window.__rnMsgs || []).map(m => JSON.parse(m)).filter(m => m.__rn === 'mmPdfChunk');
        return ms.length && ms.length === ms[0].total;
      }, null, { timeout: 45000 }).catch(() => {});
      const html = await pr.evaluate(() => {
        const ms = (window.__rnMsgs || []).map(m => JSON.parse(m)).filter(m => m.__rn === 'mmPdfChunk');
        if (!ms.length || ms.length !== ms[0].total) return '';
        return ms.sort((a, b) => a.i - b.i).map(m => m.chunk).join('');
      });
      if (!html) { bad++; console.log(`❌ ${tag} — capture কিছু পাঠায়নি`); await ctx.close(); continue; }
      /* expo-print যা পায় — কেবল HTML; <base> দিয়েই CSS/ফন্ট/ছবি পৌঁছয় */
      const out = await ctx.newPage();
      await offline(out);
      await out.setContent(html, { waitUntil: 'load' });
      await brokenImgs(out, tag);
      await out.emulateMedia({ media: 'print' });
      const text = await out.evaluate(() => document.body.innerText);
      const bnLines = text.split('\n').filter(l => BN.test(l) && !/^\s*বাংলা\s*$/.test(l));
      const pdf = await out.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
      const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
      const hasBase = /<base [^>]*href=/.test(html);
      if (bnLines.length || pages < 8 || !hasBase) {
        bad++;
        console.log(`❌ ${tag} — PDF ${pages} পাতা · বাংলা লাইন ${bnLines.length} · <base> ${hasBase}`);
        bnLines.slice(0, 6).forEach(l => console.log('     · ' + l.trim().slice(0, 90)));
      } else console.log(`✓ ${tag} — সেতু raw ${msg.raw.length} · লাইভ ছাপার পাতা · PDF ${pages} পাতা · বাংলা ০`);
      await ctx.close();
    }
    /* ⛔ ২০২৬-০৯-২৫ — বাকি তিন পেইড PDF (সহকর্মীর ৩ নম্বর: "হিন্দিতে বর্ষফলের
       টাকা দিয়েও PDF নেই")। উপরের মিলন-পরীক্ষা কেবল একটা পাতা দেখত — একই
       আকৃতির কোড চার পাতায়, তাই পরীক্ষাও চার পাতায় (CLAUDE.md নিয়ম ১১)।
       ফর্ম না ভরে ফিক্সচার বসানো হয় window-এ (localStorage ফাঁকা — অ্যাপের
       খারাপ দিকটা), আর পাতা যেভাবে ডাকে ঠিক সেভাবে window.open। মাপকাঠি:
       একই তথ্যে ওয়েবসাইটের ছাপার পাতা সরাসরি — পাতার সংখ্যা ±১, আর অ্যাপে
       বাংলা লাইন ওয়েবসাইটের চেয়ে বেশি নয় (তথ্যের ভিতরের নাম বাংলা থাকতেই পারে)। */
    const OTHERS = [
      ['varshaphala', 'varshaphala-print', '_vpPrintData', 'varshaphala_print_data', 'VarshaphalaScreen'],
      ['namakaran',   'namakaran-print',   '_nkPrintData', 'namakaran_print_data',   'NamakaranScreen'],
      ['numerology',  'numerology-print',  '_nuPrintData', 'numerology_print_data',  'NumerologyResultScreen'],
    ];
    /* capture-এর ন্যূনতম দৈর্ঘ্য পর্দার ফাইল থেকেই পড়া — প্রথম রূপে হাতে ২০,০০০
       ধরে চারটে মিথ্যে লাল পেয়েছিলাম (পর্দাগুলো ৮,০০০ ব্যবহার করে) */
    const minLenOf = scr => {
      const m = /makeCaptureJS\(\s*'[^']+'\s*(?:,\s*(\d+))?\s*\)/.exec(fs.readFileSync(path.join(__dirname, '..', 'src', 'screens', scr + '.js'), 'utf8'));
      if (!m) throw new Error(scr + '-এ makeCaptureJS পাওয়া গেল না');
      return m[1] ? +m[1] : undefined;
    };
    const countPages = b => (b.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    const bnOf = t => t.split('\n').filter(l => BN.test(l) && !/^\s*বাংলা\s*$/.test(l)).length;
    for (const lang of ['en', 'hi']) for (const [calc, printPg, winKey, lsKey, screen] of OTHERS) {
      const tag = `${lang} ${calc}`;
      const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, '__fixtures__', 'print', calc + '.json'), 'utf8'));
      const ctx = await br.newContext({ viewport: { width: 412, height: 900 } });
      const pg = await ctx.newPage();
      await pg.addInitScript(() => { window.__rnMsgs = []; window.ReactNativeWebView = { postMessage: m => window.__rnMsgs.push(m) }; });
      await pg.goto(`${ORIGIN}/${lang}/${calc}.html`, { waitUntil: 'domcontentloaded' });
      await pg.waitForTimeout(2500);
      await pg.evaluate(W.OPEN_BRIDGE_JS);
      await pg.evaluate(([k, ls, d, p, l]) => {
        try { localStorage.removeItem(ls); } catch (e) {}
        window[k] = d; window.open('/' + p + '.html?v=2&lang=' + l, '_blank');
      }, [winKey, lsKey, fixture, printPg, lang]);
      const msg = await pg.evaluate(() => (window.__rnMsgs || []).map(m => JSON.parse(m)).find(m => m.__rn === 'open'));
      if (!msg || !msg.raw || msg.raw.length < 200) { bad++; console.log(`❌ ${tag} — সেতু: ${msg ? 'raw ফাঁকা' : 'বার্তা আসেনি'}`); await ctx.close(); continue; }
      const src = W.printSource(printPg, '<html><head></head><body></body></html>', msg.raw, lang);
      if (!src.uri) { bad++; console.log(`❌ ${tag} — printSource লাইভ পাতা দেয়নি`); await ctx.close(); continue; }
      const pr = await ctx.newPage();
      await pr.addInitScript(() => { window.__rnMsgs = []; window.ReactNativeWebView = { postMessage: m => window.__rnMsgs.push(m) }; });
      await pr.addInitScript({ content: src.before });
      await pr.goto(src.uri.replace(W.SITE_ORIGIN, ORIGIN), { waitUntil: 'domcontentloaded' });
      await pr.evaluate(W.makeCaptureJS('xPdfChunk', minLenOf(screen)));
      await pr.waitForFunction(() => {
        const ms = (window.__rnMsgs || []).map(m => JSON.parse(m)).filter(m => m.__rn === 'xPdfChunk');
        return ms.length && ms.length === ms[0].total;
      }, null, { timeout: 45000 }).catch(() => {});
      const html = await pr.evaluate(() => {
        const ms = (window.__rnMsgs || []).map(m => JSON.parse(m)).filter(m => m.__rn === 'xPdfChunk');
        return ms.length && ms.length === ms[0].total ? ms.sort((a, b) => a.i - b.i).map(m => m.chunk).join('') : '';
      });
      if (!html) { bad++; console.log(`❌ ${tag} — capture কিছু পাঠায়নি`); await ctx.close(); continue; }
      const out = await ctx.newPage();
      await offline(out);
      await out.setContent(html, { waitUntil: 'load' });
      await brokenImgs(out, tag);
      await out.emulateMedia({ media: 'print' });
      const aBn = bnOf(await out.evaluate(() => document.body.innerText));
      const aPages = countPages(await out.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true }));
      /* ওয়েবসাইট সরাসরি — একই তথ্য localStorage-এ */
      const dp = await ctx.newPage();
      await dp.addInitScript(([ls, r]) => { try { localStorage.setItem(ls, r); } catch (e) {} }, [lsKey, msg.raw]);
      await dp.goto(`${ORIGIN}/${printPg}.html?v=2&lang=${lang}`, { waitUntil: 'domcontentloaded' });
      await dp.waitForTimeout(7000);
      await dp.emulateMedia({ media: 'print' });
      const wBn = bnOf(await dp.evaluate(() => document.body.innerText));
      const wPages = countPages(await dp.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true }));
      if (aPages < 2 || Math.abs(aPages - wPages) > 1 || aBn > wBn) {
        bad++; console.log(`❌ ${tag} — অ্যাপে ${aPages} পাতা/বাংলা ${aBn} · ওয়েবসাইটে ${wPages} পাতা/বাংলা ${wBn}`);
      } else console.log(`✓ ${tag} — সেতু → লাইভ ছাপার পাতা · অ্যাপে ${aPages} পাতা = ওয়েবসাইটে ${wPages} · বাংলা ${aBn}/${wBn}`);
      await ctx.close();
    }
    /* ⛔ ২০২৬-০৯-২৪ — "আমার রিপোর্ট" (WebPage পর্দা): /my-reports পাতা
       '/kundali-print.html?premium=1' খোলে; অ্যাপ সেটা livePrintSource দিয়ে
       লুকোনো WebView-এ আঁকে। আগে এই পর্দায় onPrint-ই ছিল না (৮ নম্বর)। */
    {
      const fx = path.join(__dirname, '__fixtures__', 'print', 'kundali.json');
      const raw = JSON.stringify(Object.assign(JSON.parse(fs.readFileSync(fx, 'utf8')), { isPremium: true }));
      const bogus = W.livePrintSource('https://evil.example/kundali-print.html', raw, 'bn');
      const src = W.livePrintSource('/kundali-print.html?premium=1', raw, 'bn');
      if (bogus && !/^https:\/\/myastrology\.in\//.test(bogus.uri)) { bad++; console.log('❌ livePrintSource বাইরের ঠিকানা মেনে নিল'); }
      if (!src || !/\/kundali-print\.html\?premium=1&lang=bn$/.test(src.uri)) { bad++; console.log('❌ প্রিমিয়াম ঠিকানা ভুল: ' + (src && src.uri)); }
      else {
        const ctx = await br.newContext({ viewport: { width: 412, height: 900 } });
        const pr = await ctx.newPage();
        await pr.addInitScript(() => { window.__rnMsgs = []; window.ReactNativeWebView = { postMessage: m => window.__rnMsgs.push(m) }; });
        await pr.addInitScript({ content: src.before });
        await pr.goto(src.uri.replace(W.SITE_ORIGIN, ORIGIN), { waitUntil: 'domcontentloaded' });
        await pr.evaluate(W.makeCaptureJS('hpPdfChunk'));
        await pr.waitForFunction(() => {
          const ms = (window.__rnMsgs || []).map(m => JSON.parse(m)).filter(m => m.__rn === 'hpPdfChunk');
          return ms.length && ms.length === ms[0].total;
        }, null, { timeout: 45000 }).catch(() => {});
        const html = await pr.evaluate(() => {
          const ms = (window.__rnMsgs || []).map(m => JSON.parse(m)).filter(m => m.__rn === 'hpPdfChunk');
          return ms.length && ms.length === ms[0].total ? ms.sort((a, b) => a.i - b.i).map(m => m.chunk).join('') : '';
        });
        if (!html) { bad++; console.log('❌ প্রিমিয়াম কুণ্ডলী (আমার রিপোর্ট) — capture কিছু পাঠায়নি'); }
        else {
          const out = await ctx.newPage();
          await offline(out);
          await out.setContent(html, { waitUntil: 'load' });
          await brokenImgs(out, 'প্রিমিয়াম কুণ্ডলী');
          const pdf = await out.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
          const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
          /* ⚠️ নির্দিষ্ট সংখ্যার সঙ্গে নয় — প্রথমবার "৪০-এর নিচে ভুল" লিখে মিথ্যে-লাল
             পেয়েছিলাম (এই নমুনার পূর্ণ রিপোর্টই ১৭ পাতা)। মাপকাঠি: একই তথ্যে
             ওয়েবসাইটের পাতা সরাসরি যত পাতা ছাপে। */
          const dp = await ctx.newPage();
          await dp.addInitScript(r => { try { localStorage.setItem('kundali_print_data', r); } catch (e) {} }, raw);
          await dp.goto(src.uri.replace(W.SITE_ORIGIN, ORIGIN), { waitUntil: 'domcontentloaded' });
          await dp.waitForTimeout(9000);
          const dpdf = await dp.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
          const want = (dpdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
          if (Math.abs(pages - want) > 1) { bad++; console.log(`❌ প্রিমিয়াম কুণ্ডলী (আমার রিপোর্ট) — অ্যাপে ${pages} পাতা, ওয়েবসাইটে ${want}`); }
          else console.log(`✓ প্রিমিয়াম কুণ্ডলী (আমার রিপোর্ট) — ?premium=1 সহ লাইভ পাতা · অ্যাপে ${pages} পাতা = ওয়েবসাইটে ${want}`);
        }
        await ctx.close();
      }
    }
  } finally {
    if (br) await br.close();
    stop();
  }
  bad += brokenBad;
  if (bad) { console.log(`\n✗ ${bad}টি ভাষায় অ্যাপের PDF-পথ ভাঙা`); process.exit(1); }
  console.log('\n✓ অ্যাপের en/hi PDF-পথ: সেতু → লাইভ অনূদিত ছাপার পাতা → সম্পূর্ণ PDF');
})();
