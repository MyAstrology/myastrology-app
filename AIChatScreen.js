// src/screens/AIChatScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, Linking, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../theme';

const SYSTEM_PROMPT = `আপনি ড. প্রদ্যুৎ আচার্যের MyAstrology App-এর AI সহায়ক। বাংলায় কথা বলুন।

পরিচয়:
- বৈদিক জ্যোতিষ, হস্তরেখা, পঞ্জিকা ও সমুদ্রিক শাস্ত্রে পারদর্শী
- ড. প্রদ্যুৎ আচার্য রাণাঘাট, নদিয়ার বিশিষ্ট জ্যোতিষী
- সংক্ষিপ্ত, স্পষ্ট বাংলায় উত্তর দিন (৩-৫ বাক্য)

নিয়ম:
1. সবসময় বাংলায় উত্তর দিন
2. জটিল বিষয়ে Dr. Acharya-র পরামর্শ সুপারিশ করুন
3. WhatsApp: wa.me/919333122768
4. ভুল তথ্য দেবেন না`;

const QUICK_QUESTIONS = [
  '🔮 আমার রাশিফল জানতে চাই',
  '🪐 শনির সাড়েসাতি কী?',
  '✋ হাতের রেখা কী বলে?',
  '💑 বিবাহযোগ কীভাবে বুঝব?',
  '💎 আমার রত্নপাথর কোনটা?',
  '🏠 বাস্তু দোষ কী?',
];

async function callClaudeAPI(messages) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || 'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না।';
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && <Text style={styles.avatar}>🔮</Text>}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.content}
        </Text>
        {!isUser && message.showWhatsApp && (
          <TouchableOpacity style={styles.waButton}
            onPress={() => Linking.openURL('https://wa.me/919333122768')}
          >
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
      content: 'নমস্কার 🙏\nআমি MyAstrology-র AI সহায়ক। জ্যোতিষ, হস্তরেখা, পঞ্জিকা বা রত্নপাথর — যেকোনো বিষয়ে বাংলায় জিজ্ঞেস করুন।',
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

  const sendMessage = async (text) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput('');
    setShowQuick(false);

    const userMsg = { id: Date.now().toString(), role: 'user', content: q };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const apiMessages = updatedMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

      const reply = await callClaudeAPI(apiMessages);
      const shouldShowWA = reply.length > 100 || apiMessages.length > 4;

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        showWhatsApp: shouldShowWA,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'সংযোগে সমস্যা। একটু পরে আবার চেষ্টা করুন। 🙏',
        showWhatsApp: false,
      }]);
    }
    setLoading(false);
  };

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
        renderItem={({ item }) => <MessageBubble message={item} />}
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
