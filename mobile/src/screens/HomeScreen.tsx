import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { Colors } from "../constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BUTTON_SIZE = Math.min(SCREEN_WIDTH * 0.52, 220);

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

// ---------- Waveform bars (animated) ----------

function WaveformBar({ index }: { index: number }) {
  const anim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const loop = () => {
      Animated.sequence([
        Animated.timing(anim, {
          toValue: Math.random() * 36 + 8,
          duration: 160 + index * 40,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: Math.random() * 20 + 8,
          duration: 160 + index * 40,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start(loop);
    };
    loop();
    return () => anim.stopAnimation();
  }, [anim, index]);

  return (
    <Animated.View
      style={[
        styles.waveBar,
        { height: anim },
      ]}
    />
  );
}

// ---------- Pulse ring ----------

function PulseRing({ delay = 0 }: { delay?: number }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.6,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [delay, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { transform: [{ scale }], opacity },
      ]}
    />
  );
}

// ---------- Home Screen ----------

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [isListening, setIsListening] = useState(false);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isListening) {
      setIsListening(true);
      // Navigate to conversation after a brief moment
      setTimeout(() => {
        setIsListening(false);
        navigation.navigate("Conversation");
      }, 1200);
    } else {
      setIsListening(false);
    }
  }, [isListening, navigation]);

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.titlePill}>
            <Text style={styles.titleText}>Bloom</Text>
          </View>
        </View>

        {/* Main content */}
        <View style={styles.center}>
          {/* Greeting */}
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.subtitle}>Here to help</Text>

          {/* Mic button area */}
          <View style={styles.buttonArea}>
            {isListening && (
              <>
                <PulseRing delay={0} />
                <PulseRing delay={500} />
              </>
            )}

            <TouchableOpacity
              onPress={handlePress}
              activeOpacity={0.85}
              style={[
                styles.micButton,
                isListening && styles.micButtonActive,
              ]}
            >
              {isListening ? (
                <View style={styles.waveContainer}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <WaveformBar key={i} index={i} />
                  ))}
                </View>
              ) : (
                <Text style={styles.micIcon}>🎙️</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Status */}
          <Text style={styles.statusText}>
            {isListening ? "Listening..." : "Tap to talk"}
          </Text>
          <Text style={styles.statusSubtext}>
            {isListening
              ? "Speak naturally, I'm listening"
              : "Press the button and start talking"}
          </Text>
        </View>

        {/* Bottom info */}
        <View style={styles.bottomCard}>
          <View style={styles.connectedRow}>
            <View style={styles.greenDot} />
            <Text style={styles.connectedText}>Connected & Ready</Text>
          </View>
          <Text style={styles.bottomHint}>
            Ask me anything — check your schedule, take your medications, or
            just chat.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, justifyContent: "space-between" },

  // Top bar
  topBar: {
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 24,
  },
  titlePill: {
    backgroundColor: Colors.glassWhiteSubtle,
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.gray700,
  },

  // Center area
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginTop: -40,
  },
  greeting: {
    fontSize: 40,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 26,
    color: Colors.gray500,
    marginBottom: 48,
  },

  // Mic button
  buttonArea: {
    width: BUTTON_SIZE + 80,
    height: BUTTON_SIZE + 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  micButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: Colors.glassWhite,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: Colors.careBlue,
    borderColor: Colors.careBlue,
    shadowColor: Colors.careBlue,
    shadowOpacity: 0.3,
  },
  micIcon: {
    fontSize: 64,
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  waveBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.85)",
  },

  // Pulse
  pulseRing: {
    position: "absolute",
    width: BUTTON_SIZE + 60,
    height: BUTTON_SIZE + 60,
    borderRadius: (BUTTON_SIZE + 60) / 2,
    backgroundColor: "rgba(91,154,139,0.18)",
  },

  // Status
  statusText: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.gray800,
    marginBottom: 6,
  },
  statusSubtext: {
    fontSize: 20,
    color: Colors.gray400,
    textAlign: "center",
  },

  // Bottom card
  bottomCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: Colors.glassWhite,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  connectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.alertGreen,
  },
  connectedText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.gray700,
  },
  bottomHint: {
    fontSize: 17,
    color: Colors.gray500,
    lineHeight: 24,
  },
});
