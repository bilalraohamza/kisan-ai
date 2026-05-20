import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import AjrakBand from '../components/AjrakBand';
import { C } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenEntrance, AnimatedPressable } from '../components/ScreenEntrance';

const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export default function ForgotPasswordScreen({ navigation }) {
  const { t }          = useLanguage();
  const fp             = t.forgotPassword;

  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [sent, setSent]       = useState(false);

  const handleSend = () => {
    if (!email.trim()) { setEmailErr(fp.emailRequired); return; }
    if (!validateEmail(email)) { setEmailErr(fp.emailInvalid); return; }

    setLoading(true);
    setTimeout(() => {
      // TODO: call API POST /auth/forgot-password when backend is ready
      setLoading(false);
      setSent(true);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.root}>
          {/* Header */}
          <View style={s.header}>
            <AjrakBand h={8} />
            <View style={s.headerBody}>
              <View style={s.logo}><Text style={{ fontSize: 32 }}>🔑</Text></View>
              <Text style={s.appName}>Kisan AI</Text>
              <Text style={s.appSub}>{fp.title}</Text>
            </View>
            <AjrakBand h={8} />
          </View>

          <ScreenEntrance style={{ flex: 1 }}>
            <View style={s.body}>
            {sent ? (
              // ── Success state ──────────────────────────────────────────────
              <View style={s.successCard}>
                <Text style={{ fontSize: 52, textAlign: 'center', marginBottom: 16 }}>📬</Text>
                <Text style={s.successTitle}>{fp.successTitle}</Text>
                <Text style={s.successSub}>{fp.successSub}</Text>
                <AnimatedPressable
                  style={s.backBtn}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={s.backBtnText}>{fp.backToLogin}</Text>
                </AnimatedPressable>
              </View>
            ) : (
              // ── Form state ────────────────────────────────────────────────
              <>
                <Text style={s.title}>{fp.title}</Text>
                <Text style={s.sub}>{fp.sub}</Text>

                <Text style={s.label}>{fp.emailLabel}</Text>
                <TextInput
                  style={[s.input, emailErr && s.inputError]}
                  placeholder="apka@email.com"
                  placeholderTextColor={C.inkFaint}
                  value={email}
                  onChangeText={v => { setEmail(v); setEmailErr(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {emailErr ? <Text style={s.errorText}>⚠ {emailErr}</Text> : null}

                <AnimatedPressable
                  style={[s.sendBtn, loading && { opacity: 0.7 }]}
                  onPress={handleSend}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.sendBtnText}>{fp.sendBtn}</Text>
                  }
                </AnimatedPressable>

                <AnimatedPressable
                  style={s.backLink}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={s.backLinkText}>{fp.backToLogin}</Text>
                </AnimatedPressable>
              </>
            )}
            </View>
          </ScreenEntrance>
        </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.cream },
  header:       { backgroundColor: C.maroonDk },
  headerBody:   { alignItems: 'center', paddingVertical: 24, gap: 8 },
  logo:         { width: 68, height: 68, borderRadius: 18, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.goldLt },
  appName:      { color: C.gold, fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  appSub:       { color: C.goldLt, fontSize: 14 },
  body:         { padding: 24, paddingTop: 32 },
  title:        { fontSize: 22, fontWeight: '800', color: C.maroon, marginBottom: 6 },
  sub:          { fontSize: 15, color: C.inkMuted, marginBottom: 24, lineHeight: 22 },
  label:        { fontSize: 14, fontWeight: '700', color: C.ink, marginBottom: 6 },
  input:        { backgroundColor: C.white, borderRadius: 12, padding: 14, fontSize: 16, color: C.ink, borderWidth: 1.5, borderColor: C.sep, marginBottom: 4 },
  inputError:   { borderColor: '#EF4444' },
  errorText:    { fontSize: 13, color: '#DC2626', marginBottom: 8 },
  sendBtn:      { backgroundColor: C.maroon, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: C.gold, marginTop: 12, marginBottom: 16 },
  sendBtnText:  { color: '#fff', fontSize: 17, fontWeight: '800' },
  backLink:     { alignItems: 'center' },
  backLinkText: { color: C.maroon, fontSize: 15, fontWeight: '600' },
  successCard:  { backgroundColor: C.white, borderRadius: 20, borderWidth: 2, borderColor: C.green, padding: 28, alignItems: 'center', marginTop: 20 },
  successTitle: { fontSize: 22, fontWeight: '800', color: C.green, marginBottom: 8, textAlign: 'center' },
  successSub:   { fontSize: 15, color: C.inkMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  backBtn:      { backgroundColor: C.maroon, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 28, borderWidth: 2, borderColor: C.gold },
  backBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
});

