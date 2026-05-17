import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { C } from '../constants/colors';

export default function ProviderCard({ provider }) {
  const call = () => Linking.openURL(`tel:${provider.phone}`);
  const trustPercent = Math.round(provider.trust * 100);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{provider.name}</Text>
        <Text style={styles.dist}>{provider.dist} km</Text>
      </View>
      <Text style={styles.rate}>PKR {provider.rate.toLocaleString()} / acre</Text>
      <Text style={styles.trustLabel}>Bharosa: {trustPercent}%</Text>
      <View style={styles.trustTrack}>
        <View style={[
          styles.trustFill,
          {
            width: `${trustPercent}%`,
            backgroundColor: provider.trust > 0.9 ? C.green : C.gold,
          }
        ]} />
      </View>
      <TouchableOpacity style={styles.callBtn} onPress={call}>
        <Text style={styles.callText}>📞  Call</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: C.sep,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: 13, fontWeight: '700', color: C.ink },
  dist: { fontSize: 11, color: C.inkMuted },
  rate: { fontSize: 14, color: C.green, fontWeight: '700', marginBottom: 8 },
  trustLabel: { fontSize: 10, color: C.inkMuted, marginBottom: 4 },
  trustTrack: { height: 6, backgroundColor: C.cream, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  trustFill:  { height: '100%', borderRadius: 3 },
  callBtn: {
    backgroundColor: C.green,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  callText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
