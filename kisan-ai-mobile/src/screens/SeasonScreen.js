import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import AjrakBand from '../components/AjrakBand';
import { C } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { getSeasonPlan } from '../services/api';

const getCropEmoji = (cropType) => {
  const m = { wheat: '🌾', rice: '🍚', cotton: '🌿', sugarcane: '🎋', maize: '🌽' };
  return m[cropType] || '🌱';
};

const getDefaultPlantingDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 4);
  return d.toISOString().split('T')[0];
};

const labels = {
  roman_urdu: {
    crop: 'Fasal',
    acres: 'Rukba',
    acre: 'Acre',
    when: 'Fasal kab boi thi?',
    button: 'AI Plan Banao',
    months: ['1 mahina pehle', '2 mahine pehle', '3 mahine pehle', '4 mahine pehle', '5 mahine pehle'],
    daysAgo: 'din pehle'
  },
  urdu: {
    crop: 'فصل',
    acres: 'رقبہ',
    acre: 'ایکڑ',
    when: 'فصل کب بوئی تھی؟',
    button: 'AI پلان بناؤ',
    months: ['1 مہینہ پہلے', '2 مہینے پہلے', '3 مہینے پہلے', '4 مہینے پہلے', '5 مہینے پہلے'],
    daysAgo: 'دن پہلے'
  },
  english: {
    crop: 'Crop',
    acres: 'Area',
    acre: 'Acres',
    when: 'When did you plant?',
    button: 'Generate AI Plan',
    months: ['1 month ago', '2 months ago', '3 months ago', '4 months ago', '5 months ago'],
    daysAgo: 'days ago'
  }
};

const CROP_OPTIONS = {
  roman_urdu: [
    { label: 'Gehun', value: 'wheat', emoji: '🌾' },
    { label: 'Chawal', value: 'rice', emoji: '🍚' },
    { label: 'Kapas', value: 'cotton', emoji: '🌿' },
    { label: 'Ganna', value: 'sugarcane', emoji: '🎋' },
    { label: 'Makkai', value: 'maize', emoji: '🌽' },
  ],
  urdu: [
    { label: 'گندم', value: 'wheat', emoji: '🌾' },
    { label: 'چاول', value: 'rice', emoji: '🍚' },
    { label: 'کپاس', value: 'cotton', emoji: '🌿' },
    { label: 'گنا', value: 'sugarcane', emoji: '🎋' },
    { label: 'مکئی', value: 'maize', emoji: '🌽' },
  ],
  english: [
    { label: 'Wheat', value: 'wheat', emoji: '🌾' },
    { label: 'Rice', value: 'rice', emoji: '🍚' },
    { label: 'Cotton', value: 'cotton', emoji: '🌿' },
    { label: 'Sugarcane', value: 'sugarcane', emoji: '🎋' },
    { label: 'Maize', value: 'maize', emoji: '🌽' },
  ],
};

const calculateDaysAgo = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
  return diff;
};

const getDateFromDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const SERVICE_EMOJI = {
  harvester: '🚜',
  combine: '🚜',
  labor: '👷',
  mazdoor: '👷',
  storage: '🏭',
  transport: '🚌',
  mandi: '🏪',
  weather: '🌤',
  fertilizer: '🌿',
  pesticide: '💊',
  irrigation: '💧',
  inspection: '🔍',
  default: '📋'
};

const getServiceEmoji = (serviceName) => {
  const name = (serviceName || '').toLowerCase();
  for (const [key, emoji] of Object.entries(SERVICE_EMOJI)) {
    if (name.includes(key)) return emoji;
  }
  return SERVICE_EMOJI.default;
};

