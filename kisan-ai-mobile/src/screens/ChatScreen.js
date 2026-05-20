import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AjrakBand from '../components/AjrakBand';
import MessageBubble from '../components/MessageBubble';
import { C } from '../constants/colors';
import { chatMessage } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function ChatScreen() {
  const { t, language } = useLanguage();
  const ch = t.chat;
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  const INITIAL_MESSAGES = [
    { id: '1', text: ch.initialMsg, user: false, language },
  ];

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { id: Date.now().toString(), text: input, user: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const farmProfile = JSON.parse(
        await AsyncStorage.getItem('farmProfile') || '{}'
      );
      const { data } = await chatMessage(input, language || 'roman_urdu', farmProfile);
      


      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        ttsText: data.reply_for_tts || data.reply,
        user: false,
        language: data.language || language,
        clarify: data.needs_clarification,
        navigate_to: data.navigate_to || null,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: ch.errorMsg,
        user: false,
        language,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, backgroundColor: C.cream }}>

        <View style={[s.header, { paddingTop: insets.top + 10 }]}>
          <View style={s.headerInner}>
            <View style={s.avatar}>
              <Text style={{ fontSize: 20 }}>🌾</Text>
            </View>
            <View>
              <Text style={s.title}>{ch.title}</Text>
              <Text style={s.subtitle}>{ch.subtitle}</Text>
            </View>
            <View style={s.headerRight}>
              <Text style={{ fontSize: 18, color: C.goldLt }}>🔊</Text>
            </View>
          </View>
        </View>

        <AjrakBand h={8} />

        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map(item => (
            <MessageBubble key={item.id} message={item} />
          ))}
          {loading && (
            <View style={s.typing}>
              <ActivityIndicator color={C.maroon} size="small" />
              <Text style={s.typingText}>{ch.typing}</Text>
            </View>
          )}
        </ScrollView>

        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder={ch.placeholder}
            placeholderTextColor={C.inkFaint}
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={send}
          />
          <TouchableOpacity style={s.sendBtn} onPress={send}>
            <Text style={{ fontSize: 18 }}>📤</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: C.maroon,
    paddingHorizontal: 14,
    paddingBottom: 14
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.gold,
    alignItems: 'center', justifyContent: 'center'
  },
  title: { color: '#fff', fontWeight: '700', fontSize: 16 },
  subtitle: { color: C.goldLt, fontSize: 12 },
  headerRight: { marginLeft: 'auto' },
  typing: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, padding: 10
  },
  typingText: { fontSize: 14, color: C.inkMuted },
  inputBar: {
    backgroundColor: C.white,
    borderTopWidth: 1, borderTopColor: C.sep,
    padding: 10, flexDirection: 'row',
    alignItems: 'flex-end', gap: 8
  },
  input: {
    flex: 1, backgroundColor: C.cream, borderRadius: 20,
    padding: 12, fontSize: 15, color: C.ink,
    borderWidth: 0.5, borderColor: C.sep, maxHeight: 100
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.maroon,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.gold
  },
});