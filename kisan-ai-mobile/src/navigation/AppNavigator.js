import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth }     from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import LoginScreen          from '../screens/LoginScreen';
import SignupScreen         from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen           from '../screens/HomeScreen';
import ChatScreen           from '../screens/ChatScreen';
import DiseaseScreen        from '../screens/DiseaseScreen';
import WeatherScreen        from '../screens/WeatherScreen';
import MandiScreen          from '../screens/MandiScreen';
import FarmScreen           from '../screens/FarmScreen';
import ServicesScreen       from '../screens/ServicesScreen';
import { C } from '../constants/colors';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ─── 6 Tabs (Chat removed — accessed via floating FAB instead) ────────────────
function MainTabs() {
  const { t }  = useLanguage();
  const insets = useSafeAreaInsets();
  const tabs = [
    { name:'Home',     component:HomeScreen,     emoji:'🏡', label: t.nav.home     },
    { name:'Disease',  component:DiseaseScreen,  emoji:'🔬', label: t.nav.disease  },
    { name:'Weather',  component:WeatherScreen,  emoji:'⛅', label: t.nav.weather  },
    { name:'Mandi',    component:MandiScreen,    emoji:'🏪', label: t.nav.mandi    },
    { name:'Farm',     component:FarmScreen,     emoji:'🌾', label: t.nav.farm     },
    { name:'Services', component:ServicesScreen, emoji:'🛠', label: t.nav.services },
  ];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopWidth: 2.5,
          borderTopColor: C.maroon,
          height: 70 + insets.bottom,
          paddingBottom: 16 + insets.bottom,
          paddingTop: 6,
        },
        tabBarActiveTintColor: C.maroon,
        tabBarInactiveTintColor: C.inkMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ focused }) => {
          const tab = tabs.find(t => t.name === route.name);
          return (
            <Text style={{ fontSize: focused ? 26 : 23, opacity: focused ? 1 : 0.6 }}>
              {tab?.emoji}
            </Text>
          );
        },
      })}
    >
      {tabs.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ tabBarLabel: tab.label }}
        />
      ))}
    </Tab.Navigator>
  );
}

// ─── Tabs + floating Chat FAB (shown on all tab screens) ──────────────────────
function TabsWithFAB({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <MainTabs />
      {/* 💬 Floating Chat button — appears above the tab bar on every screen */}
      <TouchableOpacity
        style={fab.btn}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Chat')}
      >
        <Text style={{ fontSize: 26 }}>💬</Text>
      </TouchableOpacity>
    </View>
  );
}

const fab = StyleSheet.create({
  btn: {
    position: 'absolute',
    right: 16,
    bottom: 82,                     // sits just above the tab bar
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.maroon,
    borderWidth: 2.5, borderColor: C.gold,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.maroonDk,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 9,
  },
});

// ─── Auth Stack (first — if not logged in) ────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"          component={LoginScreen}          />
      <Stack.Screen name="Signup"         component={SignupScreen}         />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// ─── Main Stack (tabs + chat as a full-screen push) ────────────────────────────
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsWithFAB} />
      <Stack.Screen name="Chat" component={ChatScreen}  />
    </Stack.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { user, loading: authLoading } = useAuth();
  const { loading: langLoading }       = useLanguage();

  if (authLoading || langLoading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor: C.maroonDk }}>
        <Text style={{ fontSize: 46, marginBottom: 16 }}>🌾</Text>
        <ActivityIndicator color={C.gold} size="large" />
        <Text style={{ color: C.goldLt, marginTop: 14, fontSize: 14 }}>Kisan AI lod ho raha hai...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
