/*  অ্যাপের প্রবেশযোগ্যতা (accessibility) — যতটা এখান থেকে মাপা যায়।
 *  ═══════════════════════════════════════════════════════════════
 *  এই স্যান্ডবক্সে অ্যাপ চালানো যায় না, তাই TalkBack দিয়ে সত্যিকারের
 *  পরীক্ষা সম্ভব নয়। কিন্তু সবচেয়ে সাধারণ ত্রুটিটা **স্থিরভাবেই** ধরা
 *  যায়: কেবল-আইকন বোতাম, যার ভিতরে কোনো লেখা নেই আর কোনো
 *  accessibilityLabel-ও নেই। স্ক্রিন-রিডার ওটাকে শুধু "বোতাম" বলে —
 *  পাঠক জানেনই না কীসের বোতাম।
 *
 *  ⚠️ ভিতরে <Text> থাকলে লেবেল লাগে না — রিডার ওই লেখাটাই পড়ে। তাই
 *  পুরো এলিমেন্ট-ব্লকটা দেখা হয়, শুধু খোলার ট্যাগটা নয়। প্রথম চেষ্টায়
 *  ব্লকটা ৪০০ অক্ষরে কেটে দেখা হয়েছিল আর তাতে HomeScreen-এর চারটে
 *  ঠিক বোতামও "ভুল" বলে ধরা পড়েছিল — মিথ্যে লাল।
 */
const fs = require('fs');
const path = require('path');
const APP = path.resolve(__dirname, '..');

let checks = 0, fail = 0;
const ok  = m => { checks++; console.log('  \x1b[32m✓\x1b[0m ' + m); };
const bad = m => { checks++; fail++; console.log('  \x1b[31m✗\x1b[0m ' + m); };

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

/* একটা JSX এলিমেন্টের শুরু থেকে তার নিজের বন্ধ-ট্যাগ পর্যন্ত — একই নামের
   নেস্টেড এলিমেন্ট গুনে (Pressable-এর ভিতরে Pressable সত্যিই আছে)। */
/* ⚠️ খোলার ট্যাগের শেষ '>' খুঁজতে হলে `{...}`-এর ভিতরটা বাদ দিতেই হবে —
   `onPress={() => nav()}`-এর তিরচিহ্নেই (=>) একটা '>' আছে, আর সেটাকে
   ট্যাগের শেষ ধরে নিলে পরের লাইনের accessibilityLabel চোখেই পড়ত না।
   প্রথম সংস্করণে ঠিক সেটাই হয়েছিল: সাতটা ঠিক-লেবেল-করা বোতাম "ভুল"
   বলে ধরা পড়ে। */
function tagEnd(src, start) {
  let d = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '{') d++;
    else if (c === '}') d--;
    else if (c === '>' && d === 0) return i;
  }
  return -1;
}

function block(src, start, tag) {
  const open = new RegExp('<' + tag + '[\\s/>]', 'g');
  const close = '</' + tag + '>';
  let i = tagEnd(src, start);
  if (i < 0) return src.slice(start, start + 400);
  if (src[i - 1] === '/') return src.slice(start, i + 1);   // self-closing
  let depth = 1, p = i + 1;
  while (depth > 0 && p < src.length) {
    open.lastIndex = p;
    const m = open.exec(src);
    const c = src.indexOf(close, p);
    if (c < 0) return src.slice(start, p + 400);
    if (m && m.index < c) { depth++; p = m.index + 1; }
    else { depth--; p = c + close.length; }
  }
  return src.slice(start, p);
}

console.log('① কেবল-আইকন বোতামে লেবেল আছে কি না');
{
  const TAGS = ['Pressable', 'TouchableOpacity', 'TouchableHighlight'];
  const miss = [];
  for (const f of walk(path.join(APP, 'src'))) {
    const s = fs.readFileSync(f, 'utf8');
    for (const tag of TAGS) {
      const re = new RegExp('<' + tag + '[\\s/>]', 'g');
      let m;
      while ((m = re.exec(s))) {
        const blk = block(s, m.index, tag);
        const head = blk.slice(0, tagEnd(blk, 0) + 1);
        if (/accessibilityLabel/.test(head)) continue;
        if (/<Text[\s/>]/.test(blk)) continue;   // ভিতরের লেখাই রিডার পড়ে
        miss.push(path.relative(APP, f) + ':' + (s.slice(0, m.index).split('\n').length));
      }
    }
  }
  if (!miss.length) ok('প্রতিটি ছোঁয়ার জায়গায় হয় লেখা আছে, নয় লেবেল');
  else bad(miss.length + 'টি বোতামে লেখাও নেই, লেবেলও নেই:\n      ' + miss.join('\n      '));
}

console.log('\n② ত্রুটি হলে সাদা পর্দা নয়');
{
  const app = fs.readFileSync(path.join(APP, 'App.js'), 'utf8');
  const eb  = fs.readFileSync(path.join(APP, 'src/components/ErrorBoundary.js'), 'utf8');
  if (/<ErrorBoundary>/.test(app)) ok('App.js-এ ErrorBoundary বসানো আছে');
  else bad('ErrorBoundary বসানো নেই — একটা রেন্ডার-ত্রুটিতে পর্দা সাদা হয়ে যাবে');

  if (/getDerivedStateFromError/.test(eb)) ok('ত্রুটি ধরা হয় (getDerivedStateFromError)');
  else bad('ত্রুটি ধরার হুক নেই');

  /* ⚠️ শুধু বার্তা দেখানো যথেষ্ট নয় — বেরোনোর পথ না থাকলে পাঠককে অ্যাপ
     বন্ধ করতেই হতো, অর্থাৎ সাদা পর্দার চেয়ে সামান্যই ভালো। */
  if (/setState\(\{\s*err:\s*null\s*\}\)/.test(eb)) ok('"আবার চেষ্টা করুন" সত্যিই অবস্থাটা মুছে দেয়');
  else bad('বেরোনোর পথ নেই — বার্তাটা দেখিয়েই আটকে থাকত');

  if (/from '\.\.\/i18n\/Text'/.test(eb)) ok('ত্রুটির বার্তা পাঠকের ভাষায়');
  else bad('ত্রুটির বার্তা বাংলাতেই থেকে যেত (কাঁচা react-native Text)');

  /* componentDidCatch-এ throw করলে ত্রুটি-পর্দাটাই ভেঙে যেত। */
  const cdc = eb.slice(eb.indexOf('componentDidCatch'), eb.indexOf('  render()'));
  if (/try\s*\{/.test(cdc)) ok('ত্রুটি নথিভুক্ত করাটা নিজেই ভাঙতে পারে না');
  else bad('componentDidCatch পাহারাহীন — সেখানে ভাঙলে আবার সাদা পর্দা');
}

console.log(`\n${fail ? '❌' : '✅'} ${checks}টি পরীক্ষা, ${fail}টি সমস্যা`);
process.exit(fail ? 1 : 0);
