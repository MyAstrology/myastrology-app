// প্রতিটা preset-এ fontFamily বেক-ইন করা আছে, যাতে এটা ব্যবহার করলেই বাংলা
// লেখা সঠিক ফন্টে (NotoSerifBengali) আসে — আলাদা করে fontFamily মনে রেখে
// বসাতে হয় না, যেটা আগে অনেক স্ক্রিনে বাদ পড়েছিল।
export const typography = {
  brand:        { fontSize: 16, fontWeight: '800', letterSpacing: 3 }, // ইংরেজি ওয়ার্ডমার্ক, system font
  tagline:      { fontSize: 9,  letterSpacing: 1.2, fontFamily: 'NotoSerifBengali-Regular' },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'NotoSerifBengali-Bold' },
  heading:      { fontSize: 17, fontWeight: '700', fontFamily: 'NotoSerifBengali-Bold' },
  body:         { fontSize: 13, fontFamily: 'NotoSerifBengali-Regular' },
  label:        { fontSize: 11, fontFamily: 'NotoSerifBengali-Regular' },
  value:        { fontSize: 14, fontWeight: '700', fontFamily: 'NotoSerifBengali-Bold' },
  caption:      { fontSize: 10, fontFamily: 'NotoSerifBengali-Regular' },
};
