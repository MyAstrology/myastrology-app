/* ═══════════════════════════════════════════════════════════════
   বান্ডল-করা ওয়েব-পাতা ডিস্কে বসানো — অ্যাপ চালু হওয়ার গতি

   সমস্যা: প্রতিটা WebView-পাতা (kundali ৪.৩ MB, panjika ১.৮ MB,
   result ১.৩ MB, match-making, namakaran, prashna, varshaphala…)
   একটা বিশাল JS-স্ট্রিং হিসেবে অ্যাপের ভিতরে থাকে, আর দেখানোর আগে
   ফাইল হিসেবে লিখতে হয়। আগে প্রতিবার অ্যাপ চালু করলেই আবার লেখা হতো —
   একই লেখা, একই জায়গায়। সব মিলিয়ে ~৮ MB ডিস্কে লেখা, প্রতিবার। পুরনো
   ফোনে এটাই পাতা খোলার আগের অপেক্ষাটা লম্বা করত।

   সমাধান: পাশে একটা ছোট "ছাপ" ফাইল রাখা হয়। ছাপ মিলে গেলে আগের
   ফাইলটাই ব্যবহার হয়, নতুন করে লেখা হয় না।

   ⚠️ ছাপে লেখার দৈর্ঘ্য ব্যবহার করা যায় না। এই বান্ডলগুলোতে সবচেয়ে
   সাধারণ সংশোধনই দৈর্ঘ্য বদলায় না (যেমন .toFixed(1) → .toFixed(2)) —
   তখন ছাপ একই থেকে যেত আর ব্যবহারকারীর ফোনে চিরকাল পুরনো ফাইলটাই
   চলত, অথচ আপডেট ঠিকই নেমেছে। তাই ছাপ তৈরি হয় "লেখাটা আদৌ বদলাতে
   পারে কখন" সেই প্রশ্ন থেকে: অ্যাপের সংস্করণ বদলালে, অথবা expo-updates
   দিয়ে নতুন JS নামলে (updateId বদলায়) — অন্য কোনোভাবে নয়।
   ═══════════════════════════════════════════════════════════════ */
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

export const WEB_DIR = FileSystem.documentDirectory + 'myastro/';

/* একবারই হিসাব — অ্যাপ চলাকালীন এগুলো বদলায় না */
const BUILD_ID = (() => {
  let v = '';
  try { v = (Constants.expoConfig && Constants.expoConfig.version) || ''; } catch (_) {}
  let u = '';
  /* updateId — OTA আপডেট নামলে বদলায়; embedded বান্ডলে null, তখন
     অ্যাপের সংস্করণই যথেষ্ট (নতুন সংস্করণ = নতুন ইনস্টল)। dev-এ
     মডিউলটা throw করতে পারে, তাই try-এর ভিতরে। */
  try { u = Updates.updateId || ''; } catch (_) {}
  return v + '|' + u;
})();

const _cache = {};

/**
 * @param name    ফাইলের নাম (এক্সটেনশন ছাড়া)
 * @param source  বান্ডল-করা মূল স্ট্রিং
 * @param opts.transform  লেখার ঠিক আগে চালানো হয় (দামি রূপান্তর যেন
 *                        অকারণে প্রতিবার না চলে)
 * @param opts.salt       রূপান্তরের সংস্করণ — transform-এর কোড বদলালে
 *                        এটাও বদলাবেন
 */
export async function ensureWebFile(name, source, opts) {
  if (_cache[name]) return _cache[name];
  const dest = WEB_DIR + name + '.html';
  const sfile = WEB_DIR + name + '.stamp';
  const want = BUILD_ID + '|' + ((opts && opts.salt) || '') + '|' + source.length;
  try {
    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) {
      const have = await FileSystem.readAsStringAsync(sfile);
      if (have === want) { _cache[name] = dest; return dest; }
    }
  } catch (_) { /* ছাপ নেই বা পড়া গেল না — নিচে নতুন করে লেখা হবে */ }
  await FileSystem.makeDirectoryAsync(WEB_DIR, { intermediates: true });
  const body = (opts && opts.transform) ? opts.transform(source) : source;
  await FileSystem.writeAsStringAsync(dest, body, { encoding: FileSystem.EncodingType.UTF8 });
  /* ছাপ লেখা হয় সবার শেষে — মাঝপথে অ্যাপ বন্ধ হলে ছাপ ছাড়া অসম্পূর্ণ
     ফাইল পড়ে থাকবে, পরের বার সেটা আবার লেখা হবে (উল্টোটা বিপজ্জনক)। */
  try { await FileSystem.writeAsStringAsync(sfile, want); } catch (_) {}
  _cache[name] = dest;
  return dest;
}
