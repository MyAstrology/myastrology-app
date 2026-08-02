import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { colors } from '../theme/colors';
import { MenuIcon } from './menuItems';

/* ── স্ক্রিনগুলো getComponent দিয়ে দেরিতে লোড করা হয় (আগে static import ছিল) ──
   কেন: ক্যালকুলেটর স্ক্রিনগুলো নিজেদের web-html/*.js বান্ডল static import
   করে, আর সেই বান্ডলগুলো বিশাল একেকটা HTML স্ট্রিং —

     kundali 4.28MB · panjika 1.77MB · result 1.18MB · match-making 0.82MB
     namakaran 0.76MB · varshaphala 0.62MB · prashna 0.54MB
     + print-ভ্যারিয়েন্ট ও numerology  ≈ মোট ১০.২MB

   এই ফাইলে সব স্ক্রিন static import করা থাকায় Metro-র মডিউল-চেইন অ্যাপ
   চালু হওয়ার মুহূর্তেই প্রতিটা মডিউল evaluate করত — অর্থাৎ হোম স্ক্রিন
   আঁকার আগেই ১০.২MB স্ট্রিং JS হিপে তৈরি হতো। কম-RAM ফোনে এটাই cold
   start ধীর করার ও মাঝেমধ্যে ক্র্যাশের প্রধান কারণ।

   getComponent এর কলব্যাক React Navigation তখনই ডাকে যখন স্ক্রিনটা প্রথম
   render হয় — অর্থাৎ ব্যবহারকারী ট্যাব/মেনুতে চাপ দিলে। ফলে চালুর সময়
   কেবল HomeScreen ও তার নির্ভরতাগুলোই লোড হয়।

   কেন require(), import() নয়: Metro-র require সিঙ্ক্রোনাস ও ক্যাশড, তাই
   একই মডিউল বারবার চাইলেও একই অবজেক্ট ফেরে — কম্পোনেন্টের identity বদলায়
   না, স্ক্রিন remount হয় না। import() হলে Promise আসত, getComponent যা
   গ্রহণ করে না।

   ⚠️ প্রথম ট্যাপে require-এর খরচটা এখন দিতে হয়, কিন্তু সেটা ঠিক তখনই
   হয় যখন WebView এমনিতেই তৈরি হচ্ছে (এবং HTML ফাইলে লেখা হচ্ছে) — ওই
   অপেক্ষার তুলনায় require নগণ্য। তাই আলাদা করে prewarm রাখা হয়নি;
   prewarm রাখলে জটিলতা বাড়ত অথচ লাভ চোখে পড়ত না। */
const lazy = {
  Panchang:        () => require('../screens/PanchangScreen').PanchangScreen,
  Rashifal:        () => require('../screens/RashifalScreen').RashifalScreen,
  RashifalDetail:  () => require('../screens/RashifalDetailScreen').RashifalDetailScreen,
  Kundali:         () => require('../screens/KundaliScreen').KundaliScreen,
  More:            () => require('../screens/MoreScreen').MoreScreen,
  Namakaran:       () => require('../screens/NamakaranScreen').NamakaranScreen,
  MatchMaking:     () => require('../screens/MatchMakingScreen').MatchMakingScreen,
  Numerology:      () => require('../screens/NumerologyScreen').NumerologyScreen,
  NumerologyResult:() => require('../screens/NumerologyResultScreen').NumerologyResultScreen,
  Varshaphala:     () => require('../screens/VarshaphalaScreen').VarshaphalaScreen,
  Prashna:         () => require('../screens/PrashnaScreen').PrashnaScreen,
  Blog:            () => require('../screens/BlogScreen').BlogScreen,
  News:            () => require('../screens/NewsScreen').NewsScreen,
  Booking:         () => require('../screens/BookingScreen').BookingScreen,
  Palmistry:       () => require('../screens/PalmistryScreen').PalmistryScreen,
  Vastu:           () => require('../screens/VastuScreen').VastuScreen,
  Learning:        () => require('../screens/LearningScreen').LearningScreen,
  VedicAstrology:  () => require('../screens/VedicAstrologyScreen').VedicAstrologyScreen,
  Gemstone:        () => require('../screens/GemstoneScreen').GemstoneScreen,
  Video:           () => require('../screens/VideoScreen').VideoScreen,
  Settings:        () => require('../screens/SettingsScreen').SettingsScreen,
  Admin:           () => require('../screens/AdminScreen').AdminScreen,
  AboutAstrologer: () => require('../screens/AboutAstrologerScreen').AboutAstrologerScreen,
};

