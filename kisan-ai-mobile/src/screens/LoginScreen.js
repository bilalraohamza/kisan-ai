import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import AjrakBand from '../components/AjrakBand';
import { C } from '../constants/colors';
import { useAuth }     from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const validateEmail    = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const validatePassword = (p) => p.length >= 6;

const LANG_OPTIONS = [
  { key: 'roman_urdu', label: 'Roman Urdu' },
  { key: 'urdu',       label: 'اردو'        },
  { key: 'english',    label: 'English'     },
];

export default function LoginScreen({ navigation }) {
  const { login }                    = useAuth();
  const { t, language, selectLanguage } = useLanguage();
  const a                            = t.auth;
  const insets                       = useSafeAreaInsets();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!email.trim())              e.email    = t.errors.emailRequired;
    else if (!validateEmail(email)) e.email    = t.errors.emailInvalid;
    if (!password)                  e.password = t.errors.passRequired;
    else if (!validatePassword(password)) e.password = t.errors.passShort;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Login Handler ────────────────────────────────────────────────────────────
  const handleLogin = () => {
    if (!validate()) return;
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass  = password.trim();

    setTimeout(async () => {
      try {
        // ── Admin / demo login ──────────────────────────────────────────────
        if (trimmedEmail === 'demo@kisanai.pk' && trimmedPass === 'kisan2026') {
          await login({
            name: 'Demo Kisan',
            email: 'demo@kisanai.pk',
            role: 'admin',
            provider: 'email',
          });
          return;
        }
        // ── Regular API login (placeholder) ────────────────────────────────
        Alert.alert('Login', 'Sirf admin login is waqt available hai.');
      } catch {
        Alert.alert('Error', 'Login fail hua. Dobara try karein.');
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleGoogleLogin = () => {
    Alert.alert('Google Login', 'Google Client ID configure karne ke baad kaam karega.');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={s.root}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={[s.header, { paddingTop: insets.top + 16 }]}>
          <AjrakBand h={8} />
          <View style={s.headerBody}>
            <View style={s.logo}><Text style={{ fontSize: 36 }}>🌾</Text></View>
            <Text style={s.appName}>Kisan AI</Text>
            <Text style={s.appSub}>Pakistan ke kisanon ka AI saathi</Text>
          </View>
          <AjrakBand h={8} />
        </View>

        <View style={s.form}>

          {/* ── 🌐 Language Switcher ── */}
          <View style={s.langBox}>
            <Text style={s.langBoxLabel}>🌐  Zaban / Language</Text>
            <View style={s.langRow}>
              {LANG_OPTIONS.map(opt => {
                const active = language === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[s.langBtn, active && s.langBtnActive]}
                    onPress={() => selectLanguage(opt.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.langBtnText, active && s.langBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text style={s.formTitle}>{a.loginTitle}</Text>
          <Text style={s.formSub}>{a.loginSub}</Text>

          <View style={s.demoCard}>
            <Text style={s.demoTitle}>Demo Account</Text>
            <Text style={s.demoText}>Email: demo@kisanai.pk</Text>
            <Text style={s.demoText}>Password: kisan2026</Text>
            <TouchableOpacity onPress={() => {
              setEmail('demo@kisanai.pk');
              setPassword('kisan2026');
            }}>
              <Text style={s.demoBtn}>Use Demo Account</Text>
            </TouchableOpacity>
          </View>

          {/* Email */}
          <Text style={s.label}>{a.emailLabel}</Text>
          <TextInput
            style={[s.input, errors.email && s.inputError]}
            placeholder="apka@email.com"
            placeholderTextColor={C.inkFaint}
            value={email}
            onChangeText={v => { setEmail(v); setErrors(p => ({ ...p, email: '' })); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.email ? <Text style={s.errorText}>⚠ {errors.email}</Text> : null}

          {/* Password */}
          <Text style={s.label}>{a.passLabel}</Text>
          <View style={s.passRow}>
            <TextInput
              style={[s.input, { flex: 1 }, errors.password && s.inputError]}
              placeholder="••••••••"
              placeholderTextColor={C.inkFaint}
              value={password}
              onChangeText={v => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(p => !p)}>
              <Text style={{ fontSize: 18 }}>{showPass ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={s.errorText}>⚠ {errors.password}</Text> : null}

          {/* Forgot Password */}
          <TouchableOpacity
            style={{ alignSelf: 'flex-end', marginBottom: 20, marginTop: 6 }}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={s.forgotText}>{a.forgotPass}</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[s.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.loginBtnText}>{a.loginBtn}</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divText}>{a.orText}</Text>
            <View style={s.divLine} />
          </View>

          {/* Google Login */}
          <TouchableOpacity style={s.googleBtn} onPress={handleGoogleLogin} activeOpacity={0.85}>
            <Text style={{ fontSize: 20 }}>🔵</Text>
            <Text style={s.googleBtnText}>{a.googleBtn}</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={s.signupRow}>
            <Text style={s.signupPrompt}>{a.signupPrompt}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={s.signupLink}>{a.signupLink}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: C.cream },
  header:           { backgroundColor: C.maroonDk },
  headerBody:       { alignItems: 'center', paddingVertical: 24, gap: 8 },
  logo:             { width: 72, height: 72, borderRadius: 20, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.goldLt },
  appName:          { color: C.gold, fontSize: 30, fontWeight: '800', letterSpacing: 1 },
  appSub:           { color: C.goldLt, fontSize: 14 },

  // Language box
  langBox:          { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.sep, padding: 12, marginBottom: 20 },
  langBoxLabel:     { fontSize: 13, color: C.inkMuted, fontWeight: '700', marginBottom: 8 },
  langRow:          { flexDirection: 'row', gap: 8 },
  langBtn:          { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: C.sep, alignItems: 'center', backgroundColor: C.cream },
  langBtnActive:    { backgroundColor: C.maroon, borderColor: C.maroon },
  langBtnText:      { fontSize: 14, fontWeight: '700', color: C.inkMuted },
  langBtnTextActive:{ color: '#fff' },

  form:             { padding: 22, paddingTop: 24 },
  formTitle:        { fontSize: 21, fontWeight: '800', color: C.maroon, marginBottom: 4 },
  formSub:          { fontSize: 15, color: C.inkMuted, marginBottom: 18 },
  demoCard:         { backgroundColor: C.goldPale, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.gold, marginBottom: 16 },
  demoTitle:        { fontSize: 14, fontWeight: '700', color: C.maroon, marginBottom: 4 },
  demoText:         { fontSize: 13, color: C.ink, marginBottom: 2 },
  demoBtn:          { color: C.maroon, fontWeight: '700', fontSize: 13, marginTop: 6 },
  label:            { fontSize: 14, fontWeight: '700', color: C.ink, marginBottom: 6, marginTop: 4 },
  input:            { backgroundColor: C.white, borderRadius: 12, padding: 14, fontSize: 16, color: C.ink, borderWidth: 1.5, borderColor: C.sep, marginBottom: 4 },
  inputError:       { borderColor: '#EF4444' },
  errorText:        { fontSize: 13, color: '#DC2626', marginBottom: 6, marginLeft: 2 },
  passRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  eyeBtn:           { padding: 10 },
  forgotText:       { fontSize: 14, color: C.maroon, fontWeight: '600' },
  loginBtn:         { backgroundColor: C.maroon, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: C.gold, marginBottom: 18 },
  loginBtnText:     { color: '#fff', fontSize: 17, fontWeight: '800' },
  divider:          { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  divLine:          { flex: 1, height: 1, backgroundColor: C.sep },
  divText:          { color: C.inkMuted, fontSize: 14 },
  googleBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.white, borderRadius: 14, padding: 15, borderWidth: 1.5, borderColor: C.sep, marginBottom: 24 },
  googleBtnText:    { fontSize: 16, fontWeight: '700', color: C.ink },
  signupRow:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupPrompt:     { fontSize: 15, color: C.inkMuted },
  signupLink:       { fontSize: 15, color: C.maroon, fontWeight: '800' },
});

