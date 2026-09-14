#!/usr/bin/env node
/*  হুক সবসময় early-return-এর **উপরে** — এটাই এখানে assert করা হয়
 *  ═══════════════════════════════════════════════════════════════
 *  ⛔ ২০২৬-০৯-১৪ — LocalWebView-এ একটা `React.useMemo` দুটো early-return-এর
 *  পরে বসে গিয়েছিল। বান্ডল-করা পাতাগুলোতে (নামকরণ · যোটক · প্রশ্ন ·
 *  বর্ষফল · সংখ্যা) প্রথম রেন্ডারে `uri` থাকে না — ফাইলটা আগে ডিস্কে
 *  লিখতে হয় — তাই `if (!uri) return …` চলে যেত আর হুকটা ডাকা হত না;
 *  পরের রেন্ডারে ডাকা হত। React তখন "Rendered more hooks than during the
 *  previous render" ছোঁড়ে, ErrorBoundary ধরে, আর পাঠক দেখেন
 *  "দুঃখিত, কিছু একটা ভুল হয়েছে" — পাঁচটা ক্যালকুলেটরেই।
 *
 *  ⚠️ কোনো লিন্টার এখানে চলে না (এই স্যান্ডবক্সে node_modules নেই), আর
 *  পার্স-পরীক্ষা এটা ধরতে পারে না — সিনট্যাক্স নিখুঁত, ভুলটা কেবল
 *  চালানোর সময়ে। তাই নিয়মটা নিজেই লিখে রাখা হলো।
 */
const fs = require('fs'), path = require('path');
const ts = require('/opt/node22/lib/node_modules/typescript');
const APP = path.join(__dirname, '..');
const DIRS = ['src/screens', 'src/components', 'src/context', 'src/i18n', 'src/navigation'];
const HOOK = /^use[A-Z]/;

let checked = 0, bad = 0;
const C = { g: '\x1b[32m', r: '\x1b[31m', x: '\x1b[0m' };

function scan(file) {
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(path.basename(file), src, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const rel = path.relative(APP, file);

  function fnBody(node) {
    return node.body && node.body.statements ? node.body.statements : null;
  }
  function looksLikeComponentOrHook(node) {
    const n = (node.name && node.name.text) || '';
    return /^[A-Z]/.test(n) || HOOK.test(n);
  }
  function firstExitPos(stmts) {
    /* প্রথম যে জায়গায় ফাংশনটা তাড়াতাড়ি বেরিয়ে যেতে পারে */
    for (let i = 0; i < stmts.length; i++) {
      const st = stmts[i];
      /* ⚠️ ফাংশনের **শেষ** return কোনো early-return নয় — ওটাকে ধরলে
         `return React.useMemo(...)`-এর মতো নিখুঁত কোডও লাল হত (প্রথম
         চেষ্টায় ঠিক সেটাই হয়েছিল, src/i18n/Text.js-এর useAlert)। */
      if (ts.isReturnStatement(st)) { if (i === stmts.length - 1) continue; return st.getStart(); }
      if (ts.isIfStatement(st)) {
        let found = -1;
        const look = n => { if (found < 0 && ts.isReturnStatement(n)) found = st.getStart(); ts.forEachChild(n, look); };
        look(st);
        if (found >= 0) return found;
      }
    }
    return -1;
  }
  function hooksAfter(node, pos) {
    const out = [];
    const walk = n => {
      /* ভিতরের ফাংশনে (callback) হুক-নাম থাকলে সেটা আলাদা স্কোপ — বাদ */
      if (n !== node && (ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n))) return;
      if (ts.isCallExpression(n)) {
        const e = n.expression;
        const name = ts.isIdentifier(e) ? e.text
          : (ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.name) ? e.name.text : '');
        if (HOOK.test(name) && n.getStart() > pos) out.push({ name, line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1 });
      }
      ts.forEachChild(n, walk);
    };
    ts.forEachChild(node, walk);
    return out;
  }

  const visit = node => {
    if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && looksLikeComponentOrHook(node)) {
      const stmts = fnBody(node);
      if (stmts) {
        checked++;
        const exitAt = firstExitPos(stmts);
        if (exitAt >= 0) {
          const late = hooksAfter(node, exitAt);
          if (late.length) {
            bad++;
            const nm = (node.name && node.name.text) || '?';
            console.log(`  ${C.r}✗${C.x} ${rel} → ${nm}() — early-return-এর পরে হুক:`);
            late.forEach(h => console.log(`       ${h.name}()  লাইন ${h.line}`));
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

for (const d of DIRS) {
  const dir = path.join(APP, d);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.js')) scan(path.join(dir, f));
}

console.log('');
if (bad) { console.log(`${C.r}✗ ${bad}টি ফাংশনে হুক শর্তের নিচে — রেন্ডারে ক্র্যাশ করবে${C.x}\n`); process.exit(1); }
console.log(`${C.g}✅ ${checked}টি কম্পোনেন্ট/হুক দেখা হলো — সব হুক early-return-এর উপরে${C.x}\n`);
