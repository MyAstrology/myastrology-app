// src/screens/AIChatScreen.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, Linking, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../theme';
import { askGemini } from '../gemini';

// ═══════════════════════════════════════════════════════════
// ★ তথ্যসমৃদ্ধ স্থানীয় জ্ঞানভাণ্ডার (৩০+ বিষয়)
//    — কোনো API লাগবে না, অ্যাপের সাইজে নগণ্য প্রভাব (≈১২ KB)
// ═══════════════════════════════════════════════════════════
const LOCAL_KNOWLEDGE = [
  // ── রাশিফল ও রাশিচক্র ──
  { keywords: ['রাশিফল','রাশি','দৈনিক','ভাগ্য','রাশিচক্র','গ্রহ','দৈনিক রাশিফল','আজকের'], title:'আজকের রাশিফল ও দৈনিক ভাগ্য', description:'প্রতিদিন সকালে চন্দ্র গোচর অনুযায়ী ১২ রাশির বিস্তারিত রাশিফল প্রকাশিত হয়। এতে প্রেম, কর্ম, স্বাস্থ্য, অর্থ ও সতর্কতা সহ সম্পূর্ণ বিশ্লেষণ দেওয়া হয়। আপনার জন্ম রাশি অনুযায়ী আজকের দিনটি কেমন যাবে তা জানতে রাশিফল দেখুন।', url:'https://www.myastrology.in/rashifal.html' },
  { keywords: ['মেষ','বৃষ','মিথুন','কর্কট','সিংহ','কন্যা','তুলা','বৃশ্চিক','ধনু','মকর','কুম্ভ','মীন'], title:'১২ রাশির বৈশিষ্ট্য ও স্বভাব', description:'প্রত্যেক রাশির নিজস্ব অধিপতি গ্রহ, উপাদান (অগ্নি/পৃথিবী/বায়ু/জল) ও প্রকৃতি (চর/স্থির/দ্বিস্বভাব) রয়েছে। যেমন: মেষ রাশির অধিপতি মঙ্গল — অগ্নি উপাদান, চর প্রকৃতি। এরা সাহসী, উদ্যোগী ও নেতৃত্বগুণ সম্পন্ন।', url:'https://www.myastrology.in/rashifal.html' },

  // ── গ্রহ ও জ্যোতিষ ──
  { keywords: ['গ্রহ','নবগ্রহ','সূর্য','চন্দ্র','মঙ্গল','বুধ','বৃহস্পতি','শুক্র','শনি','রাহু','কেতু'], title:'নবগ্রহ — গ্রহদের পরিচিতি ও প্রভাব', description:'বৈদিক জ্যোতিষে ৯টি গ্রহ রয়েছে: সূর্য (আত্মা), চন্দ্র (মন), মঙ্গল (সাহস), বুধ (বুদ্ধি), বৃহস্পতি (জ্ঞান), শুক্র (প্রেম), শনি (কর্মফল), রাহু (মায়া), কেতু (মোক্ষ)। প্রতিটি গ্রহ জীবনের নির্দিষ্ট ক্ষেত্রকে প্রভাবিত করে।', url:'https://www.myastrology.in/astrology.html' },
  { keywords: ['সাড়েসাতি','শনি','সাড়ে সাতি','শনির','সাড়েসাতির','ঢাইয়া'], title:'শনির সাড়েসাতি — কী, কেন, কতদিন?', description:'শনি যখন জন্মরাশির আগের রাশি, নিজ রাশি ও পরের রাশিতে অবস্থান করে তখন সাড়েসাতি হয়। এটি মোট সাড়ে সাত বছর স্থায়ী হয়। প্রথম পর্যায় (শনি ১২ম ভাবে), মধ্য পর্যায় (শনি ১ম ভাবে) ও শেষ পর্যায় (শনি ২য় ভাবে) — এই তিন পর্যায়ে সাড়েসাতি সম্পূর্ণ হয়। ধৈর্য, নম্রতা ও সেবাই মুক্তির পথ।', url:'https://www.myastrology.in/blog/shani-sadesati-ki-hoy-keno-hoy-ki-korben.html' },
  { keywords: ['গ্রহদশা','দশা','মহাদশা','অন্তর্দশা','বিংশোত্তরী'], title:'গ্রহদশা — মহাদশা ও অন্তর্দশা', description:'জন্মের সময় চন্দ্র যে নক্ষত্রে থাকে তার উপর ভিত্তি করে বিংশোত্তরী দশা গণনা করা হয়। সূর্য ৬ বছর, চন্দ্র ১০ বছর, মঙ্গল ৭ বছর, রাহু ১৮ বছর, বৃহস্পতি ১৬ বছর, শনি ১৯ বছর, বুধ ১৭ বছর, কেতু ৭ বছর, শুক্র ২০ বছর — এই ক্রমে মহাদশা চলে।', url:'https://www.myastrology.in/kundali.html' },
  { keywords: ['বক্রী','বক্র','retrograde','গ্রহ বক্র'], title:'গ্রহের বক্রী গতি — কী প্রভাব ফেলে?', description:'যখন কোনো গ্রহ পৃথিবীর সাপেক্ষে বিপরীত দিকে চলতে শুরু করে তখন তাকে বক্রী বলে। বুধ বক্রী হলে যোগাযোগ ও চুক্তিতে সমস্যা, শুক্র বক্রী হলে সম্পর্কে টানাপড়েন, বৃহস্পতি বক্রী হলে শিক্ষা ও ধর্মীয় কাজে বাধা আসতে পারে।', url:'https://www.myastrology.in/astrology.html' },

  // ── হস্তরেখা ──
  { keywords: ['হাতের রেখা','হস্তরেখা','রেখা','পামিস্ট্রি','palmistry','হাত'], title:'হস্তরেখা — জীবনের মানচিত্র', description:'হাতের রেখা জন্মগত ও অর্জিত কর্মফলের প্রতিচ্ছবি। হৃদয়রেখা প্রেম ও আবেগ, মস্তিষ্করেখা বুদ্ধি ও চিন্তা, জীবনরেখা আয়ু ও স্বাস্থ্য, এবং ভাগ্যরেখা ক্যারিয়ার ও ভাগ্য নির্দেশ করে। এছাড়াও সূর্যরেখা, শুক্ররেখা, বিবাহরেখা ইত্যাদি গুরুত্বপূর্ণ। বিস্তারিত বিশ্লেষণের জন্য Dr. Acharya-র পরামর্শ নিন।', url:'https://www.myastrology.in/palmistry.html' },
  { keywords: ['বিবাহ রেখা','বিয়ের রেখা','প্রেম রেখা'], title:'বিবাহ রেখা — কী বলে আপনার দাম্পত্য?', description:'হাতের কনিষ্ঠ আঙুলের নিচে অনুভূমিক রেখাগুলোই বিবাহ রেখা। একটি স্পষ্ট ও লম্বা রেখা সুখী দাম্পত্যের ইঙ্গিত দেয়। রেখা ভেঙে গেলে বা দ্বীপ চিহ্ন থাকলে সম্পর্কে সমস্যার আভাস পাওয়া যায়। তবে অন্যান্য রেখার সমন্বয়ে সম্পূর্ণ বিচার করতে হবে।', url:'https://www.myastrology.in/palmistry.html' },

  // ── বিবাহ ও সম্পর্ক ──
  { keywords: ['বিবাহযোগ','বিবাহ','বিয়ে','মিলন','যোটক','কুষ্ঠি মিলন','বিবাহের'], title:'বিবাহযোগ — কুষ্ঠি মিলন ও যোটক বিচার', description:'বিবাহযোগ বিচারের জন্য অষ্টকূট পদ্ধতিতে কুষ্ঠি মিলন করা হয়। বর্ণ, বশ্য, তারা, যোনি, গ্রহমৈত্রী, গণ, ভকূট ও নাড়ী — এই ৮টি কূট মিলিয়ে ৩৬ গুণের মধ্যে ১৮ বা তার বেশি পেলে বিবাহযোগ শুভ বলে বিবেচিত হয়। মাঙ্গলিক দোষ ও কালসর্প যোগ বিশেষভাবে বিচার করা প্রয়োজন।', url:'https://www.myastrology.in/match-making.html' },
  { keywords: ['মাঙ্গলিক','মঙ্গল দোষ','মাঙ্গলিক দোষ','মঙ্গল'], title:'মাঙ্গলিক দোষ — কী ও প্রতিকার', description:'মঙ্গল গ্রহ লগ্ন, চতুর্থ, সপ্তম, অষ্টম বা দ্বাদশ ভাবে থাকলে মাঙ্গলিক দোষ হয়। তবে উভয়ের মাঙ্গলিক দোষ একে অপরকে বাতিল করে। প্রতিকার: কুম্ভ বিবাহ, মঙ্গলবার উপবাস, হনুমান চালিশা পাঠ, লাল প্রবাল ধারণ।', url:'https://www.myastrology.in/blog/manglik-yog-ki-prathamik-dharona.html' },
  { keywords: ['কালসর্প','কালসর্পযোগ','কালসর্প দোষ','রাহু কেতু'], title:'কালসর্প যোগ — প্রভাব ও প্রতিকার', description:'যখন সমস্ত গ্রহ রাহু ও কেতুর মধ্যে অবস্থান করে, তখন কালসর্প যোগ হয়। এর ১২টি প্রকার রয়েছে — অনন্ত, কুলিক, বাসুকি, শঙ্খপাল, পদ্ম, মহাপদ্ম, তক্ষক, কর্কট, শঙ্খনাদ, পাতক, বিষধর, শেষনাগ। প্রতিকারের জন্য নাগপঞ্চমী, রুদ্রাভিষেক ও মহাকালেশ্বর দর্শন উপকারী।', url:'https://www.myastrology.in/blog/kalsarpa-yog-ki-prabhab-somadhan.html' },
  { keywords: ['প্রেম','ভালোবাসা','সম্পর্ক','প্রণয়','প্রেমের'], title:'প্রেম ও সম্পর্ক — জ্যোতিষীয় বিশ্লেষণ', description:'প্রেম ও সম্পর্কের জন্য শুক্র, চন্দ্র ও সপ্তম ভাবের অবস্থান গুরুত্বপূর্ণ। শুক্র শক্তিশালী হলে প্রেমের সম্পর্ক মধুর হয়। চন্দ্রের অবস্থান মানসিক সামঞ্জস্য নির্দেশ করে। সপ্তম ভাবের গ্রহ ও দৃষ্টি দাম্পত্য জীবনের গুণাগুণ প্রকাশ করে।', url:'https://www.myastrology.in/astrology.html' },

  // ── রত্নপাথর ──
  { keywords: ['রত্নপাথর','রত্ন','পাথর','গোমেদ','নীলা','পান্না','মাণিক্য','প্রবাল','মুক্তা','পোখরাজ','হীরা'], title:'রত্নপাথর — রাশি অনুযায়ী সঠিক রত্ন', description:'প্রতিটি রাশির জন্য নির্দিষ্ট রত্নপাথর রয়েছে: মেষ-প্রবাল, বৃষ-হীরা, মিথুন-পান্না, কর্কট-মুক্তা, সিংহ-মাণিক্য, কন্যা-পান্না, তুলা-হীরা, বৃশ্চিক-প্রবাল, ধনু-পুষ্পরাগ, মকর-নীলম, কুম্ভ-নীলম, মীন-পুষ্পরাগ। সঠিক রত্ন ধারণ করলে গ্রহদোষ প্রশমিত হয়।', url:'https://www.myastrology.in/gemstone.html' },

  // ── বাস্তু ──
  { keywords: ['বাস্তু','বাস্তুদোষ','ঘর','অফিস','দিক','গৃহ'], title:'বাস্তু শাস্ত্র — গৃহ ও কর্মক্ষেত্রের শক্তি', description:'বাস্তু শাস্ত্র অনুযায়ী গৃহের উত্তর-পূর্ব কোণে পূজাঘর, দক্ষিণ-পূর্বে রান্নাঘর, দক্ষিণ-পশ্চিমে শোবার ঘর, উত্তর-পশ্চিমে অতিথি কক্ষ হওয়া উচিত। বাস্তুদোষে পারিবারিক অশান্তি, আর্থিক সমস্যা ও স্বাস্থ্যহানি হতে পারে।', url:'https://www.myastrology.in/vastu-science.html' },

  // ── পঞ্জিকা ও সময় ──
  { keywords: ['পঞ্জিকা','পঞ্চাঙ্গ','তিথি','নক্ষত্র','যোগ','করণ'], title:'বাংলা পঞ্জিকা — তিথি, নক্ষত্র, যোগ, করণ', description:'বাংলা পঞ্জিকা বৈদিক জ্যোতিষের একটি গুরুত্বপূর্ণ অঙ্গ। এতে তিথি (চন্দ্রকলা), নক্ষত্র (চন্দ্র অবস্থান), যোগ, করণ, সূর্যোদয়, সূর্যাস্ত, রাহুকাল ও শুভ মুহূর্তের তথ্য থাকে। বিবাহ, গৃহপ্রবেশ বা ব্যবসা শুরুর আগে পঞ্জিকা দেখে শুভ সময় নির্বাচন করা হয়।', url:'https://www.myastrology.in/panjika.html' },
  { keywords: ['রাহুকাল','রাহু','অশুভ সময়','শুভ সময়'], title:'রাহুকাল — কখন কী কাজ করবেন না', description:'প্রতিদিন প্রায় ৯০ মিনিটের একটি সময় থাকে যখন রাহুর প্রভাব চরমে থাকে। এই সময়ে নতুন কাজ শুরু, যাত্রা, বা গুরুত্বপূর্ণ সিদ্ধান্ত নেওয়া উচিত নয়। রাহুকাল বারের অধিপতি অনুযায়ী প্রতিদিন ভিন্ন ভিন্ন সময়ে পড়ে। বিস্তারিত জানতে বাংলা পঞ্জিকা দেখুন।', url:'https://www.myastrology.in/panjika.html' },
  { keywords: ['গ্রহণ','চন্দ্রগ্রহণ','সূর্যগ্রহণ','গ্রহণকাল'], title:'গ্রহণকাল — কী করবেন, কী করবেন না', description:'গ্রহণের সময় পাকস্থলীতে খাদ্য রাখা উচিত নয়। গ্রহণ স্পর্শের ৪ প্রহর আগে আহার বন্ধ করতে হয়। গ্রহণকালে দেবদেবীর স্মরণ, জপ ও দান করা উচিত। সূতক কালে গর্ভবতী মহিলাদের বিশেষ সতর্কতা অবলম্বন করতে হয়।', url:'https://www.myastrology.in/panjika.html' },
  { keywords: ['অমৃতযোগ','অমৃত যোগ','মহেন্দ্রযোগ','মহেন্দ্র যোগ'], title:'অমৃতযোগ ও মহেন্দ্রযোগ — শুভ সময়', description:'অমৃতযোগ ও মহেন্দ্রযোগ বিবাহ, গৃহপ্রবেশ ও যেকোনো শুভ কাজের জন্য প্রশস্ত সময়। অমৃতযোগ বার ও নক্ষত্রের মিলনে তৈরি হয়। মহেন্দ্রযোগে করা কাজের ফল দ্বিগুণ হয়। পঞ্জিকায় প্রতিদিনের অমৃতযোগ ও মহেন্দ্রযোগের সময় উল্লেখ থাকে।', url:'https://www.myastrology.in/panjika.html' },

  // ── নামকরণ ও সংখ্যাতত্ত্ব ──
  { keywords: ['নামকরণ','শিশুর নাম','বাচ্চার নাম','নাম'], title:'নবজাতকের নামকরণ — নক্ষত্র অনুযায়ী নাম', description:'নবজাতকের নামকরণ করা হয় জন্ম নক্ষত্রের চরণ অনুযায়ী। প্রতিটি নক্ষত্রের ৪টি চরণের নির্দিষ্ট আদ্যক্ষর রয়েছে। বাংলা ও ইংরেজিতে নামের আদ্যক্ষর নির্বাচন করে শিশুর শুভ নাম রাখা হয়। Dr. Acharya-র কাছে নামকরণ পরামর্শের জন্য WhatsApp করুন।', url:'https://www.myastrology.in/blog/mesha-lagna-jataker-swabhab-karma-bibaha-bhagya.html' },
  { keywords: ['সংখ্যাতত্ত্ব','নিউমেরোলজি','মূলাংক','ভাগ্যাংক','numerology'], title:'সংখ্যাতত্ত্ব (নিউমেরোলজি) — আপনার সংখ্যার গোপন কথা', description:'জন্মতারিখের দিনের যোগফল হলো মূলাংক (যেমন: ১৫ তারিখ → ১+৫=৬), আর পুরো জন্মতারিখের যোগফল হলো ভাগ্যাংক। প্রতিটি সংখ্যা নির্দিষ্ট গ্রহের প্রতিনিধিত্ব করে: ১-সূর্য, ২-চন্দ্র, ৩-বৃহস্পতি, ৪-রাহু, ৫-বুধ, ৬-শুক্র, ৭-কেতু, ৮-শনি, ৯-মঙ্গল। নাম, মোবাইল নম্বর, গাড়ির নম্বর — সব সংখ্যাই আপনার ভাগ্যকে প্রভাবিত করে।', url:'https://www.myastrology.in/numerology.html' },
  { keywords: ['নাম শুদ্ধি','নাম সংশোধন','নামের বানান'], title:'নাম সংশোধন (নাম শুদ্ধি) — বানানের গোপন শক্তি', description:'নামের অক্ষরগুলির সংখ্যাতাত্ত্বিক মান আপনার গ্রহদশার সাথে সামঞ্জস্যপূর্ণ না হলে জীবনে বাধা আসতে পারে। নাম সংশোধন করলে অনেক সমস্যার সমাধান হয়। Dr. Acharya-র পরামর্শে সঠিক নাম নির্বাচন করুন।', url:'https://www.myastrology.in/numerology.html' },

  // ── ক্যারিয়ার ও ব্যবসা ──
  { keywords: ['ক্যারিয়ার','চাকরি','ব্যবসা','পেশা','জীবিকা'], title:'ক্যারিয়ার ও ব্যবসা — গ্রহের প্রভাব', description:'দশম ভাবে সূর্য, শনি বা মঙ্গল শক্তিশালী থাকলে চাকরি ও ব্যবসায় উন্নতি হয়। বৃহস্পতি ও শুক্র ব্যবসায়িক বুদ্ধি ও কূটনীতি দেয়। ধন যোগ ও রাজযোগ থাকলে উচ্চপদ ও সম্মান পাওয়ার সম্ভাবনা থাকে।', url:'https://www.myastrology.in/astrology.html' },
  { keywords: ['শুভ মুহূর্ত','মুহূর্ত','শুভদিন','শুভ সময়'], title:'শুভ মুহূর্ত নির্বাচন — কখন করবেন শুভ কাজ?', description:'বিবাহ, গৃহপ্রবেশ, ব্যবসা শুরু বা যেকোনো শুভ কাজের জন্য পঞ্জিকা মতে শুভ মুহূর্ত নির্বাচন করা প্রয়োজন। তিথি, নক্ষত্র, যোগ, করণ ও লগ্নের সমন্বয়ে শুভ মুহূর্ত নির্ধারিত হয়। Dr. Acharya-র কাছে শুভ মুহূর্ত নির্বাচনের জন্য যোগাযোগ করুন।', url:'https://www.myastrology.in/panjika.html' },

  // ── জন্মকুণ্ডলী ──
  { keywords: ['জন্মকুণ্ডলী','কুণ্ডলী','জন্মছক','কুষ্ঠি','কুষ্ঠী','জন্ম'], title:'জন্মকুণ্ডলী — আপনার জীবনের মহাজাগতিক মানচিত্র', description:'জন্মকুণ্ডলী হল জন্মের সময় গ্রহ-নক্ষত্রের অবস্থানের ছবি। এটি লগ্ন, রাশি, নক্ষত্র, গ্রহের অবস্থান, ভাব, দশা ইত্যাদির ভিত্তিতে আপনার ব্যক্তিত্ব, ভাগ্য ও জীবনের ঘটনাবলি সম্পর্কে ধারণা দেয়। বিনামূল্যে অনলাইনে আপনার কুণ্ডলী গণনা করতে পারেন।', url:'https://www.myastrology.in/kundali.html' },
  { keywords: ['লগ্ন','উদয়কালীন','লগ্ন কি'], title:'লগ্ন (Ascendant) — আপনার ব্যক্তিত্বের ভিত্তি', description:'জন্মের সময় পূর্ব দিগন্তে যে রাশি উদয় হয় তাকে লগ্ন বলে। জন্মস্থান ও সময়ের সূক্ষ্ম পরিবর্তনে লগ্ন বদলে যায়। লগ্ন আপনার শারীরিক গঠন, ব্যক্তিত্ব, স্বাস্থ্য ও জীবনের মূল দৃষ্টিভঙ্গি নির্ধারণ করে। সঠিক লগ্ন জানতে সঠিক জন্ম সময় জানা জরুরি।', url:'https://www.myastrology.in/kundali.html' },

  // ── দোষ ও প্রতিকার ──
  { keywords: ['পিত্রু দোষ','পিত্রুদোষ','পিতৃদোষ'], title:'পিত্রু দোষ — চেনার উপায় ও প্রতিকার', description:'সূর্য রাহু বা শনির সাথে থাকলে অথবা নবম ভাবে পাপগ্রহ থাকলে পিত্রু দোষ হয়। এতে পারিবারিক অশান্তি, সন্তানহীনতা, বিবাহে বাধা ও পিতৃকুলের অমঙ্গল হতে পারে। প্রতিকার: অমাবস্যায় তর্পণ, গয়ায় পিণ্ডদান, পিপল গাছের পূজা।', url:'https://www.myastrology.in/blog/pitru-dosh-shastriya-byakhya.html' },
  { keywords: ['নক্ষত্র','২৭ নক্ষত্র','অশ্বিনী','ভরণী','রোহিণী'], title:'২৭ নক্ষত্র — আপনার জন্ম নক্ষত্রের প্রভাব', description:'চন্দ্র যে নক্ষত্রে থাকে তাকে জন্ম নক্ষত্র বলে। ২৭টি নক্ষত্রের প্রত্যেকের নিজস্ব গুণ, দোষ, অধিপতি ও প্রকৃতি রয়েছে। আপনার জন্ম নক্ষত্র আপনার মনের গঠন, আবেগ ও মানসিকতা নির্ধারণ করে। এটি জানতে জন্ম তারিখ, সময় ও স্থান জানতে হবে।', url:'https://www.myastrology.in/kundali.html' },

  // ── স্বাস্থ্য ও জ্যোতিষ ──
  { keywords: ['স্বাস্থ্য','রোগ','অসুখ','শরীর'], title:'জ্যোতিষে স্বাস্থ্য — কোন গ্রহ কোন রোগের কারণ?', description:'প্রত্যেক গ্রহ শরীরের নির্দিষ্ট অঙ্গকে নিয়ন্ত্রণ করে। সূর্য-হৃদপিণ্ড, চন্দ্র-পেট/মানসিকতা, মঙ্গল-রক্ত, বুধ-স্নায়ু/ত্বক, বৃহস্পতি-যকৃৎ, শুক্র-জননাঙ্গ, শনি-হাড়/দাঁত, রাহু-বিষক্রিয়া/ভ্রম, কেতু-অজানা রোগ। আক্রান্ত গ্রহের প্রতিকার করলে স্বাস্থ্যের উন্নতি হয়।', url:'https://www.myastrology.in/astrology.html' },
  { keywords: ['যোগ','ব্যায়াম','ধ্যান','মেডিটেশন','শান্তি'], title:'মানসিক শান্তির জন্য জ্যোতিষীয় পরামর্শ', description:'চন্দ্র ও বুধকে শক্তিশালী করতে ধ্যান করুন। প্রতিদিন সকালে সূর্যোদয়ের সময় সূর্য প্রণাম করুন, এটি আত্মবিশ্বাস বাড়ায়। মঙ্গলবারে হনুমান চালিশা পাঠ সাহস ও শক্তি যোগায়। শনিবারে শনি মন্দিরে তেলের প্রদীপ জ্বালালে কর্মফলের বাধা কমে।', url:'https://www.myastrology.in/astrology.html' },

  // ── ড. আচার্য ও MyAstrology ──
  { keywords: ['ড. আচার্য','ডাক্তার','আচার্য','প্রদ্যুৎ','ডক্টর','পরামর্শ'], title:'ড. প্রদ্যুৎ আচার্য — MyAstrology-র প্রতিষ্ঠাতা', description:'ড. প্রদ্যুৎ আচার্য, PhD in Vedic Jyotish, ১৫+ বছরের অভিজ্ঞতা সম্পন্ন বিশিষ্ট জ্যোতিষী ও হস্তরেখাবিদ। রাণাঘাট, নদিয়া, পশ্চিমবঙ্গ থেকে সারা ভারতে অনলাইনে পরামর্শ দিয়ে থাকেন। ২৯০+ যাচাইকৃত রিভিউ, ২.২৪L YouTube সাবস্ক্রাইবার।', url:'https://www.myastrology.in/about.html' },
  { keywords: ['যোগাযোগ','নম্বর','ফোন','ঠিকানা','কোথায়'], title:'MyAstrology-র ঠিকানা ও যোগাযোগ', description:'ড. প্রদ্যুৎ আচার্য, নাসরা মাগুর খালি, তুঁত বাগান, পোস্ট নাসরা, রাণাঘাট, নদিয়া, পশ্চিমবঙ্গ — ৭৪১২০২ | ফোন/WhatsApp: +91 93331 22768 | ওয়েবসাইট: www.myastrology.in', url:'https://www.myastrology.in/contact.html' },
];

