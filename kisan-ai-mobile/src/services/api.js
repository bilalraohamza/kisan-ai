import axios from 'axios';

// Person A will give you this URL on Day 2 after Railway deploy
const BASE_URL = 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL, timeout: 30000 });

export const chatMessage = (text, language, farmProfile) =>
  api.post('/api/chat', { message: text, language, farm_profile: farmProfile });

export const analyzeDisease = (formData) =>
  api.post('/api/disease/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getWeather = (lat, lng) =>
  api.get(`/api/weather/${lat}/${lng}`);

export const getMandiPrices = (cropType) =>
  api.get(`/api/mandi/prices/${cropType}`);

export const saveFarm = (farmData) =>
  api.post('/api/farm/save', farmData);

export const findServices = (serviceType, farmProfile) =>
  api.post('/api/services/find', { service_type: serviceType, farm_profile: farmProfile });
