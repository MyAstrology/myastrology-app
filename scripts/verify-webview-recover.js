#!/usr/bin/env node
/* প্রতিটি <WebView>-এ recoverProps — রেন্ডার-প্রসেস মরলে সাদা পর্দা নয়।
   কেন (২০২৬-০৯-২৫): সহকর্মীর ২ নম্বর। ন'টা WebView-এর একটাও এটা সামলাত না।
   তালিকা হাতে লেখা নয় — src/ গোটা গাছ হেঁটে (CLAUDE.md নিয়ম ৩); web-html বাদ
   (ওগুলো পাতার লেখা, React নয়)।                                              */
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? (e.name === 'web-html' ? [] : walk(path.join(d, e.name)))
                  : (e.name.endsWith('.js') ? [path.join(d, e.name)] : []));
let bad = 0, n = 0;
for (const f of walk(SRC)) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/<WebView\b(?!ErrorOverlay)([\s\S]*?)\/?>/g)) {
    n++;
    if (!/\{\.\.\.recoverProps\(/.test(m[1])) {
      bad++; console.log('❌ ' + path.relative(SRC, f) + ':' + s.slice(0, m.index).split('\n').length + ' — recoverProps নেই');
    }
  }
}
if (!n) { console.log('❌ একটাও <WebView> পাওয়া গেল না — পরীক্ষাটাই ভাঙা'); process.exit(1); }
if (bad) { console.log(`\n✗ ${bad}/${n}টি WebView রেন্ডার-প্রসেস মরলে সাদা থাকবে`); process.exit(1); }
console.log(`✓ ${n}টি WebView-এর সবক'টায় recoverProps`);
