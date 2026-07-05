import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeScreen }      from '../screens/HomeScreen';
import { PanchangScreen }  from '../screens/PanchangScreen';
import { RashifalScreen }  from '../screens/RashifalScreen';
import { KundaliScreen }   from '../screens/KundaliScreen';
import { MoreScreen }      from '../screens/MoreScreen';
import { NamakaranScreen } from '../screens/NamakaranScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const ico = name => ({ color, size }) => <MaterialCommunityIcons name={name} size={size} color={color} />;

export function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   colors.gold,
        tabBarInactiveTintColor: '#6B5C40',
        tabBarStyle: {
          backgroundColor: colors.headerBg,
          borderTopColor:  colors.gold,
          borderTopWidth:  0.5,
          height: 62, paddingBottom: 10, paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
      }}
    >
      <Tab.Screen name="Home"     component={HomeScreen}     options={{ tabBarLabel: 'হোম',     tabBarIcon: ico('home-variant')           }} />
      <Tab.Screen name="Panchang" component={PanchangScreen} options={{ tabBarLabel: 'পঞ্জিকা', tabBarIcon: ico('calendar-month')         }} />
      <Tab.Screen name="Rashifal" component={RashifalScreen} options={{ tabBarLabel: 'রাশিফল',  tabBarIcon: ico('star-circle')            }} />
      <Tab.Screen name="Kundali"  component={KundaliScreen}  options={{ tabBarLabel: 'কুণ্ডলী', tabBarIcon: ico('chart-donut')            }} />
      <Tab.Screen name="More"     component={MoreScreen}     options={{ tabBarLabel: 'আরও',     tabBarIcon: ico('dots-horizontal-circle') }} />

      {/* Hidden screen — navigable from MoreScreen */}
      <Tab.Screen
        name="Namakaran"
        component={NamakaranScreen}
        options={{ tabBarButton: () => <View style={{ width: 0 }} />, tabBarLabel: '' }}
      />
    </Tab.Navigator>
  );
}
