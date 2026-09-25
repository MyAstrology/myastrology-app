/*  "আমার রিপোর্ট" — অ্যাপ নিজেই অর্ডার ও রিপোর্ট এনে ওয়েবসাইটের পাতায় দেয়।
 *
 *  ⛔ ২০২৬-০৯-২৫ — /my-reports পাতা সাইন-ইন পেত কেবল টোকেন-সেতু দিয়ে
 *  (mintWebViewToken → signInWithCustomToken)। সেতু ব্যর্থ হলে পাতা আবার
 *  লগইন চাইত, অথচ অ্যাপের WebView-এ Google লগইন চলেই না — ক্রেতা টাকা দিয়ে
 *  নিজের রিপোর্ট পেতেন না (সহকর্মীর স্ক্রিনশট)। অ্যাপ নেটিভ Firebase-এ সাইন-ইন
 *  করা, তাই এখানেই পড়ে পাতার window.__myaReportsFeed(list)-এ পাঠানো হয় —
 *  প্রোফাইলের জন্য যেমন pullProfiles() করে। পাতা মেশানো ও ছাপা নিজেই করে
 *  (premium-merge.js), তাই অ্যাপ ও ওয়েবসাইটের PDF কখনো আলাদা হয় না।
 */
import { collection, getDocs, getDoc, doc, query, where, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

const READY = (st) => st === 'ready' || st === 'done';

/* Firestore Timestamp → মিলিসেকেন্ড। JSON.stringify আগে toJSON() চালায়,
   তাই replacer পায় {seconds, nanoseconds} — পাতার bnDate() ওটা চেনে না। */
function replacer(k, v) {
  if (v && typeof v === 'object' && typeof v.seconds === 'number' && typeof v.nanoseconds === 'number')
    return v.seconds * 1000 + Math.round(v.nanoseconds / 1e6);
  return v;
}

/** [{id, data, premium}] — প্রস্তুত নয় এমন অর্ডারে ভারী printHtml পাঠানো হয় না */
export async function loadReportsFeed(uid) {
  if (!uid) return null;
  const snap = await getDocs(query(collection(db, 'orders'), where('uid', '==', uid), limit(100)));
  const ms = (v) => (v && typeof v.toMillis === 'function') ? v.toMillis() : (v && v.seconds ? v.seconds * 1000 : 0);
  const rows = snap.docs.map(d => ({ id: d.id, data: d.data() }));
  rows.sort((a, b) => ms(b.data.createdAt) - ms(a.data.createdAt));
  const out = [];
  for (const r of rows) {
    let premium = null;
    const data = Object.assign({}, r.data);
    if (READY(data.status)) {
      try {
        const p = await getDoc(doc(db, 'orders', r.id, 'report', 'premium'));
        premium = p.exists() ? p.data() : null;
      } catch (e) { /* রিপোর্টের লেখা না এলেও ইঞ্জিনের অংশসহ PDF হয় */ }
    } else {
      delete data.printHtml;
    }
    out.push({ id: r.id, data, premium });
  }
  return out;
}

/** পাতায় চালানোর JS — ফাংশনটা তৈরি না হওয়া পর্যন্ত (~১০ সেকেন্ড) অপেক্ষা */
export function reportsFeedJS(list) {
  if (!list) return '';
  return `(function(){var d=${JSON.stringify(list, replacer)},n=0;
    (function go(){ if(window.__myaReportsFeed){ window.__myaReportsFeed(d); return; }
      if(++n>40) return; setTimeout(go,250); })();
  })();true;`;
}
