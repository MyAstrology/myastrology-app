/*  লুকোনো WebView-এ ছাপার পাতা আঁকা → PDF → সংরক্ষণ/শেয়ার — এক জায়গায়।
 *
 *  ⛔ ২০২৬-০৯-২৪ — "আমার রিপোর্ট" (WebPage পর্দায় /my-reports) থেকে প্রিমিয়াম
 *  রিপোর্টের "ডাউনলোড" চাপলে পাতা ছাপার পাতা খুলতে চাইত, কিন্তু ওই পর্দায়
 *  PDF বানানোর কোনো ব্যবস্থাই ছিল না — অনুরোধটা কেউ শুনত না। ₹৫০১/₹১৫০১
 *  দিয়ে কেনা রিপোর্ট ক্রেতা অ্যাপ থেকে নামাতেই পারতেন না (সহকর্মীর ৮ নম্বর)।
 *
 *  মিলন/বর্ষফল/নামকরণ/সংখ্যা পর্দায় এই একই কাজ আলাদা করে লেখা আছে; নতুন
 *  কোনো জায়গায় লাগলে এটাই ব্যবহার করুন — পঞ্চম কপি নয়।
 *
 *  source: printSource()/livePrintSource()-এর ফল — {uri, before} বা {html}।
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { makeCaptureJS, collectPdfChunk, deliverPdf } from '../utils/webPrint';
import { useAlert } from '../i18n/Text';

const TYPE = 'hpPdfChunk';
const CAPTURE_JS = makeCaptureJS(TYPE);
/* প্রিমিয়াম কুণ্ডলী ১০০+ পাতা, ধীর নেটে অভিধান ও ছবিও আসে — তবু দুই
   মিনিটে না হলে পাঠককে বলা হয়, চিরকাল ঘুরতে থাকা চাকা নয় */
const GIVE_UP_MS = 120000;

export function HiddenPrintRenderer({ source, fileName, dialogTitle, onFinish }) {
  const alertT = useAlert();
  const ref = useRef(null);
  const store = useRef({ parts: [], total: 0 });
  const doneRef = useRef(false);

  useEffect(() => {
    if (!source) return undefined;
    doneRef.current = false;
    store.current = { parts: [], total: 0 };
    const timer = setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      alertT('ত্রুটি', 'PDF তৈরি করা যায়নি।');
      if (onFinish) onFinish();
    }, GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, [source]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!source) return null;

  const onMessage = (e) => {
    let m;
    try { m = JSON.parse(e.nativeEvent.data); } catch { return; }
    const html = collectPdfChunk(m, store.current, TYPE);
    if (!html || doneRef.current) return;
    doneRef.current = true;
    deliverPdf(html, { alertT, fileName: fileName || 'MyAstrology.pdf', dialogTitle: dialogTitle || 'MyAstrology' })
      .catch(() => alertT('ত্রুটি', 'PDF তৈরি করা যায়নি।'))
      .finally(() => { if (onFinish) onFinish(); });
  };

  return (
    <WebView
      ref={ref}
      style={s.hidden}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={['*']}
      source={source.uri ? { uri: source.uri } : { html: source.html }}
      injectedJavaScriptBeforeContentLoaded={source.before}
      onLoadEnd={() => { ref.current?.injectJavaScript(CAPTURE_JS); }}
      onMessage={onMessage}
    />
  );
}

const s = StyleSheet.create({
  hidden: { position: 'absolute', left: -9999, top: -9999, width: 1, height: 1, opacity: 0 },
});
