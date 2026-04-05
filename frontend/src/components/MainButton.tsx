/**
 * MainButton
 *
 * The single large central button for Memoria.
 * 160x160 round button with state-dependent colors and haptic feedback.
 * Touch target well above the 48dp accessibility minimum.
 *
 * Redesigned to match the Memoria website palette (brown/orange/green).
 */

import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { Colors, FontSizes, Shadows } from "../constants/theme";

type ButtonState = "idle" | "listening" | "thinking" | "speaking";

interface MainButtonProps {
  state: ButtonState;
  onPress: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUTTON_SIZE = 160;

const BG_COLORS: Record<ButtonState, string> = {
  idle: Colors.buttonIdle,       // brown #7D6340
  listening: Colors.buttonListening, // orange-soft #E8A87C
  thinking: Colors.buttonThinking,   // brownLight #8B6F47
  speaking: Colors.buttonSpeaking,   // greenForest #4A7A35
};

const LABELS: Record<ButtonState, string> = {
  idle: "Parler",
  listening: "J'\u00e9coute\u2026",
  thinking: "Je r\u00e9fl\u00e9chis\u2026",
  speaking: "Je parle\u2026",
};

const ICONS: Record<ButtonState, string> = {
  idle: "\uD83C\uDF99",     // microphone emoji
  listening: "\uD83D\uDC42", // ear emoji
  thinking: "\uD83D\uDCAD",  // thought bubble
  speaking: "\uD83D\uDCAC",  // speech bubble
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MainButton({
  state,
  onPress,
  onLongPress,
  disabled = false,
}: MainButtonProps) {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  // Pulse animation for thinking state
  useEffect(() => {
    if (state === "thinking") {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.06, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
    }

    return () => cancelAnimation(pulseScale);
  }, [state, pulseScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulseScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.93, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  };

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const backgroundColor = BG_COLORS[state];
  const label = LABELS[state];
  const icon = ICONS[state];

  return (
    <View style={styles.wrapper}>
      {/* Outer glow ring — color matches current state */}
      <View
        style={[
          styles.glowRing,
          { borderColor: backgroundColor, opacity: 0.15 },
        ]}
      />

      <AnimatedPressable
        onPress={handlePress}
        onLongPress={() => {
          if (!disabled && onLongPress) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onLongPress();
          }
        }}
        delayLongPress={800}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[styles.button, { backgroundColor }, animatedStyle]}
        accessibilityRole="button"
        accessibilityLabel={`Parler \u00e0 Memoria. \u00c9tat actuel: ${label}`}
        accessibilityHint="Appuyez pour commencer \u00e0 parler. Appui long pour terminer la session."
      >
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </AnimatedPressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    width: BUTTON_SIZE + 24,
    height: BUTTON_SIZE + 24,
    justifyContent: "center",
    alignItems: "center",
  },
  glowRing: {
    position: "absolute",
    width: BUTTON_SIZE + 24,
    height: BUTTON_SIZE + 24,
    borderRadius: (BUTTON_SIZE + 24) / 2,
    borderWidth: 4,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.strong,
  },
  icon: {
    fontSize: 40,
    marginBottom: 6,
  },
  label: {
    color: Colors.buttonText,
    fontSize: FontSizes.body,
    fontWeight: "700",
    textAlign: "center",
  },
});
