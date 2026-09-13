/*  পাতা নিজেই ছাপে — এমন WebView-এর জন্য PDF তৈরি
 *  ═══════════════════════════════════════════════════════════════
 *  বর্ষফল ও সংখ্যা-জ্যোতিষের PDF বোতাম শেষমেশ `window.print()` ডাকে।
 *  WebView-এ ওটা **কিছুই করে না** — কোনো ত্রুটিও দেয় না। ফলে প্রোমো
 *  কোড ঠিক দিলেও পাঠক কিছুই পেতেন না, আর টাকা দিলেও তাই হতো।
 *
 *  কুণ্ডলী, পঞ্জিকা ও যোটক-বিচারের পর্দায় এর সমাধান আলাদা আলাদা করে
 *  তিনবার লেখা হয়েছিল। এটি সেই কোডেরই এক জায়গার রূপ — নতুন কিছু নয়,
 *  যাতে চতুর্থ কপি না জন্মায়।
 *
 *  ⚠️ HTML একসঙ্গে postMessage করলে কম-RAM ফোনে WebView-এর সেতু
 *     ওভারলোড হয়ে অ্যাপ ক্র্যাশ করে — তাই টুকরো করে পাঠানো হয়
 *     (পঞ্জিকার পর্দায় মাপা আচরণ)।
 */
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const PDF_CHUNK = 'pagePdfChunk';

/* পাতার নিজের `window.print()`-কে বদলে দেয়: DOM-এর একটা কপি নিয়ে
   <script> ফেলে দিয়ে স্ট্যাটিক HTML পাঠায়। স্ক্রিপ্ট রাখলে expo-print
   ওগুলো আবার চালাতে গিয়ে অর্ধেক-আঁকা পাতা ছাপত। */
export const PAGE_PRINT_JS = `(function(){try{
  if(window.__myaPrintHooked) return; window.__myaPrintHooked=1;
  window.print=function(){
    try{
      var clone=document.documentElement.cloneNode(true);
      var sc=clone.querySelectorAll('script');
      for(var i=0;i<sc.length;i++){ sc[i].parentNode&&sc[i].parentNode.removeChild(sc[i]); }
      var html='<!DOCTYPE html>'+clone.outerHTML;
      if(!window.ReactNativeWebView) return;
      var CHUNK=200000, total=Math.ceil(html.length/CHUNK)||1;
      for(var c=0;c<total;c++){
        window.ReactNativeWebView.postMessage(JSON.stringify({
          __rn:'${PDF_CHUNK}', i:c, total:total,
          chunk:html.substring(c*CHUNK,(c+1)*CHUNK)
        }));
      }
    }catch(e){}
  };
}catch(e){}})();true;`;

/*  লুকোনো WebView-এ ছাপার পাতাটা আঁকা শেষ হলে তার স্ট্যাটিক HTML ধরা।
 *  ⚠️ টুকরো করে পাঠানো **ঐচ্ছিক নয়** — কোষ্ঠী-মিলনের ছাপার পাতা মেপে
 *  ২,২০,৯৫৩ অক্ষর, আর এই ফাইলের উপরের নোটেই লেখা যে একসঙ্গে পাঠালে
 *  কম-RAM ফোনে সেতু ওভারলোড হয়। কুণ্ডলীর পর্দায় ঠিক এই সংশোধনটা
 *  আগেই বসানো হয়েছিল, মিলনের পর্দায় বসেনি — তাই এখানে এক জায়গায়।
 *  minLen: printRoot-এ অন্তত এত অক্ষর না এলে ধরা হবে না — নইলে
 *  অর্ধেক-আঁকা (কেবল মলাট) পাতাও "তৈরি" বলে ধরা পড়ত।
 */
export const makeCaptureJS = (type, minLen = 20000) => `(function poll(){
  var root=document.getElementById('printRoot');
  if(root && root.innerHTML.length > ${minLen}){
    [].slice.call(document.querySelectorAll('script')).forEach(function(s){s.parentNode&&s.parentNode.removeChild(s);});
    var h=document.documentElement.outerHTML, C=200000, n=Math.ceil(h.length/C)||1;
    for(var i=0;i<n;i++){
      window.ReactNativeWebView.postMessage(JSON.stringify({
        __rn:${JSON.stringify(type)}, i:i, total:n, chunk:h.substring(i*C,(i+1)*C)
      }));
    }
  } else { setTimeout(poll,400); }
})();true;`;

/** টুকরোগুলো জোড়া লাগায়। সব টুকরো এলে পুরো HTML ফেরায়, নইলে null।
 *  store একটা সাধারণ অবজেক্ট (useRef().current) — {parts, total}. */
export function collectPdfChunk(msg, store, type = PDF_CHUNK) {
  if (!msg || msg.__rn !== type) return null;
  if (store.total !== msg.total) { store.total = msg.total; store.parts = []; }
  store.parts[msg.i] = msg.chunk;
  for (let i = 0; i < store.total; i++) if (store.parts[i] == null) return null;
  const html = store.parts.join('');
  store.parts = []; store.total = 0;
  return html;
}

/** HTML → PDF, তারপর পাঠককে সংরক্ষণ বা শেয়ারের সুযোগ।
 *  alertT আসে useAlert() থেকে, তাই বার্তাগুলো পাঠকের ভাষায়। */
export async function deliverPdf(html, { alertT, fileName, dialogTitle }) {
  const { uri } = await Print.printToFileAsync({ html, base64: false, width: 595, height: 842 });
  alertT('PDF তৈরি হয়েছে', 'কী করতে চান?', [
    {
      text: 'সংরক্ষণ করুন',
      onPress: async () => {
        try {
          const { StorageAccessFramework } = FileSystem;
          const perm = await StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (perm.granted) {
            const dest = await StorageAccessFramework.createFileAsync(
              perm.directoryUri, fileName, 'application/pdf');
            const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            await FileSystem.writeAsStringAsync(dest, b64, { encoding: FileSystem.EncodingType.Base64 });
            alertT('সংরক্ষিত!', 'PDF ফোল্ডারে সেভ হয়েছে।');
          }
        } catch (_) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
        }
      },
    },
    {
      text: 'শেয়ার করুন',
      onPress: () => Sharing.shareAsync(uri, {
        mimeType: 'application/pdf', dialogTitle, UTI: 'com.adobe.pdf',
      }),
    },
    { text: 'বাতিল', style: 'cancel' },
  ]);
}
