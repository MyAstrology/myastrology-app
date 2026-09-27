#!/usr/bin/env node
/* verify-pdf-save — PDF সেভ স্মৃতিতে base64 লেখা তোলে না (২০২৬-০৯-৩০)
   সহকর্মীর দ্বিতীয় ফোনে "সংরক্ষণ" চাপলেই অ্যাপ বন্ধ — গোটা PDF base64 লেখা হয়ে JS-এ
   উঠত। ① src/utils/savePdf.js আসলে চালিয়ে (নকল expo-file-system): বাইট সরাসরি লেখে,
   বাতিলে 'cancelled', অন্য ত্রুটি ছুড়ে দেয় (ডাকার জায়গা তখন শেয়ার খোলে)।
   ② src-এর কোথাও (web-html বাদে) PDF-uri base64-এ পড়া ফিরে আসেনি, আর চারটে জায়গাই
   এক সাহায্যকারী ডাকে।                                                       */
const fs = require('fs'), path = require('path'), Module = require('module');
const ROOT = path.join(__dirname, '..');
let bad = 0; const ok = (c, m) => { if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m); } };
let ts = null;
for (const p of ['/opt/node22/lib/node_modules/typescript/lib/typescript.js', 'typescript']) { try { ts = require(p); break; } catch (_) {} }
if (!ts) { console.log('✗ typescript নেই'); process.exit(1); }

const log = [];
let mode = 'ok';
class FakeFile { constructor(u) { this.uri = u; } async bytes() { log.push('bytes:' + this.uri); return new Uint8Array([37, 80, 68, 70]); }
  write(b) { log.push('write:' + this.uri + ':' + (b instanceof Uint8Array ? 'bytes' : typeof b)); } }
const FakeDir = { async pickDirectoryAsync() {
  if (mode === 'cancel') { const e = new Error('The file picker was cancelled by the user'); e.code = 'ERR_PICKER_CANCELLED'; throw e; }
  if (mode === 'boom') throw new Error('disk full');
  return { createFile: (n, m) => { log.push('create:' + n + ':' + m); return new FakeFile('content://dir/' + n); } }; } };
const orig = Module._load;
Module._load = function (r, ...a) { return r === 'expo-file-system' ? { File: FakeFile, Directory: FakeDir } : orig.call(this, r, ...a); };
const src = fs.readFileSync(path.join(ROOT, 'src/utils/savePdf.js'), 'utf8');
const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText;
const m = new Module('savePdf'); m.paths = module.paths; m._compile(out, path.join(ROOT, 'src/utils/savePdf.js'));
const { savePdfToFolder } = m.exports;
Module._load = orig;

(async () => {
  console.log('PDF সেভ');
  let r = await savePdfToFolder('file:///cache/x.pdf', 'MyAstrology_kundali.pdf');
  ok(r === 'saved' && log.join('|') === 'create:MyAstrology_kundali.pdf:application/pdf|bytes:file:///cache/x.pdf|write:content://dir/MyAstrology_kundali.pdf:bytes',
     "সেভ: ফাইল তৈরি → বাইট পড়া → বাইট লেখা (base64 নয়) → 'saved'");
  mode = 'cancel'; log.length = 0;
  r = await savePdfToFolder('file:///cache/x.pdf', 'a.pdf');
  ok(r === 'cancelled' && log.length === 0, "ফোল্ডার বাছাই বাতিল → 'cancelled', কিছুই লেখা নয়");
  mode = 'boom'; let threw = false;
  try { await savePdfToFolder('file:///cache/x.pdf', 'a.pdf'); } catch (e) { threw = /disk full/.test(e.message); }
  ok(threw, 'অন্য ত্রুটি ছুড়ে দেয় — ডাকার জায়গা শেয়ার-পর্দা খোলে');

  /* ② গাছ-হাঁটা, হাতে-লেখা তালিকা নয় */
  const files = [];
  (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) { if (f !== 'web-html') walk(p); } else if (/\.js$/.test(f)) files.push(p); } })(path.join(ROOT, 'src'));
  const b64 = files.filter(f => /readAsStringAsync\(\s*uri\b[^)]*Base64/.test(fs.readFileSync(f, 'utf8')));
  ok(!b64.length, 'PDF-uri base64-এ পড়া কোথাও নেই' + (b64.length ? ': ' + b64.map(f => path.relative(ROOT, f)).join(', ') : ''));
  const users = files.filter(f => !/savePdf\.js$/.test(f) && /savePdfToFolder\(uri/.test(fs.readFileSync(f, 'utf8'))).map(f => path.basename(f)).sort();
  ok(users.join(',') === 'KundaliScreen.js,MatchMakingScreen.js,PanchangScreen.js,webPrint.js', 'চারটে জায়গাই এক সাহায্যকারী ডাকে (' + users.join(', ') + ')');
  console.log('');
  if (bad) { console.log(`❌ ${bad}টি সমস্যা`); process.exit(1); }
  console.log('✅ সব ঠিক');
})();
