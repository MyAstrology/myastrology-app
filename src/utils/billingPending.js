/*  টাকা নেওয়া হয়েছে অথচ জিনিসটা পৌঁছয়নি — সেই অবস্থাটা মনে রাখা।
 *  ═══════════════════════════════════════════════════════════════
 *  কেন দরকার: Play-তে পেমেন্ট সফল হওয়া আর অ্যাপের ভিতরে জিনিসটা
 *  ডেলিভারি হওয়া — দুটো আলাদা ধাপ। মাঝখানে অ্যাপ বন্ধ হয়ে গেলে, নেট
 *  কেটে গেলে বা ফোন রিস্টার্ট হলে টাকা কাটা হয়ে যেত আর পাঠক কিছুই
 *  পেতেন না। উপরন্তু consumable ক্রয় consume করে ফেলতে **হয়** (নইলে
 *  Google ৩ দিনে টাকা ফেরত দিয়ে দেয়), তাই Play-র দিকে ক্রয়টা আর
 *  পড়ে থাকে না — মনে রাখার দায়িত্ব আমাদেরই।
 *
 *  ⚠️ এটা "অধিকার" (entitlement) নয় — সেটা সার্ভারে, Firestore-এ।
 *  এটা কেবল **এই ফোনে এখনো ডেলিভারি বাকি** তার চিহ্ন। তাই এটা মুছে
 *  গেলেও টাকা হারায় না, প্রমাণ সার্ভারেই থাকে।
 *
 *  ⚠️ ডেলিভারিটা পরের বার বোতাম চাপার সময় হয়, পাতা খোলার সময় নয় —
 *  কারণ প্রতিটি প্রোডাক্টের আনলক পাতার একটা প্রস্তুত অবস্থা ধরে নেয়
 *  (গণনা হয়ে গেছে, ওভারলে তৈরি)। পাতা খোলামাত্র চালালে স্ক্রিপ্টটা
 *  নীরবে কিছুই করত, অথচ চিহ্নটা মুছে যেত — টাকাটা তখনই সত্যিই হারাত।
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@myastrology_billing_pending_v1';

async function read() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter(x => typeof x === 'string') : [];
  } catch (e) { return []; }
}

async function write(list) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
}

/** কেনা হয়েছে কিন্তু ডেলিভারি বাকি — চিহ্ন বসানো */
export async function addPending(key) {
  if (!key) return;
  const list = await read();
  list.push(key);            // একই জিনিস দু'বার কিনলে দু'বারই পাওনা
  await write(list);
}

/** একটা পাওনা তুলে নেওয়া — থাকলে true, আর চিহ্নটা মুছে যায় */
export async function takePending(key) {
  const list = await read();
  const i = list.indexOf(key);
  if (i < 0) return false;
  list.splice(i, 1);
  await write(list);
  return true;
}

/** কী কী পাওনা আছে (পাঠককে জানানোর জন্য) */
export async function listPending() {
  return read();
}
