import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { C } from '../constants/colors';

const getNavigateLabel = (navigateTo, language) => {
  const labels = {
    Disease: {
      roman_urdu: '🔬 Bimari Scanner Kholein',
      urdu: '🔬 بیماری سکینر کھولیں',
      english: '🔬 Open Disease Scanner',
    },
    Mandi: {
      roman_urdu: '🏪 Mandi Dekhen',
      urdu: '🏪 منڈی دیکھیں',
      english: '🏪 View Mandi Prices',
    },
    Weather: {
      roman_urdu: '🌤 Mausam Dekhen',
      urdu: '🌤 موسم دیکھیں',
      english: '🌤 View Weather',
    },
    Services: {
      roman_urdu: '🚜 Services Dekhen',
      urdu: '🚜 خدمات دیکھیں',
      english: '🚜 View Services',
    },
    Season: {
      roman_urdu: '📅 Calendar Dekhen',
      urdu: '📅 کیلنڈر دیکھیں',
      english: '📅 View Calendar',
    },
  };
  const lang = language || 'roman_urdu';
  return labels[navigateTo]?.[lang] || '→ ' + navigateTo;
};

const getClarifyLabel = (language) =>
  ({
    roman_urdu: '⚠ WAZAHAT DARKAR',
    urdu: '⚠ وضاحت درکار',
    english: '⚠ CLARIFICATION NEEDED',
  }[language] || '⚠ WAZAHAT DARKAR');

export default function MessageBubble({ message }) {
  const navigation = useNavigation();
  const { text, user, clarify, language } = message;

  const speak = () => {
    Speech.speak(text, {
      language: language === 'urdu' ? 'ur-PK' : 'en-US',
      rate: language === 'roman_urdu' ? 0.85 : 0.9,
    });
  };

  if (clarify) {
    return (
      <View style={styles.clarifyBubble}>
        <Text style={styles.clarifyLabel}>{getClarifyLabel(language)}</Text>
        <Text style={styles.clarifyText}>{text}</Text>
        <View style={styles.bubbleFooter}>
          <TouchableOpacity onPress={speak}>
            <Text style={{ fontSize: 16 }}>🔊</Text>
          </TouchableOpacity>
          <View style={styles.langBadge}>
            <Text style={styles.langBadgeText}>{language || 'Roman Urdu'}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{text}</Text>
      </View>
    );
  }

  return (
    <View style={styles.aiBubble}>
      <Text style={styles.aiText}>{text}</Text>
      {message.navigate_to && (
        <TouchableOpacity
          style={styles.navigateBtn}
          onPress={() => {
            navigation.goBack();
            setTimeout(() => {
              navigation.navigate('Tabs', {
                screen: message.navigate_to,
              });
            }, 300);
          }}
        >
          <Text style={styles.navigateBtnText}>
            {getNavigateLabel(message.navigate_to, message.language)}
          </Text>
        </TouchableOpacity>
      )}
      <View style={styles.bubbleFooter}>
        <View style={styles.langBadge}>
          <Text style={styles.langBadgeText}>{language || 'Roman Urdu'}</Text>
        </View>
        <TouchableOpacity onPress={speak}>
          <Text style={{ fontSize: 16 }}>🔊</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: C.maroon,
    borderRadius: 14,
    borderBottomRightRadius: 2,
    padding: 10,
    maxWidth: '75%',
    marginBottom: 8,
  },
  userText: { color: '#fff', fontSize: 13, lineHeight: 18 },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: C.white,
    borderRadius: 14,
    borderBottomLeftRadius: 2,
    borderWidth: 0.5,
    borderColor: C.sep,
    padding: 10,
    maxWidth: '80%',
    marginBottom: 8,
  },
  aiText: { color: C.ink, fontSize: 13, lineHeight: 18 },
  clarifyBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3E2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F59E0B',
    padding: 10,
    maxWidth: '80%',
    marginBottom: 8,
  },
  clarifyLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#C47A1E',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  clarifyText: { fontSize: 12, color: C.ink, lineHeight: 17 },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  langBadge: {
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  langBadgeText: { fontSize: 9, color: '#1D6A96', fontWeight: '600' },
  navigateBtn: {
    backgroundColor: C.maroon,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.gold,
  },
  navigateBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
