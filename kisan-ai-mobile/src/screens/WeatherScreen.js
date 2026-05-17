import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AjrakBand    from '../components/AjrakBand';
import UrgentBanner from '../components/UrgentBanner';
import { C }        from '../constants/colors';
import { getWeather }  from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function WeatherScreen() {
  const { t } = useLanguage();
  const w      = t.weather;
  const insets = useSafeAreaInsets();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchWeather(); }, []);

  const fetchWeather = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const res = await getWeather(loc.coords.latitude, loc.coords.longitude);
      setData(res.data);
    } catch {
      // fallback to mock
    } finally {
      setLoading(false);
    }
  };

  // Build mock days using translated strings
  const mockDays = [
    { rain: 10, icon: '☀️', advisory: w.advisories[0] },
    { rain: 45, icon: '⛅', advisory: w.advisories[1] },
    { rain: 82, icon: '🌧', advisory: w.advisories[2] },
    { rain: 60, icon: '🌦', advisory: w.advisories[3] },
    { rain: 18, icon: '🌤', advisory: w.advisories[4] },
  ].map((d, i) => ({ ...d, day: w.days[i], temp: ['34','32','28','30','33'][i] }));

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 22 }}>☁️</Text>
          <View>
            <Text style={s.title}>{w.title}</Text>
            <Text style={s.subtitle}>{w.city}</Text>
          </View>
        </View>
        <View>
          <Text style={s.temp}>{data?.current_temp || '34'}°</Text>
          <Text style={s.tempLabel}>☀️</Text>
        </View>
      </View>
      <AjrakBand h={10} />

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator color={C.maroon} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.body}>
          <UrgentBanner message={data?.urgent_alert} autoSpeak={true} />

          <Text style={s.sectionLabel}>{w.forecastLabel}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {(data?.days || mockDays).map((d, i) => (
              <View key={i} style={[s.dayCard, { backgroundColor: d.rain > 50 ? '#EFF6FF' : '#F0FDF4' }]}>
                <Text style={s.dayName}>{d.day}</Text>
                <Text style={{ fontSize: 26 }}>{d.icon}</Text>
                <Text style={[s.rain, { color: d.rain > 50 ? '#1D4ED8' : C.green }]}>{d.rain}% 💧</Text>
                <Text style={s.dayTemp}>{d.temp}°</Text>
              </View>
            ))}
          </ScrollView>

          <Text style={s.sectionLabel}>{w.advisoryLabel}</Text>
          {(data?.days || mockDays).map((d, i) => (
            <View key={i} style={s.advisoryRow}>
              <Text style={{ fontSize: 22 }}>{d.icon}</Text>
              <View>
                <Text style={s.advisoryDay}>{d.day}</Text>
                <Text style={s.advisoryText}>{d.advisory}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header:       { backgroundColor: C.maroon, paddingHorizontal: 14, paddingBottom: 14, flexDirection: 'row', alignItems: 'center' },
  title:        { color: '#fff', fontWeight: '700', fontSize: 16 },
  subtitle:     { color: C.goldLt, fontSize: 13 },
  temp:         { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'right' },
  tempLabel:    { color: C.goldLt, fontSize: 16, textAlign: 'right' },
  loader:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body:         { padding: 16, paddingBottom: 80 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: C.maroon, marginBottom: 10 },
  dayCard:      { borderRadius: 14, padding: 12, marginRight: 10, alignItems: 'center', minWidth: 80, borderWidth: 1, borderColor: '#D1FAE5' },
  dayName:      { fontSize: 13, fontWeight: '700', color: C.inkMuted, marginBottom: 4 },
  rain:         { fontSize: 13, marginTop: 4 },
  dayTemp:      { fontSize: 13, fontWeight: '700', color: C.ink },
  advisoryRow:  { backgroundColor: C.white, borderRadius: 10, borderWidth: 0.5, borderColor: C.sep, padding: 12, marginBottom: 6, flexDirection: 'row', gap: 10, alignItems: 'center' },
  advisoryDay:  { fontSize: 13, fontWeight: '700', color: C.ink },
  advisoryText: { fontSize: 13, color: C.inkMuted },
});

