import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import KundaliScreen from '../screens/KundaliScreen';
import PanjikaScreen from '../screens/PanjikaScreen';
import RashifalScreen from '../screens/RashifalScreen';
import MoreScreen from '../screens/MoreScreen';
import { COLORS } from '../theme';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'হোম',    component: HomeScreen,    icon: ['home',    'home-outline']    },
  { name: 'কুণ্ডলী', component: KundaliScreen, icon: ['planet',  'planet-outline']  },
  { name: 'পঞ্জিকা', component: PanjikaScreen, icon: ['calendar','calendar-outline'] },
  { name: 'রাশিফল', component: RashifalScreen, icon: ['star',    'star-outline']    },
  { name: 'আরও',    component: MoreScreen,    icon: ['grid',    'grid-outline']    },
];

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 58,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarIcon: ({ focused, color }) => {
          const tab = TABS.find(t => t.name === route.name);
          const iconName = focused ? tab.icon[0] : tab.icon[1];
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      {TABS.map(t => (
        <Tab.Screen key={t.name} name={t.name} component={t.component} />
      ))}
    </Tab.Navigator>
  );
}
