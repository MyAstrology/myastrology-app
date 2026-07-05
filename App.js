import './src/polyfills';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>MyAstrology</Text>
      <Text style={styles.sub}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1810', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 28, fontWeight: '700', color: '#D4AF37', letterSpacing: 3 },
  sub:  { fontSize: 14, color: '#8A7A60', marginTop: 12 },
});
