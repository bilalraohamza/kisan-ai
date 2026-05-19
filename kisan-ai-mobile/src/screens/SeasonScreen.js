import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';

import AjrakBand from '../components/AjrakBand';
import { C } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';

const BASE_URL = 'https://kisan-ai-backend-669164319923.asia-south1.run.app';

const fetchSeasonPlan = async (plantingDate, farmProfile, language) => {
  const response = await axios.post(
    BASE_URL + '/api/farm/season-plan',
    {
      crop_type: farmProfile.crop_type || 'wheat',
      planting_date: plantingDate,
      acres: parseFloat(farmProfile.acres) || 5,
      farmer_lat: parseFloat(farmProfile.lat) || 30.1575,
      farmer_lng: parseFloat(farmProfile.lng) || 71.5249,
      language: language || 'roman_urdu'
    },
    { timeout: 60000 }
  );
  return response.data;
};

const getCropEmoji = (cropType) => {
  const m = { wheat: '🌾', rice: '🍚', cotton: '🌿', sugarcane: '🎋', maize: '🌽' };
  return m[cropType] || '🌱';
};

const getDefaultPlantingDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 4);
  return d.toISOString().split('T')[0];
};

export default function SeasonScreen({ navigation }) {
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  
  const [farmProfile, setFarmProfile] = useState({});
  const [plantingDate, setPlantingDate] = useState(getDefaultPlantingDate());
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const loadProfile = async () => {
    try {
      const raw = await AsyncStorage.getItem('farmProfile');
      if (raw) setFarmProfile(JSON.parse(raw));
    } catch (e) {
      console.log('Error loading profile', e);
    }
  };

  const handleGenerate = async () => {
    if (!plantingDate) {
      Alert.alert('Error', 'Please enter a planting date.');
      return;
    }
    setLoading(true);
    try {
      const data = await fetchSeasonPlan(plantingDate, farmProfile, language);
      setPlan(data);
    } catch (error) {
      console.error('Plan error:', error);
      Alert.alert('Error', 'Failed to generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tUI = {
    roman_urdu: {
      inputLabel: "Fasal kab boi?",
      btn: "AI Plan Banao",
      loading: "AI aap ki fasal ka plan bana raha hai...",
      urgent: "⚠️ Fasal tayyar hone wali hai! Abhi harvester book karein",
      next30: "Agle 30 din ki zaroorat",
      fullCal: "Poora Calendar",
      reset: "Nai Tareekh Darj Karein",
    },
    urdu: {
      inputLabel: "فصل کب بوئی؟",
      btn: "AI پلان بناؤ",
      loading: "AI آپ کی فصل کا پلان بنا رہا ہے...",
      urgent: "⚠️ فصل تیار ہونے والی ہے! ابھی ہارویسٹر بک کریں",
      next30: "اگلے 30 دن کی ضرورت",
      fullCal: "پورا کیلنڈر",
      reset: "نئی تاریخ درج کریں",
    },
    english: {
      inputLabel: "When did you plant?",
      btn: "Generate AI Plan",
      loading: "AI is generating your crop plan...",
      urgent: "⚠️ Harvest is approaching! Book harvester now",
      next30: "Next 30 days",
      fullCal: "Full Calendar",
      reset: "Enter New Date",
    }
  };
  const texts = tUI[language] || tUI.roman_urdu;

  const renderInputForm = () => (
    <View style={s.card}>
      <Text style={s.label}>Crop</Text>
      <Text style={s.readOnly}>{getCropEmoji(farmProfile.crop_type)} {farmProfile.crop_label || farmProfile.crop_type || 'Unknown'}</Text>
      
      <Text style={[s.label, { marginTop: 15 }]}>Acres</Text>
      <Text style={s.readOnly}>{farmProfile.acres || '0'}</Text>

      <Text style={[s.label, { marginTop: 15 }]}>{texts.inputLabel}</Text>
      <TextInput
        style={s.input}
        value={plantingDate}
        onChangeText={setPlantingDate}
        placeholder="YYYY-MM-DD (e.g. 2026-01-15)"
        placeholderTextColor={C.inkFaint}
      />

      <TouchableOpacity style={s.btn} onPress={handleGenerate}>
        <Text style={s.btnText}>{texts.btn}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={s.loader}>
      <ActivityIndicator size="large" color={C.maroon} />
      <Text style={s.loadingText}>{texts.loading}</Text>
    </View>
  );

  const renderPlan = () => {
    if (!plan) return null;
    const isReadySoon = plan.crop_status === 'READY_SOON';

    return (
      <View style={s.planContainer}>
        {/* Banner */}
        <View style={s.banner}>
          <Text style={s.bannerTitle}>{getCropEmoji(farmProfile.crop_type)} {plan.crop_name}</Text>
          <Text style={s.bannerStage}>{plan.current_stage_name}</Text>
          <View style={s.daysRow}>
            <Text style={s.daysValue}>{plan.days_to_harvest}</Text>
            <Text style={s.daysLabel}>days to harvest</Text>
          </View>
          <Text style={s.estHarvest}>Est: {plan.estimated_harvest_date}</Text>
        </View>

        {isReadySoon && (
          <View style={s.urgentBanner}>
            <Text style={s.urgentText}>{texts.urgent}</Text>
          </View>
        )}

        {/* Upcoming Services */}
        {plan.upcoming_services && plan.upcoming_services.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{texts.next30}</Text>
            {plan.upcoming_services.map((svc, i) => (
              <View key={i} style={s.serviceCard}>
                <View style={s.svcHeader}>
                  <Text style={s.svcName}>{svc.service_name}</Text>
                  <View style={[s.badge, { 
                    backgroundColor: svc.urgency === 'high' ? '#FEE2E2' : svc.urgency === 'medium' ? '#FEF3C7' : '#DCFCE7' 
                  }]}>
                    <Text style={[s.badgeText, {
                      color: svc.urgency === 'high' ? '#B91C1C' : svc.urgency === 'medium' ? '#D97706' : '#16A34A'
                    }]}>{svc.urgency}</Text>
                  </View>
                </View>
                <Text style={s.svcDate}>By: {svc.recommended_by_date}</Text>
                <Text style={s.svcReason}>{svc.reason}</Text>
                
                {svc.urgency === 'high' && (
                  <TouchableOpacity 
                    style={s.actionBtn}
                    onPress={() => {
                      const lower = svc.service_name.toLowerCase();
                      if (lower.includes('harvester')) navigation.navigate('Services');
                      else if (lower.includes('mandi')) navigation.navigate('Mandi');
                      else Alert.alert('Call', 'Dialing...');
                    }}
                  >
                    <Text style={s.actionBtnText}>
                      {(svc.service_name.toLowerCase().includes('harvester') || svc.service_name.toLowerCase().includes('mandi')) ? 'Book Now →' : '📞 Call'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Full Calendar */}
        {plan.full_calendar && plan.full_calendar.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{texts.fullCal}</Text>
            {plan.full_calendar.map((ev, i) => (
              <View key={i} style={s.calRow}>
                <View style={s.calLeft}>
                  <Text style={s.calDate}>{ev.date}</Text>
                </View>
                <View style={s.calRight}>
                  <Text style={s.calEventName}>{ev.event_name}</Text>
                  <Text style={s.calEventDesc}>{ev.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Post Harvest */}
        {plan.post_harvest_plan && (
          <View style={s.postHarvestCard}>
            <Text style={s.postHarvestText}>{plan.post_harvest_plan}</Text>
          </View>
        )}

        <TouchableOpacity style={s.resetBtn} onPress={() => setPlan(null)}>
          <Text style={s.resetBtnText}>{texts.reset}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Text style={s.headerTitle}>📅 Season Planner</Text>
      </View>
      <AjrakBand h={10} />
      
      <ScrollView contentContainerStyle={s.scroll}>
        {loading ? renderLoading() : (plan ? renderPlan() : renderInputForm())}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: C.maroon, paddingHorizontal: 20, paddingBottom: 15 },
  headerTitle: { color: C.white, fontSize: 20, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: C.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.sep },
  label: { fontSize: 14, color: C.inkMuted, fontWeight: '600', marginBottom: 6 },
  readOnly: { fontSize: 16, color: C.ink, backgroundColor: C.goldPale, padding: 10, borderRadius: 8, overflow: 'hidden' },
  input: { backgroundColor: C.white, borderWidth: 1, borderColor: C.gold, borderRadius: 8, padding: 12, fontSize: 16, color: C.ink },
  btn: { backgroundColor: C.maroon, borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 24 },
  btnText: { color: C.white, fontSize: 16, fontWeight: '700' },
  loader: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  loadingText: { marginTop: 15, fontSize: 16, color: C.inkMuted },
  
  planContainer: { gap: 16 },
  banner: { backgroundColor: C.white, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: C.sep },
  bannerTitle: { fontSize: 20, fontWeight: '700', color: C.ink },
  bannerStage: { fontSize: 16, color: C.maroon, fontWeight: '600', marginTop: 4 },
  daysRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginVertical: 10 },
  daysValue: { fontSize: 40, fontWeight: '800', color: C.green },
  daysLabel: { fontSize: 16, color: C.inkMuted },
  estHarvest: { fontSize: 14, color: C.inkMuted, fontWeight: '500' },
  
  urgentBanner: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#B91C1C' },
  urgentText: { color: '#B91C1C', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.maroon, marginBottom: 12 },
  serviceCard: { backgroundColor: C.white, borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.sep },
  svcHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  svcName: { fontSize: 16, fontWeight: '700', color: C.ink, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  svcDate: { fontSize: 13, color: C.inkMuted, marginBottom: 8 },
  svcReason: { fontSize: 14, color: C.ink, lineHeight: 20 },
  actionBtn: { backgroundColor: C.maroon, padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 12 },
  actionBtnText: { color: C.white, fontWeight: '700' },
  
  calRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  calLeft: { width: 80 },
  calDate: { fontSize: 13, fontWeight: '700', color: C.maroon },
  calRight: { flex: 1, backgroundColor: C.white, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: C.sep },
  calEventName: { fontSize: 15, fontWeight: '700', color: C.ink, marginBottom: 4 },
  calEventDesc: { fontSize: 13, color: C.inkMuted, lineHeight: 18 },
  
  postHarvestCard: { backgroundColor: '#DCFCE7', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#16A34A', marginTop: 8 },
  postHarvestText: { fontSize: 14, color: '#166534', lineHeight: 20, fontWeight: '500' },
  
  resetBtn: { padding: 16, alignItems: 'center', marginTop: 10 },
  resetBtnText: { color: C.maroon, fontSize: 15, fontWeight: '700' }
});
