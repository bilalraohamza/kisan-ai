import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AjrakBand   from '../components/AjrakBand';
import { C }       from '../constants/colors';
import { useAuth }     from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const FEATURE_KEYS   = ['Chat','Disease','Weather','Mandi','Farm','Services'];
const FEATURE_EMOJIS = ['💬','🔬','🌤','🏪','🌾','🚜'];
const FEATURE_BG    = [C.goldPale, C.greenPale, C.skyPale, C.terraPale, C.parchment, C.greenPale];
const FEATURE_BDR   = [C.gold, C.green, C.sky, C.terra, C.maroon, C.greenLt];

export default function HomeScreen({ navigation }) {
  const { user, logout }     = useAuth();
  const { t }                = useLanguage();
  const hm                   = t.home;
  const insets = useSafeAreaInsets();

  // Track content vs container to decide if scroll is needed
  const [contentH, setContentH]     = useState(0);
  const [containerH, setContainerH] = useState(0);
  const scrollNeeded = contentH > containerH && containerH > 0;

  const handleLogout = () => {
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

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.maroon} translucent />

      {/* ── Hero Header — paddingTop accounts for status bar ── */}
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
            <View style={s.logo}><Text style={{ fontSize: 26 }}>🌾</Text></View>
            <View>
              <Text style={s.appName}>Kisan AI</Text>
              <Text style={s.appSub}>{hm.tagline}</Text>
            </View>
          </View>

          {user ? (
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={s.logoutBtnText}>🚪 Logout</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.loginBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={s.loginBtnText}>{hm.loginBtn}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.infoBar}>
          <Text style={s.infoBarLabel}>{hm.infoLabel}</Text>
          <Text style={s.infoBarText}>{hm.infoText}</Text>
        </View>
      </View>

      <AjrakBand h={12} />

      {/* ── Scrollable body — only scrolls if content taller than available space ── */}
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
            <Text style={s.greetText}>👋  {user.name?.split(' ')[0] || 'Kisan'} bhai, khush aamdeed!</Text>
          </View>
        )}

        <Text style={s.sectionLabel}>{hm.sectionLabel}</Text>

        <View style={s.grid}>
          {hm.features.map((f, idx) => (
            <TouchableOpacity
              key={idx}
              style={[s.featureCard, { backgroundColor: FEATURE_BG[idx], borderColor: FEATURE_BDR[idx] }]}
              activeOpacity={0.75}
              onPress={() => navigation.navigate(FEATURE_KEYS[idx])}
            >
              <Text style={{ fontSize: 28, marginBottom: 4 }}>{FEATURE_EMOJIS[idx]}</Text>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureSub}>{f.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.activityCard}>
          <Text style={s.activityTitle}>{hm.recentTitle}</Text>
          {hm.activity.map((a, i) => (
            <View key={i} style={[s.activityRow, i === 0 && s.activityRowBorder]}>
              <View style={[s.dot, { backgroundColor: [C.green, C.terra][i] }]} />
              <Text style={s.activityText}>{a.t}</Text>
              <Text style={s.activityTime}>{a.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

    </View>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: C.cream },
  header:            { backgroundColor: C.maroon, paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden' },
  circle:            { position: 'absolute', borderRadius: 200, borderWidth: 1.5 },
  headerRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  logoRow:           { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  logo:              { width: 50, height: 50, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.goldLt },
  appName:           { color: '#fff', fontSize: 21, fontWeight: '800', letterSpacing: 0.5 },
  appSub:            { color: C.goldLt, fontSize: 13 },
  logoutBtn:         { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  logoutBtnText:     { color: '#fff', fontSize: 13, fontWeight: '700' },
  loginBtn:          { backgroundColor: C.gold, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  loginBtnText:      { color: C.maroonDk, fontSize: 13, fontWeight: '800' },
  infoBar:           { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(201,139,53,0.35)' },
  infoBarLabel:      { color: C.goldLt, fontSize: 12, marginBottom: 2 },
  infoBarText:       { color: '#fff', fontSize: 14 },
  scrollView:        { flex: 1 },
  body:              { padding: 14, paddingBottom: 90 },
  greetCard:         { backgroundColor: C.goldPale, borderRadius: 10, borderWidth: 1, borderColor: C.gold, padding: 10, marginBottom: 12 },
  greetText:         { fontSize: 14, fontWeight: '700', color: C.goldDk },
  sectionLabel:      { fontSize: 12, color: C.inkMuted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 2 },
  grid:              { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  featureCard:       { width: '47%', borderWidth: 1.5, borderRadius: 16, padding: 13 },
  featureTitle:      { fontSize: 14, fontWeight: '700', color: C.ink },
  featureSub:        { fontSize: 12, color: C.inkMuted, marginTop: 2, lineHeight: 16 },
  activityCard:      { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.sep, padding: 12, marginBottom: 10 },
  activityTitle:     { fontSize: 14, fontWeight: '700', color: C.maroon, marginBottom: 8 },
  activityRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  activityRowBorder: { borderBottomWidth: 0.5, borderBottomColor: C.sep },
  dot:               { width: 7, height: 7, borderRadius: 4, marginRight: 10 },
  activityText:      { flex: 1, fontSize: 13, color: C.ink },
  activityTime:      { fontSize: 11, color: C.inkFaint },
  fab: {
    display: 'none',  // FAB is now global in TabsWithFAB — not needed here
  },
});