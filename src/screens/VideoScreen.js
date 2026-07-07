import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalWebView } from '../components/LocalWebView';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../theme/colors';

// video.html লাইভ থেকে লোড হচ্ছে — YouTube ভিডিও তালিকা নিয়মিত বাড়ে বলে bundle
// করা হয়নি।
const APP_CSS = `
header,footer{display:none!important;}
.menu,#navOverlay,.wa-float,#btt{display:none!important;}
html{height:auto!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:none!important;max-width:100vw!important;}
body{height:auto!important;min-height:100vh!important;padding-top:0!important;margin:0!important;overflow-x:hidden!important;}
::-webkit-scrollbar{display:none!important;width:0!important;}
*{-webkit-tap-highlight-color:transparent!important;box-sizing:border-box!important;}
`;

function buildInjectedJS(css) {
  return `(function(){
  var st=document.getElementById('__vidNative__');
  if(!st){st=document.createElement('style');st.id='__vidNative__';document.head.appendChild(st);}
  st.textContent=${JSON.stringify(css)};
})();true;`;
}

const INJECTED_JS = buildInjectedJS(APP_CSS);

export function VideoScreen() {
  return (
    <View style={s.root}>
      <AppHeader />
      <LocalWebView name="video" remoteUrl="https://myastrology.in/video.html" style={s.wv} injectedJS={INJECTED_JS} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
