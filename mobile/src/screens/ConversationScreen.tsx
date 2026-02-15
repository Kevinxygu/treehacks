import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Animated, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { Colors } from "../constants/colors";
import { voiceChat, type ChatMessage } from "../services/api";

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

// ---------- Conversation Screen ----------

export default function ConversationScreen() {
    const navigation = useNavigation<Nav>();
    const flatListRef = useRef<FlatList>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);

    // Auto-scroll when messages change
    useEffect(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages, isProcessing]);

    // Cleanup sound on unmount
    useEffect(() => {
        return () => {
            if (currentSound) {
                currentSound.unloadAsync().catch(() => {});
            }
        };
    }, [currentSound]);

    // ---------- Audio playback ----------

    const playAudioBase64 = useCallback(
        async (base64Audio: string) => {
            try {
                // Stop any currently playing audio
                if (currentSound) {
                    await currentSound.stopAsync().catch(() => {});
                    await currentSound.unloadAsync().catch(() => {});
                }

                // Set audio mode for playback
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                });

                // Play using a data URI — no file system needed
                const dataUri = `data:audio/mp3;base64,${base64Audio}`;
                const { sound } = await Audio.Sound.createAsync({ uri: dataUri });
                setCurrentSound(sound);
                await sound.playAsync();

                // Cleanup when done
                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        sound.unloadAsync().catch(() => {});
                    }
                });
            } catch (err) {
                console.error("Audio playback error:", err);
            }
        },
        [currentSound],
    );

    // ---------- Audio recording ----------

    const startRecording = useCallback(async () => {
        try {
            // Stop any playing audio first
            if (currentSound) {
                await currentSound.stopAsync().catch(() => {});
                await currentSound.unloadAsync().catch(() => {});
                setCurrentSound(null);
            }

            const permission = await Audio.requestPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Permission needed", "Please allow microphone access to use this feature.");
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            setRecording(rec);
            setIsListening(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (err) {
            console.error("Failed to start recording", err);
        }
    }, [currentSound]);

    const stopRecording = useCallback(async () => {
        if (!recording) return;
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

        setIsListening(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            if (!uri) return;

            // Show processing state
            setIsProcessing(true);

            try {
                // Call the backend voice-chat endpoint
                const result = await voiceChat(uri, chatHistory);

                // Add user message (their transcript)
                if (result.transcript) {
                    const userMsg: Message = {
                        id: `user-${Date.now()}`,
                        role: "user",
                        text: result.transcript,
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    };
                    setMessages((prev) => [...prev, userMsg]);

                    // Update chat history for context
                    setChatHistory((prev) => [...prev, { role: "user", content: result.transcript }]);
                }

                setIsProcessing(false);

                // Add assistant response
                if (result.response) {
                    const assistantMsg: Message = {
                        id: `ai-${Date.now()}`,
                        role: "assistant",
                        text: result.response,
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    };
                    setMessages((prev) => [...prev, assistantMsg]);

                    // Update chat history
                    setChatHistory((prev) => [...prev, { role: "assistant", content: result.response }]);

                    // Play the audio response
                    if (result.audioBase64) {
                        await playAudioBase64(result.audioBase64);
                    }
                }
            } catch (err: any) {
                setIsProcessing(false);
                console.error("Voice chat error:", err);
                const errorMsg: Message = {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    text: "I had trouble with that. Could you try again?",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                };
                setMessages((prev) => [...prev, errorMsg]);
            }
        } catch (err) {
            console.error("Failed to stop recording", err);
            setRecording(null);
            setIsProcessing(false);
        }
    }, [recording, chatHistory, playAudioBase64]);

    const toggleRecording = useCallback(() => {
        if (isProcessing) return; // Don't allow recording while processing
        if (isListening) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [isListening, isProcessing, startRecording, stopRecording]);

    // ---------- End chat ----------

    const handleEndChat = useCallback(() => {
        // Stop any playing audio
        if (currentSound) {
            currentSound.stopAsync().catch(() => {});
            currentSound.unloadAsync().catch(() => {});
        }
        navigation.navigate("Confirmation", {
            summary: "Your conversation has been saved and analyzed.",
        });
    }, [navigation, currentSound]);

    // ---------- Render ----------

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === "user";
        return (
            <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant]}>
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
                    <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>{item.text}</Text>
                    <Text style={[styles.bubbleTime, isUser ? styles.bubbleTimeUser : styles.bubbleTimeAssistant]}>{item.timestamp}</Text>
                </View>
            </View>
        );
    };

    return (
        <LinearGradient colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]} style={styles.container}>
            <SafeAreaView style={styles.safe}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>

                    <View style={styles.headerPill}>
                        <Text style={styles.headerTitle}>CareCompanion</Text>
                    </View>

                    <View style={{ width: 48 }} />
                </View>

                {/* Empty state */}
                {messages.length === 0 && !isProcessing && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🎙️</Text>
                        <Text style={styles.emptyTitle}>Hi there!</Text>
                        <Text style={styles.emptySubtitle}>Tap the button below and start talking.</Text>
                    </View>
                )}

                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messageList}
                    ListFooterComponent={
                        isProcessing ? (
                            <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
                                <View style={[styles.bubble, styles.bubbleAssistantTyping]}>
                                    <TypingDots />
                                </View>
                            </View>
                        ) : null
                    }
                />

                {/* Bottom controls */}
                <View style={styles.bottomControls}>
                    <TouchableOpacity
                        onPress={toggleRecording}
                        activeOpacity={0.85}
                        disabled={isProcessing}
                        style={[styles.micBar, isListening && styles.micBarActive, isProcessing && styles.micBarDisabled]}
                    >
                        <Text style={styles.micBarIcon}>{isProcessing ? "⏳" : isListening ? "⏹️" : "🎙️"}</Text>
                        <Text style={[styles.micBarText, isListening && styles.micBarTextActive]}>{isProcessing ? "Thinking..." : isListening ? "Listening..." : "Tap to speak"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleEndChat} activeOpacity={0.85} style={styles.endButton}>
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

    // Empty state
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
    },
    emptyIcon: { fontSize: 64, marginBottom: 16 },
    emptyTitle: { fontSize: 28, fontWeight: "600", color: Colors.gray700, marginBottom: 8 },
    emptySubtitle: { fontSize: 18, color: Colors.gray500, textAlign: "center" },

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
        backgroundColor: "rgba(74,144,226,0.1)",
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
        backgroundColor: "rgba(74,144,226,0.5)",
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
    micBarDisabled: {
        opacity: 0.6,
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
