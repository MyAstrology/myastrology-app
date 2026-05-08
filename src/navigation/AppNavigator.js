// src/navigation/AppNavigator.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import ToolsScreen from '../screens/ToolsScreen';
import AIChatScreen from '../screens/AIChatScreen';
import BlogScreen from '../screens/BlogScreen';
import ConsultScreen from '../screens/ConsultScreen';
import KundaliScreen from '../screens/KundaliScreen';
import MatchMakingScreen from '../screens/MatchMakingScreen';
import NumerologyScreen from '../screens/NumerologyScreen';
import PanjikaScreen from '../screens/PanjikaScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import RashifalScreen from '../screens/RashifalScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const stackOptions = {
  headerStyle: { backgroundColor: Colors.bg },
  headerTintColor: Colors.goldLight,
  headerTitleStyle: { fontSize: 16 },
  cardStyle: { backgroundColor: Colors.bg },
};

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>
        {emoji}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
}

function ToolsStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="ToolsHome" component={ToolsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Kundali" component={KundaliScreen} options={{ title: 'জন্মকুষ্ঠি' }} />
      <Stack.Screen name="MatchMaking" component={MatchMakingScreen} options={{ title: 'কুষ্ঠি মিলন' }} />
      <Stack.Screen name="Numerology" component={NumerologyScreen} options={{ title: 'নিউমেরোলজি' }} />
      <Stack.Screen name="Panjika" component={PanjikaScreen} options={{ title: 'পঞ্জিকা' }} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RashifalDetail" component={RashifalScreen} options={{ title: 'রাশিফল' }} />
    </Stack.Navigator>
  );
}

function BlogStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="BlogList" component={BlogScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen}
        options={({ route }) => ({ title: route.params?.title || 'ব্লগ' })} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarShowLabel: false }}>
      <Tab.Screen name="Home" component={HomeStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="হোম" focused={focused} /> }} />
      <Tab.Screen name="Tools" component={ToolsStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔮" label="টুলস" focused={focused} /> }} />
      <Tab.Screen name="AIChat" component={AIChatScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" label="AI চ্যাট" focused={focused} /> }} />
      <Tab.Screen name="Blog" component={BlogStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📖" label="ব্লগ" focused={focused} /> }} />
      <Tab.Screen name="Consult" component={ConsultScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📞" label="পরামর্শ" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0a1525',
    borderTopColor: 'rgba(201,168,76,0.15)',
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIcon: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabEmoji: { fontSize: 22, opacity: 0.5 },
  tabEmojiFocused: { opacity: 1, transform: [{ scale: 1.1 }] },
  tabLabel: { fontSize: 10, color: 'rgba(201,168,76,0.5)' },
  tabLabelFocused: { color: '#c9a84c', fontWeight: '600' },
});
