import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalWebView } from '../components/LocalWebView';
import html from '../web-html/panjika';
import { colors } from '../theme/colors';

export function PanchangScreen() {
  return (
    <View style={s.root}>
      <LocalWebView name="panjika" html={html} style={s.wv} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
