// src/gemini.js
// Google Gemini 1.5 Flash — free tier (1.5M tokens/day)
import { GEMINI_API_KEY } from './secrets';

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `আপনি MyAstrology-র AI সহায়ক। আপনার নাম "জ্যোতিষী AI"।
আপনি ড. প্রদ্যুৎ আচার্য (PhD in Vedic Jyotish, রাণাঘাট, নদিয়া)-এর পক্ষে কাজ করছেন।

নিয়মাবলী:
- সবসময় বাংলায় উত্তর দিন
- জ্যোতিষ, হস্তরেখা, পঞ্জিকা, রত্নপাথর, বাস্তু, সংখ্যাতত্ত্ব বিষয়ে বিস্তারিত উত্তর দিন
- উত্তর সর্বোচ্চ ৪-৫ বাক্যের মধ্যে রাখুন
- ব্যক্তিগত কুণ্ডলী বিশ্লেষণের জন্য ড. আচার্যের পরামর্শ নেওয়ার পরামর্শ দিন
- WhatsApp: +91 93331 22768
- Website: www.myastrology.in
- কখনো মিথ্যা বা অনিশ্চিত তথ্য দেবেন না`;

export async function askGemini(userMessage, history = []) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    return null; // fallback to local knowledge
  }

  const contents = [
    ...history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const body = {
    contents,
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
  };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}
