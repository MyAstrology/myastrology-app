import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PanchangScreen } from '../screens/PanchangScreen';
import { RashifalScreen } from '../screens/RashifalScreen';
import { KundaliScreen } from '../screens/KundaliScreen';
import { NamakaranScreen } from '../screens/NamakaranScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: '#8A7A60',
        tabBarStyle: {
          backgroundColor: colors.headerBg,
          borderTopColor: colors.gold,
          borderTopWidth: 0.5,
          height: 62,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.4,
        },
      }}
    >
      <Tab.Screen
        name="Panchang"
        component={PanchangScreen}
        options={{
          tabBarLabel: 'পঞ্জিকা',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Rashifal"
        component={RashifalScreen}
        options={{
          tabBarLabel: 'রাশিফল',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="star-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Kundali"
        component={KundaliScreen}
        options={{
          tabBarLabel: 'কুণ্ডলী',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-donut" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Namakaran"
        component={NamakaranScreen}
        options={{
          tabBarLabel: 'নামকরণ',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="baby-face-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
