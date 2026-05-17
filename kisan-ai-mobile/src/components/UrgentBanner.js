import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';

export default function UrgentBanner({ message, autoSpeak = false }) {
  useEffect(() => {
    if (autoSpeak && message) {
      Speech.speak(message, { language: 'en-US', rate: 0.85 });
    }
  }, [message]);

  if (!message) return null;

  return (
    <View style={styles.banner}>
      <Text style={{ fontSize: 22 }}>⚠️</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Fori Ittela!</Text>
        <Text style={styles.body}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#EF4444',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  title: { fontSize: 13, fontWeight: '800', color: '#B91C1C' },
  body:  { fontSize: 12, color: '#7F1D1D', lineHeight: 18 },
});
