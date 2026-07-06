import React from 'react';
import { StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { COLORS } from '../theme';

const INJECTED_JS = `
  (function() {
    var style = document.createElement('style');
    style.innerHTML = 'nav, header, footer, .navbar, .header, .footer { display: none !important; }';
    document.head.appendChild(style);

    // Override window.print() — WebView has no native print dialog.
    // Capture the rendered HTML and send to React Native for PDF generation.
    var _orig = window.print;
    window.print = function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'panjikaprint',
          html: document.documentElement.outerHTML
        }));
      } else {
        _orig && _orig.call(window);
      }
    };
  })();
  true;
`;

export default function PanjikaScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <WebView
        source={{ uri: 'https://www.myastrology.in/panjika.html' }}
        style={s.web}
        injectedJavaScript={INJECTED_JS}
        javaScriptEnabled
        domStorageEnabled
        onMessage={async (event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type !== 'panjikaprint' || !msg.html) return;
            const { uri } = await Print.printToFileAsync({ html: msg.html, base64: false });
            Alert.alert(
              'পঞ্জিকা PDF তৈরি হয়েছে',
              'কী করতে চান?',
              [
                {
                  text: 'সংরক্ষণ করুন',
                  onPress: async () => {
                    try {
                      const { StorageAccessFramework } = FileSystem;
                      const perm = await StorageAccessFramework.requestDirectoryPermissionsAsync();
                      if (perm.granted) {
                        const dest = await StorageAccessFramework.createFileAsync(
                          perm.directoryUri, 'MyAstrology_panjika.pdf', 'application/pdf'
                        );
                        const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                        await FileSystem.writeAsStringAsync(dest, b64, { encoding: FileSystem.EncodingType.Base64 });
                        Alert.alert('সংরক্ষিত!', 'PDF ফোল্ডারে সেভ হয়েছে।');
                      }
                    } catch (_) {
                      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
                    }
                  },
                },
                {
                  text: 'শেয়ার করুন',
                  onPress: () => Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'পঞ্জিকা PDF শেয়ার করুন',
                    UTI: 'com.adobe.pdf',
                  }),
                },
                { text: 'বাতিল', style: 'cancel' },
              ]
            );
          } catch (_) {}
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  web:  { flex: 1 },
});
