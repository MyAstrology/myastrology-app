/* PDF বেছে নেওয়া ফোল্ডারে সেভ — এক উৎস (২০২৬-০৯-৩০)
   ⛔ কেন: আগে চারটে জায়গায় (কুণ্ডলী, মিলন, পঞ্জিকা, webPrint) একই কপি ছিল, আর সেটা
   গোটা PDF base64 লেখা করে JS-এ তুলত (readAsStringAsync) আবার লিখত — ৪–৮ MB-র PDF-এ
   ৬–১১ MB-র লেখা, একসঙ্গে দুই কপি। কম RAM-এর ফোনে "সংরক্ষণ" চাপলেই অ্যাপ বন্ধ হয়ে
   যেত (সহকর্মীর দ্বিতীয় ফোন) — স্মৃতি ফুরোনোয় Android অ্যাপটাই মেরে দেয়, try/catch ধরে না।
   এখন expo-file-system-এর নতুন API: বাইট সরাসরি (bytes → write), base64 নেই, লেখা নেই।
   legacy copyAsync SAF-ফোল্ডারে লিখতে পারে না, নতুন File.copy-ও নয় — প্যাকেজের
   Kotlin উৎস খুলে দেখা; write(TypedArray) content:// URI-তে openOutputStream দিয়ে লেখে।
   ফেরত: 'saved' · 'cancelled' (পাঠক ফোল্ডার বাছেননি — কিছুই করার নেই)।
   অন্য কোনো ত্রুটি হলে ছুড়ে দেয় — ডাকার জায়গা তখন শেয়ার-পর্দা খোলে। */
import { File, Directory } from 'expo-file-system';

export async function savePdfToFolder(uri, fileName) {
  let dir;
  try {
    dir = await Directory.pickDirectoryAsync();
  } catch (e) {
    if (/cancel/i.test(String((e && (e.code || e.message)) || ''))) return 'cancelled';
    throw e;
  }
  if (!dir) return 'cancelled';
  const dest = dir.createFile(fileName, 'application/pdf');
  const bytes = await new File(uri).bytes();
  dest.write(bytes);
  return 'saved';
}
