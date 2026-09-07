/*  একটা রেন্ডার-ত্রুটি হলে পাঠক কী দেখবেন।
 *  ═══════════════════════════════════════════════════════════════
 *  ⚠️ এটা না থাকলে React গোটা গাছটা খুলে ফেলে আর পর্দা **সাদা** হয়ে
 *  যায় — কোনো বার্তা নেই, বেরোনোর পথ নেই, অ্যাপ বন্ধ করা ছাড়া উপায়
 *  নেই। Play Console-এ ওটা crash হিসেবেও গোনা হয় না (অ্যাপ তো চলছেই),
 *  তাই আমরা কোনোদিন জানতেও পারতাম না — শুধু এক-তারা রিভিউ আসত।
 *
 *  ⚠️ ত্রুটির আসল লেখাটা পাঠককে দেখানো হয় না (ইংরেজি stack trace তাঁর
 *  কোনো কাজে আসে না), কিন্তু Analytics-এ পাঠানো হয় — নইলে কোন পর্দায়
 *  ভাঙছে সেটা জানার কোনো উপায় থাকত না।
 *
 *  ⚠️ লেখাগুলো এখানে হার্ডকোড **বাংলায়** নয় — `t()` দিয়ে, কারণ ইংরেজি
 *  বা হিন্দি পাঠকের কাছে হঠাৎ বাংলা বার্তা আসা মানে ভুল ভাষায় ক্ষমা
 *  চাওয়া। কিন্তু ⚠️ `t()` নিজেই যদি ভেঙে থাকে তবে যেন সব ভেঙে না পড়ে,
 *  তাই প্রতিটা ডাক try/catch-এ মোড়া (fallback = বাংলা)।
 */
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
/* ⚠️ react-native-এর কাঁচা Text নয় — নইলে লেখাগুলো বাংলাই থেকে যেত।
   এই মোড়কটা LanguageProvider-এর বাইরেও চলে (FALLBACK আছে), আর
   ErrorBoundary ইচ্ছে করেই ওই Provider-এর বাইরে বসানো। */
import { Text } from '../i18n/Text';
import { colors } from '../theme/colors';
import { logEvent } from '../utils/analytics';
import { tGlobal } from '../i18n';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }

  static getDerivedStateFromError(err) {
    return { err };
  }

  componentDidCatch(err, info) {
    /* ⚠️ এখানে throw করা চলবে না — তাহলে ত্রুটি-পর্দাটাই ভেঙে যেত
       আর পাঠক আবার সেই সাদা পর্দাই দেখতেন। */
    try {
      logEvent('app_error', {
        message: String((err && err.message) || err || '').slice(0, 100),
        /* componentStack-এর প্রথম সারিটাই সবচেয়ে ভিতরের কম্পোনেন্ট —
           অর্থাৎ ঠিক কোথায় ভাঙল। পুরোটা পাঠালে ইভেন্টের সীমা ছাড়াত। */
        component: String((info && info.componentStack) || '').trim().split('\n')[0].trim().slice(0, 60),
      });
    } catch (e) {}
  }

  render() {
    if (!this.state.err) return this.props.children;
    const T = (bn) => { try { return tGlobal(bn); } catch (e) { return bn; } };
    return (
      <View style={s.wrap}>
        <Text style={s.emoji}>🙏</Text>
        <Text style={s.title}>দুঃখিত, কিছু একটা ভুল হয়েছে</Text>
        <Text style={s.body}>অ্যাপটি এই মুহূর্তে পর্দাটি দেখাতে পারছে না। নিচের বোতামে চাপ দিয়ে আবার চেষ্টা করুন।</Text>
        <Pressable
          style={s.btn}
          onPress={() => this.setState({ err: null })}
          accessibilityRole="button"
          accessibilityLabel={T('আবার চেষ্টা করুন')}
        >
          <Text style={s.btnText}>আবার চেষ্টা করুন</Text>
        </Pressable>
        <Text style={s.note}>বারবার হলে অ্যাপটি বন্ধ করে আবার খুলুন।</Text>
      </View>
    );
  }
}

const s = StyleSheet.create({
  wrap:  { flex: 1, backgroundColor: colors.background, alignItems: 'center',
           justifyContent: 'center', padding: 28 },
  emoji: { fontSize: 44, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  body:  { fontSize: 14, lineHeight: 23, color: colors.textSecondary,
           textAlign: 'center', marginTop: 10 },
  btn:   { marginTop: 22, backgroundColor: colors.primary, paddingVertical: 13,
           paddingHorizontal: 30, borderRadius: 30, minHeight: 48, justifyContent: 'center' },
  btnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  note:  { fontSize: 12, color: colors.textSecondary, marginTop: 16, textAlign: 'center' },
});
