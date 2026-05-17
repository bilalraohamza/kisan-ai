import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { C } from '../constants/colors';

export default function ExpertCard({ expert }) {
  const call = () => Linking.openURL(`tel:${expert.phone}`);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>👨‍⚕️  Pehle Expert Se Milein</Text>
      <Text style={styles.sub}>Dawai kharidne se pehle expert se milein — bilkul muft</Text>
      <Text style={styles.name}>{expert.name}</Text>
      <Text style={styles.meta}>{expert.city}  ·  {expert.hours}</Text>
      <TouchableOpacity style={styles.btn} onPress={call}>
        <Text style={styles.btnText}>📞  Call Expert</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.green,
    padding: 14,
    marginBottom: 14,
  },
  label: { fontSize: 13, fontWeight: '800', color: C.green, marginBottom: 4 },
  sub:   { fontSize: 11, color: C.inkMuted, marginBottom: 10 },
  name:  { fontSize: 14, fontWeight: '700', color: C.ink },
  meta:  { fontSize: 12, color: C.inkMuted },
  btn: {
    marginTop: 10,
    backgroundColor: C.green,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
