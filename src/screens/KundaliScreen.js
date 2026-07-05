import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, TextInput, Modal, Pressable,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import KUNDALI_HTML from '../web-html/kundali';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const LOGO = require('../../assets/logo.png');

const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBN = n => String(n).replace(/\d/g, d => BN_DIGITS[+d]);

const BN_MONTHS_SHORT = [
  'জানু','ফেব্রু','মার্চ','এপ্রিল','মে','জুন',
  'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টো','নভে','ডিসে',
];

const TZ_OPTIONS = [
  { label: 'ভারত (IST) UTC+৫:৩০',    value: '5.5'  },
  { label: 'বাংলাদেশ (BST) UTC+৬:০০', value: '6.0'  },
  { label: 'নেপাল (NPT) UTC+৫:৪৫',   value: '5.75' },
  { label: 'পাকিস্তান (PKT) UTC+৫:০০', value: '5.0' },
  { label: 'মিয়ানমার UTC+৬:৩০',       value: '6.5'  },
  { label: 'থাইল্যান্ড UTC+৭:০০',      value: '7.0'  },
  { label: 'সিঙ্গাপুর UTC+৮:০০',       value: '8.0'  },
];

const MENU_ITEMS = [
  { tab: 'Home',        icon: 'home-variant',          label: 'হোম'            },
  { tab: 'Panchang',    icon: 'calendar-month',        label: 'পঞ্জিকা'         },
  { tab: 'Rashifal',    icon: 'star-circle',           label: 'রাশিফল'          },
  { tab: 'Kundali',     icon: 'chart-donut',           label: 'জন্ম কুণ্ডলী'    },
  { tab: 'MatchMaking', icon: 'heart-multiple',        label: 'যোটক বিচার'     },
  { tab: 'Numerology',  icon: 'numeric-9-plus-box',    label: 'সংখ্যাজ্যোতিষ'  },
  { tab: 'Namakaran',   icon: 'baby-face-outline',     label: 'নামকরণ'          },
  { tab: 'More',        icon: 'dots-horizontal-circle',label: 'আরও'             },
];

// ── File URI (written once per session) ──────────────────────────────────────

const WEB_DIR = FileSystem.documentDirectory + 'myastro/';
let _kUri = null;
let _kPromise = null;

async function getKUri() {
  if (_kUri) return _kUri;
  if (!_kPromise) {
    _kPromise = (async () => {
      await FileSystem.makeDirectoryAsync(WEB_DIR, { intermediates: true });
      const dest = WEB_DIR + 'kundali_app.html';
      await FileSystem.writeAsStringAsync(dest, KUNDALI_HTML,
        { encoding: FileSystem.EncodingType.UTF8 });
      _kUri = dest;
      return dest;
    })();
  }
  return _kPromise;
}

function useKUri() {
  const [uri, setUri] = useState(_kUri);
  useEffect(() => { getKUri().then(u => setUri(u)); }, []);
  return uri;
}

// ── Build injected JS to auto-fill + submit the WebView form ─────────────────

function buildResultJS(f) {
  return `(function(){
  var st=document.getElementById('__kApp__');
  if(!st){st=document.createElement('style');st.id='__kApp__';document.head.appendChild(st);}
  st.textContent='#inputSection{display:none!important;}#moreServicesCard{display:none!important;}#seoSection{display:none!important;}#faqSection{display:none!important;}body{background:#FAF8F3!important;}::-webkit-scrollbar{display:none!important;}html{scrollbar-width:none!important;}';

  function doFill(){
    var el;
    el=document.getElementById('userName');if(el)el.value=${JSON.stringify(f.name||'')};
    el=document.getElementById(${JSON.stringify(f.gender==='F'?'genderFemale':'genderMale')});
    if(el){el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));}
    var ids=['dobDay','dobMonth','dobYear','tobHour','tobMin'];
    var vals=[${f.day},${f.month},${f.year},${f.hour},${f.minute}];
    ids.forEach(function(id,i){
      el=document.getElementById(id);
      if(el){el.value=vals[i];el.dispatchEvent(new Event('change',{bubbles:true}));}
    });
    el=document.getElementById('tobSec');if(el)el.value='0';
    el=document.getElementById('tzOffset');if(el)el.value=${JSON.stringify(String(f.tz))};
    el=document.getElementById('lat');if(el){el.value=${JSON.stringify(String(f.lat))};el.dispatchEvent(new Event('input',{bubbles:true}));}
    el=document.getElementById('lon');if(el){el.value=${JSON.stringify(String(f.lon))};el.dispatchEvent(new Event('input',{bubbles:true}));}
    if(typeof validateForm==='function')validateForm();
    setTimeout(function(){
      if(typeof calculateFullKundali==='function')calculateFullKundali();
      else{var b=document.getElementById('calcBtn');if(b)b.click();}
    },300);
  }

  function tryFill(n){
    var yr=document.getElementById('dobYear');
    if(!yr||yr.options.length<2){
      if(n>0)setTimeout(function(){tryFill(n-1);},120);
      return;
    }
    doFill();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){tryFill(15);},200);});
  }else{
    setTimeout(function(){tryFill(15);},200);
  }
  return true;
})();true;`;
}