const QUICK_QUESTIONS = [
  '🔮 আমার রাশিফল জানতে চাই',
  '🪐 শনির সাড়েসাতি কী?',
  '✋ হাতের রেখা কী বলে?',
  '💑 বিবাহযোগ কীভাবে বুঝব?',
  '💎 আমার রত্নপাথর কোনটা?',
  '🏠 বাস্তু দোষ কী?',
];

// ═══════════════════════════════════════════════════════
// উন্নত লোকাল নলেজ সার্চ ইঞ্জিন
// ═══════════════════════════════════════════════════════
function searchKnowledgeBase(question) {
  const q = question.toLowerCase();
  
  // প্রথমে exact match
  const exactMatch = LOCAL_KNOWLEDGE.find(item =>
    item.keywords.some(kw => q.includes(kw))
  );
  if (exactMatch) return exactMatch;
  
  // তারপর partial match
  const words = q.split(/\s+/);
  for (const item of LOCAL_KNOWLEDGE) {
    for (const kw of item.keywords) {
      for (const w of words) {
        if (kw.includes(w) || w.includes(kw)) {
          return item;
        }
      }
    }
  }
  
  return null;
}

function MessageBubble({ message, onWhatsApp }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && <Text style={styles.avatar}>🔮</Text>}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.content}
        </Text>
        {message.url && (
          <TouchableOpacity style={styles.readMoreBtn}
            onPress={() => Linking.openURL(message.url)}
          >
            <Text style={styles.readMoreText}>📖 বিস্তারিত পড়ুন →</Text>
          </TouchableOpacity>
        )}
        {!isUser && message.showWhatsApp && (
          <TouchableOpacity style={styles.waButton} onPress={onWhatsApp}>
            <Text style={styles.waButtonText}>💬 Dr. Acharya-র সাথে কথা বলুন</Text>
          </TouchableOpacity>
        )}
      </View>
      {isUser && <Text style={styles.avatar}>🙏</Text>}
    </View>
  );
}

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    {
      id: '0', role: 'assistant',
      content: 'নমস্কার 🙏\nআমি MyAstrology-র AI সহায়ক। জ্যোতিষ, হস্তরেখা, পঞ্জিকা, রত্নপাথর, ক্যারিয়ার, স্বাস্থ্য — যেকোনো বিষয়ে বাংলায় জিজ্ঞেস করুন।',
      showWhatsApp: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const openWhatsApp = useCallback(() => {
    Linking.openURL('https://wa.me/919333122768');
  }, []);

  const sendMessage = useCallback(async (text) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput('');
    setShowQuick(false);

    const userMsg = { id: Date.now().toString(), role: 'user', content: q };
    const history = messages.filter(m => m.id !== '0').slice(-8); // last 4 turns
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Gemini API প্রথমে চেষ্টা করি
      const geminiReply = await askGemini(q, history);

      if (geminiReply) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: geminiReply,
          showWhatsApp: true,
        }]);
        setLoading(false);
        return;
      }
    } catch (_) {
      // Gemini ব্যর্থ হলে local fallback
    }

    // লোকাল নলেজ বেস fallback
    const result = searchKnowledgeBase(q);
    let reply, url, showWA = true;

    if (result) {
      reply = `📖 ${result.title}\n\n${result.description}\n\n🔍 বিস্তারিত জানতে নিচের লিংকে ক্লিক করুন।`;
      url = result.url;
    } else {
      reply = 'এই বিষয়ে সঠিক উত্তরের জন্য Dr. Acharya-র সাথে সরাসরি কথা বলুন। 🙏';
    }

    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: reply,
      url,
      showWhatsApp: showWA,
    }]);
    setLoading(false);
  }, [input, loading, messages]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🔮</Text>
        <View>
          <Text style={styles.headerTitle}>MyAstrology AI</Text>
          <Text style={styles.headerSub}>ড. প্রদ্যুৎ আচার্যের AI সহায়ক</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} onWhatsApp={openWhatsApp} />
        )}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingRow}>
          <Text style={styles.avatar}>🔮</Text>
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={Colors.gold} />
            <Text style={styles.loadingText}>উত্তর লিখছি...</Text>
          </View>
        </View>
      )}

      {/* Quick questions */}
      {showQuick && (
        <View style={styles.quickContainer}>
          {QUICK_QUESTIONS.map((q, i) => (
            <TouchableOpacity key={i} style={styles.quickBtn}
              onPress={() => sendMessage(q)}
            >
              <Text style={styles.quickBtnText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="বাংলায় প্রশ্ন করুন..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, padding: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.goldBorder,
    backgroundColor: '#0a1525',
  },
  headerIcon: { fontSize: 28 },
  headerTitle: {
    fontSize: 15, fontFamily: 'NotoSerifBengali',
    fontWeight: '700', color: Colors.goldLight,
  },
  headerSub: {
    fontSize: 11, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary,
  },
  onlineDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.success, marginLeft: 'auto',
  },
  messageList: { padding: Spacing.md, gap: Spacing.sm },
  bubbleRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  bubbleRowUser: { justifyContent: 'flex-end' },
  avatar: { fontSize: 24 },
  bubble: {
    maxWidth: '78%', borderRadius: 18,
    padding: Spacing.sm + 4,
  },
  bubbleAI: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#1a3a5c',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15, fontFamily: 'NotoSerifBengali',
    color: Colors.textPrimary, lineHeight: 24,
  },
  bubbleTextUser: { color: '#e8dcc8' },
  readMoreBtn: {
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderRadius: 20, padding: Spacing.sm,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.gold, fontWeight: '600',
  },
  waButton: {
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(37,211,102,0.15)',
    borderRadius: 20, padding: Spacing.sm,
    borderWidth: 1, borderColor: 'rgba(37,211,102,0.3)',
    alignItems: 'center',
  },
  waButtonText: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: '#25d366', fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  loadingBubble: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18, padding: Spacing.sm + 4,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  loadingText: {
    fontSize: 13, fontFamily: 'NotoSerifBengali',
    color: Colors.textSecondary,
  },
  quickContainer: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: Spacing.sm, padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  quickBtn: {
    backgroundColor: Colors.goldGlow,
    borderRadius: Radius.full, paddingHorizontal: 12,
    paddingVertical: 6, borderWidth: 1, borderColor: Colors.goldBorder,
  },
  quickBtnText: {
    fontSize: 12, fontFamily: 'NotoSerifBengali',
    color: Colors.gold,
  },
  inputRow: {
    flexDirection: 'row', gap: Spacing.sm,
    padding: Spacing.sm, paddingHorizontal: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.goldBorder,
    backgroundColor: '#0a1525',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, color: Colors.textPrimary,
    fontFamily: 'NotoSerifBengali', fontSize: 15,
    borderWidth: 1, borderColor: Colors.goldBorder,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gold, alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.goldGlow },
  sendIcon: { fontSize: 18, color: '#fff', fontWeight: '700' },
});
