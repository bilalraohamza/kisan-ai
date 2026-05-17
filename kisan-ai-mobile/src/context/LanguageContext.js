import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STRINGS } from '../constants/strings';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(null); // null = not yet selected
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('kisan_language').then((lang) => {
      if (lang) setLanguage(lang);
      setLoading(false);
    });
  }, []);

  const selectLanguage = async (lang) => {
    await AsyncStorage.setItem('kisan_language', lang);
    setLanguage(lang);
  };

  // t = translated strings for current language
  const t       = STRINGS[language] || STRINGS['roman_urdu'];
  const isRTL   = language === 'urdu';

  return (
    <LanguageContext.Provider value={{ language, selectLanguage, t, loading, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
