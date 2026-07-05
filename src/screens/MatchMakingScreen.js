import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LocalWebView } from '../components/LocalWebView';
import { colors } from '../theme/colors';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const MATCH_HTML = require('../../assets/web/match-making.html');

export function MatchMakingScreen() {
  return (
    <View style={s.root}>
      <LocalWebView assetModule={MATCH_HTML} style={s.web} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  web:  { flex: 1 },
});
