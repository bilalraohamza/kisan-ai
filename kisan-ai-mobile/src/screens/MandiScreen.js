import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AjrakBand from '../components/AjrakBand';
import { C } from '../constants/colors';
import { getMandiPrices } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// We will generate CROPS array dynamically inside the component

export default function MandiScreen({ route }) {
  const preloaded = route?.params?.preloaded_data || null;
  const preloadedCrop = route?.params?.preloaded_crop || null;
  const { t, language } = useLanguage();
  const m = t.mandi;
  const insets = useSafeAreaInsets();

  // cropsArray is derived from translation — updates automatically when language changes
  const cropsArray = (m.crops || ['Gehun','Chawal','Ganna','Kapas','Makai'])
    .slice(0, 7)
    .map((label, i) => ({
      label,
      value: ['wheat','rice','sugarcane','cotton','maize','onion','potato'][i]
    }));

  const [selectedCrop, setSelectedCrop] = useState(cropsArray[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [farmerLat, setFarmerLat] = useState(30.0449);
  const [farmerLng, setFarmerLng] = useState(72.3514);

  useEffect(() => {
    if (preloaded) {
      setData(preloaded);
      if (preloadedCrop) {
        const crop = cropsArray.find(c => c.value === preloadedCrop);
        if (crop) setSelectedCrop(crop);
      }
      setLoading(false);
    }
    loadFarmerLocation();
  }, []);

  useEffect(() => {
    if (preloaded && data === preloaded && selectedCrop.value === preloadedCrop) return;
    fetchPrices(selectedCrop.value);
  }, [selectedCrop, farmerLat, farmerLng, language]); // re-fetch when language changes

  const loadFarmerLocation = async () => {
    try {
      const profile = JSON.parse(
        await AsyncStorage.getItem('farmProfile') || '{}'
      );
      if (profile.lat) setFarmerLat(profile.lat);
      if (profile.lng) setFarmerLng(profile.lng);
    } catch (e) {
      console.log('Profile load error:', e);
    }
  };

  const fetchPrices = async (cropValue) => {
    setLoading(true);
    setLoadingMsg(
      language === 'urdu' ? 'قیمتیں لوڈ ہو رہی ہیں...' :
      language === 'english' ? 'Loading prices...' :
      'Prices load ho rahi hain...'
    );
    setData(null);
    try {
      const { data: res } = await getMandiPrices(
        cropValue,
        language || 'roman_urdu',
        farmerLat,
        farmerLng,
        5
      );
      setData(res);
    } catch (e) {
      console.log('Mandi error:', e);
    } finally {
      setLoading(false);
    }
  };

  const prices = data?.prices || [];
  const best = data?.best_mandi || null;

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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
        >
          {cropsArray.map((crop, i) => {
            const active = crop.value === selectedCrop.value;
            return (
              <TouchableOpacity
                key={i}
                style={[s.chip, active && s.chipActive]}
                onPress={() => setSelectedCrop(crop)}
              >
                <Text style={[s.chipText, active && s.chipTextActive]}>
                  {crop.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 30 }}>
            <ActivityIndicator
              color={C.maroon}
              size="large"
            />
            <Text style={{ marginTop: 12, color: C.inkMuted, fontSize: 14 }}>{loadingMsg}</Text>
          </View>
        ) : data ? (
          <>
            {/* Best mandi highlight */}
            {best && (
              <View style={s.bestCard}>
                <Text style={s.bestLabel}>{m.bestLabel || '🏆 SABSE ACHA BHAAV'}</Text>
                <Text style={s.bestMandi}>{best.name}</Text>
                <Text style={s.bestCity}>{best.city}</Text>
                <Text style={s.bestPrice}>
                  PKR {best.price_per_40kg?.toLocaleString()}/40kg
                </Text>
                <View style={s.bestDetails}>
                  <Text style={s.bestDist}>📍 {best.distance_km} {m.dist || 'km door'}</Text>
                  <Text style={s.bestNet}>
                    Net: PKR {best.net_revenue_pkr?.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Govt support price */}
            {data.govt_support_price && (
              <View style={s.govtCard}>
                <Text style={s.govtText}>
                  🏩 {m.govtPrice || 'Govt support price'}: PKR {data.govt_support_price}/40kg
                </Text>
                {data.market_vs_support && (
                  <Text style={s.govtSub}>{data.market_vs_support}</Text>
                )}
              </View>
            )}

            {/* AI Advice */}
            {data.sell_timing_advice && (
              <View style={s.adviceCard}>
                <Text style={s.adviceTitle}>{m.aiTitle || '🤖 AI ki Salah'}</Text>
                <Text style={s.adviceText}>{data.sell_timing_advice}</Text>
                {data.wait_or_sell && (
                  <View style={[s.sellBadge, {
                    backgroundColor: data.wait_or_sell === 'sell_now'
                      ? '#DCFCE7' : '#FEF3C7'
                  }]}>
                    <Text style={[s.sellBadgeText, {
                      color: data.wait_or_sell === 'sell_now'
                        ? C.green : '#D97706'
                    }]}>
                      {data.wait_or_sell === 'sell_now'
                        ? `✅ ${m.sellNow || 'Abhi bechein'}`
                        : data.wait_or_sell === 'wait_3_5_days'
                          ? `⏳ ${m.wait3 || '3-5 din ruko'}`
                          : `⏳ ${m.wait1 || '1 hafte ruko'}`}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Overall trend */}
            {data.overall_trend && (
              <View style={s.trendCard}>
                <Text style={s.trendText}>
                  📈 {m.trending || 'Market trend'}:{' '}
                  <Text style={{
                    color: data.overall_trend === 'rising' ? C.green
                      : data.overall_trend === 'falling' ? '#DC2626'
                        : C.ink,
                    fontWeight: '700'
                  }}>
                    {data.overall_trend === 'rising' ? (m.rising || '↑ Barh raha hai')
                      : data.overall_trend === 'falling' ? (m.falling || '↓ Gir raha hai')
                        : (m.stable || '→ Stable hai')}
                  </Text>
                </Text>
              </View>
            )}

            {/* All mandis */}
            <Text style={s.sectionLabel}>{m.allLabel || 'TAMAM MANDIYAAN'}</Text>
            {/* Per-mandi trend labels */}
            {prices.map((mandi, i) => (
              <View key={i} style={s.mandiRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.mandiName}>{mandi.name}</Text>
                  <Text style={s.mandiCity}>{mandi.city}</Text>
                  {/* distance with translated unit */}
                  <Text style={s.mandiDist}>
                    📍 {mandi.distance_km} {m.dist || 'km door'}
                  </Text>
                  {/* trend label from translations */}
                  <Text style={s.mandiTrend}>
                    {mandi.trend === 'rising'  ? (m.rising  || '↑ Barh raha')
                      : mandi.trend === 'falling' ? (m.falling || '↓ Gir raha')
                        : (m.stable || '→ Stable')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.mandiPrice}>
                    PKR {mandi.price_per_40kg?.toLocaleString()}
                  </Text>
                  <Text style={s.mandiUnit}>{m.unit || '/40kg'}</Text>
                  {/* translated Net label */}
                  <Text style={s.mandiNet}>
                    {m.netLabel || 'Net'}: {mandi.net_revenue_pkr?.toLocaleString()}
                  </Text>
                  {/* translated transport label */}
                  <Text style={[s.mandiTransport, { color: C.inkMuted }]}>
                    🚛 {mandi.transport_cost_pkr?.toLocaleString()} {m.transportLabel || 'transport'}
                  </Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: C.inkMuted, fontSize: 14 }}>
              {m.noData || 'Data load nahi hua. Dobara try karein.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: C.maroon, paddingHorizontal: 14, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: '#fff', fontWeight: '700', fontSize: 16 },
  subtitle: { color: C.goldLt, fontSize: 13 },
  body: { padding: 16, paddingBottom: 80 },
  chip: { backgroundColor: C.white, borderRadius: 20, paddingVertical: 9, paddingHorizontal: 18, marginRight: 8, borderWidth: 1, borderColor: C.sep },
  chipActive: { backgroundColor: C.maroon, borderColor: C.maroon },
  chipText: { fontSize: 14, color: C.inkMuted, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  bestCard: { backgroundColor: C.maroon, borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 2, borderColor: C.gold },
  bestLabel: { color: C.goldLt, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  bestMandi: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 4 },
  bestCity: { color: C.goldLt, fontSize: 13, marginTop: 2 },
  bestPrice: { color: C.gold, fontSize: 26, fontWeight: '800', marginTop: 4 },
  bestDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  bestDist: { color: C.goldLt, fontSize: 13 },
  bestNet: { color: C.goldLt, fontSize: 13 },
  govtCard: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 0.5, borderColor: '#BFDBFE' },
  govtText: { fontSize: 13, color: '#1D4ED8', fontWeight: '600' },
  govtSub: { fontSize: 12, color: '#3B82F6', marginTop: 4 },
  adviceCard: { backgroundColor: '#F0FDF4', borderRadius: 14, borderWidth: 1.5, borderColor: C.green, padding: 12, marginBottom: 12 },
  adviceTitle: { fontSize: 14, fontWeight: '700', color: C.green, marginBottom: 4 },
  adviceText: { fontSize: 14, color: C.ink, lineHeight: 20 },
  sellBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8, alignSelf: 'flex-start' },
  sellBadgeText: { fontSize: 13, fontWeight: '700' },
  trendCard: { backgroundColor: C.white, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 0.5, borderColor: C.sep },
  trendText: { fontSize: 13, color: C.ink },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: C.inkMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  mandiRow: { backgroundColor: C.white, borderRadius: 12, borderWidth: 0.5, borderColor: C.sep, padding: 13, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  mandiName: { fontSize: 15, fontWeight: '700', color: C.ink },
  mandiCity: { fontSize: 12, color: C.inkMuted },
  mandiDist: { fontSize: 12, color: C.inkMuted, marginTop: 2 },
  mandiTrend: { fontSize: 12, color: C.green, marginTop: 2 },
  mandiPrice: { fontSize: 16, fontWeight: '800', color: C.ink },
  mandiUnit: { fontSize: 11, color: C.inkMuted },
  mandiNet: { fontSize: 12, color: C.green, fontWeight: '600', marginTop: 2 },
  mandiTransport: { fontSize: 11, marginTop: 2 },
});