// ── Spinner widget (− value +) ────────────────────────────────────────────────

function Spinner({ value, min, max, onDec, onInc, label }) {
  return (
    <View style={ss.spWrap}>
      <Text style={ss.spLabel}>{label}</Text>
      <View style={ss.spRow}>
        <TouchableOpacity style={ss.spBtn} onPress={onDec} activeOpacity={0.7}>
          <MaterialCommunityIcons name="minus" size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={ss.spVal}>{value}</Text>
        <TouchableOpacity style={ss.spBtn} onPress={onInc} activeOpacity={0.7}>
          <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

const CUR_YEAR = new Date().getFullYear();

export function KundaliScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [tzModal,    setTzModal]    = useState(false);
  const [phase,      setPhase]      = useState('form'); // 'form' | 'result'
  const [resultJS,   setResultJS]   = useState(null);

  const kUri = useKUri();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name,   setName]   = useState('');
  const [gender, setGender] = useState('M');
  const [day,    setDay]    = useState(1);
  const [month,  setMonth]  = useState(1);
  const [year,   setYear]   = useState(1990);
  const [hour,   setHour]   = useState(6);
  const [minute, setMinute] = useState(0);
  const [tz,     setTz]     = useState('5.5');
  const [lat,    setLat]    = useState('22.5726');
  const [lon,    setLon]    = useState('88.3639');

  const tzLabel = TZ_OPTIONS.find(t => t.value === tz)?.label ?? tz;

  const daysInMonth = new Date(year, month, 0).getDate();
  const safeDec = (v, min, max) => v <= min ? max : v - 1;
  const safeInc = (v, min, max) => v >= max ? min : v + 1;

  function submit() {
    const clampedDay = Math.min(day, daysInMonth);
    const js = buildResultJS({ name, gender, day: clampedDay, month, year, hour, minute, tz, lat: parseFloat(lat)||22.5726, lon: parseFloat(lon)||88.3639 });
    setResultJS(js);
    setPhase('result');
  }

  function goBack() { setPhase('form'); setResultJS(null); }

  // ── Shared header ────────────────────────────────────────────────────────────
  function Header({ showBack }) {
    return (
      <View style={s.header}>
        {showBack ? (
          <TouchableOpacity style={s.hamBtn} onPress={goBack} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.gold} />
          </TouchableOpacity>
        ) : (
          <Image source={LOGO} style={s.logo} />
        )}
        <View style={s.headerCenter}>
          <Text style={s.brand}>MYASTROLOGY</Text>
          <Text style={s.tagline}>জ্যোতিষ · পঞ্জিকা · কুণ্ডলী</Text>
        </View>
        <TouchableOpacity style={s.hamBtn} onPress={() => setMenuOpen(true)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="menu" size={24} color={colors.gold} />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Drawer ───────────────────────────────────────────────────────────────────
  function Drawer() {
    return (
      <View style={s.drawerOverlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => setMenuOpen(false)} activeOpacity={1} />
        <View style={[s.drawer, { paddingTop: insets.top + 8 }]}>
          <View style={s.drawerHeader}>
            <Text style={s.drawerTitle}>MENU</Text>
            <TouchableOpacity onPress={() => setMenuOpen(false)}>
              <MaterialCommunityIcons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={s.drawerDivider} />
          {MENU_ITEMS.map(item => (
            <TouchableOpacity key={item.tab} style={s.menuItem}
              onPress={() => { setMenuOpen(false); navigation.navigate(item.tab); }}
              activeOpacity={0.7}>
              <MaterialCommunityIcons name={item.icon} size={20} color={colors.primary} />
              <Text style={s.menuLabel}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // ── Result phase ─────────────────────────────────────────────────────────────
  if (phase === 'result') {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <Header showBack />
        {!kUri ? (
          <View style={s.loadCenter}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={s.loadMsg}>গণনা হচ্ছে…</Text>
          </View>
        ) : (
          <WebView
            key={resultJS}
            source={{ uri: kUri }}
            style={s.wv}
            originWhitelist={['file://*','about:*','https://*','http://*']}
            allowFileAccess={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            mixedContentMode="always"
            javaScriptEnabled={true}
            domStorageEnabled={true}
            cacheEnabled={false}
            startInLoadingState={true}
            injectedJavaScript={resultJS}
            renderLoading={() => (
              <View style={[s.loadCenter, StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.gold} />
                <Text style={s.loadMsg}>কুণ্ডলী গণনা হচ্ছে…</Text>
              </View>
            )}
          />
        )}
        {menuOpen && <Drawer />}
      </View>
    );
  }

  // ── Form phase ───────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={s.formContent}>

        {/* Title */}
        <View style={s.titleRow}>
          <MaterialCommunityIcons name="chart-donut" size={20} color={colors.gold} />
          <Text style={s.title}>জন্ম কুণ্ডলী গণনা</Text>
        </View>

        {/* Name */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>আপনার নাম</Text>
          <TextInput
            style={s.textInput}
            value={name}
            onChangeText={setName}
            placeholder="পূর্ণ নাম লিখুন"
            placeholderTextColor={colors.textSecondary + '80'}
          />
        </View>

        {/* Gender */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>লিঙ্গ</Text>
          <View style={s.genderRow}>
            {[['M','পুরুষ','gender-male'],['F','মহিলা','gender-female']].map(([g, lbl, ico]) => (
              <TouchableOpacity key={g} style={[s.genderChip, gender===g && s.genderChipActive]}
                onPress={() => setGender(g)} activeOpacity={0.7}>
                <MaterialCommunityIcons name={ico} size={16}
                  color={gender===g ? colors.primary : colors.textSecondary} />
                <Text style={[s.genderLabel, gender===g && s.genderLabelActive]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date of Birth */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>জন্ম তারিখ</Text>
          <View style={s.spRowGroup}>
            <Spinner label="দিন" value={toBN(day)}
              onDec={() => setDay(v => safeDec(v, 1, daysInMonth))}
              onInc={() => setDay(v => safeInc(v, 1, daysInMonth))} />
            <Spinner label="মাস" value={BN_MONTHS_SHORT[month-1]}
              onDec={() => setMonth(v => safeDec(v, 1, 12))}
              onInc={() => setMonth(v => safeInc(v, 1, 12))} />
            <Spinner label="বছর" value={toBN(year)}
              onDec={() => setYear(v => Math.max(1900, v - 1))}
              onInc={() => setYear(v => Math.min(CUR_YEAR, v + 1))} />
          </View>
        </View>

        {/* Time of Birth */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>জন্ম সময়</Text>
          <View style={s.spRowGroup}>
            <Spinner label="ঘন্টা" value={toBN(hour)}
              onDec={() => setHour(v => safeDec(v, 0, 23))}
              onInc={() => setHour(v => safeInc(v, 0, 23))} />
            <Spinner label="মিনিট" value={toBN(minute)}
              onDec={() => setMinute(v => safeDec(v, 0, 59))}
              onInc={() => setMinute(v => safeInc(v, 0, 59))} />
          </View>
          <Text style={s.fieldHint}>সঠিক সময় না জানলে সূর্যোদয়ের কাছাকাছি দিন</Text>
        </View>

        {/* Timezone */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>টাইম জোন</Text>
          <TouchableOpacity style={s.tzPicker} onPress={() => setTzModal(true)} activeOpacity={0.8}>
            <Text style={s.tzPickerText}>{tzLabel}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Birth place */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>জন্মস্থান (অক্ষাংশ · দ্রাঘিমাংশ)</Text>
          <View style={s.coordRow}>
            <View style={s.coordField}>
              <Text style={s.coordLabel}>অক্ষাংশ</Text>
              <TextInput style={s.coordInput} value={lat} onChangeText={setLat}
                keyboardType="decimal-pad" placeholderTextColor={colors.textSecondary}
                placeholder="22.5726" />
            </View>
            <View style={s.coordField}>
              <Text style={s.coordLabel}>দ্রাঘিমাংশ</Text>
              <TextInput style={s.coordInput} value={lon} onChangeText={setLon}
                keyboardType="decimal-pad" placeholderTextColor={colors.textSecondary}
                placeholder="88.3639" />
            </View>
          </View>
          <Text style={s.fieldHint}>ডিফল্ট: কলকাতা (২২.৫৭, ৮৮.৩৬)</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity style={s.submitBtn} onPress={submit} activeOpacity={0.8}>
          <MaterialCommunityIcons name="chart-donut" size={18} color={colors.white} />
          <Text style={s.submitText}>কুণ্ডলী গণনা করুন</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* TZ modal */}
      {tzModal && (
        <View style={s.drawerOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setTzModal(false)} activeOpacity={1} />
          <View style={[s.tzModal, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={s.tzModalTitle}>টাইম জোন বেছে নিন</Text>
            {TZ_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.value} style={s.tzOption}
                onPress={() => { setTz(opt.value); setTzModal(false); }} activeOpacity={0.7}>
                <Text style={[s.tzOptionText, tz===opt.value && s.tzOptionActive]}>{opt.label}</Text>
                {tz === opt.value &&
                  <MaterialCommunityIcons name="check" size={16} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {menuOpen && <Drawer />}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.headerBg,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.headerBorder,
  },
  logo:         { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.gold + 'AA' },
  headerCenter: { flex: 1, alignItems: 'center' },
  brand:        { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  tagline:      { fontSize: 9, color: colors.textSecondary, letterSpacing: 1.2, marginTop: 1,
                  fontFamily: 'NotoSerifBengali-Regular' },
  hamBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

  /* Form */
  formContent: { paddingHorizontal: spacing.md, paddingTop: 16, paddingBottom: 40 },

  titleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: 1,
    fontFamily: 'NotoSerifBengali-Bold',
  },

  fieldGroup: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8,
    fontFamily: 'NotoSerifBengali-Bold',
  },
  fieldHint: {
    fontSize: 11, color: colors.textSecondary + 'AA',
    fontFamily: 'NotoSerifBengali-Regular', marginTop: 6,
  },

  textInput: {
    backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: colors.text,
    fontFamily: 'NotoSerifBengali-Regular',
  },

  /* Gender */
  genderRow: { flexDirection: 'row', gap: 12 },
  genderChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 22, borderWidth: 1.5, borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  genderChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
  genderLabel:      { fontSize: 14, color: colors.textSecondary, fontFamily: 'NotoSerifBengali-Regular' },
  genderLabelActive: { color: colors.primary, fontFamily: 'NotoSerifBengali-Bold' },

  /* Spinners */
  spRowGroup: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },

  /* Timezone */
  tzPicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  tzPickerText: { fontSize: 14, color: colors.text, fontFamily: 'NotoSerifBengali-Regular' },

  /* Coords */
  coordRow: { flexDirection: 'row', gap: 10 },
  coordField: { flex: 1 },
  coordLabel: {
    fontSize: 11, color: colors.textSecondary, marginBottom: 6,
    fontFamily: 'NotoSerifBengali-Regular',
  },
  coordInput: {
    backgroundColor: colors.card, borderRadius: 10,
    borderWidth: 1, borderColor: colors.cardBorder,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: colors.text,
  },

  /* Submit */
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.primary, borderRadius: 14,
    paddingVertical: 15, marginTop: 8,
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  submitText: { fontSize: 15, color: colors.white, fontFamily: 'NotoSerifBengali-Bold' },

  /* Result WebView */
  wv: { flex: 1 },
  loadCenter: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadMsg: { marginTop: 12, color: colors.textSecondary, fontSize: 13,
             fontFamily: 'NotoSerifBengali-Regular' },

  /* TZ Modal */
  tzModal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderTopColor: colors.cardBorder,
    paddingHorizontal: 20, paddingTop: 16,
  },
  tzModalTitle: {
    fontSize: 15, fontWeight: '700', color: colors.text,
    textAlign: 'center', marginBottom: 14,
    fontFamily: 'NotoSerifBengali-Bold',
  },
  tzOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  tzOptionText:   { fontSize: 14, color: colors.text, fontFamily: 'NotoSerifBengali-Regular' },
  tzOptionActive: { color: colors.primary, fontFamily: 'NotoSerifBengali-Bold' },

  /* Drawer */
  drawerOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row-reverse', zIndex: 100 },
  drawer: {
    width: '75%', backgroundColor: colors.card,
    paddingHorizontal: 18, paddingBottom: 32,
    borderLeftWidth: 1, borderLeftColor: colors.cardBorder,
    elevation: 16, shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.12, shadowRadius: 12,
  },
  drawerHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  drawerTitle:   { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  drawerDivider: { height: 1, backgroundColor: colors.cardBorder, marginBottom: 14 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  menuLabel: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '600',
               fontFamily: 'NotoSerifBengali-Regular' },
});

// ── Spinner sub-styles ────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  spWrap: { alignItems: 'center', gap: 6 },
  spLabel: {
    fontSize: 11, color: colors.textSecondary,
    fontFamily: 'NotoSerifBengali-Regular',
  },
  spRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 10,
    borderWidth: 1, borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  spBtn: {
    paddingHorizontal: 10, paddingVertical: 10,
    backgroundColor: colors.cardBorder + '60',
  },
  spVal: {
    minWidth: 52, textAlign: 'center',
    fontSize: 14, color: colors.text,
    fontFamily: 'NotoSerifBengali-Bold',
    paddingHorizontal: 4,
  },
});
