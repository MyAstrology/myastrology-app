import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalWebView } from '../components/LocalWebView';
import html from '../web-html/numerology';
import { colors } from '../theme/colors';

export function NumerologyScreen() {
  return (
    <View style={s.root}>
      <LocalWebView name="numerology" html={html} style={s.wv} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  wv:   { flex: 1 },
});
