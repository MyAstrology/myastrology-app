import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LocalWebView } from '../components/LocalWebView';
import html from '../web-html/match-making';
import PRINT_HTML from '../web-html/match-making-print';
import { colors } from '../theme/colors';

// Injects the print data directly into the HTML so it doesn't need localStorage.
// Same pattern as KundaliScreen.injectDataIntoPrintHtml.
function buildPrintHtml(rawJson) {
  let out = PRINT_HTML;
  // Escape </script> sequences inside the JSON payload
  const safe = JSON.stringify(rawJson).replace(/</g, '\\u003c');
  out = out.replace('<head>', () => `<head><script>window.__mmRaw=${safe};<\/script>`);
  out = out.replace(
    "try{raw=localStorage.getItem('match_print_data');}catch(e){}",
    () => `try{raw=window.__mmRaw||null;}catch(e){}`
  );
  return out;
}

// Patch downloadMatchPDF to bypass the Razorpay payment gate.
// _doMatchPrint is a global function in match-making.js; we call it directly.
const PATCH_JS = `
(function(){
  function patch(){
    if(typeof window._doMatchPrint==='function'){
      window.downloadMatchPDF=function(){window._doMatchPrint();};
    }
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',patch);
  } else {
    patch();
  }
})();
true;
`;

export function MatchMakingScreen() {
  const [generating, setGenerating] = useState(false);

  const handlePrint = useCallback(async (rawJson) => {
    if (generating) return;
    if (!rawJson) {
      Alert.alert('ত্রুটি', 'PDF ডেটা পাওয়া যায়নি। আগে কুষ্ঠি মিলন গণনা করুন।');
      return;
    }
    setGenerating(true);
    try {
      const printHtml = buildPrintHtml(rawJson);
      const { uri } = await Print.printToFileAsync({
        html: printHtml,
        base64: false,
        width: 595,
        height: 842,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'কুষ্ঠি মিলন রিপোর্ট সংরক্ষণ করুন',
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (e) {
      Alert.alert('ত্রুটি', 'PDF তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setGenerating(false);
    }
  }, [generating]);

  return (
    <View style={s.root}>
      <LocalWebView
        name="match-making"
        html={html}
        style={s.wv}
        onPrint={handlePrint}
        injectedJS={PATCH_JS}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