const Tab = createBottomTabNavigator();
const ico = name => ({ color, size }) => <MaterialCommunityIcons name={name} size={size} color={color} />;
// কুণ্ডলী ট্যাবের কাস্টম আইকনের জন্য — MenuIcon-এর 'tab' প্যারামিটার দিয়ে
// 'chart-donut'-এর বদলে বৈদিক কুণ্ডলী ছকের ছবি দেখায়, বাকি সব ট্যাবে
// MaterialCommunityIcons-ই থাকে (icoMenu-এর 'icon' নাম উপেক্ষা করে)।
const icoMenu = tab => ({ color, size }) => <MenuIcon tab={tab} size={size} color={color} />;

// মেনু থেকে পৌঁছানো স্ক্রিনগুলো ট্যাব-বারে দেখানো হয় না
const HIDDEN = { tabBarItemStyle: { display: 'none' }, tabBarButton: () => null };

export function BottomTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      /* backBehavior="history" — ব্যাক চাপলে **আগের দেখা স্ক্রিনে** ফেরে।
         ডিফল্ট ('firstRoute') সবসময় সোজা হোমে ফিরিয়ে আনত: সংখ্যাজ্যোতিষের
         ফলাফল থেকে ব্যাক করলে ফর্মে না ফিরে হোম, মেনু থেকে খোলা যেকোনো
         স্ক্রিন থেকে ব্যাক করলেও হোম। অ্যাপের প্রতিটা স্ক্রিনই আসলে একটা
         ট্যাব (কিছু লুকোনো), তাই সমস্যাটা সব জায়গায় ছিল। */
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor:   colors.gold,
        tabBarInactiveTintColor: '#A89060',
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopColor:  colors.cardBorder,
          borderTopWidth:  1,
          height: 58 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
          elevation: 8,
          shadowColor: colors.gold,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0 },
      }}
    >
      {/* HomeScreen-ই initial route, প্রথম render-এই লাগে — তাই এটি static
          import-ই থাকল; getComponent দিলে বাড়তি কোনো লাভ হতো না। */}
      <Tab.Screen name="Home"     component={HomeScreen}          options={{ tabBarLabel: 'হোম',     tabBarIcon: ico('home-variant')           }} />
      <Tab.Screen name="Panchang" getComponent={lazy.Panchang}    options={{ tabBarLabel: 'পঞ্জিকা', tabBarIcon: ico('calendar-month')         }} />
      <Tab.Screen name="Rashifal" getComponent={lazy.Rashifal}    options={{ tabBarLabel: 'রাশিফল',  tabBarIcon: ico('star-circle')            }} />
      <Tab.Screen name="Kundali"  getComponent={lazy.Kundali}     options={{ tabBarLabel: 'কুণ্ডলী', tabBarIcon: icoMenu('Kundali')             }} />
      <Tab.Screen name="More"     getComponent={lazy.More}        options={{ tabBarLabel: 'আরও',     tabBarIcon: ico('dots-horizontal-circle') }} />

      {/* Hidden screens — navigable from MoreScreen / hamburger menu */}
      <Tab.Screen name="Namakaran"        getComponent={lazy.Namakaran}        options={HIDDEN} />
      <Tab.Screen name="MatchMaking"      getComponent={lazy.MatchMaking}      options={HIDDEN} />
      <Tab.Screen name="Numerology"       getComponent={lazy.Numerology}       options={HIDDEN} />
      <Tab.Screen name="NumerologyResult" getComponent={lazy.NumerologyResult} options={HIDDEN} />
      <Tab.Screen name="Varshaphala"      getComponent={lazy.Varshaphala}      options={HIDDEN} />
      <Tab.Screen name="Prashna"          getComponent={lazy.Prashna}          options={HIDDEN} />
      <Tab.Screen name="RashifalDetail"   getComponent={lazy.RashifalDetail}   options={HIDDEN} />
      <Tab.Screen name="Blog"             getComponent={lazy.Blog}             options={HIDDEN} />
      <Tab.Screen name="News"             getComponent={lazy.News}             options={HIDDEN} />
      <Tab.Screen name="Booking"          getComponent={lazy.Booking}          options={HIDDEN} />
      <Tab.Screen name="Palmistry"        getComponent={lazy.Palmistry}        options={HIDDEN} />
      <Tab.Screen name="Vastu"            getComponent={lazy.Vastu}            options={HIDDEN} />
      <Tab.Screen name="Learning"         getComponent={lazy.Learning}         options={HIDDEN} />
      <Tab.Screen name="VedicAstrology"   getComponent={lazy.VedicAstrology}   options={HIDDEN} />
      <Tab.Screen name="Gemstone"         getComponent={lazy.Gemstone}         options={HIDDEN} />
      <Tab.Screen name="Video"            getComponent={lazy.Video}            options={HIDDEN} />
      <Tab.Screen name="Settings"         getComponent={lazy.Settings}         options={HIDDEN} />
      <Tab.Screen name="Admin"            getComponent={lazy.Admin}            options={HIDDEN} />
      <Tab.Screen name="AboutAstrologer"  getComponent={lazy.AboutAstrologer}  options={HIDDEN} />
    </Tab.Navigator>
  );
}
