/*  WebView-এর রেন্ডার-প্রসেস মারা গেলে পাতা আবার লোড করা।
 *
 *  ⛔ ২০২৬-০৯-২৫ — সহকর্মীর ২ নম্বর: "ফিরে এলে কুণ্ডলী পাতা ফাঁকা"।
 *  ব্যাক-বোতামের পথ আগেই সারানো (makeHideResultsJS, ১৫/৯); কিন্তু আরেকটা
 *  পথ কেউ ধরেনি — অন্য পর্দা বা অন্য অ্যাপে গেলে Android মেমরি বাঁচাতে
 *  WebView-এর রেন্ডার-প্রসেস মেরে দেয় (কুণ্ডলীর পাতা ভারী, তাই প্রথম শিকার)।
 *  ফিরে এলে WebView আছে কিন্তু ভিতরে কিছু নেই — সাদা পর্দা; হ্যান্ডলার না
 *  থাকলে কিছু সংস্করণে গোটা অ্যাপই বন্ধ হয়। ন'টা WebView-এর একটাও এটা
 *  সামলাত না। iOS-এ একই ঘটনা onContentProcessDidTerminate।
 *
 *  ব্যবহার:  <WebView {...recoverProps(ref)} … />   (ref না থাকলে কেবল অ্যাপ
 *  বন্ধ হওয়া আটকায়; লুকোনো PDF-রেন্ডারারের নিজের সময়সীমা বাকিটা সামলায়)। */
export function recoverProps(ref) {
  const again = () => { try { if (ref && ref.current) ref.current.reload(); } catch (e) {} };
  return { onRenderProcessGone: again, onContentProcessDidTerminate: again };
}
