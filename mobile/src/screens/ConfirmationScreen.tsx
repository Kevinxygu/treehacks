import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { Colors } from "../constants/colors";

type Nav = NativeStackNavigationProp<RootStackParamList, "Confirmation">;
type Route = RouteProp<RootStackParamList, "Confirmation">;

export default function ConfirmationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const summary = route.params?.summary ?? "Your session is complete.";

  // Entrance animations
  const iconScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(30)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslate = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      // Icon bounces in
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      // Content slides up
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(contentTranslate, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
      // Buttons slide up
      Animated.parallel([
        Animated.timing(buttonsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(buttonsTranslate, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          {/* Success icon */}
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }] }]}>
            <Text style={styles.checkIcon}>✅</Text>
          </Animated.View>

          {/* Title */}
          <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslate }] }}>
            <Text style={styles.title}>All done!</Text>
            <Text style={styles.subtitle}>{summary}</Text>
          </Animated.View>

          {/* Info card */}
          <Animated.View
            style={[
              styles.card,
              { opacity: contentOpacity, transform: [{ translateY: contentTranslate }] },
            ]}
          >
            <View style={styles.cardRow}>
              <View style={[styles.cardIcon, { backgroundColor: "rgba(91,154,139,0.1)" }]}>
                <Text style={styles.cardEmoji}>📅</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Session Saved</Text>
                <Text style={styles.cardValue}>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardRow}>
              <View style={[styles.cardIcon, { backgroundColor: "rgba(126,211,33,0.1)" }]}>
                <Text style={styles.cardEmoji}>🧠</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Analysis</Text>
                <Text style={styles.cardValue}>
                  Your conversation has been sent for cognitive analysis
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardRow}>
              <View style={[styles.cardIcon, { backgroundColor: "rgba(155,81,224,0.1)" }]}>
                <Text style={styles.cardEmoji}>👨‍👩‍👧</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Caretaker</Text>
                <Text style={styles.cardValue}>
                  Results will appear on the caretaker dashboard
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Buttons */}
          <Animated.View
            style={[
              styles.buttons,
              { opacity: buttonsOpacity, transform: [{ translateY: buttonsTranslate }] },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.popToTop();
              }}
              activeOpacity={0.85}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Got it, thanks!</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>← Back</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  // Icon
  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(126,211,33,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  checkIcon: { fontSize: 56 },

  // Title
  title: {
    fontSize: 38,
    fontWeight: "700",
    color: Colors.gray900,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 22,
    color: Colors.gray500,
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 30,
  },

  // Card
  card: {
    width: "100%",
    backgroundColor: Colors.glassWhite,
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: 36,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: { fontSize: 24 },
  cardContent: { flex: 1 },
  cardLabel: {
    fontSize: 16,
    color: Colors.gray500,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.gray900,
    lineHeight: 28,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.gray200,
    marginVertical: 18,
  },

  // Buttons
  buttons: { width: "100%", gap: 14 },
  primaryButton: {
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.careBlue,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.careBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.white,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 20,
    backgroundColor: Colors.glassWhiteSubtle,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 19,
    fontWeight: "500",
    color: Colors.gray500,
  },
});
