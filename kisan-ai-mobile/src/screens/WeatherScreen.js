import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AjrakBand from '../components/AjrakBand';
import UrgentBanner from '../components/UrgentBanner';
import { C } from '../constants/colors';
import { getWeather } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Rain icon helper ──────────────────────────────────────────────────────────
const RAIN_ICON = (rain) => {
  if (rain >= 70) return '🌧';
  if (rain >= 40) return '🌦';
  if (rain >= 20) return '⛅';
  return '☀️';
};

// ── Localised day name (short) ────────────────────────────────────────────────
const getDayName = (dateStr, language) => {
  const date = new Date(dateStr);
  if (language === 'urdu') {
    const urduDays = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];
    return urduDays[date.getDay()];
  }
  if (language === 'roman_urdu') {
    const romanDays = ['Itwar', 'Peer', 'Mangal', 'Budh', 'Jumerat', 'Juma', 'Hafta'];
    return romanDays[date.getDay()];
  }
  const engDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return engDays[date.getDay()];
};

// ── Localised full date string for advisory rows ──────────────────────────────
const getFullDayName = (dateStr, language) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = {
    urdu: ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'],
    roman_urdu: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    english: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  };
  const days = {
    urdu: ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'],
    roman_urdu: ['Itwar', 'Peer', 'Mangal', 'Budh', 'Jumerat', 'Juma', 'Hafta'],
    english: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  };
  const monthList = months[language] || months['english'];
  const dayList = days[language] || days['english'];
  return `${dayList[date.getDay()]}, ${day} ${monthList[date.getMonth()]}`;
};

// ── Localised crop label ──────────────────────────────────────────────────────
const getCropLabel = (cropType, language) => {
  const labels = {
    wheat: { roman_urdu: 'Gehun', urdu: 'گندم', english: 'Wheat' },
    rice: { roman_urdu: 'Chawal', urdu: 'چاول', english: 'Rice' },
    cotton: { roman_urdu: 'Kapas', urdu: 'کپاس', english: 'Cotton' },
    sugarcane: { roman_urdu: 'Ganna', urdu: 'گنا', english: 'Sugarcane' },
    maize: { roman_urdu: 'Makkai', urdu: 'مکئی', english: 'Maize' },
  };
  return labels[cropType]?.[language] || cropType || '';
};

