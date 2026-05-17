import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AjrakBand   from '../components/AjrakBand';
import { C }       from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { findServices } from '../services/api';

const SERVICES = [
  { key: 'harvester', icon: '🚜', label: 'Combine Harvester' },
  { key: 'tractor',   icon: '🚛', label: 'Tractor'           },
  { key: 'drone',     icon: '🚁', label: 'Spray Drone'       },
  { key: 'labor',     icon: '👷', label: 'Mazdoor'           },
  { key: 'storage',   icon: '🏚', label: 'Storage'           },
  { key: 'transport', icon: '🚌', label: 'Transport'         },
];

const MOCK_PROVIDERS = [
  { name: 'Usman Combine Services', dist: 8,  rate: 2200, trust: 0.92, phone: '03001234567' },
  { name: 'Ali Machinery Co.',      dist: 15, rate: 2000, trust: 0.85, phone: '03007654321' },
];

export default function ServicesScreen() {
  const { t }  = useLanguage();
  const sv     = t.services;
  const insets = useSafeAreaInsets();

  const [selected, setSelected]   = useState(null);
  const [providers, setProviders] = useState([]);

  const handleSelect = async (key) => {
    setSelected(key);
    try {
      const { data } = await findServices(key, {});
      setProviders(data.providers || MOCK_PROVIDERS);
    } catch {
      setProviders(MOCK_PROVIDERS);
    }
  };

  const call = (phone) => Linking.openURL(`tel:${phone}`);

  return (
    <View style={s.root}>

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Text style={{ fontSize: 22 }}>🛠</Text>
        <View>
          <Text style={s.title}>{sv.title}</Text>
          <Text style={s.subtitle}>{sv.subtitle}</Text>
        </View>
      </View>
      <AjrakBand h={10} />

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* ── 3-column Service Grid ── */}
        <View style={s.grid}>
          {SERVICES.map((svc) => {
            const active = selected === svc.key;
            return (
              <TouchableOpacity
                key={svc.key}
                style={[s.svcCard, active && s.svcCardActive]}
                activeOpacity={0.75}
                onPress={() => handleSelect(svc.key)}
              >
                <Text style={{ fontSize: 28, marginBottom: 4 }}>{svc.icon}</Text>
                <Text style={[s.svcLabel, active && s.svcLabelActive]}>{svc.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Providers or Empty State ── */}
        {selected ? (
          <>
            <Text style={s.sectionLabel}>{sv.providersLabel}</Text>

            {(providers.length > 0 ? providers : MOCK_PROVIDERS).map((p, i) => (
              <View key={i} style={s.providerCard}>
                <View style={s.providerTop}>
                  <Text style={s.providerName}>{p.name}</Text>
                  <Text style={s.providerDist}>{p.dist} km</Text>
                </View>

                <Text style={s.providerRate}>PKR {p.rate?.toLocaleString()} / acre</Text>

                {/* Trust bar */}
                <View style={s.trustRow}>
                  <Text style={s.trustLabel}>Bharosa: {Math.round(p.trust * 100)}%</Text>
                </View>
                <View style={s.trustTrack}>
                  <View style={[s.trustFill, {
                    width: `${p.trust * 100}%`,
                    backgroundColor: p.trust > 0.9 ? C.green : C.gold,
                  }]} />
                </View>

                <TouchableOpacity style={s.callBtn} onPress={() => call(p.phone)}>
                  <Text style={s.callBtnText}>📞  Call</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* ── AI Coordination Bundle ── */}
            <View style={s.coordCard}>
              <Text style={s.coordTitle}>{sv.coordTitle}</Text>
              <Text style={s.coordSub}>
                AI ne aapke 5 acre ke liye Combine + Mazdoor + Transport sab book karne ka plan banaya hai.
              </Text>
              <Text style={s.coordItems}>Combine + Mazdoor + Storage + Transport</Text>
              <Text style={s.coordPrice}>Total: PKR 18,500</Text>
              <TouchableOpacity style={s.coordBtn}>
                <Text style={s.coordBtnText}>{sv.coordBtn}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={s.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🛠</Text>
            <Text style={s.emptyText}>{sv.emptyText}</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.cream },
  header:        { backgroundColor: C.maroon, paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  title:         { color: '#fff', fontWeight: '700', fontSize: 16 },
  subtitle:      { color: C.goldLt, fontSize: 13 },
  body:          { padding: 16, paddingBottom: 90 },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  svcCard:       { width: '31%', backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.sep, padding: 14, alignItems: 'center' },
  svcCardActive: { backgroundColor: C.maroon, borderColor: C.gold },
  svcLabel:      { fontSize: 12, fontWeight: '700', color: C.ink, textAlign: 'center' },
  svcLabelActive:{ color: '#fff' },
  sectionLabel:  { fontSize: 14, fontWeight: '700', color: C.maroon, marginBottom: 10 },
  providerCard:  { backgroundColor: C.white, borderRadius: 14, borderWidth: 0.5, borderColor: C.sep, padding: 14, marginBottom: 10 },
  providerTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  providerName:  { fontSize: 15, fontWeight: '700', color: C.ink, flex: 1 },
  providerDist:  { fontSize: 13, color: C.inkMuted },
  providerRate:  { fontSize: 16, color: C.green, fontWeight: '700', marginBottom: 8 },
  trustRow:      { marginBottom: 4 },
  trustLabel:    { fontSize: 12, color: C.inkMuted },
  trustTrack:    { height: 6, backgroundColor: C.cream, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  trustFill:     { height: '100%', borderRadius: 3 },
  callBtn:       { backgroundColor: C.green, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 20, alignSelf: 'flex-start' },
  callBtnText:   { color: '#fff', fontSize: 14, fontWeight: '700' },
  coordCard:     { backgroundColor: C.maroon, borderRadius: 18, borderWidth: 2, borderColor: C.gold, padding: 18, marginTop: 6 },
  coordTitle:    { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  coordSub:      { color: C.goldLt, fontSize: 14, marginBottom: 8, lineHeight: 20 },
  coordItems:    { color: '#fff', fontSize: 13 },
  coordPrice:    { color: C.gold, fontSize: 22, fontWeight: '800', marginTop: 4, marginBottom: 12 },
  coordBtn:      { backgroundColor: C.gold, borderRadius: 12, padding: 13, alignItems: 'center' },
  coordBtnText:  { color: C.maroonDk, fontSize: 16, fontWeight: '800' },
  emptyState:    { alignItems: 'center', paddingVertical: 40 },
  emptyText:     { fontSize: 15, color: C.inkMuted, textAlign: 'center' },
});

