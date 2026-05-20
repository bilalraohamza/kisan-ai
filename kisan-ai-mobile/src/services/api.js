import axios from 'axios';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Live Backend (Google Cloud Run) ──────────────────────────────────────────
const BASE_URL = 'https://kisan-ai-backend-669164319923.asia-south1.run.app';

// ─── Centralised endpoint map ──────────────────────────────────────────────────
export const ENDPOINTS = {
  chat: `${BASE_URL}/api/chat`,
  diseaseAnalyze: `${BASE_URL}/api/disease/analyze`,
  weather: (lat, lng) => `${BASE_URL}/api/farm/weather/${lat}/${lng}`,
  servicesFind: `${BASE_URL}/api/services/find`,
  mandiPrices: (cropType) => `${BASE_URL}/api/mandi/prices/${cropType}`,
  seasonPlan: `${BASE_URL}/api/farm/season-plan`,
  health: `${BASE_URL}/health`,
};

// ─── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: BASE_URL, timeout: 90000 });

api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    if (!config || config._retryCount >= 2) {
      return Promise.reject(error);
    }
    if (
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout') ||
      error.response?.status === 429 ||
      error.response?.status === 503
    ) {
      config._retryCount = (config._retryCount || 0) + 1;
      const waitTime = config._retryCount * 5000;
      console.log('[api] Retry ' + config._retryCount + ' after ' + waitTime + 'ms...');
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return api(config);
    }
    return Promise.reject(error);
  }
);

// ─── Session ID — persists across app restarts ────────────────────────────────
let _sessionId = null;

export const getSessionId = async () => {
  if (_sessionId) return _sessionId;

  try {
    const stored = await AsyncStorage.getItem('kisan_session_id');
    if (stored) {
      _sessionId = stored;
    } else {
      _sessionId = Crypto.randomUUID();
      await AsyncStorage.setItem('kisan_session_id', _sessionId);
    }
  } catch {
    _sessionId = Crypto.randomUUID();
  }

  return _sessionId;
};

// ─── Health check ──────────────────────────────────────────────────────────────
export const checkHealth = () =>
  fetch(ENDPOINTS.health)
    .then((res) => res.json())
    .then((data) => console.log('[Kisan AI] Backend connected:', data))
    .catch((err) => console.warn('[Kisan AI] Backend connection failed:', err));

// ─── Chat ──────────────────────────────────────────────────────────────────────
export const chatMessage = async (text, language = 'roman_urdu', farmProfile = {}) => {
  const sessionId = await getSessionId();
  return api.post('/api/chat', {
    message: text,
    language,
    farmer_profile: farmProfile,
    session_id: sessionId,
  });
};

// ─── Disease Analysis ──────────────────────────────────────────────────────────
export const analyzeDisease = async (formData, language = 'roman_urdu') => {
  const sessionId = await getSessionId();
  formData.append('language', language);
  formData.append('session_id', sessionId);
  return api.post('/api/disease/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 90000
  });
};

// ─── Weather ───────────────────────────────────────────────────────────────────
export const getWeather = async (lat, lng, language = 'roman_urdu') => {
  const sessionId = await getSessionId();
  return api.get(`/api/farm/weather/${lat}/${lng}`, {
    params: { language, session_id: sessionId },
    timeout: 90000
  });
};

// ─── Mandi Prices ─────────────────────────────────────────────────────────────
export const getMandiPrices = async (cropType, language = 'roman_urdu') => {
  const sessionId = await getSessionId();
  return api.get(`/api/mandi/prices/${cropType}`, {
    params: { language, session_id: sessionId },
    timeout: 90000
  });
};

// ─── Services Find ────────────────────────────────────────────────────────────
export const findServices = async (
  serviceType,
  location = {},
  language = 'roman_urdu',
  cropType = 'wheat',
  acres = 5,
  preferredDate = null
) => {
  const sessionId = await getSessionId();
  const farmProfile = JSON.parse(
    await AsyncStorage.getItem('farmProfile') || '{}'
  );

  const today = new Date();
  today.setDate(today.getDate() + 2);
  const date = preferredDate || today.toISOString().split('T')[0];

  return api.post('/api/services/find', {
    service_type:   serviceType,
    location: {
      lat: location.lat || parseFloat(farmProfile.lat) || 30.1575,
      lng: location.lng || parseFloat(farmProfile.lng) || 71.5249,
    },
    crop_type:      cropType || farmProfile.crop_type || 'wheat',
    acres:          parseFloat(acres || farmProfile.acres || 5),
    preferred_date: date,
    session_id:     sessionId,
    language,
  }, { timeout: 90000 });
};

// ─── Season Plan ──────────────────────────────────────────────────────────────
export const getSeasonPlan = async (
  cropType,
  plantingDate,
  acres = 5,
  farmerLat = 30.1575,
  farmerLng = 71.5249,
  language = 'roman_urdu'
) => {
  const sessionId = await getSessionId();
  return api.post('/api/farm/season-plan', {
    crop_type:     cropType,
    planting_date: plantingDate,
    acres:         parseFloat(acres) || 5,
    farmer_lat:    parseFloat(farmerLat) || 30.1575,
    farmer_lng:    parseFloat(farmerLng) || 71.5249,
    language,
    session_id:    sessionId,
  }, { timeout: 90000 });
};

// ─── Save Farm ────────────────────────────────────────────────────────────────
export const saveFarm = async (farmData, language = 'roman_urdu') => {
  const sessionId = await getSessionId();
  return api.post('/api/farm/save', {
    ...farmData,
    language,
    session_id: sessionId,
  });
};