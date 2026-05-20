import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AjrakBand from '../components/AjrakBand';
import { C } from '../constants/colors';
import { saveFarm, getSessionId } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const CROP_OPTIONS_BY_LANG = {
  roman_urdu: [
    { label: 'Gehun',   value: 'wheat',      emoji: '🌾' },
    { label: 'Chawal',  value: 'rice',        emoji: '🍚' },
    { label: 'Kapas',   value: 'cotton',      emoji: '🌿' },
    { label: 'Ganna',   value: 'sugarcane',   emoji: '🎋' },
    { label: 'Makkai',  value: 'maize',       emoji: '🌽' },
    { label: 'Doosra',  value: 'other',       emoji: '🌱' },
  ],
  urdu: [
    { label: 'گندم',   value: 'wheat',      emoji: '🌾' },
    { label: 'چاول',   value: 'rice',        emoji: '🍚' },
    { label: 'کپاس',   value: 'cotton',      emoji: '🌿' },
    { label: 'گنا',    value: 'sugarcane',   emoji: '🎋' },
    { label: 'مکئی',   value: 'maize',       emoji: '🌽' },
    { label: 'دوسرا',  value: 'other',       emoji: '🌱' },
  ],
  english: [
    { label: 'Wheat',      value: 'wheat',      emoji: '🌾' },
    { label: 'Rice',       value: 'rice',        emoji: '🍚' },
    { label: 'Cotton',     value: 'cotton',      emoji: '🌿' },
    { label: 'Sugarcane',  value: 'sugarcane',   emoji: '🎋' },
    { label: 'Maize',      value: 'maize',       emoji: '🌽' },
    { label: 'Other',      value: 'other',       emoji: '🌱' },
  ],
};

const LANG_OPTIONS = [
  { key: 'roman_urdu', label: 'Roman Urdu' },
  { key: 'urdu', label: 'اردو' },
  { key: 'english', label: 'English' },
];

