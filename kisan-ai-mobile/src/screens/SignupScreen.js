import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AjrakBand from '../components/AjrakBand';
import { C } from '../constants/colors';
import { useAuth }     from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Validation ───────────────────────────────────────────────────────────────
const validateEmail    = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const validatePhone    = (p) => /^03[0-9]{9}$/.test(p.trim());
const validatePassword = (p) => p.length >= 6;
const validateName     = (n) => n.trim().length >= 2;

export default function SignupScreen({ navigation }) {
  const { login } = useAuth();

  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [agreed, setAgreed]     = useState(false);

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const [, googleResponse, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_EXPO_GOOGLE_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
  });

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleSignup(googleResponse.authentication.accessToken);
    }
  }, [googleResponse]);

  const handleGoogleSignup = async (token) => {
    setLoading(true);
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const googleUser = await res.json();
      await login({
        name: googleUser.name,
        email: googleUser.email,
        photo: googleUser.picture,
        provider: 'google',
      });
    } catch {
      Alert.alert('Google Signup fail hua', 'Dobara try karein.');
    } finally {
      setLoading(false);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!validateName(name))              e.name     = 'Naam darain (kam az kam 2 huroof)';
    if (!phone.trim())                    e.phone    = 'Phone number darain';
    else if (!validatePhone(phone))       e.phone    = 'Pakistani number (03xxxxxxxxx) darain';
    if (!email.trim())                    e.email    = 'Email darain';
    else if (!validateEmail(email))       e.email    = 'Email sahi nahi hai';
    if (!password)                        e.password = 'Password darain';
    else if (!validatePassword(password)) e.password = 'Password kam az kam 6 huroof ka ho';
    if (!confirm)                         e.confirm  = 'Password dobara darain';
    else if (confirm !== password)        e.confirm  = 'Dono password aik jaise honay chahiye';
    if (!agreed)                          e.agreed   = 'Shartein manzoor karein';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Load existing accounts
      const existing = await AsyncStorage.getItem('kisan_accounts');
      const accounts = existing ? JSON.parse(existing) : [];

      // Check if email already exists
      const alreadyExists = accounts.find(
        a => a.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (alreadyExists) {
        setErrors(prev => ({
          ...prev,
          email: language === 'urdu' ? 'یہ ای میل پہلے سے موجود ہے' :
                 language === 'english' ? 'Email already exists' :
                 'Yeh email pehle se exist karti hai',
        }));
        return;
      }

      // Save new account
      const newAccount = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
      };
      accounts.push(newAccount);
      await AsyncStorage.setItem('kisan_accounts', JSON.stringify(accounts));

      // Auto login
      await login({ name: newAccount.name, email: newAccount.email });
    } catch (e) {
      console.log('Signup error:', e);
      setErrors(prev => ({ ...prev, email: 'Kuch masla hua. Dobara try karein.' }));
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, value, onChange, placeholder, keyboard = 'default', secure = false, show, toggleShow, error, errorKey }) => (
    <>
      <Text style={s.label}>{label}</Text>
      <View style={secure ? s.passRow : null}>
        <TextInput
          style={[s.input, secure && { flex: 1 }, error && s.inputError]}
          placeholder={placeholder}
          placeholderTextColor={C.inkFaint}
          value={value}
          onChangeText={t => { onChange(t); setErrors(p => ({ ...p, [errorKey]: '' })); }}
          keyboardType={keyboard}
          autoCapitalize="none"
          secureTextEntry={secure && !show}
        />
        {secure && (
          <TouchableOpacity style={s.eyeBtn} onPress={toggleShow}>
            <Text style={{ fontSize: 18 }}>{show ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={s.errorText}>⚠ {error}</Text> : null}
    </>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={s.root} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <View style={s.header}>
          <AjrakBand h={8} />
          <View style={s.headerBody}>
            <View style={s.logo}><Text style={{ fontSize: 32 }}>🌾</Text></View>
            <Text style={s.appName}>Kisan AI</Text>
            <Text style={s.appSub}>Naya account banayen</Text>
          </View>
          <AjrakBand h={8} />
        </View>

        <View style={s.form}>
          <Text style={s.formTitle}>Kisan AI mein Khush Aamdeed!</Text>
          <Text style={s.formSub}>Apni maloomat bhar ke shuru karein</Text>

          <Field label="👤  Apna Naam" value={name} onChange={setName} placeholder="Muhammad Aslam" error={errors.name} errorKey="name" />
          <Field label="📱  Phone Number" value={phone} onChange={setPhone} placeholder="03001234567" keyboard="phone-pad" error={errors.phone} errorKey="phone" />
          <Field label="📧  Email" value={email} onChange={setEmail} placeholder="apka@email.com" keyboard="email-address" error={errors.email} errorKey="email" />
          <Field label="🔒  Password" value={password} onChange={setPassword} placeholder="••••••••" secure show={showPass} toggleShow={() => setShowPass(!showPass)} error={errors.password} errorKey="password" />
          <Field label="🔒  Password Dobara" value={confirm} onChange={setConfirm} placeholder="••••••••" secure show={showConf} toggleShow={() => setShowConf(!showConf)} error={errors.confirm} errorKey="confirm" />

          {/* Password strength */}
          {password.length > 0 && (
            <View style={s.strengthRow}>
              {[1,2,3,4].map(i => (
                <View key={i} style={[s.strengthBar, {
                  backgroundColor: password.length >= i * 2
                    ? password.length >= 8 ? C.green : C.gold
                    : C.sep
                }]} />
              ))}
              <Text style={s.strengthLabel}>
                {password.length < 4 ? 'Kamzor' : password.length < 7 ? 'Theek' : 'Mazboot'}
              </Text>
            </View>
          )}

          {/* Terms */}
          <TouchableOpacity style={s.termsRow} onPress={() => setAgreed(!agreed)}>
            <View style={[s.checkbox, agreed && s.checkboxActive]}>
              {agreed && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>}
            </View>
            <Text style={s.termsText}>Main Kisan AI ki <Text style={s.termsLink}>Shartein wa Zaroorat</Text> se raazi hoon</Text>
          </TouchableOpacity>
          {errors.agreed ? <Text style={s.errorText}>⚠ {errors.agreed}</Text> : null}

          {/* Signup Button */}
          <TouchableOpacity style={s.signupBtn} onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.signupBtnText}>Account Banayen →</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divText}>Ya</Text>
            <View style={s.divLine} />
          </View>

          {/* Google Signup */}
          <TouchableOpacity style={s.googleBtn} onPress={() => promptAsync()} disabled={loading} activeOpacity={0.85}>
            <Text style={{ fontSize: 20 }}>🔵</Text>
            <Text style={s.googleBtnText}>Google se Sign Up Karein</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={s.loginRow}>
            <Text style={s.loginPrompt}>Pehle se account hai? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.loginLink}>Login Karein</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.cream },
  header:        { backgroundColor: C.maroonDk },
  headerBody:    { alignItems: 'center', paddingVertical: 22, gap: 6 },
  logo:          { width: 68, height: 68, borderRadius: 18, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.goldLt },
  appName:       { color: C.gold, fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  appSub:        { color: C.goldLt, fontSize: 14 },
  form:          { padding: 22, paddingTop: 24 },
  formTitle:     { fontSize: 20, fontWeight: '800', color: C.maroon, marginBottom: 4 },
  formSub:       { fontSize: 14, color: C.inkMuted, marginBottom: 18 },
  label:         { fontSize: 14, fontWeight: '700', color: C.ink, marginBottom: 5, marginTop: 8 },
  input:         { backgroundColor: C.white, borderRadius: 12, padding: 14, fontSize: 16, color: C.ink, borderWidth: 1.5, borderColor: C.sep, marginBottom: 2 },
  inputError:    { borderColor: '#EF4444' },
  errorText:     { fontSize: 13, color: '#DC2626', marginBottom: 6, marginLeft: 2 },
  passRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  eyeBtn:        { padding: 10 },
  strengthRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10, marginTop: 4 },
  strengthBar:   { flex: 1, height: 5, borderRadius: 2 },
  strengthLabel: { fontSize: 13, color: C.inkMuted, marginLeft: 4 },
  termsRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 4 },
  checkbox:      { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: C.maroon, alignItems: 'center', justifyContent: 'center' },
  checkboxActive:{ backgroundColor: C.maroon },
  termsText:     { flex: 1, fontSize: 14, color: C.inkMuted },
  termsLink:     { color: C.maroon, fontWeight: '700' },
  signupBtn:     { backgroundColor: C.maroon, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: C.gold, marginTop: 14, marginBottom: 18 },
  signupBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  divider:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  divLine:       { flex: 1, height: 1, backgroundColor: C.sep },
  divText:       { color: C.inkMuted, fontSize: 14 },
  googleBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.white, borderRadius: 14, padding: 15, borderWidth: 1.5, borderColor: C.sep, marginBottom: 22 },
  googleBtnText: { fontSize: 16, fontWeight: '700', color: C.ink },
  loginRow:      { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginPrompt:   { fontSize: 15, color: C.inkMuted },
  loginLink:     { fontSize: 15, color: C.maroon, fontWeight: '800' },
});

