import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen }        from '../screens/HomeScreen';
import { PanchangScreen }    from '../screens/PanchangScreen';
import { RashifalScreen }    from '../screens/RashifalScreen';
import { KundaliScreen }     from '../screens/KundaliScreen';
import { MoreScreen }        from '../screens/MoreScreen';
import { NamakaranScreen }   from '../screens/NamakaranScreen';
import { MatchMakingScreen } from '../screens/MatchMakingScreen';
import { NumerologyScreen }  from '../screens/NumerologyScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const ico = name => ({ color, size }) => <MaterialCommunityIcons name={name} size={size} color={color} />;

export function BottomTabs() {
  const insets = useSafeAreaInsets();
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
          height: 58 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0 },
      }}
    >
      <Tab.Screen name="Home"     component={HomeScreen}     options={{ tabBarLabel: 'হোম',     tabBarIcon: ico('home-variant')           }} />
      <Tab.Screen name="Panchang" component={PanchangScreen} options={{ tabBarLabel: 'পঞ্জিকা', tabBarIcon: ico('calendar-month')         }} />
      <Tab.Screen name="Rashifal" component={RashifalScreen} options={{ tabBarLabel: 'রাশিফল',  tabBarIcon: ico('star-circle')            }} />
      <Tab.Screen name="Kundali"  component={KundaliScreen}  options={{ tabBarLabel: 'কুণ্ডলী', tabBarIcon: ico('chart-donut')            }} />
      <Tab.Screen name="More"     component={MoreScreen}     options={{ tabBarLabel: 'আরও',     tabBarIcon: ico('dots-horizontal-circle') }} />

      {/* Hidden screens — navigable from MoreScreen / hamburger menu */}
      <Tab.Screen
        name="Namakaran"
        component={NamakaranScreen}
        options={{ tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }}
      />
      <Tab.Screen
        name="MatchMaking"
        component={MatchMakingScreen}
        options={{ tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }}
      />
      <Tab.Screen
        name="Numerology"
        component={NumerologyScreen}
        options={{ tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
}
