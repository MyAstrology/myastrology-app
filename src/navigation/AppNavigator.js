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
import YouTubeScreen from '../screens/YouTubeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import KundaliScreen from '../screens/KundaliScreen';
import MatchMakingScreen from '../screens/MatchMakingScreen';
import NumerologyScreen from '../screens/NumerologyScreen';
import PanjikaScreen from '../screens/PanjikaScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import RashifalScreen from '../screens/RashifalScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const stackOpts = {
  headerStyle: { backgroundColor: Colors.bg },
  headerTintColor: Colors.goldLight,
  headerTitleStyle: { fontSize: 16, fontWeight: '700' },
  cardStyle: { backgroundColor: Colors.bg },
};

function TabIcon({ emoji, label, focused, badge }) {
  return (
    <View style={styles.tabIcon}>
      <View>
        <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>{emoji}</Text>
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RashifalDetail" component={RashifalScreen} options={{ title: 'রাশিফল' }} />
    </Stack.Navigator>
  );
}

function ToolsStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="ToolsHome" component={ToolsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Kundali" component={KundaliScreen} options={{ title: 'জন্মকুষ্ঠি' }} />
      <Stack.Screen name="MatchMaking" component={MatchMakingScreen} options={{ title: 'কুষ্ঠি মিলন' }} />
      <Stack.Screen name="Numerology" component={NumerologyScreen} options={{ title: 'নিউমেরোলজি' }} />
      <Stack.Screen name="Panjika" component={PanjikaScreen} options={{ title: 'পঞ্জিকা' }} />
    </Stack.Navigator>
  );
}

function BlogStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="BlogList" component={BlogScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen}
        options={({ route }) => ({ title: route.params?.title || 'ব্লগ' })} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="YouTube" component={YouTubeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'সেটিংস' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: false,
    }}>
      <Tab.Screen name="Home" component={HomeStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="হোম" focused={focused} /> }} />
      <Tab.Screen name="Tools" component={ToolsStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔮" label="টুলস" focused={focused} /> }} />
      <Tab.Screen name="AIChat" component={AIChatScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" label="AI" focused={focused} /> }} />
      <Tab.Screen name="Blog" component={BlogStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📖" label="ব্লগ" focused={focused} /> }} />
      <Tab.Screen name="YouTube" component={MoreStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🎬" label="ভিডিও" focused={focused} /> }} />
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
    height: 72, paddingBottom: 8, paddingTop: 8,
  },
  tabIcon: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabEmoji: { fontSize: 20, opacity: 0.45 },
  tabEmojiFocused: { opacity: 1, transform: [{ scale: 1.15 }] },
  tabLabel: { fontSize: 9, color: 'rgba(201,168,76,0.5)' },
  tabLabelFocused: { color: '#c9a84c', fontWeight: '700' },
  badge: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: '#ef4444', borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