export default function SeasonScreen({ navigation }) {
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();

  const [farmProfile, setFarmProfile] = useState({});
  const [plantingDate, setPlantingDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [renderError, setRenderError] = useState(false);

  const L = labels[language] || labels['roman_urdu'];
  const crops = CROP_OPTIONS[language] || CROP_OPTIONS['roman_urdu'];

  const [selectedCrop, setSelectedCrop] = useState(crops[0]);
  const [acres, setAcres] = useState('5');

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
      if (raw) {
        const profile = JSON.parse(raw);
        setFarmProfile(profile);
        if (profile.crop_type) {
          const match = crops.find(c => c.value === profile.crop_type);
          if (match) setSelectedCrop(match);
        }
        if (profile.acres) {
          setAcres(profile.acres.toString());
        }
      }
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
      const response = await getSeasonPlan(
        selectedCrop.value,
        plantingDate,
        parseFloat(acres) || 5,
        parseFloat(farmProfile?.lat) || 30.1575,
        parseFloat(farmProfile?.lng) || 71.5249,
        language || 'roman_urdu'
      );
      setPlan(response.data);
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

  const setQuickDate = (days) => {
    setPlantingDate(getDateFromDays(days));
  };

  const renderInputForm = () => (
    <View style={s.card}>
      <Text style={s.label}>{L.crop}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
        {crops.map(crop => (
          <TouchableOpacity
            key={crop.value}
            style={[s.cropChip, selectedCrop.value === crop.value && s.cropChipActive]}
            onPress={() => setSelectedCrop(crop)}
          >
            <Text style={s.cropChipEmoji}>{crop.emoji}</Text>
            <Text style={[s.cropChipLabel, selectedCrop.value === crop.value && s.cropChipLabelActive]}>
              {crop.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.label}>{L.acres}</Text>
      <View style={s.acresRow}>
        <TouchableOpacity
          style={s.acresBtn}
          onPress={() => setAcres(a => String(Math.max(1, parseInt(a || 1) - 1)))}
        >
          <Text style={s.acresBtnText}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={s.acresInput}
          value={acres}
          onChangeText={setAcres}
          keyboardType="numeric"
          textAlign="center"
        />
        <TouchableOpacity
          style={s.acresBtn}
          onPress={() => setAcres(a => String(parseInt(a || 0) + 1))}
        >
          <Text style={s.acresBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.acresLabel}>{L.acre}</Text>

      <Text style={[s.label, { marginTop: 5 }]}>{L.when}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        {L.months.map((mLabel, i) => {
          const days = -30 * (i + 1);
          return (
            <TouchableOpacity
              key={i}
              style={[s.quickDateBtn, plantingDate === getDateFromDays(days) && s.quickDateBtnActive]}
              onPress={() => setQuickDate(days)}
            >
              <Text style={[s.quickDateLabel, plantingDate === getDateFromDays(days) && s.quickDateLabelActive]}>
                {mLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={s.dateInputRow}>
        <Text style={s.dateIcon}>📅</Text>
        <TextInput
          style={s.dateInput}
          value={plantingDate}
          onChangeText={setPlantingDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={C.inkFaint}
        />
      </View>

      {plantingDate ? (
        <Text style={s.dateConfirm}>
          ✅ {plantingDate} — {calculateDaysAgo(plantingDate)} {L.daysAgo}
        </Text>
      ) : null}

      <TouchableOpacity style={s.btn} onPress={handleGenerate}>
        <Text style={s.btnText}>{L.button}</Text>
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
    try {
      if (!plan) return null;
      const isReadySoon = (plan?.crop_status || '') === 'READY_SOON';

      return (
        <View style={s.planContainer}>
          {/* Banner */}
          <View style={s.banner}>
            <Text style={s.bannerTitle}>{getCropEmoji(farmProfile.crop_type)} {plan?.crop_name || ''}</Text>
            <Text style={s.bannerStage}>{plan?.current_stage_name || ''}</Text>
            <View style={s.daysRow}>
              <Text style={s.daysValue}>{plan?.days_to_harvest || 0}</Text>
              <Text style={s.daysLabel}>days to harvest</Text>
            </View>
            <Text style={s.estHarvest}>Est: {plan?.estimated_harvest_date || ''}</Text>
          </View>

          {isReadySoon && (
            <View style={s.urgentBanner}>
              <Text style={s.urgentText}>{texts.urgent}</Text>
            </View>
          )}

          {/* Upcoming Services */}
          {(plan?.upcoming_services || []).length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{texts.next30}</Text>
              {(plan?.upcoming_services || []).map((item, i) => (
                <View key={i} style={s.serviceCard}>
                  <View style={s.serviceCardHeader}>
                    <View style={s.serviceNameRow}>
                      <Text style={s.serviceEmoji}>
                        {getServiceEmoji(item.service)}
                      </Text>
                      <Text style={s.serviceName}>
                        {item?.service || 'Service'}
                      </Text>
                    </View>
                    <View style={[s.urgencyBadge, {
                      backgroundColor:
                        (item?.urgency || 'low') === 'high' ? '#FEE2E2' :
                          (item?.urgency || 'low') === 'medium' ? '#FEF3C7' : '#DCFCE7'
                    }]}>
                      <Text style={[s.urgencyText, {
                        color:
                          (item?.urgency || 'low') === 'high' ? '#B91C1C' :
                            (item?.urgency || 'low') === 'medium' ? '#D97706' : '#16A34A'
                      }]}>
                        {(item?.urgency || 'low').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={s.recommendedBy}>
                    📅 {item?.recommended_by || ''}
                  </Text>

                  <Text style={s.serviceReason}>
                    {item?.reason || ''}
                  </Text>

                  {item?.action && (
                    <Text style={s.serviceAction}>
                      ✅ {item.action}
                    </Text>
                  )}

                  {item?.navigate_to ? (
                    <TouchableOpacity
                      style={s.navigateBtn}
                      onPress={() => navigation.navigate(item.navigate_to)}
                    >
                      <Text style={s.navigateBtnText}>
                        {item.navigate_to === 'Services' ? '🚜 Service Book Karein' :
                          item.navigate_to === 'Mandi' ? '🏪 Mandi Dekhen' :
                            item.navigate_to === 'Weather' ? '🌤 Mausam Dekhen' :
                              '→ ' + item.navigate_to}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Full Calendar */}
          {(plan?.full_calendar || []).length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{texts.fullCal}</Text>
              {(plan?.full_calendar || []).map((ev, i) => (
                <View key={i} style={s.calRow}>
                  <View style={s.calLeft}>
                    <Text style={s.calDate}>{ev?.date || ''}</Text>
                  </View>
                  <View style={s.calRight}>
                    <Text style={s.calEventName}>{ev?.event_name || ''}</Text>
                    <Text style={s.calEventDesc}>{ev?.description || ''}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Post Harvest */}
          {plan?.post_harvest_plan && (
            <View style={s.postHarvestCard}>
              <Text style={s.postHarvestText}>{plan?.post_harvest_plan || ''}</Text>
            </View>
          )}

          <TouchableOpacity style={s.resetBtn} onPress={() => setPlan(null)}>
            <Text style={s.resetBtnText}>{texts.reset}</Text>
          </TouchableOpacity>
        </View>
      );
    } catch (e) {
      console.log('SeasonScreen render error:', e);
      return (
        <View style={{ padding: 20 }}>
          <Text style={{ color: 'red' }}>
            Plan display error. Please try again.
          </Text>
        </View>
      );
    }
  };

  if (renderError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Kuch masla hua. Dobara try karein.</Text>
        <TouchableOpacity onPress={() => { setPlan(null); setRenderError(false); }}>
          <Text style={{ marginTop: 10, color: C.maroon, fontWeight: 'bold' }}>Wapas jao</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
  serviceCard: { backgroundColor: C.white, borderRadius: 14, borderWidth: 0.5, borderColor: C.sep, padding: 14, marginBottom: 10 },
  serviceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  serviceNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  serviceEmoji: { fontSize: 22 },
  serviceName: { fontSize: 15, fontWeight: '700', color: C.ink, flex: 1 },
  urgencyBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  urgencyText: { fontSize: 11, fontWeight: '800' },
  recommendedBy: { fontSize: 12, color: C.inkMuted, marginBottom: 6 },
  serviceReason: { fontSize: 13, color: C.ink, lineHeight: 18, marginBottom: 8 },
  serviceAction: { fontSize: 12, color: C.green, fontWeight: '600', marginBottom: 8 },
  navigateBtn: { backgroundColor: C.maroon, borderRadius: 10, padding: 10, alignItems: 'center' },
  navigateBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  calRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  calLeft: { width: 80 },
  calDate: { fontSize: 13, fontWeight: '700', color: C.maroon },
  calRight: { flex: 1, backgroundColor: C.white, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: C.sep },
  calEventName: { fontSize: 15, fontWeight: '700', color: C.ink, marginBottom: 4 },
  calEventDesc: { fontSize: 13, color: C.inkMuted, lineHeight: 18 },

  postHarvestCard: { backgroundColor: '#DCFCE7', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#16A34A', marginTop: 8 },
  postHarvestText: { fontSize: 14, color: '#166534', lineHeight: 20, fontWeight: '500' },

  resetBtn: { padding: 16, alignItems: 'center', marginTop: 10 },
  resetBtnText: { color: C.maroon, fontSize: 15, fontWeight: '700' },

  cropChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.white, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12, marginRight: 8, borderWidth: 1.5, borderColor: C.sep },
  cropChipActive: { backgroundColor: C.green, borderColor: C.green },
  cropChipEmoji: { fontSize: 16 },
  cropChipLabel: { fontSize: 12, fontWeight: '700', color: C.inkMuted },
  cropChipLabelActive: { color: '#fff' },
  acresRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4, paddingHorizontal: 4 },
  acresBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.maroon, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  acresBtnText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  acresInput: { flex: 1, backgroundColor: C.cream, borderRadius: 12, paddingVertical: 10, fontSize: 22, fontWeight: '800', color: C.ink, borderWidth: 1, borderColor: C.sep, textAlign: 'center', minWidth: 60, maxWidth: 200 },
  acresLabel: { fontSize: 12, color: C.inkMuted, textAlign: 'center', marginBottom: 12 },
  quickDateBtn: { backgroundColor: C.white, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 10, marginRight: 6, borderWidth: 1.5, borderColor: C.sep },
  quickDateBtnActive: { backgroundColor: C.maroon, borderColor: C.maroon },
  quickDateLabel: { fontSize: 11, color: C.inkMuted, fontWeight: '600' },
  quickDateLabelActive: { color: '#fff' },
  dateInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cream, borderRadius: 12, borderWidth: 1, borderColor: C.gold, padding: 12, gap: 10 },
  dateIcon: { fontSize: 20 },
  dateInput: { flex: 1, fontSize: 15, color: C.ink },
  dateConfirm: { fontSize: 12, color: C.green, fontWeight: '600', marginTop: 6 }
});
