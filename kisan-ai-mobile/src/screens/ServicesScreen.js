import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AjrakBand from '../components/AjrakBand';
import { C } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { findServices } from '../services/api';
import { ScreenEntrance, CardEntrance, AnimatedPressable } from '../components/ScreenEntrance';

const DEFAULT_SERVICES = [
  { label: 'Combine Harvester', value: 'harvester', emoji: '🚜' },
  { label: 'Tractor', value: 'tractor', emoji: '🚛' },
  { label: 'Spray Drone', value: 'drone', emoji: '🚁' },
  { label: 'Labor', value: 'labor', emoji: '👷' },
  { label: 'Storage', value: 'storage', emoji: '🏭' },
  { label: 'Transport', value: 'transport', emoji: '🚌' },
];

export default function ServicesScreen() {
  const { t, language } = useLanguage();
  const sv = t.services;
  const insets = useSafeAreaInsets();

  const serviceList = sv.services || DEFAULT_SERVICES;

  const [selected, setSelected] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [farmProfile, setFarmProfile] = useState(null);
  const [coordination, setCoordination] = useState(null);

  useEffect(() => {
    loadFarmProfile();
  }, []);

  const loadFarmProfile = async () => {
    try {
      const raw = await AsyncStorage.getItem('farmProfile');
      if (raw) setFarmProfile(JSON.parse(raw));
    } catch (e) {
      console.log('Profile load error:', e);
    }
  };

  const handleSelect = async (value) => {
    setSelected(value);
    setProviders([]);
    setCoordination(null);
    setLoading(true);

    try {
      const profile = farmProfile || {};

      const { data } = await findServices(
        value,
        { lat: parseFloat(profile.lat), lng: parseFloat(profile.lng) },
        language || 'roman_urdu',
        profile.crop_type || 'wheat',
        parseFloat(profile.acres || 5)
      );

      // Map backend response to display format
      const mappedProviders = (data.providers || []).map(p => ({
        name: p.name,
        dist: p.distance_km || 0,
        rate: p.rate_pkr_per_acre || 0,
        trust: (p.trust_score || 4) / 5,
        phone: p.phone || '',
        area: p.area || '',
        available: p.available_on_preferred_date,
        ranking_reason: p.ranking_reason || '',
      }));

      setProviders(mappedProviders);
      setCoordination({
        recommendation: data.top_recommendation,
        booking_message: data.booking_message,
        total_cost: data.total_cost_pkr,
        coordination_plan: data.coordination_plan,
        backup: data.backup_provider,
      });

    } catch (e) {
      console.log('[services] Error:', e?.response?.data || e.message);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const call = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
          <Text style={{ fontSize: 22 }}>🛠</Text>
          <View>
            <Text style={s.title}>{sv.title}</Text>
            <Text style={s.subtitle}>{sv.subtitle}</Text>
          </View>
        </View>
        <AjrakBand h={10} />

        <ScreenEntrance style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={s.body}
            showsVerticalScrollIndicator={false}
          >
            {/* Service Grid */}
            <View style={s.grid}>
              {serviceList.map((svc) => {
                const active = selected === svc.value;
              return (
                <AnimatedPressable
                  key={svc.value}
                  style={[s.svcCard, active && s.svcCardActive]}
                  onPress={() => handleSelect(svc.value)}
                >
                  <Text style={{ fontSize: 28, marginBottom: 4 }}>{svc.emoji}</Text>
                  <Text style={[s.svcLabel, active && s.svcLabelActive]}>
                    {svc.label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          {/* Farm info notice */}
          {farmProfile && (
            <CardEntrance delay={100}>
              <View style={s.farmNotice}>
                <Text style={s.farmNoticeText}>
                  📍 {farmProfile.location} · {farmProfile.crop_type} · {farmProfile.acres} Acre
                </Text>
              </View>
            </CardEntrance>
          )}

          {loading ? (
            <View style={s.loaderBox}>
              <ActivityIndicator color={C.maroon} size="large" />
              <Text style={s.loaderText}>
                Qareeb service dhundh rahe hain...
              </Text>
            </View>
          ) : selected ? (
            <>
              {providers.length > 0 ? (
                <>
                  <Text style={s.sectionLabel}>
                    {providers.length} {language === 'urdu' ? 'سروس فراہم کار ملے' 
                      : language === 'english' ? 'service providers found'
                      : 'service provider mile'}
                  </Text>

                  {providers.map((p, i) => (
                    <CardEntrance key={i} delay={150 + i * 50}>
                      <View style={[s.providerCard,
                      i === 0 && s.topProviderCard
                      ]}>
                        {i === 0 && (
                          <Text style={s.topBadge}>
                            🏆 {language === 'urdu' ? 'سب سے بہترین' 
                              : language === 'english' ? 'Top Recommended'
                              : 'Sab se behtareen'}
                          </Text>
                        )}
                        <View style={s.providerTop}>
                          <Text style={s.providerName}>{p.name}</Text>
                          <Text style={s.providerDist}>{p.dist} km</Text>
                        </View>

                        {p.area ? (
                          <Text style={s.providerArea}>📍 {p.area}</Text>
                        ) : null}

                        <Text style={s.providerRate}>
                          PKR {p.rate?.toLocaleString()} / acre
                        </Text>

                        {p.available !== undefined && (
                          <Text style={[s.availText, { color: p.available ? C.green : '#DC2626' }]}>
                            {p.available 
                              ? (language === 'urdu' ? '✅ آپ کی تاریخ پر دستیاب' 
                                 : language === 'english' ? '✅ Available on your date'
                                 : '✅ Aap ki date par available')
                              : (language === 'urdu' ? '❌ اس تاریخ پر دستیاب نہیں'
                                 : language === 'english' ? '❌ Not available on this date'
                                 : '❌ Is date par available nahi')}
                          </Text>
                        )}

                        {p.ranking_reason ? (
                          <Text style={s.reasonText}>{p.ranking_reason}</Text>
                        ) : null}

                        <View style={s.trustRow}>
                          <Text style={s.trustLabel}>
                            Bharosa: {Math.round(p.trust * 100)}%
                          </Text>
                        </View>
                        <View style={s.trustTrack}>
                          <View style={[s.trustFill, {
                            width: `${p.trust * 100}%`,
                            backgroundColor: p.trust > 0.85 ? C.green : C.gold,
                          }]} />
                        </View>

                        {p.phone ? (
                          <AnimatedPressable
                            style={s.callBtn}
                            onPress={() => call(p.phone)}
                          >
                            <Text style={s.callBtnText}>📞 {p.phone}</Text>
                          </AnimatedPressable>
                        ) : null}
                      </View>
                    </CardEntrance>
                  ))}

                  {/* AI Coordination */}
                  {coordination && (
                    <CardEntrance delay={200 + providers.length * 50}>
                      <View style={s.coordCard}>
                        <Text style={s.coordTitle}>🤖 AI Coordination Plan</Text>
                        {coordination.recommendation && (
                          <Text style={s.coordSub}>{coordination.recommendation}</Text>
                        )}
                        {coordination?.coordination_plan && (
                          Array.isArray(coordination.coordination_plan)
                            ? coordination.coordination_plan.map((step, i) => (
                                <Text key={i} style={s.coordPlan}>• {step}</Text>
                              ))
                            : <Text style={s.coordPlan}>{coordination.coordination_plan}</Text>
                        )}
                        {coordination.total_cost && (
                          <Text style={s.coordPrice}>
                            Total: PKR {coordination.total_cost?.toLocaleString()}
                          </Text>
                        )}
                        {coordination.backup && (
                          <Text style={s.backupText}>
                            🔄 Backup: {coordination.backup}
                          </Text>
                        )}
                        {coordination.booking_message && (
                          <View style={s.bookingMsg}>
                            <Text style={s.bookingMsgTitle}>📋 Booking message:</Text>
                            <Text style={s.bookingMsgText}>
                              {coordination.booking_message}
                            </Text>
                          </View>
                        )}
                      </View>
                    </CardEntrance>
                  )}
                </>
              ) : (
                <View style={s.emptyState}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>😕</Text>
                  <Text style={s.emptyText}>
                    Is service ke liye koi provider nahi mila.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🛠</Text>
              <Text style={s.emptyText}>
                {sv.selectPrompt || 'Ooper se koi khadmat chunein'}
              </Text>
            </View>
          )}
          </ScrollView>
        </ScreenEntrance>
      </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: C.maroon, paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: '#fff', fontWeight: '700', fontSize: 16 },
  subtitle: { color: C.goldLt, fontSize: 13 },
  body: { padding: 16, paddingBottom: 90 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  svcCard: { width: '31%', backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.sep, padding: 14, alignItems: 'center' },
  svcCardActive: { backgroundColor: C.maroon, borderColor: C.gold },
  svcLabel: { fontSize: 12, fontWeight: '700', color: C.ink, textAlign: 'center' },
  svcLabelActive: { color: '#fff' },
  farmNotice: { backgroundColor: C.goldPale, borderRadius: 10, padding: 8, marginBottom: 12, borderWidth: 0.5, borderColor: C.gold },
  farmNoticeText: { fontSize: 12, color: C.goldDk },
  loaderBox: { alignItems: 'center', paddingVertical: 40 },
  loaderText: { marginTop: 12, color: C.inkMuted, fontSize: 14 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: C.maroon, marginBottom: 10 },
  providerCard: { backgroundColor: C.white, borderRadius: 14, borderWidth: 0.5, borderColor: C.sep, padding: 14, marginBottom: 10 },
  topProviderCard: { borderWidth: 2, borderColor: C.gold },
  topBadge: { fontSize: 12, fontWeight: '700', color: C.gold, marginBottom: 6 },
  providerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  providerName: { fontSize: 15, fontWeight: '700', color: C.ink, flex: 1 },
  providerDist: { fontSize: 13, color: C.inkMuted },
  providerArea: { fontSize: 12, color: C.inkMuted, marginBottom: 4 },
  providerRate: { fontSize: 16, color: C.green, fontWeight: '700', marginBottom: 6 },
  availText: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  reasonText: { fontSize: 12, color: C.inkMuted, marginBottom: 8, lineHeight: 18, fontStyle: 'italic' },
  trustRow: { marginBottom: 4 },
  trustLabel: { fontSize: 12, color: C.inkMuted },
  trustTrack: { height: 6, backgroundColor: C.cream, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  trustFill: { height: '100%', borderRadius: 3 },
  callBtn: { backgroundColor: C.green, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16, alignSelf: 'flex-start' },
  callBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  coordCard: { backgroundColor: C.maroon, borderRadius: 18, borderWidth: 2, borderColor: C.gold, padding: 18, marginTop: 6 },
  coordTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  coordSub: { color: C.goldLt, fontSize: 13, marginBottom: 8, lineHeight: 20 },
  coordPlan: { color: C.goldLt, fontSize: 12, marginTop: 4, lineHeight: 18 },
  coordPrice: { color: C.gold, fontSize: 22, fontWeight: '800', marginTop: 4, marginBottom: 8 },
  backupText: { color: C.goldLt, fontSize: 12, marginBottom: 8 },
  bookingMsg: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10 },
  bookingMsgTitle: { color: C.goldLt, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  bookingMsgText: { color: '#fff', fontSize: 12, lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: C.inkMuted, textAlign: 'center' },
});