import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import AjrakBand from '../components/AjrakBand';
import { C } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { ScreenEntrance, CardEntrance, AnimatedPressable } from '../components/ScreenEntrance';

const LANGUAGES = [
  {
    key: 'roman_urdu',
    flag: '🇵🇰',
    name: 'Roman Urdu',
    native: 'Roman Urdu',
    sample: 'AI se sawaal poochein',
    desc: 'Phonetic Urdu in English letters',
  },
  {
    key: 'urdu',
    flag: '🇵🇰',
    name: 'اردو',
    native: 'اردو',
    sample: 'AI سے سوال پوچھیں',
    desc: 'اصلی اردو رسم الخط',
    rtl: true,
  },
  {
    key: 'english',
    flag: '🇬🇧',
    name: 'English',
    native: 'English',
    sample: 'Ask AI anything',
    desc: 'Full English interface',
  },
];

export default function LanguagePickerScreen() {
  const { selectLanguage } = useLanguage();
  const [selected, setSelected] = useState('roman_urdu');

  const confirm = () => selectLanguage(selected);

  return (
    <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.maroonDk} />

        {/* Header */}
        <View style={s.header}>
          <AjrakBand h={8} />
          <View style={s.headerBody}>
            <View style={s.logo}><Text style={{ fontSize: 36 }}>🌾</Text></View>
            <Text style={s.appName}>Kisan AI</Text>
            <Text style={s.appSub}>Pakistan ke kisanon ka AI saathi</Text>
          </View>
          <AjrakBand h={8} />
        </View>

        <ScreenEntrance style={{ flex: 1 }}>
          <View style={s.body}>
          <Text style={s.title}>Zaban Chunein</Text>
          <Text style={s.sub}>App kis zaban mein chalani hai?</Text>

          {/* Language Cards */}
          {LANGUAGES.map((lang, idx) => {
            const active = selected === lang.key;
            return (
              <CardEntrance key={lang.key} delay={100 + idx * 100}>
                <AnimatedPressable
                  style={[s.card, active && s.cardActive]}
                  onPress={() => setSelected(lang.key)}
                >
                  <View style={s.cardLeft}>
                    <Text style={s.flag}>{lang.flag}</Text>
                  </View>
                  <View style={s.cardMid}>
                    <Text style={[s.langName, lang.rtl && s.rtlText, active && s.activeText]}>
                      {lang.name}
                    </Text>
                    <Text style={[s.langSample, lang.rtl && s.rtlText]}>
                      {lang.sample}
                    </Text>
                    <Text style={s.langDesc}>{lang.desc}</Text>
                  </View>
                  <View style={[s.radio, active && s.radioActive]}>
                    {active && <View style={s.radioDot} />}
                  </View>
                </AnimatedPressable>
              </CardEntrance>
            );
          })}

          {/* Continue button */}
          <AnimatedPressable style={s.continueBtn} onPress={confirm}>
            <Text style={s.continueBtnText}>Aage Barein →</Text>
          </AnimatedPressable>
          </View>
        </ScreenEntrance>
      </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.cream },
  header:          { backgroundColor: C.maroonDk },
  headerBody:      { alignItems: 'center', paddingVertical: 24, gap: 8 },
  logo:            { width: 68, height: 68, borderRadius: 18, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.goldLt },
  appName:         { color: C.gold, fontSize: 26, fontWeight: '800', letterSpacing: 1 },
  appSub:          { color: C.goldLt, fontSize: 12 },

  body:            { flex: 1, padding: 22, paddingTop: 28 },
  title:           { fontSize: 22, fontWeight: '800', color: C.maroon, marginBottom: 6 },
  sub:             { fontSize: 13, color: C.inkMuted, marginBottom: 24 },

  card:            {
    backgroundColor: C.white, borderRadius: 16, borderWidth: 2,
    borderColor: C.sep, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  cardActive:      { borderColor: C.maroon, backgroundColor: '#FFF5F6' },
  cardLeft:        { width: 40, alignItems: 'center' },
  flag:            { fontSize: 28 },
  cardMid:         { flex: 1 },
  langName:        { fontSize: 17, fontWeight: '800', color: C.ink, marginBottom: 2 },
  langSample:      { fontSize: 13, color: C.inkMuted, marginBottom: 2 },
  langDesc:        { fontSize: 11, color: C.inkFaint },
  rtlText:         { textAlign: 'right' },
  activeText:      { color: C.maroon },

  radio:           { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.sep, alignItems: 'center', justifyContent: 'center' },
  radioActive:     { borderColor: C.maroon },
  radioDot:        { width: 11, height: 11, borderRadius: 6, backgroundColor: C.maroon },

  continueBtn:     { backgroundColor: C.maroon, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: C.gold, marginTop: 8 },
  continueBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