export default function FarmScreen() {
  const { user } = useAuth();
  const { t, language, selectLanguage } = useLanguage();
  const f = t.farm;
  const insets = useSafeAreaInsets();

  const CROP_OPTIONS = CROP_OPTIONS_BY_LANG[language] || CROP_OPTIONS_BY_LANG['roman_urdu'];

  const [acres, setAcres] = useState('5');
  const [city, setCity] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('farmProfile').then(raw => {
      if (raw) {
        const p = JSON.parse(raw);
        setAcres(p.acres?.toString() || '5');
        setCity(p.location || p.city || '');
        const crop = CROP_OPTIONS.find(c => c.value === p.crop_type);
        if (crop) setSelectedCrop(crop);
        if (p.lat && p.lng) {
          setResolvedLocation({ lat: p.lat, lng: p.lng, address: p.location });
        }
      }
    });
  }, []);

  const handleSave = async () => {
    if (!city.trim()) {
      Alert.alert('', f.mustCity || 'Sheher ka naam likhein');
      return;
    }
    if (!selectedCrop) {
      Alert.alert('', f.mustCrop || 'Fasal chunein');
      return;
    }

    setLoading(true);
    setGeocoding(true);

    try {
      const sessionId = await getSessionId();

      // Call backend save endpoint — it geocodes the city automatically
      const response = await saveFarm({
        crop_type: selectedCrop.value,
        location: city,
        acres: parseFloat(acres) || 5,
        language,
        lat: 0,
        lng: 0,
        session_id: sessionId,
      }, language);

      const savedData = response.data;
      setGeocoding(false);

      // Save full profile to AsyncStorage with real coordinates from backend
      const profile = {
        crop_type: savedData.crop_type,
        crop_label: selectedCrop.label,
        location: savedData.location,
        acres: savedData.acres,
        language,
        lat: savedData.lat,
        lng: savedData.lng,
      };

      await AsyncStorage.setItem('farmProfile', JSON.stringify(profile));
      setResolvedLocation({
        lat: savedData.lat,
        lng: savedData.lng,
        address: savedData.location
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

    } catch (e) {
      console.log('Save error:', e);
      setGeocoding(false);

      // Fallback — save locally even if backend fails
      const profile = {
        crop_type: selectedCrop.value,
        crop_label: selectedCrop.label,
        location: city,
        acres: parseFloat(acres) || 5,
        language,
        lat: 0,
        lng: 0,
      };
      await AsyncStorage.setItem('farmProfile', JSON.stringify(profile));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Text style={{ fontSize: 22 }}>🌾</Text>
        <View>
          <Text style={s.title}>{f.title}</Text>
          <Text style={s.subtitle}>{f.subtitle}</Text>
        </View>
      </View>
      <AjrakBand h={10} />

      <ScrollView contentContainerStyle={s.body}>

        {/* Verified badge */}
        <View style={s.verifiedCard}>
          <Text style={s.verifiedText}>{f.verified || '✓ Verified Kisan'}</Text>
          {user && <Text style={s.userName}>👤 {user.name}</Text>}
        </View>

        {/* Language */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{f.langLabel || '🌐 Zaban ka Intikhab'}</Text>
          <Text style={s.hint}>
            {f.langHint || 'Zaban badalne se poori app mein text badal jayega'}
          </Text>
          <View style={s.langRow}>
            {LANG_OPTIONS.map(opt => {
              const active = language === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[s.langBtn, active && s.langBtnActive]}
                  onPress={() => selectLanguage(opt.key)}
                >
                  <Text style={[s.langBtnText, active && s.langBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Crop */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{f.cropLabel || '🌾 Fasal ka Intikhab'}</Text>
          <View style={s.cropGrid}>
            {/* Crop buttons — driven by t.farm.crops array */}
            {['wheat','rice','sugarcane','cotton','maize','other'].map((val, i) => {
              const active = selectedCrop?.value === val;
              const CROP_VALUES = ['wheat','rice','sugarcane','cotton','maize','other'];
              const cropLabel = (f.crops && f.crops[i]) ? f.crops[i] : CROP_VALUES[i];
              return (
                <TouchableOpacity
                  key={i}
                  style={[s.cropBtn, active && s.cropBtnActive]}
                  onPress={() => setSelectedCrop({ value: val, label: cropLabel })}
                >
                  <Text style={[s.cropBtnText, active && s.cropBtnTextActive]}>
                    {cropLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Farm Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{f.infoLabel || '📋 Farm ki Maloomat'}</Text>

          <Text style={s.inputLabel}>{f.acreLabel || 'Rukba (Acre)'}</Text>
          <TextInput
            style={s.input}
            value={acres}
            onChangeText={setAcres}
            placeholder="e.g. 5"
            placeholderTextColor={C.inkFaint}
            keyboardType="numeric"
          />

          <Text style={s.inputLabel}>{f.cityLabel || 'Sheher ya Ilaaqa'}</Text>
          <TextInput
            style={s.input}
            value={city}
            onChangeText={(text) => {
              setCity(text);
              setResolvedLocation(null);
            }}
            placeholder="e.g. Vehari, Multan, Lahore..."
            placeholderTextColor={C.inkFaint}
          />

          {/* Show resolved location after save */}
          {resolvedLocation && resolvedLocation.lat !== 0 && (
            <View style={s.locationResolved}>
              <Text style={s.locationResolvedText}>
                {f.locationFound || '✅ Location milgayi:'} {resolvedLocation.address}
              </Text>
              <Text style={s.locationCoords}>
                {resolvedLocation.lat.toFixed(4)}, {resolvedLocation.lng.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            s.saveBtn,
            saved && s.saveBtnSaved,
            loading && { opacity: 0.7 }
          ]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={s.saveBtnText}>
                {geocoding ? (f.locating || 'Location dhundh rahe hain...') : (f.saving || 'Save ho raha hai...')}
              </Text>
            </View>
          ) : (
            <Text style={s.saveBtnText}>
              {saved ? (f.savedBtn || '✅ Save ho gaya!') : (f.saveBtn || '💾 Profile Save Karein')}
            </Text>
          )}
        </TouchableOpacity>

        {saved && (
          <View style={s.successCard}>
            <Text style={s.successText}>
              {f.successMsg || '✅ Aap ka profile save ho gaya. Ab chat mein aap ki fasal aur location automatically use hogi.'}
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
  verifiedCard: { backgroundColor: '#F0FDF4', borderRadius: 14, borderWidth: 1.5, borderColor: C.green, padding: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verifiedText: { color: C.green, fontSize: 15, fontWeight: '700' },
  userName: { color: C.ink, fontSize: 14 },
  section: { backgroundColor: C.white, borderRadius: 14, borderWidth: 0.5, borderColor: C.sep, padding: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.maroon, marginBottom: 6 },
  hint: { fontSize: 13, color: C.inkMuted, marginBottom: 10 },
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: C.sep, alignItems: 'center' },
  langBtnActive: { backgroundColor: C.maroon, borderColor: C.maroon },
  langBtnText: { fontSize: 13, fontWeight: '700', color: C.inkMuted },
  langBtnTextActive: { color: '#fff' },
  cropGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cropBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: C.sep, backgroundColor: C.cream },
  cropBtnActive: { backgroundColor: C.green, borderColor: C.green },
  cropBtnText: { fontSize: 14, fontWeight: '600', color: C.inkMuted },
  cropBtnTextActive: { color: '#fff' },
  inputLabel: { fontSize: 13, color: C.inkMuted, fontWeight: '600', marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: C.cream, borderRadius: 10, padding: 13, fontSize: 15, color: C.ink, borderWidth: 1, borderColor: C.sep },
  locationResolved: { backgroundColor: '#F0FDF4', borderRadius: 8, padding: 8, marginTop: 8, borderWidth: 0.5, borderColor: C.green },
  locationResolvedText: { fontSize: 12, color: C.green, fontWeight: '600' },
  locationCoords: { fontSize: 11, color: C.inkMuted, marginTop: 2 },
  saveBtn: { backgroundColor: C.maroon, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: C.gold, marginTop: 8 },
  saveBtnSaved: { backgroundColor: C.green, borderColor: C.green },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  successCard: { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 0.5, borderColor: C.green },
  successText: { fontSize: 13, color: C.green, lineHeight: 20 },
});