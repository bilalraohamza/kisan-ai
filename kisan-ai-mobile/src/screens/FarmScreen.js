import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import AsyncStorage  from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AjrakBand     from '../components/AjrakBand';
import { C }         from '../constants/colors';
import { saveFarm }  from '../services/api';
import { useAuth }   from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function FarmScreen() {
  const { user }                    = useAuth();
  const { t, language, selectLanguage } = useLanguage();
  const f      = t.farm;
  const insets = useSafeAreaInsets();

  const [acres,  setAcres]  = useState('');
  const [city,   setCity]   = useState('');
  const [crop,   setCrop]   = useState('');
  const [saved,  setSaved]  = useState(false);
  const [loading, setLoading] = useState(false);

  // Load persisted profile on mount
  useEffect(() => {
    AsyncStorage.getItem('farmProfile').then(raw => {
      if (raw) {
        const p = JSON.parse(raw);
        setAcres(p.acres || '');
        setCity(p.city   || '');
        setCrop(p.crop   || '');
      }
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const profile = { acres, city, crop, language };
    await AsyncStorage.setItem('farmProfile', JSON.stringify(profile));
    try { await saveFarm(profile); } catch { /* offline ok */ }
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const LANG_OPTIONS = [
    { key: 'roman_urdu', label: 'Roman Urdu' },
    { key: 'urdu',       label: 'اردو'        },
    { key: 'english',    label: 'English'     },
  ];

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
          <Text style={s.verifiedText}>{f.verified}</Text>
          {user && <Text style={s.userName}>👤 {user.name}</Text>}
        </View>

        {/* ── Language Switcher ─────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>{f.langLabel}</Text>
          <Text style={s.hint}>{f.langHint}</Text>
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

        {/* ── Crop Selection ─────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>{f.cropLabel}</Text>
          <View style={s.cropGrid}>
            {f.crops.map((c, i) => (
              <TouchableOpacity
                key={i}
                style={[s.cropBtn, crop === c && s.cropBtnActive]}
                onPress={() => setCrop(c)}
              >
                <Text style={[s.cropBtnText, crop === c && s.cropBtnTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Farm Info ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>{f.infoLabel}</Text>
          <Text style={s.inputLabel}>{f.acreLabel}</Text>
          <TextInput
            style={s.input}
            value={acres}
            onChangeText={setAcres}
            placeholder="e.g. 5"
            placeholderTextColor={C.inkFaint}
            keyboardType="numeric"
          />
          <Text style={s.inputLabel}>{f.cityLabel}</Text>
          <TextInput
            style={s.input}
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Vehari"
            placeholderTextColor={C.inkFaint}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[s.saveBtn, saved && s.saveBtnSaved, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.saveBtnText}>{saved ? f.savedBtn : f.saveBtn}</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header:          { backgroundColor: C.maroon, paddingHorizontal: 14, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  title:           { color: '#fff', fontWeight: '700', fontSize: 16 },
  subtitle:        { color: C.goldLt, fontSize: 13 },
  body:            { padding: 16, paddingBottom: 80 },
  verifiedCard:    { backgroundColor: '#F0FDF4', borderRadius: 14, borderWidth: 1.5, borderColor: C.green, padding: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verifiedText:    { color: C.green, fontSize: 15, fontWeight: '700' },
  userName:        { color: C.ink, fontSize: 14 },
  section:         { backgroundColor: C.white, borderRadius: 14, borderWidth: 0.5, borderColor: C.sep, padding: 14, marginBottom: 12 },
  sectionLabel:    { fontSize: 14, fontWeight: '700', color: C.maroon, marginBottom: 6 },
  hint:            { fontSize: 13, color: C.inkMuted, marginBottom: 10 },
  langRow:         { flexDirection: 'row', gap: 8 },
  langBtn:         { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: C.sep, alignItems: 'center' },
  langBtnActive:   { backgroundColor: C.maroon, borderColor: C.maroon },
  langBtnText:     { fontSize: 13, fontWeight: '700', color: C.inkMuted },
  langBtnTextActive:{ color: '#fff' },
  cropGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cropBtn:         { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: C.sep, backgroundColor: C.cream },
  cropBtnActive:   { backgroundColor: C.green, borderColor: C.green },
  cropBtnText:     { fontSize: 14, fontWeight: '600', color: C.inkMuted },
  cropBtnTextActive:{ color: '#fff' },
  inputLabel:      { fontSize: 13, color: C.inkMuted, fontWeight: '600', marginBottom: 4, marginTop: 8 },
  input:           { backgroundColor: C.cream, borderRadius: 10, padding: 13, fontSize: 15, color: C.ink, borderWidth: 1, borderColor: C.sep },
  saveBtn:         { backgroundColor: C.maroon, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: C.gold, marginTop: 8 },
  saveBtnSaved:    { backgroundColor: C.green, borderColor: C.green },
  saveBtnText:     { color: '#fff', fontSize: 17, fontWeight: '800' },
});

