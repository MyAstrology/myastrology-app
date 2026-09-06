/*  ভাষা-সচেতন <Text> ও <Alert> — এক জায়গায়।
 *
 *  কেন কম্পোনেন্ট, প্রতিটি ডাকে t() নয়: অ্যাপে ২০০-র বেশি জায়গায় লেখা
 *  বসে। হাতে প্রতিটাকে t() দিয়ে মোড়ালে দু-একটা বাদ পড়তই — আর বাদ পড়া
 *  জায়গাটা নীরবে বাংলা থেকে যেত, কোনো পরীক্ষা লাল হতো না। এখানে
 *  react-native-এর Text-টাই মুড়ে দেওয়া হয়েছে, তাই ফাইলের import লাইনটা
 *  বদলালেই ওই ফাইলের সব লেখা ঢেকে যায় — ভবিষ্যতে যোগ হওয়া লেখাগুলোও।
 *
 *  অনুবাদ না থাকলে বাংলাটাই ফেরে (চাবিই বাংলা লেখা), তাই এতে কিছু হারায় না।
 */
import React from 'react';
import { Text as RNText, Alert } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

/* children-এর ভিতরে ঢুকে কেবল স্ট্রিংগুলো বদলানো হয়; ভিতরের <Text>
   উপাদানগুলো নিজেরাই আবার এই মোড়কের মধ্য দিয়ে যায়, তাই দু-বার
   অনুবাদের চেষ্টা হয় না। */
function mapChildren(children, t) {
  if (typeof children === 'string') return t(children);
  if (Array.isArray(children)) return children.map(c => (typeof c === 'string' ? t(c) : c));
  return children;
}

/* noTranslate — যে লেখাটা ইচ্ছাকৃতভাবে নিজের ভাষাতেই থাকা উচিত।
   একমাত্র সত্যিকারের ব্যবহার: ভাষা-বাছাইয়ের বোতাম (বাংলা · हिन्दी ·
   English)। ওগুলো অনুবাদ হলে ইংরেজি পাঠক "Bengali · Hindi · English"
   দেখতেন আর নিজের ভাষাটা কোনটা তা বোঝা গেলেও বাংলা পাঠক ফিরে আসার পথ
   হারাতেন। */
export function Text(props) {
  const { t } = useLanguage();
  const { children, noTranslate, ...rest } = props;
  return <RNText {...rest}>{noTranslate ? children : mapChildren(children, t)}</RNText>;
}

/* Alert.alert-এর শিরোনাম, বার্তা ও প্রতিটি বোতামের লেখা — একই সারণী দিয়ে।
   হুক ব্যবহার করা যায় না (Alert যেকোনো জায়গা থেকে ডাকা হয়), তাই ভাষাটা
   LanguageContext থেকে নয়, translate()-এর কাছে সরাসরি পাঠানো হয়। */
export function makeAlert(t) {
  return function alertT(title, message, buttons, options) {
    const btns = Array.isArray(buttons)
      ? buttons.map(b => (b && typeof b.text === 'string' ? { ...b, text: t(b.text) } : b))
      : buttons;
    return Alert.alert(
      title == null ? title : t(title),
      message == null ? message : t(message),
      btns,
      options
    );
  };
}

/** স্ক্রিনে ব্যবহার:  const alertT = useAlert(); */
export function useAlert() {
  const { t } = useLanguage();
  return React.useMemo(() => makeAlert(t), [t]);
}
