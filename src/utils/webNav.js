/*  WebView-এর ভিতরের নেভিগেশন → অ্যাপের নিজের পর্দা
 *  ═══════════════════════════════════════════════════════════════
 *  ⛔ ২০২৬-০৯-০৮ — কুণ্ডলী পাতার ট্যাব-সারিতে "পঞ্জিকা", "রাশিফল" ও
 *  "প্রশ্ন" চাপলে কিছুই হতো না। দুটো আলাদা কারণে, আর দুটোই নীরব:
 *
 *   ১. KundaliScreen-এর পাহারা ছিল `url.startsWith('file://')` — অর্থাৎ
 *      ইংরেজি/হিন্দিতে (যেখানে লাইভ পাতা খোলে) প্রতিটি ভিতরের লিংক
 *      আটকে যেত।
 *   ২. LocalWebView পথের নাম বার করত `/([^/\\?#]+)\.html/` দিয়ে, কিন্তু
 *      পাতাগুলো লেখে `window.location.href='panjika'` — `.html` ছাড়া।
 *      তাই নামই মিলত না, আর panjika/rashifal তালিকাতেও ছিল না।
 *
 *  এখন দুটো WebView-ই এই এক জায়গা থেকেই সিদ্ধান্ত নেয়।
 *
 *  ⚠️ ভাষা-উপসর্গ (/en/, /hi/) ছেঁটে ফেলা হয় — নইলে ইংরেজি পাঠকের
 *  লিংক কোনো পর্দার সঙ্গে মিলত না (linking.js-এর একই শিক্ষা)।
 */

/* সাইটের পথ → অ্যাপের পর্দা। নাম menuItems.js-এর `tab`-এর সঙ্গে এক। */
export const PATH_TO_SCREEN = {
  'kundali':      'Kundali',
  'namakaran':    'Namakaran',
  'match-making': 'MatchMaking',
  'varshaphala':  'Varshaphala',
  'prashna':      'Prashna',
  'numerology':   'Numerology',
  'result':       'NumerologyResult',
  'panjika':      'Panchang',
  'rashifal':     'Rashifal',
  'gemstone':     'Gemstone',
  'palmistry':    'Palmistry',
  'booking':      'Booking',
  'my-reports':   'MyReports',
};

/* WebView-এর main frame যেগুলো ধরতে পারে না — OS-এর হাতে দেওয়াই ঠিক।
   নইলে wa.me বা PDF খুলতে গিয়ে গোটা পর্দাটাই হারিয়ে যেত। */
export function isExternalHandoffUrl(url) {
  return /^(tel:|mailto:)/i.test(url) ||
    /^https?:\/\/(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\//i.test(url) ||
    /^https?:\/\/([a-z0-9-]+\.)*myastrology\.in\/[^?#]*\.pdf(\?|#|$)/i.test(url) ||
    /^https?:\/\/[^/?#]+\/[^?#]*\.pdf(\?|#|$)/i.test(url);
}

/** ঠিকানা → { page, screen, query }  (চেনা না গেলে null)
 *  file:// ও https://myastrology.in — দুটোই বোঝে, `.html` থাকুক বা না থাকুক। */
export function resolveWebNav(url) {
  if (!url) return null;
  let path = url;
  const q = path.indexOf('?');
  const query = q >= 0 ? path.slice(q + 1) : '';
  if (q >= 0) path = path.slice(0, q);
  path = path.split('#')[0];
  path = path.replace(/^file:\/\/[^?#]*?\/(?=[^/]*$)/, '/')          // file:// — শেষ অংশটুকু
             .replace(/^https?:\/\/([a-z0-9-]+\.)*myastrology\.in/i, '');
  if (/^[a-z]+:\/\//i.test(path)) return null;                        // অন্য সাইট
  path = path.replace(/^\/+/, '').replace(/\/+$/, '');
  path = path.replace(/^(en|hi)(\/|$)/, '');                          // ভাষা-উপসর্গ
  path = path.replace(/\.html$/i, '');
  const page = path.split('/')[0] || 'index';
  const screen = PATH_TO_SCREEN[page];
  return screen ? { page, screen, query } : null;
}
