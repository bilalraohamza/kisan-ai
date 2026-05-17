import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AjrakBand   from '../components/AjrakBand';
import { C }       from '../constants/colors';
import { getMandiPrices } from '../services/api';
import { useLanguage }    from '../context/LanguageContext';

const MOCK_MANDIS = [
  { name: 'Vehari Mandi',    price: 3420, change: +80, dist: 8  },
  { name: 'Multan Mandi',    price: 3390, change: +40, dist: 45 },
  { name: 'Bahawalpur Mandi', price: 3350, change: -20, dist: 62 },
];

export default function MandiScreen() {
  const { t } = useLanguage();
  const m      = t.mandi;
  const insets = useSafeAreaInsets();

  const [selectedCrop, setSelectedCrop] = useState(m.crops[0]);
  const [prices, setPrices]             = useState(null);
  const [advice, setAdvice]             = useState(m.defaultAdvice);
  const [loading, setLoading]           = useState(false);

  // Re-sync selectedCrop when language changes
  useEffect(() => { setSelectedCrop(m.crops[0]); }, [t]);

  const fetchPrices = async (crop) => {
    setLoading(true);
    try {
      const { data } = await getMandiPrices(crop);
      setPrices(data.mandis);
      setAdvice(data.ai_advice || m.defaultAdvice);
    } catch {
      setPrices(null);
      setAdvice(m.defaultAdvice);
    } finally {
      setLoading(false);
    }
  };

  const handleCrop = (crop) => {
    setSelectedCrop(crop);
    fetchPrices(crop);
  };

  const displayPrices = prices || MOCK_MANDIS;
  const best = [...displayPrices].sort((a, b) => b.price - a.price)[0];

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Text style={{ fontSize: 22 }}>🏪</Text>
        <View>
          <Text style={s.title}>{m.title}</Text>
          <Text style={s.subtitle}>{m.subtitle}</Text>
        </View>
      </View>
      <AjrakBand h={10} />

      <ScrollView contentContainerStyle={s.body}>

        {/* Crop chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {m.crops.map((crop, i) => {
            const active = crop === selectedCrop;
            return (
              <TouchableOpacity
                key={i}
                style={[s.chip, active && s.chipActive]}
                onPress={() => handleCrop(crop)}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>{crop}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={C.maroon} size="large" style={{ marginTop: 30 }} />
        ) : (
          <>
            {/* Best price highlight */}
            <View style={s.bestCard}>
              <Text style={s.bestLabel}>{m.bestLabel}</Text>
              <Text style={s.bestMandi}>{best.name}</Text>
              <Text style={s.bestPrice}>PKR {best.price?.toLocaleString()}{m.unit}</Text>
              <Text style={s.bestDist}>{best.dist} {m.dist}</Text>
            </View>

            {/* AI Advice */}
            <View style={s.adviceCard}>
              <Text style={s.adviceTitle}>{m.aiTitle}</Text>
              <Text style={s.adviceText}>{advice}</Text>
            </View>

            {/* All mandis */}
            <Text style={s.sectionLabel}>{m.allLabel}</Text>
            {displayPrices.map((mandi, i) => (
              <View key={i} style={s.mandiRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.mandiName}>{mandi.name}</Text>
                  <Text style={s.mandiDist}>{mandi.dist} {m.dist}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.mandiPrice}>PKR {mandi.price?.toLocaleString()}</Text>
                  <Text style={[s.mandiChange, { color: mandi.change >= 0 ? C.green : '#DC2626' }]}>
                    {mandi.change >= 0 ? '↑' : '↓'} {Math.abs(mandi.change)}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header:      { backgroundColor: C.maroon, paddingHorizontal: 14, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  title:       { color: '#fff', fontWeight: '700', fontSize: 16 },
  subtitle:    { color: C.goldLt, fontSize: 13 },
  body:        { padding: 16, paddingBottom: 80 },
  chip:        { backgroundColor: C.white, borderRadius: 20, paddingVertical: 9, paddingHorizontal: 18, marginRight: 8, borderWidth: 1, borderColor: C.sep },
  chipActive:  { backgroundColor: C.maroon, borderColor: C.maroon },
  chipText:    { fontSize: 14, color: C.inkMuted, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  bestCard:    { backgroundColor: C.maroon, borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 2, borderColor: C.gold },
  bestLabel:   { color: C.goldLt, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  bestMandi:   { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 4 },
  bestPrice:   { color: C.gold, fontSize: 26, fontWeight: '800', marginTop: 4 },
  bestDist:    { color: C.goldLt, fontSize: 13, marginTop: 2 },
  adviceCard:  { backgroundColor: '#F0FDF4', borderRadius: 14, borderWidth: 1.5, borderColor: C.green, padding: 12, marginBottom: 14 },
  adviceTitle: { fontSize: 14, fontWeight: '700', color: C.green, marginBottom: 4 },
  adviceText:  { fontSize: 14, color: C.ink, lineHeight: 20 },
  sectionLabel:{ fontSize: 13, fontWeight: '700', color: C.inkMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  mandiRow:    { backgroundColor: C.white, borderRadius: 12, borderWidth: 0.5, borderColor: C.sep, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  mandiName:   { fontSize: 15, fontWeight: '700', color: C.ink },
  mandiDist:   { fontSize: 13, color: C.inkMuted },
  mandiPrice:  { fontSize: 16, fontWeight: '800', color: C.ink },
  mandiChange: { fontSize: 13, fontWeight: '700' },
});