// ─────────────────────────────────────────────────────────────────────────────
export default function WeatherScreen({ navigation }) {
  const { t, language } = useLanguage();
  const w = t.weather;
  const insets = useSafeAreaInsets();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cropType, setCropType] = useState(null);
  const [locationName, setLocationName] = useState('');

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadCropAndWeather();
  }, []);

  // ── Reload when screen gets focus OR language changes ──────────────────────
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setLoading(true);
      setError(false);
      loadCropAndWeather();
    });
    return unsubscribe;
  }, [navigation, language]);

  // ── Main fetch function — always reads AsyncStorage fresh ──────────────────
  const loadCropAndWeather = async () => {
    try {
      const farmProfile = JSON.parse(
        await AsyncStorage.getItem('farmProfile') || '{}'
      );
      const crop = farmProfile?.crop_type || null;
      setCropType(crop);

      // Always request GPS permission and use device location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(true);
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const res = await getWeather(
        loc.coords.latitude,
        loc.coords.longitude,
        language || 'roman_urdu',
        crop
      );
      setData(res.data);

    } catch (e) {
      console.log('Weather error:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived display values ─────────────────────────────────────────────────
  const forecast = data?.forecast_5_day || [];
  const displayLocation = locationName || data?.location || '';
  const cropLabel = getCropLabel(cropType, language);

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 22 }}>☁️</Text>
          <View>
            <Text style={s.title}>{w.title}</Text>
            <Text style={s.subtitle}>
              {displayLocation}
              {cropLabel ? ` · ${cropLabel}` : ''}
            </Text>
          </View>
        </View>
        <View>
          <Text style={s.temp}>
            {forecast[0]?.temp_max || '--'}°
          </Text>
          <Text style={s.tempLabel}>
            {RAIN_ICON(forecast[0]?.rain_probability || 0)}
          </Text>
        </View>
      </View>
      <AjrakBand h={10} />

      {/* ── Body ── */}
      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator color={C.maroon} size="large" />
          <Text style={{ marginTop: 10, color: C.inkMuted }}>
            {w.loadingText || 'Mausam ki maloomat la rahe hain...'}
          </Text>
        </View>

      ) : error ? (
        <View style={s.loader}>
          <Text style={{ color: C.maroon, fontSize: 14, textAlign: 'center' }}>
            {language === 'urdu'
              ? "GPS کی اجازت نہیں ملی۔ سیٹنگز میں لوکیشن آن کریں۔"
              : language === 'english'
                ? "GPS permission denied. Please enable location in settings."
                : "GPS ki ijazat nahi mili. Settings mein location on karein."}
          </Text>
        </View>

      ) : (
        <ScrollView contentContainerStyle={s.body}>
          <UrgentBanner message={data?.urgent_alert} autoSpeak={false} language={language} />

          {/* Risk card */}
          {data?.weekly_risk && (
            <View style={[s.riskCard, {
              backgroundColor: data.weekly_risk === 'high' ? '#FEE2E2'
                : data.weekly_risk === 'medium' ? '#FEF3C7'
                  : '#DCFCE7'
            }]}>
              <Text style={s.riskText}>
                {w.riskLabel || 'Is hafte ka khatra'}{': '}
                <Text style={{ fontWeight: '800' }}>
                  {data.weekly_risk === 'high' ? (w.riskHigh || 'Zyada')
                    : data.weekly_risk === 'medium' ? (w.riskMedium || w.riskMed || 'Darmiyana')
                      : (w.riskLow || 'Kam')}
                </Text>
              </Text>
              {data.best_harvest_window && (
                <Text style={s.harvestText}>
                  🌾 {w.harvestLabel || w.bestHarvest || 'Behtar katayi'}: {data.best_harvest_window}
                </Text>
              )}
            </View>
          )}

          {/* Action today */}
          {data?.action_today && (
            <View style={s.actionCard}>
              <Text style={s.actionTitle}>
                ⚡ {w.actionTitle || w.actionToday || 'Aaj kya karein'}
              </Text>
              <Text style={s.actionText}>{data.action_today}</Text>
            </View>
          )}

          {/* ── 5-day forecast chips ── */}
          <Text style={s.sectionLabel}>{w.forecastLabel}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
          >
            {forecast.map((day, i) => (
              <View key={i} style={[s.dayCard, {
                backgroundColor: day.rain_probability > 50 ? '#EFF6FF' : '#F0FDF4'
              }]}>
                {/* ── FIX: language-aware short day name ── */}
                <Text style={s.dayName}>
                  {getDayName(day.date, language)}
                </Text>
                <Text style={{ fontSize: 26 }}>
                  {RAIN_ICON(day.rain_probability)}
                </Text>
                <Text style={[s.rain, {
                  color: day.rain_probability > 50 ? '#1D4ED8' : C.green
                }]}>
                  {day.rain_probability}% 💧
                </Text>
                <Text style={s.dayTemp}>
                  {day.temp_max}° / {day.temp_min}°
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* ── Advisory rows ── */}
          <Text style={s.sectionLabel}>{w.advisoryLabel}</Text>
          {forecast.map((day, i) => (
            <View key={i} style={[s.advisoryRow, {
              borderLeftWidth: 3,
              borderLeftColor: day.rain_probability > 70 ? '#B91C1C'
                : day.rain_probability > 40 ? '#D97706'
                  : C.green
            }]}>
              <Text style={{ fontSize: 22 }}>
                {RAIN_ICON(day.rain_probability)}
              </Text>
              <View style={{ flex: 1 }}>
                <View style={s.advisoryHeader}>
                  {/* ── FIX: language-aware full date string ── */}
                  <Text style={s.advisoryDay}>
                    {getFullDayName(day.date, language)}
                  </Text>
                  <Text style={s.advisoryTemp}>
                    {day.temp_max}°/{day.temp_min}°
                  </Text>
                </View>
                <Text style={s.advisoryText}>{day.farming_advisory}</Text>
                <View style={s.detailRow}>
                  <Text style={s.detailText}>💧 {day.rain_probability}%</Text>
                  {day.humidity && (
                    <Text style={s.detailText}>💦 {day.humidity}%</Text>
                  )}
                  {day.wind_speed && (
                    <Text style={s.detailText}>💨 {day.wind_speed} km/h</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: C.maroon, paddingHorizontal: 14, paddingBottom: 14, flexDirection: 'row', alignItems: 'center' },
  title: { color: '#fff', fontWeight: '700', fontSize: 16 },
  subtitle: { color: C.goldLt, fontSize: 13 },
  temp: { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'right' },
  tempLabel: { color: C.goldLt, fontSize: 16, textAlign: 'right' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  body: { padding: 16, paddingBottom: 80 },
  riskCard: { borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 0.5, borderColor: C.sep },
  riskText: { fontSize: 13, color: C.ink },
  harvestText: { fontSize: 12, color: C.green, marginTop: 4, fontWeight: '600' },
  actionCard: { backgroundColor: C.white, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 0.5, borderColor: C.gold },
  actionTitle: { fontSize: 13, fontWeight: '700', color: C.maroon, marginBottom: 4 },
  actionText: { fontSize: 13, color: C.ink, lineHeight: 18 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: C.maroon, marginBottom: 10 },
  dayCard: { borderRadius: 14, padding: 12, marginRight: 10, alignItems: 'center', minWidth: 85, borderWidth: 1, borderColor: '#D1FAE5' },
  dayName: { fontSize: 13, fontWeight: '700', color: C.inkMuted, marginBottom: 4 },
  rain: { fontSize: 13, marginTop: 4 },
  dayTemp: { fontSize: 12, fontWeight: '700', color: C.ink, marginTop: 2 },
  advisoryRow: { backgroundColor: C.white, borderRadius: 10, borderWidth: 0.5, borderColor: C.sep, padding: 12, marginBottom: 8, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  advisoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  advisoryDay: { fontSize: 13, fontWeight: '700', color: C.ink },
  advisoryTemp: { fontSize: 12, color: C.inkMuted },
  advisoryText: { fontSize: 12, color: C.inkMuted, lineHeight: 18, marginBottom: 6 },
  detailRow: { flexDirection: 'row', gap: 12 },
  detailText: { fontSize: 11, color: C.inkMuted },
});