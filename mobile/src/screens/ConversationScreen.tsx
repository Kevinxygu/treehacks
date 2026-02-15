import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { Colors } from "../constants/colors";
import { uploadAudioForAnalysis } from "../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList, "Conversation">;

// ---------- Types ----------

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

// ---------- Typing dots ----------

function TypingDots() {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingRow}>
      {dots.map((opacity, i) => (
        <Animated.View key={i} style={[styles.typingDot, { opacity }]} />
      ))}
    </View>
  );
}

// ---------- Demo messages ----------

const DEMO_MESSAGES: Message[] = [
  { id: "1", role: "assistant", text: "Good morning! How are you feeling today?", timestamp: "Now" },
  { id: "2", role: "user", text: "I slept pretty well. A little stiff this morning though.", timestamp: "Now" },
  { id: "3", role: "assistant", text: "Glad to hear you slept well! Would you like me to remind you about your morning stretches? Also, you have your medication at 8:30.", timestamp: "Now" },
  { id: "4", role: "user", text: "Oh yes, the stretches would be nice. And thank you for the reminder about my pills.", timestamp: "Now" },
  { id: "5", role: "assistant", text: "Of course! Let's start with some gentle neck rolls. Turn your head slowly to the right... hold for 5 seconds... now slowly to the left. You're doing great!", timestamp: "Now" },
];

// ---------- Conversation Screen ----------

export default function ConversationScreen() {
  const navigation = useNavigation<Nav>();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  // Load demo messages with staggered timing
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < DEMO_MESSAGES.length; i++) {
        if (cancelled) return;
        if (DEMO_MESSAGES[i].role === "assistant") {
          setIsTyping(true);
          await new Promise((r) => setTimeout(r, 800));
          if (cancelled) return;
          setIsTyping(false);
        }
        await new Promise((r) => setTimeout(r, 300));
        if (cancelled) return;
        setMessages((prev) => [...prev, DEMO_MESSAGES[i]]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  // ---------- Audio recording ----------

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow microphone access to use this feature.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(rec);
      setIsListening(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) return;

    setIsListening(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // Add a "user spoke" placeholder message
        const userMsg: Message = {
          id: `user-${Date.now()}`,
          role: "user",
          text: "🎤 (voice message recorded)",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, userMsg]);

        // Show typing indicator while we call the API
        setIsTyping(true);

        try {
          const sessionId = String(Math.floor(Date.now() / 1000));
          const result = await uploadAudioForAnalysis(uri, sessionId);

          setIsTyping(false);

          // Show AI response
          const assistantMsg: Message = {
            id: `ai-${Date.now()}`,
            role: "assistant",
            text: result.rule_based_summary || "I've processed your recording. Everything looks good!",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } catch {
          setIsTyping(false);
          const errorMsg: Message = {
            id: `err-${Date.now()}`,
            role: "assistant",
            text: "I had trouble processing that. Could you try again?",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, errorMsg]);
        }
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
      setRecording(null);
    }
  }, [recording]);

  const toggleRecording = useCallback(() => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isListening, startRecording, stopRecording]);

  // ---------- End chat ----------

  const handleEndChat = useCallback(() => {
    navigation.navigate("Confirmation", {
      summary: "Your conversation has been saved and analyzed.",
    });
  }, [navigation]);

  // ---------- Render ----------

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, isUser ? styles.bubbleTimeUser : styles.bubbleTimeAssistant]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerPill}>
            <Text style={styles.headerTitle}>Bloom</Text>
          </View>

          <View style={{ width: 48 }} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          ListFooterComponent={isTyping ? (
            <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
              <View style={[styles.bubble, styles.bubbleAssistantTyping]}>
                <TypingDots />
              </View>
            </View>
          ) : null}
        />

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            onPress={toggleRecording}
            activeOpacity={0.85}
            style={[styles.micBar, isListening && styles.micBarActive]}
          >
            <Text style={styles.micBarIcon}>{isListening ? "⏹️" : "🎙️"}</Text>
            <Text style={[styles.micBarText, isListening && styles.micBarTextActive]}>
              {isListening ? "Listening..." : "Tap to speak"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEndChat}
            activeOpacity={0.85}
            style={styles.endButton}
          >
            <Text style={styles.endButtonText}>End chat</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.glassWhiteSubtle,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { fontSize: 24, color: Colors.gray600 },
  headerPill: {
    backgroundColor: Colors.glassWhiteSubtle,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: Colors.gray700 },

  // Messages
  messageList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  bubbleRow: {
    marginVertical: 4,
  },
  bubbleRowUser: { alignItems: "flex-start" },
  bubbleRowAssistant: { alignItems: "flex-end" },
  bubble: {
    maxWidth: "85%",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  bubbleUser: {
    backgroundColor: Colors.glassWhite,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderTopLeftRadius: 8,
  },
  bubbleAssistant: {
    backgroundColor: Colors.careBlue,
    borderTopRightRadius: 8,
    shadowColor: Colors.careBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  bubbleAssistantTyping: {
    backgroundColor: "rgba(91,154,139,0.1)",
    borderTopRightRadius: 8,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  bubbleText: {
    fontSize: 19,
    lineHeight: 28,
  },
  bubbleTextUser: { color: Colors.gray800 },
  bubbleTextAssistant: { color: Colors.white },
  bubbleTime: {
    fontSize: 13,
    marginTop: 6,
  },
  bubbleTimeUser: { color: Colors.gray400 },
  bubbleTimeAssistant: { color: "rgba(255,255,255,0.6)" },

  // Typing dots
  typingRow: {
    flexDirection: "row",
    gap: 6,
  },
  typingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(91,154,139,0.5)",
  },

  // Bottom controls
  bottomControls: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  micBar: {
    flex: 1,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.glassWhite,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  micBarActive: {
    backgroundColor: Colors.careBlue,
    borderColor: Colors.careBlue,
    shadowColor: Colors.careBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  micBarIcon: { fontSize: 26 },
  micBarText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.gray700,
  },
  micBarTextActive: { color: Colors.white },
  endButton: {
    height: 64,
    paddingHorizontal: 28,
    borderRadius: 20,
    backgroundColor: Colors.glassWhite,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  endButtonText: {
    fontSize: 18,
    fontWeight: "500",
    color: Colors.gray500,
  },
});
