import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AjrakBand from '../components/AjrakBand';
import { C } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getMandiPrices } from '../services/api';

const FEATURE_KEYS = ['Chat', 'Disease', 'Weather', 'Mandi', 'Farm', 'Season'];
const FEATURE_EMOJIS = ['💬', '🔬', '🌤', '🏪', '🌾', '📅'];
const FEATURE_BG = [C.goldPale, C.greenPale, C.skyPale, C.terraPale, C.parchment, C.greenPale];
const FEATURE_BDR = [C.gold, C.green, C.sky, C.terra, C.maroon, C.greenLt];

const CROP_EMOJI = {
  wheat: '🌾', rice: '🍚', cotton: '🌿',
  sugarcane: '🎋', maize: '🌽', other: '🌱'
};

const CROP_MANDI_MAP = {
  wheat: 'wheat',
  rice: 'rice',
  cotton: 'cotton',
  sugarcane: 'sugarcane',
  maize: 'maize',
  other: null,
};

const getGreeting = (name, language) => {
  // Pakistan Standard Time UTC+5
  const pakistanHour = (new Date().getUTCHours() + 5) % 24;

  const greetings = {
    roman_urdu: {
      morning: `Subah bakhair ${name} bhai! Aaj khet mein kya khabar hai?`,
      afternoon: `Dopahar bakhair ${name} bhai! Fasal ka kya haal hai?`,
      evening: `Shaam bakhair ${name} bhai! Aaj ka kaam kaisa raha?`,
      night: `Khair maqdam ${name} bhai! Kal ke liye kuch madad chahiye?`,
    },
    urdu: {
      morning: `صبح بخیر ${name} بھائی! آج کھیت میں کیا خبر ہے؟`,
      afternoon: `دوپہر بخیر ${name} بھائی! فصل کا کیا حال ہے؟`,
      evening: `شام بخیر ${name} بھائی! آج کا کام کیسا رہا؟`,
      night: `خیر مقدم ${name} بھائی! کل کے لیے کچھ مدد چاہیے؟`,
    },
    english: {
      morning: `Good morning ${name}! How are your crops today?`,
      afternoon: `Good afternoon ${name}! How is the farm doing?`,
      evening: `Good evening ${name}! Hope the farm had a great day.`,
      night: `Good night ${name}! Need help planning for tomorrow?`,
    },
  };

  const lang = greetings[language] || greetings['roman_urdu'];
  if (pakistanHour >= 5 && pakistanHour < 12) return lang.morning;
  if (pakistanHour >= 12 && pakistanHour < 17) return lang.afternoon;
  if (pakistanHour >= 17 && pakistanHour < 21) return lang.evening;
  return lang.night;
};

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const hm = t.home;
  const insets = useSafeAreaInsets();

  const [contentH, setContentH] = useState(0);
  const [containerH, setContainerH] = useState(0);
  const [farmProfile, setFarmProfile] = useState(null);
  const [cropRate, setCropRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);

  const scrollNeeded = contentH > containerH && containerH > 0;

  useEffect(() => {
    loadFarmProfile();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFarmProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const loadFarmProfile = async () => {
    try {
      const raw = await AsyncStorage.getItem('farmProfile');
      if (raw) {
        const profile = JSON.parse(raw);
        setFarmProfile(profile);
        fetchCropRate(profile);
      }
    } catch (e) {
      console.log('Profile load error:', e);
    }
  };

  const fetchCropRate = async (profile) => {
    const mandiCrop = CROP_MANDI_MAP[profile?.crop_type];
    if (!mandiCrop) return;

    setRateLoading(true);
    try {
      const { data } = await getMandiPrices(
        mandiCrop,
        profile.language || language || 'roman_urdu',
        parseFloat(profile.lat) || 30.1575,
        parseFloat(profile.lng) || 71.5249,
        parseFloat(profile.acres) || 5
      );
      if (data?.best_mandi) {
        setCropRate({
          price: data.best_mandi.price_per_40kg,
          mandi: data.best_mandi.name,
          trend: data.overall_trend,
        });
      }
    } catch (e) {
      console.log('Rate fetch error:', e);
    } finally {
      setRateLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      logout();
      return;
    }
    Alert.alert(
      'Logout',
      'Kya aap logout karna chahte hain?',
      [
        { text: 'Nahi', style: 'cancel' },
        {
          text: 'Haan, Logout',
          style: 'destructive',
          onPress: async () => { await logout(); },
        },
      ]
    );
  };

  const getInfoBarContent = () => {
    if (!farmProfile) {
      return {
        label: hm.infoSetup || hm.profilePromptLabel || '📍 Apna profile set karein',
        text: hm.infoSetupSub || hm.profilePromptText || 'Meri Zameen mein jaa kar apni fasal aur sheher save karein',
        rate: null,
        mandi: null,
      };
    }

    const cropValues = ['wheat','rice','sugarcane','cotton','maize','other'];
    const cropIdx = cropValues.indexOf(farmProfile.crop_type);
    let cropLabel = farmProfile.crop_label || farmProfile.crop_type || 'Fasal';
    if (cropIdx >= 0 && t.farm?.crops) {
      cropLabel = t.farm.crops[cropIdx];
    }

    const acreString = language === 'urdu' ? 'ایکڑ' : language === 'english' ? 'Acres' : 'Acre';
    const location = farmProfile.location || farmProfile.city || '';
    const acres = farmProfile.acres || '';
    const emoji = CROP_EMOJI[farmProfile.crop_type] || '🌾';
    const trendArrow = cropRate?.trend === 'rising' ? ' ↑'
      : cropRate?.trend === 'falling' ? ' ↓' : '';

    return {
      label: hm.todayLabel ? hm.todayLabel.replace('{loc}', location) : `📍 Aaj ka haal — ${location}`,
      text: `${emoji} ${cropLabel}${acres ? ` · ${acres} ${acreString}` : ''}`,
      rate: cropRate
        ? `PKR ${cropRate.price?.toLocaleString()}/40kg${trendArrow}`
        : rateLoading ? (hm.loadingRate || 'Rate aa raha hai...') : null,
      mandi: cropRate?.mandi || null,
    };
  };

  const infoContent = getInfoBarContent();
  const name = user?.name?.split(' ')[0] || 'Kisan';

  const greeting = React.useMemo(() => {
    return getGreeting(name, language || 'roman_urdu');
  }, [user, language, name]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.maroon} translucent />

      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        {[120, 90, 60].map((size, i) => (
          <View key={i} style={[s.circle, {
            width: size, height: size,
            right: -size / 2.5, top: -size / 2.5,
            borderColor: `rgba(201,139,53,${0.15 + i * 0.1})`,
          }]} />
        ))}

        <View style={s.headerRow}>
          <View style={s.logoRow}>
            <View style={s.logo}>
              <Text style={{ fontSize: 26 }}>🌾</Text>
            </View>
            <View>
              <Text style={s.appName}>Kisan AI</Text>
              <Text style={s.appSub}>{hm.tagline}</Text>
            </View>
          </View>

          {user ? (
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={s.logoutBtnText}>🚪 {hm.logoutBtn || 'Logout'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.loginBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={s.loginBtnText}>{hm.loginBtn}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.infoBar}>
          <Text style={s.infoBarLabel}>{infoContent.label}</Text>
          <View style={s.infoBarRow}>
            <Text style={s.infoBarText}>{infoContent.text}</Text>
            {infoContent.rate && (
              <Text style={[s.infoBarRate, {
                color: cropRate?.trend === 'rising' ? '#86EFAC'
                  : cropRate?.trend === 'falling' ? '#FCA5A5'
                    : C.goldLt
              }]}>
                {infoContent.rate}
              </Text>
            )}
          </View>
          {infoContent.mandi && (
            <Text style={s.infoBarMandi}>📍 {infoContent.mandi}</Text>
          )}
        </View>
      </View>

      <AjrakBand h={12} />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollNeeded}
        onLayout={e => setContainerH(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => setContentH(h)}
      >
        {user && (
          <View style={s.greetCard}>
            <Text style={s.greetText}>
              👋 {greeting}
            </Text>
          </View>
        )}

        {!farmProfile && (
          <TouchableOpacity
            style={s.setupCard}
            onPress={() => navigation.navigate('Farm')}
          >
            <Text style={s.setupEmoji}>👆</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.setupTitle}>
                {language === 'urdu' ? 'پروفائل سیٹ اپ کریں' :
                 language === 'english' ? 'Set up your profile first' :
                 'Pehle apna profile set karein'}
              </Text>
              <Text style={s.setupSub}>
                {language === 'urdu' ? 'موسم، منڈی اور خدمات کے لیے ضروری ہے' :
                 language === 'english' ? 'Required for weather, mandi and services' :
                 'Mausam, mandi aur khadmaat ke liye zaroori hai'}
              </Text>
            </View>
            <Text style={{ fontSize: 18 }}>→</Text>
          </TouchableOpacity>
        )}

        <Text style={s.sectionLabel}>{hm.sectionLabel}</Text>

        <View style={s.grid}>
          {hm.features.map((f, idx) => (
            <TouchableOpacity
              key={idx}
              style={[s.featureCard, {
                backgroundColor: FEATURE_BG[idx],
                borderColor: FEATURE_BDR[idx]
              }]}
              activeOpacity={0.75}
              onPress={() => navigation.navigate(FEATURE_KEYS[idx])}
            >
              <Text style={{ fontSize: 28, marginBottom: 4 }}>{FEATURE_EMOJIS[idx]}</Text>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureSub}>{f.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>


      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: C.maroon, paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden' },
  circle: { position: 'absolute', borderRadius: 200, borderWidth: 1.5 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  logo: { width: 50, height: 50, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.goldLt },
  appName: { color: '#fff', fontSize: 21, fontWeight: '800', letterSpacing: 0.5 },
  appSub: { color: C.goldLt, fontSize: 13 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  logoutBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  loginBtn: { backgroundColor: C.gold, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  loginBtnText: { color: C.maroonDk, fontSize: 13, fontWeight: '800' },
  infoBar: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(201,139,53,0.35)' },
  infoBarLabel: { color: C.goldLt, fontSize: 12, marginBottom: 4 },
  infoBarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoBarText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  infoBarRate: { fontSize: 14, fontWeight: '800' },
  infoBarMandi: { color: C.goldLt, fontSize: 11, marginTop: 4 },
  scrollView: { flex: 1 },
  body: { padding: 14, paddingBottom: 90 },
  greetCard: { backgroundColor: C.goldPale, borderRadius: 10, borderWidth: 1, borderColor: C.gold, padding: 12, marginBottom: 12 },
  greetText: { fontSize: 14, fontWeight: '600', color: C.goldDk, lineHeight: 20 },
  sectionLabel: { fontSize: 12, color: C.inkMuted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  featureCard: { width: '47%', borderWidth: 1.5, borderRadius: 16, padding: 13 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: C.ink },
  featureSub: { fontSize: 12, color: C.inkMuted, marginTop: 2, lineHeight: 16 },
  setupCard: { backgroundColor: C.maroon, borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderColor: C.gold },
  setupEmoji: { fontSize: 24 },
  setupTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  setupSub: { color: C.goldLt, fontSize: 12, marginTop: 2 },
});