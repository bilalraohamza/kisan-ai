import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AjrakBand   from '../components/AjrakBand';
import ExpertCard  from '../components/ExpertCard';
import { C }       from '../constants/colors';
import { analyzeDisease } from '../services/api';
import { useLanguage }    from '../context/LanguageContext';

export default function DiseaseScreen() {
  const { t } = useLanguage();
  const d      = t.disease;
  const insets = useSafeAreaInsets();

  const [image, setImage]     = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (source) => {
    const fn = source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;
    const res = await fn({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled) setImage(res.assets[0].uri);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', { uri: image, type: 'image/jpeg', name: 'crop.jpg' });
      const { data } = await analyzeDisease(fd);
      setResult(data);
    } catch {
      alert(d.analysisError);
    } finally {
      setLoading(false);
    }
  };

  const severityColor = (s) =>
    s === 'shadeed' || s === 'severe' ? '#B91C1C' : s === 'mutawasit' || s === 'moderate' ? '#D97706' : C.green;

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Text style={{ fontSize: 22 }}>🔬</Text>
        <View>
          <Text style={s.title}>{d.title}</Text>
          <Text style={s.subtitle}>{d.subtitle}</Text>
        </View>
      </View>
      <AjrakBand h={10} />

      <ScrollView contentContainerStyle={s.body}>
        {!result ? (
          <>
            <View style={s.uploadBox}>
              {image
                ? <Image source={{ uri: image }} style={s.preview} />
                : <Text style={{ fontSize: 52, textAlign: 'center' }}>📷</Text>
              }
              {!image && (
                <>
                  <Text style={s.uploadTitle}>{d.uploadTitle}</Text>
                  <Text style={s.uploadSub}>{d.uploadSub}</Text>
                </>
              )}
              <View style={s.btnRow}>
                <TouchableOpacity style={[s.imgBtn, { backgroundColor: C.green }]} onPress={() => pickImage('camera')}>
                  <Text style={s.imgBtnText}>{d.cameraBtn}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.imgBtn, { backgroundColor: C.sky }]} onPress={() => pickImage('gallery')}>
                  <Text style={s.imgBtnText}>{d.galleryBtn}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {image && (
              <TouchableOpacity style={s.analyzeBtn} onPress={analyze} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.analyzeBtnText}>{d.analyzeBtn}</Text>
                }
              </TouchableOpacity>
            )}

            <View style={s.tipsCard}>
              <Text style={s.tipsTitle}>{d.tipsTitle}</Text>
              {d.tips.map((tip, i) => (
                <Text key={i} style={s.tipText}>•  {tip}</Text>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={[s.diseaseCard, { borderColor: severityColor(result.severity) }]}>
              <View style={s.diseaseTop}>
                <View>
                  <Text style={[s.diseaseName, { color: severityColor(result.severity) }]}>
                    {result.disease_name_urdu}
                  </Text>
                  <Text style={s.diseaseScientific}>{result.disease_name_en}</Text>
                </View>
                <Text style={{ fontSize: 22 }}>🔊</Text>
              </View>
              <View style={s.badgeRow}>
                <View style={[s.badge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[s.badgeText, { color: '#B91C1C' }]}>{result.severity}</Text>
                </View>
                <Text style={s.confidence}>{result.confidence}{d.confidence}</Text>
              </View>
              <Text style={s.diseaseDesc}>{result.description}</Text>
            </View>

            {/* ⚠️ Expert BEFORE medicines — ethical rule */}
            {result.expert && <ExpertCard expert={result.expert} />}

            {result.treatment && (
              <View style={s.treatmentCard}>
                <Text style={s.treatmentTitle}>{d.treatmentTitle}</Text>
                {result.treatment.map((med, i) => (
                  <View key={i} style={s.medRow}>
                    <Text style={s.medName}>{med.name}</Text>
                    <Text style={s.medGeneric}>{med.generic}</Text>
                    <Text style={s.medQty}>Chahiye: {med.qty}  ·  ~PKR {med.cost}</Text>
                  </View>
                ))}
                <View style={s.safetyNote}>
                  <Text style={s.safetyText}>{d.safetyText}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={s.resetBtn} onPress={() => { setImage(null); setResult(null); }}>
              <Text style={s.resetText}>{d.resetBtn}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header:     { backgroundColor: C.maroon, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  title:      { color: '#fff', fontWeight: '700', fontSize: 14 },
  subtitle:   { color: C.goldLt, fontSize: 11 },
  body:       { padding: 16, paddingBottom: 80 },
  uploadBox:  { backgroundColor: C.white, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: C.green, padding: 32, alignItems: 'center', marginBottom: 16 },
  preview:    { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  uploadTitle:{ fontSize: 14, fontWeight: '700', color: C.ink, marginTop: 10, marginBottom: 4 },
  uploadSub:  { fontSize: 12, color: C.inkMuted, textAlign: 'center', marginBottom: 22 },
  btnRow:     { flexDirection: 'row', gap: 12 },
  imgBtn:     { borderRadius: 12, paddingVertical: 11, paddingHorizontal: 22 },
  imgBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  analyzeBtn: { backgroundColor: C.maroon, borderWidth: 2, borderColor: C.gold, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 14 },
  analyzeBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  tipsCard:   { backgroundColor: C.goldPale, borderRadius: 14, borderWidth: 0.5, borderColor: C.gold, padding: 12 },
  tipsTitle:  { fontSize: 12, fontWeight: '700', color: C.goldDk, marginBottom: 6 },
  tipText:    { fontSize: 11, color: C.inkMuted, marginBottom: 4 },
  diseaseCard:{ backgroundColor: C.white, borderRadius: 16, borderWidth: 2, padding: 14, marginBottom: 14 },
  diseaseTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  diseaseName:{ fontSize: 17, fontWeight: '800' },
  diseaseScientific: { fontSize: 12, color: C.inkMuted, fontStyle: 'italic' },
  badgeRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  badge:      { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:  { fontSize: 11, fontWeight: '700' },
  confidence: { fontSize: 11, color: C.inkMuted },
  diseaseDesc:{ marginTop: 8, fontSize: 12, color: C.inkMuted, lineHeight: 18 },
  treatmentCard: { backgroundColor: C.white, borderRadius: 16, borderWidth: 0.5, borderColor: C.sep, padding: 14 },
  treatmentTitle:{ fontSize: 13, fontWeight: '700', color: C.maroon, marginBottom: 10 },
  medRow:     { backgroundColor: C.cream, borderRadius: 10, padding: 10, marginBottom: 8 },
  medName:    { fontSize: 13, fontWeight: '700', color: C.ink },
  medGeneric: { fontSize: 11, color: C.inkMuted },
  medQty:     { fontSize: 11, color: C.terra, marginTop: 4 },
  safetyNote: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 8, marginTop: 6 },
  safetyText: { fontSize: 11, color: '#92400E' },
  resetBtn:   { marginTop: 14, borderWidth: 1.5, borderColor: C.maroon, borderRadius: 12, padding: 12, alignItems: 'center' },
  resetText:  { color: C.maroon, fontSize: 13, fontWeight: '600' },
});
